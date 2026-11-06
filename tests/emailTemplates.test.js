import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  templateContactAcknowledgment,
  templateContactStaffNotification,
  templateVolunteerAcknowledgment,
  templateVolunteerStaffNotification,
  templateBusinessAcknowledgment,
  templateBusinessModerationNotification,
  templateTrainingAcknowledgment,
  templateTrainingStaffNotification,
  templateAccessibilityAcknowledgment,
  templateAccessibilityStaffNotification,
  templateDonorAppreciationEmail,
  templateAdminAlert
} from '../worker/src/emailTemplates.js';

describe('Resend Email Templates (12 Professional Templates)', () => {

  it('1. Contact Inquiry Acknowledgment template renders correctly', () => {
    const res = templateContactAcknowledgment({ name: 'Alex Rivera', subject: 'Youth Programs' });
    assert.match(res.subject, /received your inquiry/i);
    assert.match(res.html, /Alex Rivera/);
    assert.match(res.html, /Youth Programs/);
    assert.ok(res.text.length > 20);
  });

  it('2. Contact Inquiry Notification template renders correctly', () => {
    const res = templateContactStaffNotification({ 
      name: 'Sam Chen', 
      email: 'sam@example.com', 
      phone: '805-555-0199', 
      subject: 'Donations', 
      message: 'Hello, how can I set up an estate gift?',
      reference: 'ref_123' 
    });
    assert.match(res.subject, /\[Website Inquiry\]/);
    assert.match(res.html, /Sam Chen/);
    assert.match(res.html, /sam@example\.com/);
    assert.match(res.html, /ref_123/);
  });

  it('3. Volunteer Application Acknowledgment renders correctly', () => {
    const res = templateVolunteerAcknowledgment({ fullName: 'Taylor Swift' });
    assert.match(res.subject, /Thank you for volunteering/i);
    assert.match(res.html, /Taylor Swift/);
    assert.match(res.html, /Live Scan fingerprint/i);
  });

  it('4. Volunteer Staff Notification renders correctly', () => {
    const res = templateVolunteerStaffNotification({ 
      fullName: 'Jordan Lee', 
      email: 'jordan@example.com', 
      phone: '805-555-1234', 
      city: 'Ventura', 
      roles: ['events', 'youth'], 
      availability: 'Weekends' 
    });
    assert.match(res.subject, /\[New Volunteer Application\] Jordan Lee/);
    assert.match(res.html, /jordan@example\.com/);
    assert.match(res.html, /events, youth/);
  });

  it('5. Business Submission Acknowledgment renders correctly', () => {
    const res = templateBusinessAcknowledgment({ businessName: 'Affirming Bakery', ownerName: 'Morgan' });
    assert.match(res.subject, /Listing Received: Affirming Bakery/);
    assert.match(res.html, /Affirming Bakery/);
    assert.match(res.html, /Affirming Pledge/);
  });

  it('6. Business Moderation Notification renders correctly', () => {
    const res = templateBusinessModerationNotification({ 
      businessName: 'Coastal Law Group', 
      category: 'Legal', 
      city: 'Oxnard', 
      ownerName: 'Pat Kim', 
      ownerEmail: 'pat@coastallaw.example' 
    });
    assert.match(res.subject, /\[Directory Moderation\] Coastal Law Group/);
    assert.match(res.html, /Coastal Law Group/);
    assert.match(res.html, /Affirming Pledge Signed/);
  });

  it('7. Training Booking Acknowledgment renders correctly', () => {
    const res = templateTrainingAcknowledgment({ 
      contactName: 'Dr. Jamie Doe', 
      organizationName: 'Ventura Clinic', 
      courseTitle: 'LGBTQ+ Affirming Healthcare' 
    });
    assert.match(res.subject, /P\.R\.I\.D\.E\. Training Request Received/);
    assert.match(res.html, /Ventura Clinic/);
    assert.match(res.html, /Dr\. Jamie Doe/);
  });

  it('8. Training Staff Notification renders correctly', () => {
    const res = templateTrainingStaffNotification({ 
      organizationName: 'County Health', 
      contactName: 'Dana', 
      email: 'dana@county.gov', 
      phone: '805-555-9999', 
      courseTitle: 'Foundations of Inclusion', 
      attendees: 45, 
      preferredFormat: 'in-person' 
    });
    assert.match(res.subject, /\[Training Request\] County Health/);
    assert.match(res.html, /Dana/);
    assert.match(res.html, /Foundations of Inclusion/);
    assert.match(res.html, /45/);
  });

  it('9. Accessibility Feedback Acknowledgment renders correctly', () => {
    const res = templateAccessibilityAcknowledgment({ contactName: 'Robin', pageUrl: 'https://diversitycollective.org/events' });
    assert.match(res.subject, /Accessibility Barrier Report Received/);
    assert.match(res.html, /WCAG 2\.2 AA/);
  });

  it('10. Accessibility Feedback Notification renders correctly', () => {
    const res = templateAccessibilityStaffNotification({ 
      pageUrl: 'https://diversitycollective.org/donate', 
      barrierDescription: 'Screen reader gets stuck on modal close button.', 
      assistiveTech: 'NVDA on Windows', 
      contactName: 'Robin', 
      contactEmail: 'robin@example.com' 
    });
    assert.match(res.subject, /\[Accessibility Ticket\] Barrier reported/);
    assert.match(res.html, /NVDA on Windows/);
    assert.match(res.html, /Screen reader gets stuck/);
  });

  it('11. Donor Appreciation Card Email renders correctly', () => {
    const res = templateDonorAppreciationEmail({ 
      donorDisplayName: 'Casey Miller', 
      formattedAmount: '$150', 
      tierName: 'Rainbow Champion', 
      badge: 'CHAMPION CIRCLE', 
      tagline: 'Fostering Resilience & Youth Leadership', 
      impact: 'Your partnership underwrites weekly Rainbow Umbrella peer circles.', 
      cardUrl: 'https://diversitycollective.org/appreciation-card/dcvc_test', 
      frequency: 'one-time' 
    });
    assert.match(res.subject, /Your DCVC Appreciation Card has arrived/);
    assert.match(res.html, /Casey Miller/);
    assert.match(res.html, /\$150/);
    assert.match(res.html, /Rainbow Champion/);
    assert.match(res.html, /https:\/\/diversitycollective\.org\/appreciation-card\/dcvc_test/);
  });

  it('12. Administrative Alert renders correctly', () => {
    const res = templateAdminAlert({ 
      action: 'Business Listing Approved', 
      details: { businessId: 'biz-1', approvedBy: 'admin@diversitycollective.org' }, 
      actorEmail: 'admin@diversitycollective.org', 
      targetType: 'business', 
      targetId: 'biz-1' 
    });
    assert.match(res.subject, /\[DCVC Security\/Admin Alert\] Business Listing Approved/);
    assert.match(res.html, /admin@diversitycollective\.org/);
    assert.match(res.html, /biz-1/);
  });

});

