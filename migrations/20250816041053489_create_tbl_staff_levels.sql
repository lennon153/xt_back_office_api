-- Migration: create tbl_staff_levels
-- Created at 2025-08-16T04:10:53.489Z

CREATE TABLE IF NOT EXISTS tbl_staff_levels (
  id INT AUTO_INCREMENT PRIMARY KEY,           -- Primary key
  level_code VARCHAR(20) NOT NULL UNIQUE,      -- MNG, LEA, EXC1, EXC2 (unique)
  level_name VARCHAR(100) NOT NULL UNIQUE      -- Manager, Leader, Junior Executive, Senior Executive (unique)
);
