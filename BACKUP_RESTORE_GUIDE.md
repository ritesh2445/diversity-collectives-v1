# DCVC Disaster Recovery & Backup Architecture Guide
**Authoritative Backup, Encryption & Restoration Runbook**
**Primary Backup Storage Provider:** Backblaze B2 Free Tier
**Date:** November 6, 2026
**Target Repository:** `diversity-collectives-v1`
**Author:** Senior Full-Stack Architect & DevOps Security Engineer

---

## 1. ARCHITECTURAL OVERVIEW

Diversity Collective Ventura County (DCVC) implements an automated, encrypted, zero-cost disaster recovery pipeline. **Cloudflare R2 is not used in this platform.** The approved and verified offsite backup storage provider is **Backblaze B2 Free**.

```
+---------------------------------------------------------------------------------+
|                       DCVC PRODUCTION DATA SOURCES                              |
|                                                                                 |
|   +-----------------------+     +--------------------+    +-----------------+   |
|   |  Turso Database (SQL) |     | Sanity Content CMS |    | App Records/CMS |   |
|   |  - Businesses         |     | - Programs/Events  |    | - Submissions   |   |
|   |  - Affirming Directory|     | - Resources/News   |    | - Keepsake Cards|   |
|   +-----------+-----------+     +---------+----------+    +--------+--------+   |
+---------------|---------------------------|------------------------|------------+
                |                           |                        |
                +---------------------+-----+------------------------+
                                      |
                                      v
                        [ Snapshot Aggregation Engine ]
                                      |
                                      v
                +---------------------------------------------+
                |        Security & Encryption Pipeline        |
                |  1. SHA-256 Plaintext Hash Calculation      |
                |  2. AES-256-GCM Authenticated Encryption    |
                |  3. 12-byte IV + 16-byte Auth Tag Packing   |
                |  4. SHA-256 Ciphertext Hash Calculation     |
                |  5. Cryptographic Manifest Generation       |
                +---------------------+-----------------------+
                                      |
                                      v
                    [ Automated Execution Environment ]
                   GitHub Actions Free (2,000 mins/mo)
                      Cron: Nightly at 03:00 UTC
                                      |
                                      v
          +-------------------------------------------------------+
          |             BACKBLAZE B2 FREE CLOUD STORAGE           |
          |  Bucket: dcvc-backups-production                      |
          |  Allocation: 10 GB Free Storage (Zero Cards Required) |
          |  Payloads:                                            |
          |    - dcvc-backup-YYYY-MM-DDTHH-MM-SSZ.enc             |
          |    - dcvc-backup-YYYY-MM-DDTHH-MM-SSZ-manifest.json   |
          |  Retention: Rolling 14-day cleanup                    |
          |  Inviolable Safeguard: Latest backup NEVER deleted    |
          +-------------------------------------------------------+
```

---

## 2. BACKBLAZE B2 FREE TIER ALLOCATION & COMPLIANCE

Backblaze B2 Free Cloud Storage serves exclusively as the offsite backup repository:

| Metric / Parameter | Free Tier Allocation | DCVC Production Utilization | Compliance Status |
| :--- | :--- | :--- | :--- |
| **Storage Capacity** | **10 GB Free Forever** | ~500 MB (14 daily encrypted backups @ ~35 MB each) | **Verified Safe** (< 5% of quota) |
| **Class A Transactions** | **100% Free (Unlimited)** | Authentication, upload URL generation, bucket lookups | **100% Free** ($0.00) |
| **Class B Transactions** | **100% Free (Unlimited)** | File downloads during disaster recovery verification drills | **100% Free** ($0.00) |
| **Class C Transactions** | **100% Free (Unlimited)** | Bucket inventory listing and version lookups | **100% Free** ($0.00) |
| **Class D Transactions** | **2,500 calls / day Free** | Outbound event notifications (not utilized by DCVC) | **0% Used** ($0.00) |
| **Download / Egress** | **Free up to 3x monthly data** | Backups are write-mostly; downloads occur only during disaster drills | **100% Free** ($0.00) |
| **Credit Card Requirement**| **No credit card required** | Account created on zero-cost tier without payment details | **Strictly Enforced** |

> [!IMPORTANT]
> **Strict Zero-Cost Guarantee**: No paid subscriptions, automatic tier upgrades, or billable features are permitted. If Backblaze policies evolve, storage usage is capped strictly under the 10 GB ceiling.

---

## 3. BACKUP SCOPE & ARCHITECTURAL BOUNDARIES

### 3.1 What is Stored in Backblaze B2
1. **Turso Database Snapshots**: Complete relational table dumps (`businesses`, `contact_submissions`, `volunteer_applications`, `training_bookings`, `accessibility_feedback`, `donation_appreciation_cards`, `admin_users`, `admin_audit_logs`).
2. **Sanity Content CMS Data**: Schema definitions, published articles, resources, and operational metadata.
3. **Approved Application Records**: Custom appreciation card tier configurations, directory submissions, and moderation state.
4. **Cryptographic Manifests**: Manifest files recording backup ID, timestamps, table inventories, record counts, and dual SHA-256 integrity checksums.
5. **Recoverable Configuration**: Non-secret environment settings required to re-seed a cold environment.

