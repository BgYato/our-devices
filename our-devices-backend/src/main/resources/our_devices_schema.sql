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

SET SQL_SAFE_UPDATES = 0;
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM `devices_entity`;
DELETE FROM `users_entity`;
SET FOREIGN_KEY_CHECKS = 1;
SET SQL_SAFE_UPDATES = 1;

--------------------------------
-- QUERIES TABLES
--------------------------------

SELECT * FROM `users_entity`;
SELECT * FROM `devices_entity`;