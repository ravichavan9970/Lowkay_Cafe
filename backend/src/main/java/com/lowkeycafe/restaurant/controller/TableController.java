package com.lowkeycafe.restaurant.controller;

import com.lowkeycafe.restaurant.dto.TableDto;
import com.lowkeycafe.restaurant.service.TableService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tables")
@RequiredArgsConstructor
public class TableController {

    private final TableService tableService;

    @GetMapping
    public ResponseEntity<List<TableDto.TableResponse>> getAllTables() {
        return ResponseEntity.ok(tableService.getAllTables());
    }

    @GetMapping("/{tableNumber}")
    public ResponseEntity<TableDto.TableResponse> getTableByNumber(@PathVariable Integer tableNumber) {
        return ResponseEntity.ok(tableService.getTableByNumber(tableNumber));
    }

    @GetMapping("/{tableNumber}/validate-token")
    public ResponseEntity<?> validateTableToken(@PathVariable Integer tableNumber, @RequestParam(required = false) String token) {
        boolean valid = tableService.validateTableToken(tableNumber, token);
        return ResponseEntity.ok(Map.of("valid", valid, "tableNumber", tableNumber));
    }
}
