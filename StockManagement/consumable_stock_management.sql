-- Consumable Stock Management
-- MySQL database schema + initial seed data
-- Import this file into phpMyAdmin after creating/selecting:
-- consumable_stock_management

CREATE DATABASE IF NOT EXISTS consumable_stock_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE consumable_stock_management;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS indent_items;
DROP TABLE IF EXISTS indents;
DROP TABLE IF EXISTS stock_transactions;
DROP TABLE IF EXISTS transfers;
DROP TABLE IF EXISTS purchases;
DROP TABLE IF EXISTS product_remarks;
DROP TABLE IF EXISTS product_document_references;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS stock_documents;
DROP TABLE IF EXISTS units;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS roles;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE roles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(30) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE departments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  code VARCHAR(30) NOT NULL UNIQUE,
  description VARCHAR(255),
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  description TEXT,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE units (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  symbol VARCHAR(30) NOT NULL,
  description VARCHAR(255),
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE stock_documents (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  document_code VARCHAR(50) NOT NULL UNIQUE,
  document_name VARCHAR(150) NOT NULL,
  description VARCHAR(255),
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  role_id INT UNSIGNED NOT NULL,
  department_id INT UNSIGNED,
  avatar_text VARCHAR(10),
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id),
  CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES departments(id)
) ENGINE=InnoDB;

CREATE TABLE products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_code VARCHAR(50) NOT NULL UNIQUE,
  product_name VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  description TEXT,
  category_id INT UNSIGNED NOT NULL,
  unit_id INT UNSIGNED NOT NULL,
  current_quantity DECIMAL(12,2) NOT NULL DEFAULT 0,
  minimum_quantity DECIMAL(12,2) NOT NULL DEFAULT 0,
  minimum_stock_level DECIMAL(12,2),
  stock_register_id INT UNSIGNED,
  page_number INT UNSIGNED,
  active TINYINT(1) NOT NULL DEFAULT 1,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  created_by INT UNSIGNED,
  updated_by INT UNSIGNED,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id),
  CONSTRAINT fk_products_unit FOREIGN KEY (unit_id) REFERENCES units(id),
  CONSTRAINT fk_products_stock_document FOREIGN KEY (stock_register_id) REFERENCES stock_documents(id),
  CONSTRAINT fk_products_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_products_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_products_category (category_id),
  INDEX idx_products_unit (unit_id),
  INDEX idx_products_stock (current_quantity, minimum_quantity)
) ENGINE=InnoDB;

CREATE TABLE product_document_references (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  stock_document_id INT UNSIGNED NOT NULL,
  stock_document_name VARCHAR(150),
  page_number INT UNSIGNED,
  reference_note VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pdr_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_pdr_document FOREIGN KEY (stock_document_id) REFERENCES stock_documents(id),
  INDEX idx_pdr_product (product_id)
) ENGINE=InnoDB;

CREATE TABLE product_remarks (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  remark TEXT NOT NULL,
  created_by INT UNSIGNED,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_remarks_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_product_remarks_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_product_remarks_product (product_id)
) ENGINE=InnoDB;

CREATE TABLE purchases (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  purchase_number VARCHAR(50) NOT NULL UNIQUE,
  product_id INT UNSIGNED NOT NULL,
  quantity DECIMAL(12,2) NOT NULL,
  unit_price DECIMAL(12,2),
  total_amount DECIMAL(14,2),
  supplier VARCHAR(255),
  invoice_number VARCHAR(100),
  purchase_date DATE NOT NULL,
  stock_register_id INT UNSIGNED,
  page_number INT UNSIGNED,
  remarks TEXT,
  recorded_by INT UNSIGNED,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_purchases_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_purchases_document FOREIGN KEY (stock_register_id) REFERENCES stock_documents(id),
  CONSTRAINT fk_purchases_user FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_purchases_product_date (product_id, purchase_date)
) ENGINE=InnoDB;

