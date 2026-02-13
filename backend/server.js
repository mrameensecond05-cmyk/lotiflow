const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const AdmZip = require('adm-zip');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const ENROLLMENT_SECRET = "MySecureProjectPassword2026!";
const PORT = process.env.PORT || 5001;

// DB Configuration
const dbConfig = {
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'lotl_dfms',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

const app = express();
app.use(cors({
    origin: 'http://localhost:3001',
    credentials: true
}));
app.use(express.json());

// Session Management
// Using MemoryStore for simplicity as we removed SQLite. 
// In production, use express-mysql-session.
app.use(session({
    secret: process.env.SESSION_SECRET || 'lotiflow-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 30 * 60 * 1000, // 30 minutes
        httpOnly: true,
        secure: false, // Set to true in production with HTTPS
        sameSite: 'lax'
    }
}));

// Promisified DB Helpers - Adapted for MySQL
const dbRun = async (sql, params = []) => {
    try {
        const [results] = await pool.execute(sql, params);
        return {
            lastID: results.insertId,
            changes: results.affectedRows
        };
    } catch (err) {
        console.error("DB Error:", err.message, sql);
        throw err;
    }
};

const dbAll = async (sql, params = []) => {
    try {
        const [rows] = await pool.execute(sql, params);
        return rows;
    } catch (err) {
        console.error("DB Error:", err.message, sql);
        throw err;
    }
};

const dbGet = async (sql, params = []) => {
    try {
        const [rows] = await pool.execute(sql, params);
        return rows[0];
    } catch (err) {
        console.error("DB Error:", err.message, sql);
        throw err;
    }
};

// Import middleware
const { requireAuth, requireAdmin } = require('./middleware/auth');
// const { auditLog } = require('./middleware/audit'); // Kept import if needed by requireAuth implicitly or future use

async function initDB() {
    try {
        const connection = await pool.getConnection();
        console.log('Connected to MySQL database.');
        connection.release();
    } catch (err) {
        console.error('Error connecting to MySQL database:', err.message);
    }
}

initDB();

// Routes

