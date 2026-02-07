const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { apiMonitor, onApiResponse } = require('@sannuk792/api-response-monitor');
// const mysql = require('mysql2/promise'); // MySQL Disabled but kept

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// --- API Response Monitor Storage ---
const apiLogs = [];
onApiResponse((log) => {
    apiLogs.unshift(log);
    if (apiLogs.length > 100) apiLogs.pop();
});

// --- API Monitor Endpoints (BEFORE middleware to avoid interception) ---
app.get('/api/monitor/logs', (req, res) => {
    res.json(apiLogs);
});

app.delete('/api/monitor/logs', (req, res) => {
    apiLogs.length = 0;
    res.json({ message: 'API logs cleared' });
});

// --- API Response Monitor Middleware (after monitor endpoints) ---
app.use(apiMonitor({ enabled: true, ignoreRoutes: ['/api/monitor', '/favicon.ico'] }));

// --- MongoDB Configuration ---
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch((err) => console.error('❌ MongoDB Connection Error:', err));

const employeeSchema = new mongoose.Schema({
    emp_id: String,
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    role: { type: String, required: true },
    department: String,
    gender: String,
    salary: String,
    dob: Date,
    address: String,
    experience: String,
    created_at: { type: Date, default: Date.now }
});

const Employee = mongoose.model('Employee', employeeSchema);

// --- MySQL Configuration (DISABLED as requested) ---
/*
let db;
const connectMySQL = async () => {
    try {
        db = await mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '1234',
            database: process.env.DB_NAME || 'employee_db'
        });
        console.log('SQL Check: Connection Pool Ready (Disabled)');
    } catch (err) {
        console.error('SQL Error:', err);
    }
};
connectMySQL();
*/

// --- API ROUTES (MongoDB) ---

// Register Employee
app.post('/api/employees', async (req, res) => {
    try {
        const newEmployee = new Employee(req.body);
        const savedEmployee = await newEmployee.save();
        res.status(201).json(savedEmployee);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Get Employees
app.get('/api/employees', async (req, res) => {
    try {
        const employees = await Employee.find().sort({ created_at: -1 });
        // Transform _id to id for frontend compatibility
        const formattedEmployees = employees.map(emp => ({
            ...emp.toObject(),
            id: emp._id
        }));
        res.json(formattedEmployees);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Update Employee
app.put('/api/employees/:id', async (req, res) => {
    try {
        const updatedEmployee = await Employee.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updatedEmployee) return res.status(404).json({ error: 'Employee not found' });
        res.status(200).json({ ...updatedEmployee.toObject(), id: updatedEmployee._id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Delete Employee
app.delete('/api/employees/:id', async (req, res) => {
    try {
        const deletedEmployee = await Employee.findByIdAndDelete(req.params.id);
        if (!deletedEmployee) return res.status(404).json({ error: 'Employee not found' });
        res.status(200).json({ message: 'Employee deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} (MongoDB Active)`);
});