CREATE TABLE transfers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  transfer_number VARCHAR(50) NOT NULL UNIQUE,
  product_id INT UNSIGNED NOT NULL,
  quantity DECIMAL(12,2) NOT NULL,
  department_id INT UNSIGNED NOT NULL,
  issued_to VARCHAR(150),
  issued_by INT UNSIGNED,
  purpose VARCHAR(255),
  transfer_date DATE NOT NULL,
  stock_register_id INT UNSIGNED,
  page_number INT UNSIGNED,
  remarks TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_transfers_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_transfers_department FOREIGN KEY (department_id) REFERENCES departments(id),
  CONSTRAINT fk_transfers_user FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_transfers_document FOREIGN KEY (stock_register_id) REFERENCES stock_documents(id),
  INDEX idx_transfers_product_date (product_id, transfer_date)
) ENGINE=InnoDB;

CREATE TABLE stock_transactions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  transaction_code VARCHAR(50) NOT NULL UNIQUE,
  product_id INT UNSIGNED NOT NULL,
  transaction_type VARCHAR(30) NOT NULL,
  quantity DECIMAL(12,2) NOT NULL,
  previous_quantity DECIMAL(12,2) NOT NULL,
  new_quantity DECIMAL(12,2) NOT NULL,
  department_id INT UNSIGNED,
  reference_id INT UNSIGNED,
  reference_type VARCHAR(50),
  remarks TEXT,
  transaction_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  recorded_by INT UNSIGNED,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_stock_tx_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_stock_tx_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  CONSTRAINT fk_stock_tx_user FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_stock_tx_product_date (product_id, transaction_date),
  INDEX idx_stock_tx_type (transaction_type)
) ENGINE=InnoDB;

CREATE TABLE indents (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  indent_number VARCHAR(50) NOT NULL UNIQUE,
  department_id INT UNSIGNED NOT NULL,
  requested_by INT UNSIGNED NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
  remarks TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_indents_department FOREIGN KEY (department_id) REFERENCES departments(id),
  CONSTRAINT fk_indents_user FOREIGN KEY (requested_by) REFERENCES users(id),
  INDEX idx_indents_status (status),
  INDEX idx_indents_requester (requested_by)
) ENGINE=InnoDB;

CREATE TABLE indent_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  indent_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  requested_quantity DECIMAL(12,2) NOT NULL,
  approved_quantity DECIMAL(12,2) NOT NULL DEFAULT 0,
  issued_quantity DECIMAL(12,2) NOT NULL DEFAULT 0,
  remarks TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_indent_items_indent FOREIGN KEY (indent_id) REFERENCES indents(id) ON DELETE CASCADE,
  CONSTRAINT fk_indent_items_product FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_indent_items_indent (indent_id),
  INDEX idx_indent_items_product (product_id)
) ENGINE=InnoDB;

CREATE TABLE notifications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  reference_id INT UNSIGNED,
  reference_type VARCHAR(50),
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_user_read (user_id, is_read, created_at)
) ENGINE=InnoDB;

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO roles (id, name, description) VALUES
(1, 'ADMIN', 'Consumable Stock Administrator with full CRUD'),
(2, 'FACULTY', 'Academic Faculty with Catalog browsing and Indent requisition privileges');

INSERT INTO departments (id, name, code, description) VALUES
(1, 'Electrical & Electronics Engineering', 'EEE', 'Electrical and Electronics Engineering Department'),
(2, 'Computer Science and Engineering', 'CSE', 'Computer Science and Engineering Department'),
(3, 'Electronics and Communication Engineering', 'ECE', 'Electronics and Communication Engineering Department'),
(4, 'Mechanical Engineering', 'MECH', 'Mechanical Engineering Department'),
(5, 'Civil Engineering', 'CIVIL', 'Civil Engineering Department'),
(6, 'Information Technology', 'IT', 'Information Technology Department'),
(7, 'Central Store', 'STORE', 'Central Store');

INSERT INTO categories (id, name, description) VALUES
(1, 'Lighting', 'Lighting products'),
(2, 'Wiring', 'Electrical wiring products'),
(3, 'Switchgear', 'Switchgear and protection products'),
(4, 'Electrical Accessories', 'Electrical accessories'),
(5, 'Appliances', 'Electrical appliances'),
(6, 'Consumables', 'General consumable electrical materials');

