CREATE TABLE data_entries(  
    id int NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT 'Primary Key',
    create_time DATETIME COMMENT 'Create Time',
    device_id VARCHAR(255),
    data_value VARCHAR(255)
) COMMENT '';

CREATE TABLE data_entries(  
    id int NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT 'Primary Key',
    create_time DATETIME COMMENT 'Create Time',
    device_id VARCHAR(255),
    distance_cm INT,
    pitch_deg FLOAT,
    roll_deg FLOAT,
    yaw_deg FLOAT
) COMMENT '';

DROP TABLE IF EXISTS data_entries;

DELETE FROM data_entries;
ALTER TABLE data_entries AUTO_INCREMENT = 1;
SELECT COUNT(*) AS total_rows FROM data_entries;


