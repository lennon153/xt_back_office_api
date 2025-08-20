-- Migration: create tbl_platforms
-- Created at 2025-08-19T02:19:10.132Z

CREATE TABLE IF NOT EXISTS tbl_platforms (
  platform_id INT AUTO_INCREMENT PRIMARY KEY,
  type_id TINYINT NOT NULL,
  platform_name VARCHAR(255) NOT NULL UNIQUE,
  CONSTRAINT fk_platforms_type FOREIGN KEY (type_id) REFERENCES tbl_platform_types (type_id) ON DELETE RESTRICT ON UPDATE CASCADE
);
