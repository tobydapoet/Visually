CREATE DATABASE IF NOT EXISTS user_service;
CREATE DATABASE IF NOT EXISTS media_service;
CREATE DATABASE IF NOT EXISTS follow_service;
CREATE DATABASE IF NOT EXISTS content_service;
CREATE DATABASE IF NOT EXISTS interaction_service;
CREATE DATABASE IF NOT EXISTS message_service;
CREATE DATABASE IF NOT EXISTS notification_service;
CREATE DATABASE IF NOT EXISTS feed_service;
CREATE DATABASE IF NOT EXISTS ad_service;

CREATE USER IF NOT EXISTS 'NguyenTung'@'%' IDENTIFIED BY '123';

GRANT ALL PRIVILEGES ON user_service.* TO 'NguyenTung'@'%';
GRANT ALL PRIVILEGES ON media_service.* TO 'NguyenTung'@'%';
GRANT ALL PRIVILEGES ON follow_service.* TO 'NguyenTung'@'%';
GRANT ALL PRIVILEGES ON message_service.* TO 'NguyenTung'@'%';
GRANT ALL PRIVILEGES ON notification_service.* TO 'NguyenTung'@'%';
GRANT ALL PRIVILEGES ON feed_service.* TO 'NguyenTung'@'%';
GRANT ALL PRIVILEGES ON ad_service.* TO 'NguyenTung'@'%';
GRANT ALL PRIVILEGES ON content_service.* TO 'NguyenTung'@'%';
GRANT ALL PRIVILEGES ON interaction_service.* TO 'NguyenTung'@'%';

FLUSH PRIVILEGES;
