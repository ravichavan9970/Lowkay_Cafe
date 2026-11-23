package com.lowkeycafe.restaurant.service;

import com.lowkeycafe.restaurant.entity.Bill;
import com.lowkeycafe.restaurant.entity.Receipt;
import com.lowkeycafe.restaurant.repository.ReceiptRepository;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailReceiptService {

    private final JavaMailSender mailSender;
    private final PdfReceiptService pdfReceiptService;
    private final ReceiptRepository receiptRepository;

    public boolean sendReceiptEmail(Bill bill, String recipientEmail) {
        if (recipientEmail == null || recipientEmail.isBlank()) {
            return false;
        }

        try {
            byte[] pdfBytes = pdfReceiptService.generateReceiptPdf(bill);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setTo(recipientEmail);
            helper.setSubject("Your Dining Receipt - Lowkey Cafe [Bill #" + bill.getBillNumber() + "]");
            helper.setText(
                    "<h3>Thank you for dining at Lowkey Cafe!</h3>" +
                    "<p>Dear Diner,</p>" +
                    "<p>We hope you enjoyed your meal with us. Your bill details are attached as a PDF receipt.</p>" +
                    "<p><strong>Bill Number:</strong> " + bill.getBillNumber() + "<br>" +
                    "<strong>Total Paid:</strong> ₹" + bill.getFinalPayableAmount() + "</p>" +
                    "<p>We would love to welcome you back soon!<br>Warm regards,<br><em>Team Lowkey Cafe</em></p>",
                    true
            );

            helper.addAttachment("Receipt_" + bill.getBillNumber() + ".pdf", new ByteArrayResource(pdfBytes));

            mailSender.send(message);

            // Update receipt entity
            Receipt receipt = receiptRepository.findByBillId(bill.getId())
                    .orElse(Receipt.builder()
                            .bill(bill)
                            .receiptNumber("REC-" + bill.getBillNumber())
                            .build());
            receipt.setEmailedTo(recipientEmail);
            receipt.setEmailSentAt(LocalDateTime.now());
            receiptRepository.save(receipt);

            log.info("Receipt successfully sent to: {}", recipientEmail);
            return true;
        } catch (Exception e) {
            log.warn("Could not send receipt email to {} (SMTP may not be configured with live credentials): {}",
                    recipientEmail, e.getMessage());
            return false;
        }
    }
}
