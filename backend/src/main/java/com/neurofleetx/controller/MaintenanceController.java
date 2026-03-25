package com.neurofleetx.controller;

import com.neurofleetx.entity.MaintenanceAlert;
import com.neurofleetx.entity.Vehicle;
import com.neurofleetx.repository.MaintenanceAlertRepository;
import com.neurofleetx.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/maintenance")
public class MaintenanceController {

    @Autowired private MaintenanceAlertRepository alertRepository;
    @Autowired private VehicleRepository vehicleRepository;

    @GetMapping("/alerts")
    public List<MaintenanceAlert> getAllAlerts() {
        return alertRepository.findAll();
    }

    @GetMapping("/alerts/active")
    public List<MaintenanceAlert> getActiveAlerts() {
        return alertRepository.findByIsResolvedFalse();
    }

    @GetMapping("/alerts/vehicle/{vehicleId}")
    public List<MaintenanceAlert> getVehicleAlerts(@PathVariable Long vehicleId) {
        Vehicle v = vehicleRepository.findById(vehicleId).orElseThrow();
        return alertRepository.findByVehicle(v);
    }

    @PatchMapping("/alerts/{id}/resolve")
    public ResponseEntity<MaintenanceAlert> resolveAlert(@PathVariable Long id) {
        return alertRepository.findById(id).map(a -> {
            a.setIsResolved(true);
            return ResponseEntity.ok(alertRepository.save(a));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/health/{vehicleId}")
    public ResponseEntity<Map<String, Object>> getVehicleHealth(@PathVariable Long vehicleId) {
        return vehicleRepository.findById(vehicleId).map(v -> {
            Map<String, Object> health = Map.of(
                "vehicleId", v.getId(),
                "vehicleName", v.getName(),
                "engineHealth", v.getEngineHealth(),
                "tireWear", v.getTireWear(),
                "batteryLevel", v.getBatteryLevel(),
                "fuelLevel", v.getFuelLevel(),
                "totalKm", v.getTotalKm()
            );
            return ResponseEntity.ok(health);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/check/{vehicleId}")
    public ResponseEntity<?> runHealthCheck(@PathVariable Long vehicleId) {
        Vehicle v = vehicleRepository.findById(vehicleId).orElseThrow();
        if (v.getEngineHealth() < 50) {
            createAlert(v, "ENGINE_HEALTH", MaintenanceAlert.Severity.CRITICAL, "Engine health critical: " + v.getEngineHealth() + "%");
        }
        if (v.getTireWear() < 40) {
            createAlert(v, "TIRE_WEAR", MaintenanceAlert.Severity.HIGH, "Tire wear low: " + v.getTireWear() + "%");
        }
        if (v.getBatteryLevel() < 20) {
            createAlert(v, "LOW_BATTERY", MaintenanceAlert.Severity.MEDIUM, "Battery low: " + v.getBatteryLevel() + "%");
        }
        if (v.getFuelLevel() < 15) {
            createAlert(v, "LOW_FUEL", MaintenanceAlert.Severity.MEDIUM, "Fuel level low: " + v.getFuelLevel() + "%");
        }
        return ResponseEntity.ok("Health check completed");
    }

    private void createAlert(Vehicle v, String type, MaintenanceAlert.Severity severity, String message) {
        MaintenanceAlert alert = MaintenanceAlert.builder()
            .vehicle(v).alertType(type).severity(severity).message(message).isResolved(false).build();
        alertRepository.save(alert);
    }
}