INSERT INTO units (id, name, symbol, description) VALUES
(1, 'Pieces', 'pcs', 'Individual pieces'),
(2, 'Meter', 'm', 'Length in meters'),
(3, 'Roll', 'roll', 'Roll quantity'),
(4, 'Box', 'box', 'Box quantity'),
(5, 'Coil', 'coil', 'Coil quantity'),
(6, 'Set', 'set', 'Set quantity');

INSERT INTO stock_documents (id, document_code, document_name, description) VALUES
(1, 'CSSR1', 'CSSR1', 'Central stock register CSSR1'),
(2, 'SR1', 'SR1', 'Stock register SR1'),
(3, 'SR2', 'SR2', 'Stock register SR2'),
(4, 'SR3', 'SR3', 'Stock register SR3');

-- Demo credentials from the existing seed.
-- For production, passwords MUST be stored as secure hashes.
INSERT INTO users
(id, username, password, name, email, role_id, department_id, avatar_text, active)
VALUES
(1, 'admin', 'admin123', 'System Admin', 'admin@nec.edu.in', 1, 7, 'AD', 1),
(2, 'faculty', 'faculty123', 'Faculty User', 'faculty@nec.edu.in', 2, 1, 'FA', 1);

INSERT INTO products
(id, product_code, product_name, name, description, category_id, unit_id,
 current_quantity, minimum_quantity, minimum_stock_level, stock_register_id,
 page_number, active, status, created_by, updated_by)
VALUES
(1, 'CON-0001', 'LED Bulb 10W B22', 'LED Bulb 10W B22',
 '10W LED bulb with B22 base', 1, 1, 25, 10, 10, 2, 15, 1, 'ACTIVE', 1, 1),
(2, 'CON-0002', 'Switch 2-pin 6A', 'Switch 2-pin 6A',
 '2-pin 6A electrical switch', 4, 1, 4, 10, 10, 3, 28, 1, 'ACTIVE', 1, 1),
(3, 'CON-0003', 'Ceiling Fan 1200mm', 'Ceiling Fan 1200mm',
 '1200mm ceiling fan', 5, 1, 14, 4, 4, 4, 12, 1, 'ACTIVE', 1, 1),
(4, 'CON-0004', 'MCB 32A Single Pole', 'MCB 32A Single Pole',
 '32A single pole miniature circuit breaker', 3, 1, 18, 8, 8, 3, 45, 1, 'ACTIVE', 1, 1),
(5, 'CON-0005', 'Copper Wire 1.5 sq.mm Red', 'Copper Wire 1.5 sq.mm Red',
 '1.5 sq.mm red copper electrical wire', 2, 5, 12, 5, 5, 2, 8, 1, 'ACTIVE', 1, 1),
(6, 'CON-0006', 'PVC Insulation Tape Black', 'PVC Insulation Tape Black',
 'Black PVC insulation tape', 6, 3, 40, 15, 15, 2, 3, 1, 'ACTIVE', 1, 1);

INSERT INTO product_document_references
(product_id, stock_document_id, stock_document_name, page_number, reference_note)
VALUES
(1, 2, 'SR1', 15, 'Primary stock register reference'),
(1, 1, 'CSSR1', 42, 'Secondary stock register reference'),
(2, 3, 'SR2', 28, 'Primary stock register reference'),
(3, 4, 'SR3', 12, 'Primary stock register reference'),
(4, 3, 'SR2', 45, 'Primary stock register reference'),
(5, 2, 'SR1', 8, 'Primary stock register reference'),
(6, 2, 'SR1', 3, 'Primary stock register reference');

INSERT INTO product_remarks (product_id, remark, created_by) VALUES
(1, 'Initial stock item', 1),
(2, 'Low stock sample for testing alerts', 1),
(3, 'Initial stock item', 1),
(4, 'Initial stock item', 1),
(5, 'Initial stock item', 1),
(6, 'Initial stock item', 1);

-- Opening stock transactions. These establish the initial audit trail.
INSERT INTO stock_transactions
(transaction_code, product_id, transaction_type, quantity, previous_quantity,
 new_quantity, department_id, reference_type, remarks, transaction_date, recorded_by)
