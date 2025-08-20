-- Migration: create tbl_contact_points
-- Created at 2025-08-19T08:41:58.578Z

CREATE TABLE IF NOT EXISTS tbl_contact_points (
  point_id      INT AUTO_INCREMENT PRIMARY KEY,
  contact_id    BIGINT NOT NULL,
  channel_code  VARCHAR(20) NOT NULL DEFAULT 'ph',
  value_raw     VARCHAR(255) NOT NULL,        -- as user types in
  value_norm    VARCHAR(255) NOT NULL,        -- normalized in the app
  is_primary    TINYINT(1) NOT NULL DEFAULT 1,
  verify_at     DATETIME NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (contact_id)   REFERENCES contacts(contact_id) ON DELETE CASCADE,
  FOREIGN KEY (channel_code) REFERENCES contact_channels(channel_code),

  UNIQUE KEY uq_contact_point (channel_code, value_norm),
  KEY idx_contact_points_1 (contact_id, channel_code),
  KEY idx_contact_points_2 (channel_code, value_norm)
);
