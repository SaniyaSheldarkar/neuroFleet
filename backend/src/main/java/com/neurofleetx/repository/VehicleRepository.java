package com.neurofleetx.repository;

import com.neurofleetx.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    List<Vehicle> findByStatus(Vehicle.VehicleStatus status);
    List<Vehicle> findByType(Vehicle.VehicleType type);
    List<Vehicle> findByFuelType(Vehicle.FuelType fuelType);
    long countByStatus(Vehicle.VehicleStatus status);
}
