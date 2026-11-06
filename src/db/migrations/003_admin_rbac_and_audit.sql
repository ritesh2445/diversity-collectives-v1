-- Migration 003: Administrative Role-Based Access Control (RBAC) & Audit Logs
-- Description: Supports the separate staff/board administration dashboard with least-privilege roles, server-side authorization, and audit logging.

CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'editor', 'approver', 'read_only')),
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    mfa_enabled INTEGER DEFAULT 0,
    mfa_secret TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    last_login_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email 
    ON admin_users (email);

CREATE INDEX IF NOT EXISTS idx_admin_users_role 
    ON admin_users (role, is_active);

-- Administrative Audit Log
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    user_email TEXT NOT NULL,
    action TEXT NOT NULL,                     -- e.g. 'approve_business', 'reject_business', 'edit_business', 'export_contacts', 'resolve_correction'
    target_type TEXT NOT NULL,                -- 'business', 'contact', 'volunteer', 'training', 'a11y', 'user'
    target_id TEXT,
    details TEXT,                             -- JSON formatted summary of changes
    ip_address TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES admin_users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created 
    ON admin_audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action 
    ON admin_audit_logs (action, target_type);

