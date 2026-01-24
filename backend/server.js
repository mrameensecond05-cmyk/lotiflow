const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const DB_CONFIG = {
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'loti_db'
};

// Database Connection
let pool;
async function connectDB() {
    try {
        pool = mysql.createPool(DB_CONFIG);
        console.log('Connected to MySQL Database');
    } catch (err) {
        console.error('Database connection failed:', err);
        setTimeout(connectDB, 5000); // Retry logic for Docker startup
    }
}
connectDB();

// Routes

// 1. Register
app.post('/api/register', async (req, res) => {
    const { full_name, email, password } = req.body;
    if (!pool) return res.status(500).json({ error: 'DB not ready' });

    try {
        // Check if user exists
        const [existing] = await pool.query('SELECT login_id FROM lotl_login WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(409).json({ error: 'User already exists' });

        // Hash password
        const hash = await bcrypt.hash(password, 10);

        // Insert new user (Default Role ID 2 = Analyst for this demo, or 3=Viewer)
        // Using role_id=2 (Analyst) for ease of testing user capabilities
        const [result] = await pool.query(
            'INSERT INTO lotl_login (role_id, full_name, email, password_hash, status) VALUES (2, ?, ?, ?, "active")',
            [full_name, email, hash]
        );

        res.json({ message: 'Registration successful', userId: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// 2. Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!pool) return res.status(500).json({ error: 'DB not ready' });

    try {
        const [rows] = await pool.query('SELECT * FROM lotl_login WHERE email = ?', [email]);
        if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password_hash);

        // Fallback for mock seeds (admin/admin)
        if (match || (password === 'admin' && user.email.startsWith('admin'))) {
            // Determine redirect path based on role
            // Role 1=Admin, 2=Analyst (User view for now), 3=Viewer
            const userRole = user.role_id === 1 ? 'admin' : 'user';

            const token = jwt.sign({ id: user.login_id, role: userRole }, 'secret_key');
            return res.json({ token, role: userRole, user: { name: user.full_name, email: user.email } });
        } else {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// 2. Get Alerts
app.get('/api/alerts', async (req, res) => {
    if (!pool) return res.status(500).json({ error: 'DB not ready' });
    try {
        // Join with Rule and Host to get readable names
        const query = `
            SELECT 
                a.alert_id, 
                a.timestamp, 
                a.severity, 
                a.description, 
                a.status,
                h.hostname as host,
                r.rule_name
            FROM lotl_alert_reference a
            JOIN lotl_host h ON a.host_id = h.host_id
            JOIN lotl_detection_rule r ON a.rule_id = r.rule_id
            ORDER BY a.timestamp DESC 
            LIMIT 50
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Get Stats
app.get('/api/stats', async (req, res) => {
    if (!pool) return res.status(500).json({ error: 'DB not ready' });
    try {
        const [alertCounts] = await pool.query('SELECT severity, COUNT(*) as count FROM lotl_alert_reference GROUP BY severity');
        const [hostCounts] = await pool.query('SELECT COUNT(*) as count FROM lotl_host WHERE status="active"');
        res.json({
            alerts: alertCounts,
            hosts: hostCounts[0].count
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
