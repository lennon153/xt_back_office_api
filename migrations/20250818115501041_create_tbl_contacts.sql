-- Migration: create tbl_contacts
-- Created at 2025-08-18T11:55:01.042Z

CREATE TABLE IF NOT EXISTS tbl_contacts (
  contact_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tel VARCHAR(255) NULL,
  full_name VARCHAR(255) NULL,
  contact_type ENUM('lead', 'customer') NOT NULL DEFAULT 'lead', -- customer = registered
  register_date DATETIME NULL, -- optional cache of first registration time
  last_call_at DATETIME NULL, -- update every time agent presses 'call'
  last_call_status ENUM(
    'no_answer',
    'connected_declined',
    'callback',
    'wrong_number',
    'blocked',
    'success'
  ) NULL,
  personal_note TEXT,
  contact_line VARCHAR(255) NULL, -- Affiliate / Line
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL DEFAULT NULL
);