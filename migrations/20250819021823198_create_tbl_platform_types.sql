-- Migration: create tbl_platform_types
-- Created at 2025-08-19T02:18:23.199Z
CREATE TABLE IF NOT EXISTS tbl_platform_types (
  type_id INT AUTO_INCREMENT PRIMARY KEY,
  type_name VARCHAR(50) NOT NULL UNIQUE -- e.g. 'forum','streaming','marketplace'
);