package com.lowkeycafe.restaurant.service;

import com.lowkeycafe.restaurant.dto.TableDto;
import com.lowkeycafe.restaurant.entity.Order;
import com.lowkeycafe.restaurant.entity.Restaurant;
import com.lowkeycafe.restaurant.entity.RestaurantTable;
import com.lowkeycafe.restaurant.entity.TableQrCode;
import com.lowkeycafe.restaurant.repository.OrderRepository;
import com.lowkeycafe.restaurant.repository.RestaurantRepository;
import com.lowkeycafe.restaurant.repository.RestaurantTableRepository;
import com.lowkeycafe.restaurant.repository.TableQrCodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TableService {

    private final RestaurantTableRepository tableRepository;
    private final TableQrCodeRepository qrCodeRepository;
    private final RestaurantRepository restaurantRepository;
    private final OrderRepository orderRepository;
    private final QrCodeService qrCodeService;
    private final NotificationService notificationService;

    @Value("${app.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Transactional(readOnly = true)
    public List<TableDto.TableResponse> getAllTables() {
        return tableRepository.findByIsActiveTrueOrderByTableNumberAsc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TableDto.TableResponse getTableByNumber(Integer tableNumber) {
        RestaurantTable table = tableRepository.findByTableNumber(tableNumber)
                .orElseThrow(() -> new IllegalArgumentException("Table #" + tableNumber + " not found"));
        return mapToDto(table);
    }

    @Transactional(readOnly = true)
    public boolean validateTableToken(Integer tableNumber, String token) {
        if (token == null || token.isBlank()) return false;
        return qrCodeRepository.findByAccessToken(token)
                .map(qr -> qr.getTable() != null && qr.getTable().getTableNumber().equals(tableNumber) && Boolean.TRUE.equals(qr.getIsValid()))
                .orElse(false);
    }

    @Transactional
    public TableDto.TableResponse createTable(TableDto.CreateTableRequest request) {
        if (tableRepository.findByTableNumber(request.getTableNumber()).isPresent()) {
            throw new IllegalArgumentException("Table #" + request.getTableNumber() + " already exists");
        }

        Restaurant restaurant = restaurantRepository.findAll().stream().findFirst()
                .orElseGet(() -> restaurantRepository.save(Restaurant.builder().name("Lowkey Cafe").build()));

        RestaurantTable table = RestaurantTable.builder()
                .restaurant(restaurant)
                .tableNumber(request.getTableNumber())
                .seatingCapacity(request.getSeatingCapacity() != null ? request.getSeatingCapacity() : 4)
                .floorZone(request.getFloorZone() != null ? request.getFloorZone() : "Main Dining")
                .status("AVAILABLE")
                .isActive(true)
                .build();
        table = tableRepository.save(table);

        // Generate QR code
        String effectiveBase = resolveEffectiveBaseUrl(null);
        String token = UUID.randomUUID().toString();
        String targetUrl = effectiveBase + "/table/" + table.getTableNumber() + "?token=" + token;
        String qrImage = qrCodeService.generateQrCodeBase64(targetUrl, 300, 300);

        TableQrCode qrCode = TableQrCode.builder()
                .table(table)
                .accessToken(token)
                .targetUrl(targetUrl)
                .qrImageData(qrImage)
                .isValid(true)
                .generatedAt(LocalDateTime.now())
                .build();
        qrCodeRepository.save(qrCode);

        TableDto.TableResponse dto = mapToDto(table);
        notificationService.notifyTableUpdate(dto);
        return dto;
    }

    @Transactional
    public void updateTableStatus(Integer tableNumber, String newStatus) {
        tableRepository.findByTableNumber(tableNumber).ifPresent(table -> {
            table.setStatus(newStatus);
            tableRepository.save(table);
            notificationService.notifyTableUpdate(mapToDto(table));
        });
    }

    public String getLocalLanIp() {
        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            while (interfaces.hasMoreElements()) {
                NetworkInterface iface = interfaces.nextElement();
                if (iface.isLoopback() || !iface.isUp()) continue;
                Enumeration<InetAddress> addresses = iface.getInetAddresses();
                while (addresses.hasMoreElements()) {
                    InetAddress addr = addresses.nextElement();
                    if (addr instanceof Inet4Address && !addr.isLoopbackAddress()) {
                        String host = addr.getHostAddress();
                        if (!host.startsWith("127.") && !host.startsWith("169.254.")) {
                            return host;
                        }
                    }
                }
            }
            return InetAddress.getLocalHost().getHostAddress();
        } catch (Exception e) {
            return "localhost";
        }
    }

    public String resolveEffectiveBaseUrl(String customBaseUrl) {
        if (customBaseUrl != null && !customBaseUrl.isBlank()) {
            return customBaseUrl.endsWith("/") ? customBaseUrl.substring(0, customBaseUrl.length() - 1) : customBaseUrl;
        }
        if (frontendBaseUrl != null && !frontendBaseUrl.contains("localhost") && !frontendBaseUrl.contains("127.0.0.1")) {
            return frontendBaseUrl.endsWith("/") ? frontendBaseUrl.substring(0, frontendBaseUrl.length() - 1) : frontendBaseUrl;
        }
        String localIp = getLocalLanIp();
        return "http://" + localIp + ":5173";
    }

    @Transactional
    public TableDto.TableResponse regenerateQr(Integer tableNumber) {
        return regenerateQr(tableNumber, null);
    }

    @Transactional
    public TableDto.TableResponse regenerateQr(Integer tableNumber, String customBaseUrl) {
        RestaurantTable table = tableRepository.findByTableNumber(tableNumber)
                .orElseThrow(() -> new IllegalArgumentException("Table #" + tableNumber + " not found"));

        TableQrCode qrCode = qrCodeRepository.findByTable(table)
                .orElse(TableQrCode.builder().table(table).build());

        String effectiveBase = resolveEffectiveBaseUrl(customBaseUrl);
        String token = UUID.randomUUID().toString();
        String targetUrl = effectiveBase + "/table/" + table.getTableNumber() + "?token=" + token;
        String qrImage = qrCodeService.generateQrCodeBase64(targetUrl, 300, 300);

        qrCode.setAccessToken(token);
        qrCode.setTargetUrl(targetUrl);
        qrCode.setQrImageData(qrImage);
        qrCode.setIsValid(true);
        qrCode.setGeneratedAt(LocalDateTime.now());
        qrCodeRepository.save(qrCode);

        return mapToDto(table);
    }

    @Transactional
    public List<TableDto.TableResponse> regenerateAllQrCodes(String customBaseUrl) {
        List<RestaurantTable> allTables = tableRepository.findByIsActiveTrueOrderByTableNumberAsc();
        List<TableDto.TableResponse> results = new ArrayList<>();
        for (RestaurantTable t : allTables) {
            results.add(regenerateQr(t.getTableNumber(), customBaseUrl));
        }
        return results;
    }

    private TableDto.TableResponse mapToDto(RestaurantTable table) {
        TableQrCode qr = qrCodeRepository.findByTable(table).orElse(null);
        List<Order> activeOrders = orderRepository.findActiveOrdersForTable(table.getId());
        Order activeOrder = activeOrders.isEmpty() ? null : activeOrders.get(0);

        return TableDto.TableResponse.builder()
                .id(table.getId())
                .tableNumber(table.getTableNumber())
                .seatingCapacity(table.getSeatingCapacity())
                .floorZone(table.getFloorZone())
                .status(table.getStatus())
                .isActive(table.getIsActive())
                .accessToken(qr != null ? qr.getAccessToken() : null)
                .qrTargetUrl(qr != null ? qr.getTargetUrl() : null)
                .qrImageData(qr != null ? qr.getQrImageData() : null)
                .activeOrderId(activeOrder != null ? activeOrder.getId() : null)
                .activeOrderCode(activeOrder != null ? activeOrder.getOrderCode() : null)
                .build();
    }
}
