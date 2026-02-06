CREATE DATABASE IF NOT EXISTS employee_db;
USE employee_db;
CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    emp_id VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(255),
    role VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    gender VARCHAR(20),
    salary VARCHAR(255),
    dob DATE,
    address TEXT,
    experience VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