VALUES
('TXN-OPEN-0001', 1, 'PURCHASE', 25, 0, 25, 7, 'OPENING_STOCK', 'Physical register opening stock balance', CURRENT_TIMESTAMP, 1),
('TXN-OPEN-0002', 2, 'PURCHASE', 4, 0, 4, 7, 'OPENING_STOCK', 'Physical register opening stock balance', CURRENT_TIMESTAMP, 1),
('TXN-OPEN-0003', 3, 'PURCHASE', 14, 0, 14, 7, 'OPENING_STOCK', 'Physical register opening stock balance', CURRENT_TIMESTAMP, 1),
('TXN-OPEN-0004', 4, 'PURCHASE', 18, 0, 18, 7, 'OPENING_STOCK', 'Physical register opening stock balance', CURRENT_TIMESTAMP, 1),
('TXN-OPEN-0005', 5, 'PURCHASE', 12, 0, 12, 7, 'OPENING_STOCK', 'Physical register opening stock balance', CURRENT_TIMESTAMP, 1),
('TXN-OPEN-0006', 6, 'PURCHASE', 40, 0, 40, 7, 'OPENING_STOCK', 'Physical register opening stock balance', CURRENT_TIMESTAMP, 1);

-- Existing sample purchase: CON-0001, +10.
INSERT INTO purchases
(purchase_number, product_id, quantity, unit_price, total_amount, supplier,
 invoice_number, purchase_date, stock_register_id, page_number, remarks, recorded_by)
VALUES
('PUR-0001', 1, 10, 95.00, 950.00, 'National Electrical Supplies',
 'INV-2026-884', CURRENT_DATE, 2, 15, 'Sample purchase record', 1);

INSERT INTO stock_transactions
(transaction_code, product_id, transaction_type, quantity, previous_quantity,
 new_quantity, department_id, reference_id, reference_type, remarks, transaction_date, recorded_by)
VALUES
('TXN-PUR-0001', 1, 'PURCHASE', 10, 25, 35, 7, 1, 'PURCHASE',
 'Stock increased through purchase', CURRENT_TIMESTAMP, 1);

-- IMPORTANT: current_quantity is made consistent with the purchase transaction.
UPDATE products SET current_quantity = 35 WHERE id = 1;

-- Existing sample transfer: CON-0006, -5 to EEE.
INSERT INTO transfers
(transfer_number, product_id, quantity, department_id, issued_to, issued_by,
 purpose, transfer_date, stock_register_id, page_number, remarks)
VALUES
('TRF-0001', 6, 5, 1, 'Faculty User', 1,
 'Lab wiring maintenance', CURRENT_DATE, 2, 3, 'Sample physical transfer record');

INSERT INTO stock_transactions
(transaction_code, product_id, transaction_type, quantity, previous_quantity,
 new_quantity, department_id, reference_id, reference_type, remarks, transaction_date, recorded_by)
VALUES
('TXN-TRF-0001', 6, 'TRANSFER', 5, 40, 35, 1, 1, 'TRANSFER',
 'Stock transferred to EEE department', CURRENT_TIMESTAMP, 1);

-- IMPORTANT: current_quantity is made consistent with the transfer transaction.
UPDATE products SET current_quantity = 35 WHERE id = 6;

-- Existing sample indent.
INSERT INTO indents
(id, indent_number, department_id, requested_by, status, remarks)
VALUES
(1, 'IND-0001', 1, 2, 'SUBMITTED', 'Sample faculty indent');

INSERT INTO indent_items
(indent_id, product_id, requested_quantity, approved_quantity, issued_quantity, remarks)
VALUES
(1, 1, 5, 0, 0, NULL),
(1, 2, 2, 0, 0, NULL);

-- Notifications.
INSERT INTO notifications
(user_id, type, title, message, reference_id, reference_type, is_read)
VALUES
(1, 'LOW_STOCK', 'Low Stock Alert',
 'Switch 2-pin 6A is at or below the minimum stock quantity.',
 2, 'PRODUCT', 0),
(1, 'INDENT_CREATED', 'New Indent Request',
 'A new indent IND-0001 has been submitted by Faculty User.',
 1, 'INDENT', 0);

-- Useful verification queries:
-- SELECT * FROM products;
-- SELECT * FROM stock_transactions ORDER BY transaction_date DESC;
-- SELECT * FROM indents;
-- SELECT * FROM indent_items;
-- SELECT * FROM notifications;
