-- Create checkout table
CREATE TABLE checkout (
  id SERIAL PRIMARY KEY,
  payment_id VARCHAR(255) NOT NULL,
  payment_code VARCHAR(255) NOT NULL,
  status VARCHAR(100) NOT NULL,
  order_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Seed Data
INSERT INTO "checkout" ("payment_id", "payment_code", "status", "order_id", "created_at", "updated_at") VALUES
 ('123456', 'CODE123', 'PENDING', 1, NOW(), NOW()),
 ('789012', 'CODE789', 'COMPLETED', 2, NOW(), NOW()),
 ('345678', 'CODE345', 'PENDING', 3, NOW(), NOW()),
 ('901234', 'CODE901', 'FAILED', 4, NOW(), NOW()),
 ('567890', 'CODE567', 'COMPLETED', 5, NOW(), NOW()),
 ('234567', 'CODE234', 'PENDING', 6, NOW(), NOW()),
 ('890123', 'CODE890', 'FAILED', 7, NOW(), NOW()),
 ('456789', 'CODE456', 'COMPLETED', 8, NOW(), NOW());