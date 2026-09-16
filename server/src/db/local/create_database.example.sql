/*
  DEVELOPMENT / LOCAL EXAMPLE ONLY.
  DO NOT USE AS PRODUCTION INSTALLER.

  The canonical baseline does not create or select a database by name.
  Use this file only as a local convenience example, then run:

    SOURCE ../install.sql;
*/

CREATE DATABASE IF NOT EXISTS `cajora_local`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `cajora_local`;
