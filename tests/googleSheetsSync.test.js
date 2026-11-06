import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  formatContactRow,
  formatVolunteerRow,
  formatBusinessRow,
  formatTrainingRow,
  sanitizeOperationalText,
  convertRowsToCsv,
  syncToGoogleSheet,
  SHEET_COLUMNS
} from '../worker/src/googleSheetsSync.js';

describe('Google Sheets Contact Synchronization & Privacy Safeguards', () => {

  it('1. formats contact row correctly', () => {
    const contact = {
      id: 'c-101',
      created_at: '2026-03-01T10:00:00Z',
      name: 'Morgan Blake',
      email: 'morgan@example.com',
      phone: '805-555-0199',
      subject: 'Volunteer question',
      consent_given: 1,
      message: 'Hello, how can I help out at the pride festival?'
    };

    const row = formatContactRow(contact);
    assert.strictEqual(row[1], 'Website Contact Form');
    assert.strictEqual(row[2], 'Morgan Blake');
    assert.strictEqual(row[3], 'morgan@example.com');
    assert.strictEqual(row[6], 'CONSENT_GRANTED');
    assert.strictEqual(row[8], 'c-101');
  });

  it('2. strictly redacts confidential clinical and HIV/STI keywords from operational rows', () => {
    const sensitive = 'Need to schedule my rapid HIV test and STI screening results';
    const sanitized = sanitizeOperationalText(sensitive);
    assert.doesNotMatch(sanitized, /\bhiv\b/i);
    assert.doesNotMatch(sanitized, /\bsti\b/i);
    assert.match(sanitized, /\[REDACTED_CONFIDENTIAL_HEALTH_DATA\]/);
  });

  it('3. formats volunteer row with role list', () => {
    const vol = {
      id: 'v-202',
      created_at: '2026-03-01T12:00:00Z',
      full_name: 'Taylor Jordan',
      email: 'taylor@example.com',
      phone: '805-555-0144',
      city: 'Oxnard',
      roles_of_interest: ['events', 'center_host'],
      availability: 'Weekends',
      consent_given: 1
    };

    const row = formatVolunteerRow(vol);
    assert.strictEqual(row[1], 'Volunteer Application');
    assert.strictEqual(row[2], 'Taylor Jordan');
    assert.strictEqual(row[5], 'Oxnard');
    assert.match(row[6], /events/);
    assert.strictEqual(row[8], 'CONSENT_GRANTED');
  });

  it('4. formats business directory row with pledge status', () => {
    const biz = {
      id: 'b-303',
      created_at: '2026-03-01T14:00:00Z',
      name: 'Rainbow Cafe',
      category: 'Dining',
      city: 'Ventura',
      website: 'https://rainbowcafe.example',
      owner_name: 'Sam',
      owner_email: 'sam@rainbowcafe.example',
      affirming_pledge_signed_at: '2026-03-01T13:55:00Z',
      status: 'pending'
    };

    const row = formatBusinessRow(biz);
    assert.strictEqual(row[1], 'Affirming Directory Submission');
    assert.strictEqual(row[2], 'Rainbow Cafe');
    assert.strictEqual(row[8], 'PLEDGE_SIGNED');
    assert.strictEqual(row[9], 'pending');
  });

  it('5. formats training booking inquiry row', () => {
    const trn = {
      id: 't-404',
      created_at: '2026-03-01T15:00:00Z',
      organization_name: 'Ventura Healthcare Partners',
      contact_name: 'Dr. Lopez',
      email: 'dlopez@vhp.example',
      phone: '805-555-9000',
      course_title: 'LGBTQ+ Cultural Humility',
      estimated_attendees: 30,
      preferred_format: 'in-person',
      preferred_date: '2026-05-15'
    };

    const row = formatTrainingRow(trn);
    assert.strictEqual(row[1], 'P.R.I.D.E. Training Inquiry');
    assert.strictEqual(row[2], 'Ventura Healthcare Partners');
    assert.strictEqual(row[7], '30');
    assert.strictEqual(row[8], 'in-person');
  });

  it('6. exports rows to RFC-4180 compliant CSV', () => {
    const headers = SHEET_COLUMNS.contact;
    const rows = [
      ['2026-03-01', 'Website', 'Jane "JD" Doe', 'jane@example.com', '555', 'Question', 'YES', 'Hello, world!', 'c-1']
    ];

    const csv = convertRowsToCsv(headers, rows);
    assert.match(csv, /"Submission Timestamp","Source"/);
    assert.match(csv, /"Jane ""JD"" Doe"/);
  });

  it('7. safely simulates synchronization when credentials are not configured', async () => {
    const record = { id: 'c-999', name: 'Dev User', email: 'dev@example.com', message: 'Hello' };
    const res = await syncToGoogleSheet({ type: 'contact', record });
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.simulated, true);
    assert.ok(res.formattedRow.length > 5);
  });

});

