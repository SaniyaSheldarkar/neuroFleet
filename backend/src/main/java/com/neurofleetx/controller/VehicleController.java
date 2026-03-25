package com.neurofleetx.controller;

import com.neurofleetx.entity.Vehicle;
import com.neurofleetx.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    @Autowired
    private VehicleRepository vehicleRepository;

    @GetMapping
    public List<Vehicle> getAllVehicles() {
        return vehicleRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Vehicle> getVehicle(@PathVariable Long id) {
        return vehicleRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/status/{status}")
    public List<Vehicle> getByStatus(@PathVariable String status) {
        return vehicleRepository.findByStatus(Vehicle.VehicleStatus.valueOf(status.toUpperCase()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','FLEET_MANAGER')")
    public Vehicle createVehicle(@RequestBody Vehicle vehicle) {
        return vehicleRepository.save(vehicle);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','FLEET_MANAGER')")
    public ResponseEntity<Vehicle> updateVehicle(@PathVariable Long id, @RequestBody Vehicle updated) {
        return vehicleRepository.findById(id).map(v -> {
            v.setName(updated.getName());
            v.setType(updated.getType());
            v.setStatus(updated.getStatus());
            v.setFuelType(updated.getFuelType());
            v.setSeats(updated.getSeats());
            v.setModel(updated.getModel());
            v.setYear(updated.getYear());
            if (updated.getLicensePlate() != null) v.setLicensePlate(updated.getLicensePlate());
            return ResponseEntity.ok(vehicleRepository.save(v));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteVehicle(@PathVariable Long id) {
        vehicleRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','FLEET_MANAGER')")
    public ResponseEntity<Vehicle> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return vehicleRepository.findById(id).map(v -> {
            v.setStatus(Vehicle.VehicleStatus.valueOf(body.get("status").toUpperCase()));
            return ResponseEntity.ok(vehicleRepository.save(v));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/stats")
    public Map<String, Long> getStats() {
        return Map.of(
            "total", vehicleRepository.count(),
            "available", vehicleRepository.countByStatus(Vehicle.VehicleStatus.AVAILABLE),
            "inUse", vehicleRepository.countByStatus(Vehicle.VehicleStatus.IN_USE),
            "maintenance", vehicleRepository.countByStatus(Vehicle.VehicleStatus.MAINTENANCE)
        );
    }
}
