package com.neurofleetx.repository;

import com.neurofleetx.entity.MaintenanceAlert;
import com.neurofleetx.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MaintenanceAlertRepository extends JpaRepository<MaintenanceAlert, Long> {
    List<MaintenanceAlert> findByVehicle(Vehicle vehicle);
    List<MaintenanceAlert> findByIsResolvedFalse();
    List<MaintenanceAlert> findBySeverity(MaintenanceAlert.Severity severity);
}
