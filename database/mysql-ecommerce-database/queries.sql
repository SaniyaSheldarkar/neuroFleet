-- View all users
SELECT * FROM users;

-- View all products
SELECT * FROM products;

-- Orders with user details
SELECT o.order_id, u.name, o.order_date, o.total_amount
FROM orders o
JOIN users u ON o.user_id = u.user_id;

-- Order details with products
SELECT o.order_id, p.product_name, oi.quantity, oi.price
FROM order_items oi
JOIN orders o ON oi.order_id = o.order_id
JOIN products p ON oi.product_id = p.product_id;

-- Update product stock
UPDATE products
SET stock = stock - 1
WHERE product_id = 1;

-- Delete an order
DELETE FROM orders WHERE order_id = 1;
