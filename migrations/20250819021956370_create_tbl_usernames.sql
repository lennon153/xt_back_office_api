-- Migration: create tbl_usernames
-- Created at 2025-08-19T02:19:56.371Z

CREATE TABLE IF NOT EXISTS tbl_usernames (
  username_id INT AUTO_INCREMENT PRIMARY KEY,
  contact_id BIGINT NOT NULL,
  platform_id BIGINT NOT NULL DEFAULT 0, -- FI88
  username VARCHAR(50) NOT NULL,
  username_status ENUM('active', 'banned', 'blocked') NOT NULL DEFAULT 'active',
  life_cycle ENUM('NC', 'TLS', 'CRM') NOT NULL DEFAULT 'NC',
  register_date DATETIME NULL DEFAULT CURRENT_TIMESTAMP, -- per-platform registration time
  has_deposited TINYINT (1) NOT NULL DEFAULT 0, -- optional cache for analytics
  last_deposit DATE NULL,
  vip_level TINYINT NULL,
  CONSTRAINT fk_usernames_contact FOREIGN KEY (contact_id) REFERENCES tbl_contacts (contact_id) ON DELETE CASCADE,
  CONSTRAINT fk_usernames_platform FOREIGN KEY (platform_id) REFERENCES tbl_platforms (platform_id),
  CONSTRAINT uq_platform_username UNIQUE (platform_id, username), -- per-platform uniqueness
  CONSTRAINT uq_contact_platform UNIQUE (contact_id, platform_id), -- 1 account per contact per platform
  KEY idx_usernames_contact (contact_id)
);