const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const { guard, guardMiddleware } = require('payload-guard-filter');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// --- Payload Guard Middleware ---
app.use(guardMiddleware({
    sanitizeBody: true,
    filterResponse: true, // Automatically filter all res.json() calls if a shape is provided
    devMode: process.env.NODE_ENV === 'development'
}));

// Define Employee Shape for reliable outputs
const employeeShape = guard.shape({
    id: 'any',
    emp_id: 'string',
    name: 'string',
    email: 'string',
    phone: 'string',
    role: 'string',
    department: 'string',
    gender: 'string',
    salary: 'string',
    dob: 'any',
    address: 'string',
    experience: 'string',
    created_at: 'any'
});

// --- API Response Monitor Storage ---
const apiLogs = [];

// Helper function to log API requests
const logApiRequest = (req, res, startTime) => {
    const endTime = Date.now();
    const log = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl || req.url,
        status: res.statusCode,
        latency: `${endTime - startTime}ms`,
        success: res.statusCode >= 200 && res.statusCode < 400
    };
    apiLogs.unshift(log);
    if (apiLogs.length > 100) apiLogs.pop();
};

// --- API Monitor Endpoints ---
app.get('/api/monitor/logs', (req, res) => {
    res.json(apiLogs);
});

app.delete('/api/monitor/logs', (req, res) => {
    apiLogs.length = 0;
    res.json({ message: 'API logs cleared' });
});

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

// --- API ROUTES (MongoDB) ---

// Register Employee
app.post('/api/employees', async (req, res) => {
    const startTime = Date.now();
    try {
        const newEmployee = new Employee(req.body);
        const savedEmployee = await newEmployee.save();
        // Use guard.shape to filter response data
        res.status(201).json(employeeShape(savedEmployee));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
    logApiRequest(req, res, startTime);
});

// Get Employees
app.get('/api/employees', async (req, res) => {
    const startTime = Date.now();
    try {
        const employees = await Employee.find().sort({ created_at: -1 });
        const formattedEmployees = employees.map(emp => ({
            ...emp.toObject(),
            id: emp._id
        }));
        // Use guard.array to filter a list of objects
        res.json(guard.array(employeeShape)(formattedEmployees));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
    logApiRequest(req, res, startTime);
});

// Update Employee
app.put('/api/employees/:id', async (req, res) => {
    const startTime = Date.now();
    try {
        const updatedEmployee = await Employee.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updatedEmployee) return res.status(404).json({ error: 'Employee not found' });
        res.status(200).json(employeeShape(updatedEmployee));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
    logApiRequest(req, res, startTime);
});

// Delete Employee
app.delete('/api/employees/:id', async (req, res) => {
    const startTime = Date.now();
    try {
        const deletedEmployee = await Employee.findByIdAndDelete(req.params.id);
        if (!deletedEmployee) return res.status(404).json({ error: 'Employee not found' });
        res.status(200).json({ message: 'Employee deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
    logApiRequest(req, res, startTime);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} (MongoDB Active)`);
});
