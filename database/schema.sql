-- NeuroFleetX Database Schema
CREATE DATABASE IF NOT EXISTS neurofleetx;
USE neurofleetx;

CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('ADMIN','FLEET_MANAGER','DRIVER','CUSTOMER') NOT NULL DEFAULT 'CUSTOMER',
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE vehicles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('SEDAN','SUV','VAN','TRUCK','EV_BUS','BIKE') NOT NULL,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    status ENUM('AVAILABLE','IN_USE','MAINTENANCE') DEFAULT 'AVAILABLE',
    fuel_type ENUM('PETROL','DIESEL','ELECTRIC','HYBRID') DEFAULT 'PETROL',
    seats INT DEFAULT 4,
    speed DOUBLE DEFAULT 0,
    fuel_level DOUBLE DEFAULT 100,
    battery_level DOUBLE DEFAULT 100,
    latitude DOUBLE DEFAULT 19.8762,
    longitude DOUBLE DEFAULT 75.3433,
    engine_health DOUBLE DEFAULT 100,
    tire_wear DOUBLE DEFAULT 100,
    total_km DOUBLE DEFAULT 0,
    model VARCHAR(100),
    year INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bookings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    vehicle_id BIGINT NOT NULL,
    source VARCHAR(200) NOT NULL,
    destination VARCHAR(200) NOT NULL,
    pickup_time TIMESTAMP NOT NULL,
    drop_time TIMESTAMP,
    status ENUM('PENDING','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED') DEFAULT 'PENDING',
    distance_km DOUBLE DEFAULT 0,
    fare DOUBLE DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

CREATE TABLE trips (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    driver_id BIGINT,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    start_lat DOUBLE,
    start_lng DOUBLE,
    end_lat DOUBLE,
    end_lng DOUBLE,
    actual_distance DOUBLE DEFAULT 0,
    status ENUM('STARTED','IN_PROGRESS','COMPLETED') DEFAULT 'STARTED',
    FOREIGN KEY (booking_id) REFERENCES bookings(id),
    FOREIGN KEY (driver_id) REFERENCES users(id)
);

CREATE TABLE maintenance_alerts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id BIGINT NOT NULL,
    alert_type VARCHAR(100) NOT NULL,
    severity ENUM('LOW','MEDIUM','HIGH','CRITICAL') DEFAULT 'LOW',
    message TEXT,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

-- Seed data
INSERT INTO users (name, email, password, role, phone) VALUES
('Admin User', 'admin@neurofleetx.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ADMIN', '9999000001'),
('Fleet Manager', 'manager@neurofleetx.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'FLEET_MANAGER', '9999000002'),
('Driver One', 'driver@neurofleetx.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'DRIVER', '9999000003'),
('Customer One', 'customer@neurofleetx.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'CUSTOMER', '9999000004');
-- Default password: password123

INSERT INTO vehicles (name, type, license_plate, status, fuel_type, seats, fuel_level, battery_level, latitude, longitude, engine_health, tire_wear, model, year) VALUES
('City Cruiser 01', 'SEDAN', 'MH20AB1234', 'AVAILABLE', 'PETROL', 4, 85, 100, 19.8762, 75.3433, 92, 88, 'Toyota Camry', 2022),
('EV Bus Alpha', 'EV_BUS', 'MH20CD5678', 'IN_USE', 'ELECTRIC', 20, 100, 72, 19.8800, 75.3500, 88, 75, 'BYD K9', 2023),
('SUV Titan', 'SUV', 'MH20EF9012', 'AVAILABLE', 'DIESEL', 7, 60, 100, 19.8700, 75.3350, 95, 91, 'Toyota Fortuner', 2021),
('Cargo Van X', 'VAN', 'MH20GH3456', 'MAINTENANCE', 'DIESEL', 2, 40, 100, 19.8850, 75.3600, 45, 55, 'Tata Ace', 2020),
('EV Compact 02', 'SEDAN', 'MH20IJ7890', 'AVAILABLE', 'ELECTRIC', 4, 100, 90, 19.8720, 75.3470, 97, 93, 'Tata Nexon EV', 2023),
('Shuttle Pro', 'VAN', 'MH20KL2345', 'IN_USE', 'HYBRID', 12, 78, 65, 19.8780, 75.3520, 82, 79, 'Toyota HiAce', 2022);