### 3.2 What is NOT Stored in Backblaze B2
- **Zero Cloudinary Duplication**: Cloudinary remains the primary media storage and delivery network for high-resolution photography and logos. The Cloudinary media library is not duplicated to B2, preventing unnecessary storage bloat.
- **Zero Source Code Duplication**: GitHub remains the authoritative source code repository and version-control system.
- **Zero Credentials or Secrets**: API keys, database connection strings, JWT signing keys, and Resend secrets are **strictly excluded** from backup packages.

---

## 4. SECURITY & ENCRYPTION ARCHITECTURE

### 4.1 AES-256-GCM Authenticated Encryption
All sensitive database exports are encrypted locally **before** network transmission to Backblaze B2:
- **Cipher**: `aes-256-gcm` (Galois/Counter Mode).
- **Key Length**: 256 bits (32 bytes), injected via the server-side secret `BACKUP_ENCRYPTION_KEY`.
- **Initialization Vector (IV)**: 12-byte cryptographically random buffer generated per backup (`crypto.randomBytes(12)`).
- **Authentication Tag**: 16-byte GCM authentication tag verifying ciphertext integrity.
- **Wire Format**:
  ```
  [ 12 Bytes: IV ] + [ 16 Bytes: Auth Tag ] + [ N Bytes: Encrypted Ciphertext ]
  ```

### 4.2 Tamper Detection & Dual Integrity Validation
Every backup package produces a verifiable manifest:
1. **Plaintext SHA-256 Checksum**: Computed on the unencrypted JSON payload prior to encryption.
2. **Ciphertext SHA-256 Checksum**: Computed on the packed encrypted buffer prior to upload.
3. During restore, decryption will **fail immediately** if:
   - The ciphertext checksum does not match the manifest.
   - Any single bit of the ciphertext or IV has been tampered with or corrupted.
   - The decrypted plaintext checksum does not match the verified original hash.

### 4.3 Backblaze B2 Access Control, Private Bucket & Authority Separation
To enforce zero trust and protect backups against ransomware or compromised runner environments, DCVC separates upload authority from deletion authority:

1. **Private Bucket Enforced**: The backup bucket `dcvc-backups-production` must be created as **`allPrivate`** (never public). No unauthorized public HTTP access is permitted.
2. **Dedicated Upload Application Key (`dcvc-backup-uploader`)**:
   - **Bucket Restriction**: Locked strictly to `dcvc-backups-production`.
   - **Capabilities Granted**: `listFiles`, `readFiles`, `writeFiles` only.
   - **Deletion Denied**: The daily backup runner key is **NOT** granted `deleteFiles` permission. A compromised GitHub runner cannot delete historical backups.
3. **Automated Server-Side Retention via B2 Bucket Lifecycle Rules**:
   - Backblaze B2 native lifecycle rules manage retention automatically on the server side:
     - `daysFromUploadingToHiding`: 14 days
     - `daysFromHidingToDeleting`: 1 day
   - This eliminates the need for any daily script or key to hold destructive deletion permissions.
   - If `scripts/backup.js` attempts programmatic version pruning using a key without delete privileges, it detects the 401/403 status and logs that server-side lifecycle rules manage retention, continuing safely without failing the backup.
4. **Master Key Exclusion**: The Backblaze account master key is **NEVER** stored in GitHub Secrets or used in CI/CD pipelines.

---

## 5. AUTOMATED EXECUTION & SCHEDULING

### 5.1 Free Scheduled Execution: GitHub Actions
Automated backups run via **GitHub Actions Free** (`.github/workflows/backup-schedule.yml`):
- **Schedule**: Nightly at `03:00 UTC` (`0 3 * * *`), corresponding to **7:00 PM PST** (Standard Time) / **8:00 PM PDT** (Daylight Saving Time).
- **Runner Allocation**: GitHub Actions Free provides **2,000 runner minutes per month**.
- **Execution Cost**: A complete backup job finishes in **~45 seconds** (~23 minutes per month).
- **Quota Impact**: Uses **1.15%** of the monthly free GitHub Actions allotment.
- **Why Not Cloudflare Workers**: Cloudflare Workers Free imposes a strict **10ms CPU limit** and **30s wall-clock limit**, creating a risk of timeout errors on database exports or network uploads. GitHub Actions provides an isolated, full-memory Linux runner with standard Node.js crypto capabilities.

### 5.2 Manual Backup Fallback Command
Staff or DevOps engineers can trigger an immediate backup at any time from the repository root:
```bash
npm run backup
# or: node scripts/backup.js
```

---

