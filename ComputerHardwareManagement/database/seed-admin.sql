-- ========================================================
-- Seed Initial Admin User
-- Location: database/seed-admin.sql
-- Default Admin credentials:
-- Username: admin
-- Email: admin@nec.edu.in
-- Password: admin123
-- (Bcrypt hash: $2a$10$giICNrUk4idavc6J5DUkH.qnN92KS6rGxmP2KEEKEI.gqcx0IBFbq)
-- ========================================================

USE consumable_stock_management;

-- Ensure roles exist
INSERT INTO roles (id, name, description)
VALUES 
  (1, 'ADMIN', 'Consumable Stock Administrator with full CRUD privileges'),
  (2, 'FACULTY', 'Academic Faculty with Catalog browsing and Indent requisition privileges')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Seed initial admin user if not exists
INSERT INTO users (id, username, password, name, email, role_id, department_id, avatar_text, active)
SELECT 
  1,
  'admin',
  '$2a$10$giICNrUk4idavc6J5DUkH.qnN92KS6rGxmP2KEEKEI.gqcx0IBFbq',
  'System Administrator',
  'admin@nec.edu.in',
  1,
  NULL,
  'A',
  1
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE username = 'admin' OR email = 'admin@nec.edu.in'
);
