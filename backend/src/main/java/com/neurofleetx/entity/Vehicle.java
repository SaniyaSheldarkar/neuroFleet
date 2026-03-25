package com.neurofleetx.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vehicles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vehicle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    private VehicleType type;

    @Column(name = "license_plate", unique = true)
    private String licensePlate;

    @Enumerated(EnumType.STRING)
    private VehicleStatus status = VehicleStatus.AVAILABLE;

    @Enumerated(EnumType.STRING)
    private FuelType fuelType;

    private Integer seats;
    private Double speed = 0.0;
    private Double fuelLevel = 100.0;
    private Double batteryLevel = 100.0;
    private Double latitude = 19.8762;
    private Double longitude = 75.3433;
    private Double engineHealth = 100.0;
    private Double tireWear = 100.0;
    private Double totalKm = 0.0;
    private String model;
    private Integer year;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum VehicleType { SEDAN, SUV, VAN, TRUCK, EV_BUS, BIKE }
    public enum VehicleStatus { AVAILABLE, IN_USE, MAINTENANCE }
    public enum FuelType { PETROL, DIESEL, ELECTRIC, HYBRID }
}
