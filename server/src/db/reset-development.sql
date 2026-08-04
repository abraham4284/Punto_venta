/*
  DEVELOPMENT ONLY.
  This script deletes the complete database and all its data.
  Do not run in production.
*/

DROP DATABASE IF EXISTS `punto_venta_dev_clean_2`;
SOURCE install.sql;
