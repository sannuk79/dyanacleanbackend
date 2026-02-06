const mysql = require('mysql2/promise');
require('dotenv').config();

async function setup() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    console.log('Connected to MySQL server');

    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    console.log(`Database ${process.env.DB_NAME} ensured`);

    await connection.query(`USE ${process.env.DB_NAME}`);

    await connection.query(`DROP TABLE IF EXISTS employees`);
    await connection.query(`
        CREATE TABLE employees (
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
        )
    `);
    console.log('Employees table ensured');

    await connection.end();
    console.log('Setup complete');
}

setup().catch(err => {
    console.error('Setup failed:', err);
    process.exit(1);
});
