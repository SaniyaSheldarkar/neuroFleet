package com.neurofleetx.repository;

import com.neurofleetx.entity.Booking;
import com.neurofleetx.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByCustomer(User customer);
    List<Booking> findByStatus(Booking.BookingStatus status);
    
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.status = 'IN_PROGRESS'")
    long countActiveTrips();
    
    @Query("SELECT SUM(b.fare) FROM Booking b WHERE b.status = 'COMPLETED'")
    Double totalRevenue();
}
