-- Migration: create tbl_staff_departments
-- Created at 2025-08-16T04:06:57.442Z

CREATE TABLE IF NOT EXISTS tbl_staff_departments (
  id INT AUTO_INCREMENT PRIMARY KEY, -- Primary key
  department_code VARCHAR(20) NOT NULL UNIQUE, -- TLS, CRM, DEV (unique)
  department_name VARCHAR(100) NOT NULL UNIQUE -- Telesales, CRM, Developer (unique)
);