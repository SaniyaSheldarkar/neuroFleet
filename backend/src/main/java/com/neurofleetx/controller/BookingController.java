package com.neurofleetx.controller;

import com.neurofleetx.entity.Booking;
import com.neurofleetx.entity.User;
import com.neurofleetx.entity.Vehicle;
import com.neurofleetx.repository.BookingRepository;
import com.neurofleetx.repository.UserRepository;
import com.neurofleetx.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired private BookingRepository bookingRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private VehicleRepository vehicleRepository;

    @GetMapping
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    @GetMapping("/my")
    public List<Booking> getMyBookings(Authentication auth) {
        User user = userRepository.findByEmail(auth.getName()).orElseThrow();
        return bookingRepository.findByCustomer(user);
    }

    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody Map<String, Object> body, Authentication auth) {
        User customer = userRepository.findByEmail(auth.getName()).orElseThrow();
        Long vehicleId = Long.valueOf(body.get("vehicleId").toString());
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
            .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        if (vehicle.getStatus() != Vehicle.VehicleStatus.AVAILABLE) {
            return ResponseEntity.badRequest().body("Vehicle is not available");
        }

        double distanceKm = Math.random() * 40 + 5;
        double fare = distanceKm * 12.5;

        Booking booking = Booking.builder()
            .customer(customer)
            .vehicle(vehicle)
            .source(body.get("source").toString())
            .destination(body.get("destination").toString())
            .pickupTime(LocalDateTime.parse(body.get("pickupTime").toString()))
            .status(Booking.BookingStatus.CONFIRMED)
            .distanceKm(distanceKm)
            .fare(Math.round(fare * 100.0) / 100.0)
            .notes(body.containsKey("notes") ? body.get("notes").toString() : null)
            .build();

        vehicle.setStatus(Vehicle.VehicleStatus.IN_USE);
        vehicleRepository.save(vehicle);

        return ResponseEntity.ok(bookingRepository.save(booking));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Booking> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return bookingRepository.findById(id).map(b -> {
            Booking.BookingStatus newStatus = Booking.BookingStatus.valueOf(body.get("status").toUpperCase());
            b.setStatus(newStatus);
            if (newStatus == Booking.BookingStatus.COMPLETED || newStatus == Booking.BookingStatus.CANCELLED) {
                b.getVehicle().setStatus(Vehicle.VehicleStatus.AVAILABLE);
                vehicleRepository.save(b.getVehicle());
                b.setDropTime(LocalDateTime.now());
            }
            return ResponseEntity.ok(bookingRepository.save(b));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        Double rev = bookingRepository.totalRevenue();
        return Map.of(
            "total", bookingRepository.count(),
            "activeTrips", bookingRepository.countActiveTrips(),
            "revenue", rev != null ? rev : 0.0
        );
    }
}