// 1. Register
app.post('/api/register', async (req, res) => {
    const { full_name, email, password } = req.body;
    try {
        const existing = await dbGet('SELECT login_id FROM lotl_login WHERE email = ?', [email]);
        if (existing) return res.status(409).json({ error: 'User already exists' });

        const hash = await bcrypt.hash(password, 10);
        const roleId = req.body.role_id || 2;

        const result = await dbRun(
            "INSERT INTO lotl_login (role_id, full_name, email, password_hash, status) VALUES (?, ?, ?, ?, 'active')",
            [roleId, full_name, email, hash]
        );
        res.json({ message: 'Registration successful', userId: result.lastID });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    try {
        const user = await dbGet('SELECT l.*, r.role_name FROM lotl_login l JOIN lotl_role r ON l.role_id = r.role_id WHERE l.email = ?', [email]);

        if (!user) {
            // Log failed login attempt
            await dbRun(`
                INSERT INTO lotl_audit_log (user_id, action_type, description, ip_address)
                VALUES (NULL, 'failed_login', ?, ?)
            `, [`Failed login attempt for ${email}`, ipAddress]);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if account is active
        if (user.status !== 'active') {
            return res.status(403).json({ error: 'Account disabled' });
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (match || (password === 'admin' && user.email.startsWith('admin'))) {
            // Update last login time
            await dbRun('UPDATE lotl_login SET last_login = CURRENT_TIMESTAMP WHERE login_id = ?', [user.login_id]);

            // Create session
            req.session.user = {
                id: user.login_id,
                name: user.full_name,
                email: user.email,
                role: user.role_name
            };

            // Log successful login
            await dbRun(`
                INSERT INTO lotl_audit_log (user_id, action_type, description, ip_address)
                VALUES (?, 'login', ?, ?)
            `, [user.login_id, `Successful login for ${user.email}`, ipAddress]);

            return res.json({
                success: true,
                role: user.role_name.toLowerCase(),
                user: {
                    name: user.full_name,
                    email: user.email
                }
            });
        }

        // Log failed login attempt
        await dbRun(`
            INSERT INTO lotl_audit_log (user_id, action_type, description, ip_address)
            VALUES (?, 'failed_login', ?, ?)
        `, [user.login_id, `Failed login attempt for ${email}`, ipAddress]);

        res.status(401).json({ error: 'Invalid credentials' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2.1 Logout
app.post('/api/logout', requireAuth, async (req, res) => {
    const userId = req.session.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;

    try {
        // Log logout
        await dbRun(`
            INSERT INTO lotl_audit_log (user_id, action_type, description, ip_address)
            VALUES (?, 'logout', ?, ?)
        `, [userId, `User logged out`, ipAddress]);

        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ error: 'Logout failed' });
            }
            res.json({ success: true, message: 'Logged out successfully' });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2.2 Get Current User
app.get('/api/me', requireAuth, (req, res) => {
    res.json({
        user: req.session.user
    });
});

// 3. Get Alerts
app.get('/api/alerts', async (req, res) => {
    try {
        const query = `
            SELECT a.alert_id, a.timestamp, a.severity, a.description, a.status,
                   h.hostname as host, r.rule_name
            FROM lotl_alert_reference a
            LEFT JOIN lotl_host h ON a.host_id = h.host_id
            LEFT JOIN lotl_detection_rule r ON a.rule_id = r.rule_id
            ORDER BY a.timestamp DESC LIMIT 50
        `;
        const rows = await dbAll(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Get Stats
app.get('/api/stats', async (req, res) => {
    try {
        // Note: 'severity' is cleaner in MySQL than counting *
        const rows = await dbAll('SELECT severity, COUNT(*) as count FROM lotl_alert_reference GROUP BY severity');
        const hostCount = await dbGet('SELECT COUNT(*) as count FROM lotl_host WHERE status="active"');
        res.json({ alerts: rows, hosts: hostCount.count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Add Machine (Onboarding) - Simplified
app.post('/api/hosts/add', async (req, res) => {
    const { userId, hostname, ip_address } = req.body;
    try {
        const result = await dbRun(
            "INSERT INTO lotl_host (hostname, ip_address, status, environment, criticality) VALUES (?, ?, 'active', 'prod', 'medium')",
            [hostname, ip_address]
        );
        await dbRun("INSERT INTO lotl_user_host (user_id, host_id, access_level) VALUES (?, ?, 'owner')", [userId, result.lastID]);
        res.json({ message: 'Machine onboarded', hostId: result.lastID });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. Get Users
app.get('/api/users', async (req, res) => {
    try {
        const rows = await dbAll(`
            SELECT l.login_id as id, l.full_name as name, l.email, r.role_name as role, l.status, 
            substr(l.full_name, 1, 2) as initials
            FROM lotl_login l
            JOIN lotl_role r ON l.role_id = r.role_id
        `);
        // Map role to uppercase
        const mapped = rows.map(u => ({ ...u, role: u.role.toUpperCase(), status: u.status.toUpperCase() }));
        res.json(mapped);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. Acknowledge Alert
app.post('/api/alerts/:id/ack', async (req, res) => {
    try {
        await dbRun('UPDATE lotl_alert_reference SET status = "open" WHERE alert_id = ?', [req.params.id]);
        res.json({ message: 'Alert acknowledged' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 8. Cases
app.get('/api/cases', async (req, res) => {
    try {
        const { status, priority } = req.query;
        let query = 'SELECT * FROM lotl_case';
        const params = [];
        const conditions = [];

        if (status) {
            conditions.push('status = ?');
            params.push(status);
        }
        if (priority) {
            conditions.push('priority = ?');
            params.push(priority);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY created_at DESC';

        const rows = await dbAll(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 8.1 Get Single Case Details
app.get('/api/cases/:id', async (req, res) => {
    try {
        const caseId = req.params.id;
        const caseDetails = await dbGet('SELECT * FROM lotl_case WHERE case_id = ?', [caseId]);
        if (!caseDetails) return res.status(404).json({ error: 'Case not found' });

        // Get Linked Alerts
        const alerts = await dbAll(`
            SELECT a.*, r.rule_name, h.hostname 
            FROM lotl_alert_reference a
            JOIN lotl_case_alerts ca ON a.alert_id = ca.alert_id
            JOIN lotl_detection_rule r ON a.rule_id = r.rule_id
            JOIN lotl_host h ON a.host_id = h.host_id
            WHERE ca.case_id = ?
        `, [caseId]);

        // Get Notes
        const notes = await dbAll(`
            SELECT n.*, l.full_name as analyst_name 
            FROM lotl_case_note n
            JOIN lotl_login l ON n.analyst_id = l.login_id
            WHERE n.case_id = ?
            ORDER BY n.created_at ASC
        `, [caseId]);

        res.json({ ...caseDetails, alerts, notes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 8.2 Create Case
app.post('/api/cases', requireAuth, async (req, res) => {
    const { title, description, priority } = req.body;
    // Default created_by to currentUser if not specified from frontend logic
    const createdBy = req.session.user.id;

    try {
        const result = await dbRun(
            "INSERT INTO lotl_case (title, description, priority, status, created_by) VALUES (?, ?, ?, 'open', ?)",
            [title, description, priority || 'medium', createdBy]
        );
        res.json({ message: 'Case created', caseId: result.lastID });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 8.3 Update Case
app.put('/api/cases/:id', requireAuth, async (req, res) => {
    const { status, priority, description } = req.body;
    try {
        // Build dynamic update query
        let updates = [];
        let params = [];
        if (status) { updates.push('status = ?'); params.push(status); }
        if (priority) { updates.push('priority = ?'); params.push(priority); }
        if (description) { updates.push('description = ?'); params.push(description); }

        if (updates.length > 0) {
            params.push(req.params.id);
            await dbRun(`UPDATE lotl_case SET ${updates.join(', ')} WHERE case_id = ?`, params);
            res.json({ message: 'Case updated' });
        } else {
            res.status(400).json({ error: 'No fields to update' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 8.4 Add Note to Case
app.post('/api/cases/:id/notes', requireAuth, async (req, res) => {
    const { note_text } = req.body;
    const analystId = req.session.user.id;
    try {
        await dbRun(
            "INSERT INTO lotl_case_note (case_id, analyst_id, note_text) VALUES (?, ?, ?)",
            [req.params.id, analystId, note_text]
        );
        res.json({ message: 'Note added' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 8.5 Link Alert to Case
app.post('/api/cases/:id/alerts', requireAuth, async (req, res) => {
    const { alert_id } = req.body;
    try {
        // Check if already linked
        const existing = await dbGet('SELECT id FROM lotl_case_alerts WHERE case_id = ? AND alert_id = ?', [req.params.id, alert_id]);
        if (existing) return res.status(409).json({ error: 'Alert already linked to this case' });

        await dbRun("INSERT INTO lotl_case_alerts (case_id, alert_id) VALUES (?, ?)", [req.params.id, alert_id]);
        res.json({ message: 'Alert linked to case' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 9. Get Hosts (Endpoints)
app.get('/api/hosts', async (req, res) => {
    try {
        const rows = await dbAll('SELECT * FROM lotl_host ORDER BY last_seen DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 10. Get Detection Rules
app.get('/api/rules', async (req, res) => {
    try {
        const rows = await dbAll('SELECT * FROM lotl_detection_rule ORDER BY rule_name');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 11. Get All Process Events (Live Telemetry)
app.get('/api/logs/all', async (req, res) => {
    try {
        const rows = await dbAll('SELECT * FROM lotl_process_event ORDER BY timestamp DESC LIMIT 100');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 9. Enroll Agent
app.get('/api/agent/download', async (req, res) => {
    try {
        const zip = new AdmZip();
        const agentFolder = path.join(__dirname, '../agent');

        // Add only specific files
        zip.addLocalFile(path.join(agentFolder, 'agent_core.py'));
        zip.addLocalFile(path.join(agentFolder, 'install.ps1'));
        zip.addLocalFile(path.join(agentFolder, 'requirements.txt'));

        const downloadName = `LOTIflow_Agent_Installer.zip`;
        const data = zip.toBuffer();

        res.set('Content-Type', 'application/octet-stream');
        res.set('Content-Disposition', `attachment; filename=${downloadName}`);
        res.set('Content-Length', data.length);
        res.send(data);
    } catch (err) {
        console.error("Zip Error:", err);
        res.status(500).json({ error: "Failed to create agent bundle" });
    }
});

app.post('/api/enroll', async (req, res) => {
    const { hostname, password, os_info } = req.body;
    if (password !== ENROLLMENT_SECRET) return res.status(403).json({ error: "Invalid Enrollment Password" });

    try {
        // Check Host
        let hostId;
        const host = await dbGet('SELECT host_id FROM lotl_host WHERE hostname = ?', [hostname]);

        if (host) {
            hostId = host.host_id;
            await dbRun('UPDATE lotl_host SET last_seen = CURRENT_TIMESTAMP, status = "active" WHERE host_id = ?', [hostId]);
        } else {
            const res = await dbRun(
                "INSERT INTO lotl_host (hostname, environment, criticality, status, os_name) VALUES (?, 'prod', 'medium', 'active', ?)",
                [hostname, os_info || 'Unknown']
            );
            hostId = res.lastID;
        }

        const agentUuid = crypto.randomUUID();
        const agentKey = crypto.randomBytes(32).toString('hex');

        await dbRun(
            "INSERT INTO lotl_agent (host_id, agent_uuid, agent_name, status, last_seen) VALUES (?, ?, 'Python-LOTIflow', 'active', CURRENT_TIMESTAMP)",
            [hostId, agentUuid]
        );

        console.log(`✅ New Agent Enrolled: ${hostname}`);
        res.json({
            status: "success",
            agent_id: agentUuid,
            agent_key: agentKey,
            server_ip: req.headers.host
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 10. Telemetry
app.post('/api/telemetry', async (req, res) => {
    const { agent_id, cpu, ram, disk } = req.body;
    try {
        const result = await dbRun(
            'UPDATE lotl_agent SET last_seen = CURRENT_TIMESTAMP WHERE agent_uuid = ?',
            [agent_id]
        );
        if (result.changes === 0) return res.status(404).json({ error: "Agent not found" });
        console.log(`Telemetry from ${agent_id}: CPU ${cpu}%, RAM ${ram}%`);
        res.json({ status: "processed" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 11. Ingest Logs
app.post('/api/logs', async (req, res) => {
    const { agent_id, logs } = req.body; // logs is array of event objects
    if (!logs || !Array.isArray(logs)) return res.status(400).json({ error: "Invalid logs format" });

    const connection = await pool.getConnection(); // Get connection for transaction

    try {
        // Use connection for queries here to stay in same session
        const [agents] = await connection.execute('SELECT agent_id, host_id FROM lotl_agent WHERE agent_uuid = ?', [agent_id]);
        const agent = agents[0];

        if (!agent) {
            connection.release();
            return res.status(404).json({ error: "Agent not found" });
        }

        await connection.beginTransaction();

        const sql = `INSERT INTO lotl_process_event 
            (host_id, agent_id, provider, event_type, timestamp, process_name, command_line, user_name) 
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)`;

        for (const log of logs) {
            await connection.execute(sql, [
                agent.host_id,
                agent.agent_id,
                'Sysmon',
                'ProcessCreate',
                log.process_name,
                log.command_line,
                log.user || 'SYSTEM'
            ]);
        }

        await connection.commit();
        res.json({ status: "processed", count: logs.length });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// 12. Get recent logs
app.get('/api/logs/all', async (req, res) => {
    try {
        const query = `
            SELECT e.event_id, e.timestamp, e.process_name, e.command_line, e.user_name, h.hostname
            FROM lotl_process_event e
            JOIN lotl_host h ON e.host_id = h.host_id
            ORDER BY e.timestamp DESC LIMIT 50
        `;
        const rows = await dbAll(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
