package com.lowkeycafe.restaurant.service;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.LineSeparator;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.lowkeycafe.restaurant.entity.Bill;
import com.lowkeycafe.restaurant.entity.BillItem;
import com.lowkeycafe.restaurant.entity.RestaurantSettings;
import com.lowkeycafe.restaurant.repository.RestaurantSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class PdfReceiptService {

    private final RestaurantSettingsRepository settingsRepository;

    public byte[] generateReceiptPdf(Bill bill) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            RestaurantSettings settings = settingsRepository.findFirstByOrderByUpdatedAtDesc()
                    .orElse(null);
            String restaurantName = settings != null && settings.getRestaurant() != null ?
                    settings.getRestaurant().getName() : "Lowkey Cafe";
            String tagline = settings != null && settings.getRestaurant() != null ?
                    settings.getRestaurant().getTagline() : "Artisan Coffee & Good Vibes";
            String address = settings != null && settings.getRestaurant() != null ?
                    settings.getRestaurant().getAddress() : "Foodie Lane, Metro City";
            String phone = settings != null && settings.getRestaurant() != null ?
                    settings.getRestaurant().getPhone() : "+91 98765 43210";

            DeviceRgb primaryColor = new DeviceRgb(217, 119, 6); // amber-600

            // Header
            document.add(new Paragraph(restaurantName.toUpperCase())
                    .setFontSize(22)
                    .setBold()
                    .setFontColor(primaryColor)
                    .setTextAlignment(TextAlignment.CENTER));

            document.add(new Paragraph(tagline)
                    .setFontSize(10)
                    .setItalic()
                    .setTextAlignment(TextAlignment.CENTER));

            document.add(new Paragraph(address + " | Tel: " + phone)
                    .setFontSize(9)
                    .setFontColor(ColorConstants.GRAY)
                    .setTextAlignment(TextAlignment.CENTER));

            document.add(new Paragraph("\n"));

            // Bill metadata table
            Table metaTable = new Table(UnitValue.createPercentArray(new float[]{50, 50}))
                    .useAllAvailableWidth();
            metaTable.addCell(new Cell().add(new Paragraph("Receipt #: " + bill.getBillNumber()).setBold().setFontSize(10)).setBorder(null));
            metaTable.addCell(new Cell().add(new Paragraph("Table #: " + (bill.getTable() != null ? bill.getTable().getTableNumber() : "N/A"))
                    .setTextAlignment(TextAlignment.RIGHT).setBold().setFontSize(10)).setBorder(null));

            String formattedDate = bill.getCreatedAt() != null ?
                    bill.getCreatedAt().format(DateTimeFormatter.ofPattern("dd-MMM-yyyy hh:mm a")) : "N/A";
            metaTable.addCell(new Cell().add(new Paragraph("Date: " + formattedDate).setFontSize(9).setFontColor(ColorConstants.GRAY)).setBorder(null));
            metaTable.addCell(new Cell().add(new Paragraph("Order Ref: " + (bill.getOrder() != null ? bill.getOrder().getOrderCode() : "N/A"))
                    .setTextAlignment(TextAlignment.RIGHT).setFontSize(9).setFontColor(ColorConstants.GRAY)).setBorder(null));
            document.add(metaTable);

            document.add(new Paragraph("\n"));

            // Itemized Table
            Table itemTable = new Table(UnitValue.createPercentArray(new float[]{45, 15, 20, 20}))
                    .useAllAvailableWidth();

            DeviceRgb headerBg = new DeviceRgb(243, 244, 246);
            itemTable.addHeaderCell(new Cell().add(new Paragraph("Item").setBold().setFontSize(10)).setBackgroundColor(headerBg));
            itemTable.addHeaderCell(new Cell().add(new Paragraph("Qty").setBold().setFontSize(10)).setBackgroundColor(headerBg).setTextAlignment(TextAlignment.CENTER));
            itemTable.addHeaderCell(new Cell().add(new Paragraph("Price").setBold().setFontSize(10)).setBackgroundColor(headerBg).setTextAlignment(TextAlignment.RIGHT));
            itemTable.addHeaderCell(new Cell().add(new Paragraph("Total").setBold().setFontSize(10)).setBackgroundColor(headerBg).setTextAlignment(TextAlignment.RIGHT));

            for (BillItem item : bill.getItems()) {
                itemTable.addCell(new Cell().add(new Paragraph(item.getItemName()).setFontSize(9)));
                itemTable.addCell(new Cell().add(new Paragraph(String.valueOf(item.getQuantity())).setFontSize(9)).setTextAlignment(TextAlignment.CENTER));
                itemTable.addCell(new Cell().add(new Paragraph("₹" + item.getUnitPrice()).setFontSize(9)).setTextAlignment(TextAlignment.RIGHT));
                itemTable.addCell(new Cell().add(new Paragraph("₹" + item.getTotalPrice()).setFontSize(9)).setTextAlignment(TextAlignment.RIGHT));
            }
            document.add(itemTable);

            document.add(new Paragraph("\n"));

            // Calculation Summary Table
            Table summaryTable = new Table(UnitValue.createPercentArray(new float[]{70, 30}))
                    .useAllAvailableWidth();

            summaryTable.addCell(new Cell().add(new Paragraph("Subtotal").setFontSize(9)).setBorder(null));
            summaryTable.addCell(new Cell().add(new Paragraph("₹" + bill.getSubtotal()).setFontSize(9)).setTextAlignment(TextAlignment.RIGHT).setBorder(null));

            summaryTable.addCell(new Cell().add(new Paragraph("Taxes (GST)").setFontSize(9)).setBorder(null));
            summaryTable.addCell(new Cell().add(new Paragraph("₹" + bill.getTaxAmount()).setFontSize(9)).setTextAlignment(TextAlignment.RIGHT).setBorder(null));

            if (bill.getServiceCharge() != null && bill.getServiceCharge().doubleValue() > 0) {
                summaryTable.addCell(new Cell().add(new Paragraph("Service Charge").setFontSize(9)).setBorder(null));
                summaryTable.addCell(new Cell().add(new Paragraph("₹" + bill.getServiceCharge()).setFontSize(9)).setTextAlignment(TextAlignment.RIGHT).setBorder(null));
            }

            if (bill.getDiscountAmount() != null && bill.getDiscountAmount().doubleValue() > 0) {
                summaryTable.addCell(new Cell().add(new Paragraph("Discount Applied").setFontSize(9).setFontColor(ColorConstants.GREEN)).setBorder(null));
                summaryTable.addCell(new Cell().add(new Paragraph("-₹" + bill.getDiscountAmount()).setFontSize(9).setFontColor(ColorConstants.GREEN)).setTextAlignment(TextAlignment.RIGHT).setBorder(null));
            }

            if (bill.getTipAmount() != null && bill.getTipAmount().doubleValue() > 0) {
                summaryTable.addCell(new Cell().add(new Paragraph("Tip / Gratuity").setFontSize(9)).setBorder(null));
                summaryTable.addCell(new Cell().add(new Paragraph("₹" + bill.getTipAmount()).setFontSize(9)).setTextAlignment(TextAlignment.RIGHT).setBorder(null));
            }

            // Grand Total Row
            summaryTable.addCell(new Cell().add(new Paragraph("FINAL AMOUNT PAID").setBold().setFontSize(12)).setBorderTop(null));
            summaryTable.addCell(new Cell().add(new Paragraph("₹" + bill.getFinalPayableAmount()).setBold().setFontSize(12).setFontColor(primaryColor)).setTextAlignment(TextAlignment.RIGHT).setBorderTop(null));

            document.add(summaryTable);

            // Footer
            document.add(new Paragraph("\n\n"));
            document.add(new Paragraph("Thank you for dining with Lowkey Cafe!")
                    .setBold()
                    .setFontSize(11)
                    .setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("Free Wi-Fi: " + (settings != null ? settings.getWifiName() : "LowkeyCafe_Guest") + " | Pwd: " + (settings != null ? settings.getWifiPassword() : "espresso_vibes"))
                    .setFontSize(8)
                    .setFontColor(ColorConstants.GRAY)
                    .setTextAlignment(TextAlignment.CENTER));

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Error creating PDF receipt: {}", e.getMessage(), e);
            return new byte[0];
        }
    }
}
