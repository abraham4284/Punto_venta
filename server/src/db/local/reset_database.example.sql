/*
  DEVELOPMENT / LOCAL EXAMPLE ONLY.
  DO NOT USE AS PRODUCTION INSTALLER.

  WARNING: this script deletes all information in the example database.
  It is intentionally not referenced by install.sql or the canonical baseline.
*/

DROP DATABASE IF EXISTS `cajora_local`;

CREATE DATABASE `cajora_local`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `cajora_local`;

SOURCE ../install.sql;
