-- Migration: create tbl_staff
-- Created at 2025-08-16T04:11:58.978Z

CREATE TABLE IF NOT EXISTS tbl_staff (
  id INT AUTO_INCREMENT PRIMARY KEY,          -- Primary key
  staff_id BIGINT NOT NULL UNIQUE,            -- Unique staff identifier
  department_code VARCHAR(20) NOT NULL,
  level_code VARCHAR(20) NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  hired_at DATE NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_staff_departments
    FOREIGN KEY (department_code) REFERENCES tbl_staff_departments(department_code)
      ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_staff_levels
    FOREIGN KEY (level_code) REFERENCES tbl_staff_levels(level_code)
      ON DELETE RESTRICT ON UPDATE RESTRICT
);
