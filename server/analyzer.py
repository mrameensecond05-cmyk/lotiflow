import json
import sys
import os
import time
import requests
import mysql.connector
from datetime import datetime

# DB Configuration
DB_CONFIG = {
    'host': os.environ.get('DB_HOST', 'db'),
    'user': os.environ.get('DB_USER', 'root'),
    'password': os.environ.get('DB_PASSWORD', 'root'),
    'database': os.environ.get('DB_NAME', 'loti_db')
}

OLLAMA_HOST = os.environ.get('OLLAMA_HOST', 'http://ollama:11434')
OLLAMA_MODEL = os.environ.get('OLLAMA_MODEL', 'llama3')

class LogAnalyzer:
    def __init__(self):
        self.db_conn = None
        self.connect_db()

    def connect_db(self):
        try:
            self.db_conn = mysql.connector.connect(**DB_CONFIG)
            print("Connected to MySQL Database")
        except Exception as e:
            print(f"DB Error: {e}")
            self.db_conn = None

    def ask_ollama(self, cmd_line, rule_name):
        prompt = f"Analyze this suspicious command detected by rule '{rule_name}':\n\nCommand: {cmd_line}\n\nExplain briefly (in 1-2 sentences) why this is dangerous and what the attacker might be trying to do."
        try:
            response = requests.post(f"{OLLAMA_HOST}/api/generate", json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False}, timeout=10)
            if response.status_code == 200:
                result = response.json()
                return result.get("response", "No analysis provided.")
            return f"AI Error: {response.status_code}"
        except Exception as e:
            return f"AI Connection Failed: {str(e)}"

    def get_or_create_host(self, hostname):
        if not self.db_conn: return None
        cursor = self.db_conn.cursor()
        # Check exist
        cursor.execute("SELECT host_id FROM lotl_host WHERE hostname = %s", (hostname,))
        res = cursor.fetchone()
        if res: return res[0]
        
        # Create
        try:
            cursor.execute("INSERT INTO lotl_host (hostname, environment, criticality, status) VALUES (%s, 'lab', 'medium', 'active')", (hostname,))
            self.db_conn.commit()
            return cursor.lastrowid
        except Exception as e:
            print(f"Host Creation Error: {e}")
            return None

    def get_or_create_rule(self, rule_name):
        if not self.db_conn: return None
        cursor = self.db_conn.cursor()
        cursor.execute("SELECT rule_id FROM lotl_detection_rule WHERE rule_name = %s", (rule_name,))
        res = cursor.fetchone()
        if res: return res[0]
        
        # Create default
        try:
            cursor.execute("INSERT INTO lotl_detection_rule (rule_name, severity_default, logic_type, rule_content) VALUES (%s, 'high', 'keyword', 'auto-generated')", (rule_name,))
            self.db_conn.commit()
            return cursor.lastrowid
        except Exception as e:
            print(f"Rule Creation Error: {e}")
            return None

    def save_alert(self, hostname, rule_name, severity, details, ai_analysis):
        if not self.db_conn or not self.db_conn.is_connected():
            self.connect_db()
        
        if self.db_conn:
            try:
                host_id = self.get_or_create_host(hostname)
                rule_id = self.get_or_create_rule(rule_name)
                
                if not host_id or not rule_id:
                    print("Failed to resolve IDs for Host/Rule")
                    return

                cursor = self.db_conn.cursor()
                # Insert Alert
                # Note: lotl_alert_reference doesn't have ai_analysis column in the user's schema prompt?
                # User prompt: "description TEXT NULL". I will put AI analysis in description.
                full_desc = f"{details}\n\nAI Analysis: {ai_analysis}"
                
                sql = "INSERT INTO lotl_alert_reference (host_id, rule_id, severity, description, timestamp, status, detection_source) VALUES (%s, %s, %s, %s, NOW(), 'new', 'rule')"
                val = (host_id, rule_id, severity.lower(), full_desc)
                cursor.execute(sql, val)
                self.db_conn.commit()
                print(f"Saved Alert: {rule_name} for {hostname}")
            except Exception as e:
                print(f"Failed to save alert: {e}")

    def analyze_log(self, log_entry):
        try:
            process = log_entry.get("process_name") or log_entry.get("Image", "")
            cmd_line = log_entry.get("command_line") or log_entry.get("CommandLine", "")
            hostname = log_entry.get("Computer", "Unknown-Host")
            
            process_lower = process.lower()
            cmd_line_lower = cmd_line.lower()

            # Rule 1: CertUtil
            if "certutil" in process_lower and any(x in cmd_line_lower for x in ["urlcache", "split", "decode"]):
                ai_explanation = self.ask_ollama(cmd_line, "CertUtil Abuse")
                self.save_alert(hostname, "CertUtil Download", "HIGH", cmd_line, ai_explanation)
                return "ALERT: CertUtil"

            # Rule 2: PowerShell Encoded
            if ("powershell" in process_lower or "pwsh" in process_lower) and any(x in cmd_line_lower for x in ["-enc", "-encodedcommand"]):
                ai_explanation = self.ask_ollama(cmd_line, "Suspicious PowerShell")
                self.save_alert(hostname, "Suspicious PowerShell", "MEDIUM", cmd_line, ai_explanation)
                return "ALERT: PowerShell"

            return "CLEAN"

        except Exception as e:
            return f"ERROR: {str(e)}"

def main():
    print("Starting Analysis Engine...")
    log_file = sys.argv[1] if len(sys.argv) > 1 else "test_logs.json"
    
    if os.path.exists(log_file):
        with open(log_file, 'r') as f:
            try:
                content = json.load(f)
                logs = content if isinstance(content, list) else [content]
                
                analyzer = LogAnalyzer()
                for log in logs:
                    res = analyzer.analyze_log(log)
                    print(f"Processed: {res}")
                    
            except Exception as e:
                print(f"JSON Error: {e}")
    else:
        print("No log file found. Waiting...")
        time.sleep(3600)

if __name__ == "__main__":
    time.sleep(10) # Wait for DB
    main()