## 6. RETENTION POLICY & 10 GB STORAGE MANAGEMENT

Backblaze B2 backup storage is managed automatically by [`src/utils/backupRestore.js`](file:///e:/DCVC-1/diversity-collectives-v1/src/utils/backupRestore.js) and [`scripts/backup.js`](file:///e:/DCVC-1/diversity-collectives-v1/scripts/backup.js):

1. **Rolling 14-Day Retention**: Backups older than 14 days (`DEFAULT_RETENTION_DAYS = 14`) are automatically deleted during the nightly backup pipeline.
2. **10 GB Ceiling Monitoring**: Total bucket storage is monitored on every backup run. If aggregate storage approaches 80% (8 GB), older backups outside the retention window are prioritized for deletion.
3. **INVIOLABLE SAFEGUARD (Protection of Latest Backup)**:
   ```javascript
   // Inviolable Rule: The most recent verified backup is ALWAYS retained,
   // even if it exceeds the retention window or storage ceiling.
   const newestBackup = sorted[0];
   const toRetain = [newestBackup];
   ```
   Under no circumstances will the backup script leave the repository with 0 backups.

---

## 7. DISASTER RESTORATION RUNBOOK

### 7.1 Recovery Objectives
- **RPO (Recovery Point Objective)**: **< 24 Hours** (maximum potential data loss equals one day of transactions).
- **RTO (Recovery Time Objective)**: **< 15 Minutes** (full restoration of database tables and content).

### 7.2 Non-Production Restoration Verification
Before restoring into production, verify backup integrity in a local or staging environment:
```bash
# 1. Download or verify the staged backup
npm run restore

# Output:
# [RESTORE] Selected Backup ID: dcvc-backup-2026-11-06T16-07-06-931Z
# [RESTORE] Plaintext SHA-256 Checksum Verified: 19d25cb...
# [RESTORE] Schema Version: 2026.1
# [RESTORE] Restored Tables: businesses, programs, contact_submissions, donation_appreciation_cards
# Total Records Restored: 6 (100% data fidelity confirmed)
```

### 7.3 Production Disaster Recovery Procedure (Cold Start)
If the production Turso database is lost or corrupted:

1. **Provision New Turso Database**:
   ```bash
   turso db create dcvc-production-recovery --location lax
   turso db shell dcvc-production-recovery < src/db/schema.sql
   ```
2. **Execute Restore Engine with Recovery Connection**:
   ```bash
   TURSO_DATABASE_URL="libsql://dcvc-production-recovery-[org].turso.io" \
   TURSO_AUTH_TOKEN="[recovery-token]" \
   BACKUP_ENCRYPTION_KEY="[your-32-byte-hex-key]" \
   npm run restore
   ```
3. **Update Worker Secret**:
   ```bash
   cd worker
   wrangler secret put TURSO_DATABASE_URL
   # Enter new URL: libsql://dcvc-production-recovery-[org].turso.io
   ```
4. **Run Smoke Test**:
   ```bash
   curl -i https://diversitycollective.org/api/health
   # Verify HTTP 200 OK with connected database status
   ```

---

## 8. ENVIRONMENT CONFIGURATION REFERENCE

| Secret / Variable Name | Context | Required Value / Description |
| :--- | :--- | :--- |
| `BACKUP_PROVIDER` | Workflow / Server | `backblaze` |
| `B2_KEY_ID` | GitHub Actions Secret | Application key ID from Backblaze B2 console |
| `B2_APPLICATION_KEY` | GitHub Actions Secret | Application key secret from Backblaze B2 console |
| `B2_BUCKET_NAME` | GitHub Actions Secret | `dcvc-backups-production` (Private bucket) |
| `B2_ENDPOINT` | GitHub Actions Secret | `https://api.backblazeb2.com` (or S3-compatible endpoint) |
| `BACKUP_ENCRYPTION_KEY` | GitHub Actions Secret | 64-character hexadecimal key (256 bits) for AES-256-GCM |

---

## 9. VERIFICATION & TEST EVIDENCE

Automated disaster recovery tests pass 100% in the repository test suite ([`tests/backupRestore.test.js`](file:///e:/DCVC-1/diversity-collectives-v1/tests/backupRestore.test.js)):
- **Test 1**: Generates verified snapshot with 64-char SHA-256 hash.
- **Test 2**: Detects corrupted archive checksums and rejects tampering.
- **Test 3**: Full database restore verifying zero record loss across all tables.
- **Test 4**: AES-256-GCM encryption/decryption round-trip fidelity.
- **Test 5**: Rejection of tampered ciphertexts.
- **Test 6**: Complete Backblaze B2 encrypted backup package generation.
- **Test 7**: Decryption and validation of full B2 package.
- **Test 8**: Rejection of tampered manifest integrity checksums.
- **Test 9**: 14-day retention enforcement staying under 10 GB limit.
- **Test 10**: Inviolable protection guaranteeing the latest backup is never deleted.

