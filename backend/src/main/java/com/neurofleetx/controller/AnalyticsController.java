package com.neurofleetx.controller;

import com.neurofleetx.repository.BookingRepository;
import com.neurofleetx.repository.UserRepository;
import com.neurofleetx.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    @Autowired private BookingRepository bookingRepository;
    @Autowired private VehicleRepository vehicleRepository;
    @Autowired private UserRepository userRepository;

    @GetMapping("/kpis")
    public Map<String, Object> getKpis() {
        Double rev = bookingRepository.totalRevenue();
        return Map.of(
            "totalVehicles", vehicleRepository.count(),
            "totalUsers", userRepository.count(),
            "totalBookings", bookingRepository.count(),
            "activeTrips", bookingRepository.countActiveTrips(),
            "revenue", rev != null ? Math.round(rev) : 0,
            "availableVehicles", vehicleRepository.countByStatus(com.neurofleetx.entity.Vehicle.VehicleStatus.AVAILABLE)
        );
    }

    @GetMapping("/trips-per-hour")
    public List<Map<String, Object>> getTripsPerHour() {
        // Simulated hourly trip data
        String[] hours = {"8AM","9AM","10AM","11AM","12PM","1PM","2PM","3PM","4PM","5PM","6PM","7PM"};
        int[] trips =    { 12,   18,   24,    30,    22,    28,   35,   40,   38,   45,   32,   20 };
        List<Map<String, Object>> data = new ArrayList<>();
        for (int i = 0; i < hours.length; i++) {
            data.add(Map.of("hour", hours[i], "trips", trips[i]));
        }
        return data;
    }

    @GetMapping("/vehicle-usage")
    public List<Map<String, Object>> getVehicleUsage() {
        List<Map<String, Object>> data = new ArrayList<>();
        vehicleRepository.findAll().forEach(v -> data.add(Map.of(
            "name", v.getName(),
            "km", Math.round(v.getTotalKm()),
            "status", v.getStatus().name()
        )));
        return data;
    }

    @GetMapping("/revenue-weekly")
    public List<Map<String, Object>> getWeeklyRevenue() {
        String[] days = {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"};
        int[] revenue = {8200, 9500, 7800, 11200, 13400, 15600, 12100};
        List<Map<String, Object>> data = new ArrayList<>();
        for (int i = 0; i < days.length; i++) {
            data.add(Map.of("day", days[i], "revenue", revenue[i]));
        }
        return data;
    }
}
