-- Users
INSERT INTO users (name, email, address)
VALUES
('Saniya Sheldarkar', 'saniya@gmail.com', 'Aurangabad'),
('Rahul Patil', 'rahul@gmail.com', 'Pune');

-- Products
INSERT INTO products (product_name, price, stock)
VALUES
('Laptop', 55000, 10),
('Headphones', 2000, 25),
('Mouse', 800, 50);

-- Orders
INSERT INTO orders (user_id, order_date, total_amount)
VALUES
(1, '2026-02-09', 57000);

-- Order Items
INSERT INTO order_items (order_id, product_id, quantity, price)
VALUES
(1, 1, 1, 55000),
(1, 2, 1, 2000);
