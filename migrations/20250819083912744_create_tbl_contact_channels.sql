-- Migration: create tbl_contact_channels
-- Created at 2025-08-19T08:39:12.745Z

CREATE TABLE IF NOT EXISTS tbl_contact_channels (
  channel_id INT AUTO_INCREMENT PRIMARY KEY,
  channel_code VARCHAR(20) NOT NULL UNIQUE,   -- e.g. 'ph','em','tg','zl','vb','fb','wa','wc','ds'
  channel_name VARCHAR(50) NOT NULL UNIQUE
);
