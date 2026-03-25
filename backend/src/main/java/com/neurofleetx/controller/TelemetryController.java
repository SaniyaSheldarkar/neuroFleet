package com.neurofleetx.controller;

import com.neurofleetx.entity.Vehicle;
import com.neurofleetx.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Random;

@RestController
@RequestMapping("/api/telemetry")
public class TelemetryController {

    @Autowired private VehicleRepository vehicleRepository;
    @Autowired private SimpMessagingTemplate messagingTemplate;

    private final Random random = new Random();

    // Simulate telemetry every 3 seconds for IN_USE vehicles
    @Scheduled(fixedRate = 3000)
    public void simulateTelemetry() {
        List<Vehicle> activeVehicles = vehicleRepository.findByStatus(Vehicle.VehicleStatus.IN_USE);
        for (Vehicle v : activeVehicles) {
            // Move vehicle slightly
            v.setLatitude(v.getLatitude() + (random.nextDouble() - 0.5) * 0.002);
            v.setLongitude(v.getLongitude() + (random.nextDouble() - 0.5) * 0.002);
            v.setSpeed(30 + random.nextDouble() * 60);

            // Drain fuel/battery
            if (v.getFuelType() == Vehicle.FuelType.ELECTRIC) {
                v.setBatteryLevel(Math.max(5, v.getBatteryLevel() - random.nextDouble() * 0.3));
            } else {
                v.setFuelLevel(Math.max(5, v.getFuelLevel() - random.nextDouble() * 0.2));
            }

            // Degrade health slightly
            v.setEngineHealth(Math.max(10, v.getEngineHealth() - random.nextDouble() * 0.05));
            v.setTireWear(Math.max(10, v.getTireWear() - random.nextDouble() * 0.03));
            v.setTotalKm(v.getTotalKm() + v.getSpeed() * (3.0 / 3600));

            vehicleRepository.save(v);
            messagingTemplate.convertAndSend("/topic/telemetry", buildTelemetryPayload(v));
        }
        // Also push all vehicle locations
        List<Vehicle> all = vehicleRepository.findAll();
        messagingTemplate.convertAndSend("/topic/vehicles", all);
    }

    private java.util.Map<String, Object> buildTelemetryPayload(Vehicle v) {
        return java.util.Map.of(
            "vehicleId", v.getId(),
            "name", v.getName(),
            "lat", v.getLatitude(),
            "lng", v.getLongitude(),
            "speed", Math.round(v.getSpeed()),
            "fuelLevel", v.getFuelLevel(),
            "batteryLevel", v.getBatteryLevel(),
            "engineHealth", v.getEngineHealth(),
            "status", v.getStatus().name()
        );
    }

    @GetMapping("/all")
    public List<Vehicle> getAllTelemetry() {
        return vehicleRepository.findAll();
    }
}
