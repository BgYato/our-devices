--------------------------------
-- DATABASE OUR DEVICES
--------------------------------

DROP DATABASE IF EXISTS `our_devices`;
CREATE DATABASE IF NOT EXISTS `our_devices`;

USE `our_devices`;

--------------------------------
-- QUERIES
--------------------------------

SHOW TABLES;
DESCRIBE `devices_entity`;
DESCRIBE `user_entity`;

--------------------------------
-- DROPS
--------------------------------

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE `devices_entity`;
DROP TABLE `users_entity`;
SET FOREIGN_KEY_CHECKS = 1;

--------------------------------
-- QUERIES TABLES
--------------------------------

SELECT * FROM `users_entity`;
