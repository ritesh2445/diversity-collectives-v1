/**
 * Diversity Collective Ventura County — Reusable Transactional Email Templates
 * 
 * Powered by Resend
 * Supports:
 *  1. Contact inquiry acknowledgment (to visitor)
 *  2. Contact inquiry notification (to staff)
 *  3. Volunteer application acknowledgment (to applicant)
 *  4. Volunteer application notification (to staff)
 *  5. Business submission acknowledgment (to submitter)
 *  6. Business moderation notification (to staff)
 *  7. Training booking acknowledgment (to inquirer)
 *  8. Training booking notification (to staff)
 *  9. Accessibility feedback acknowledgment (to reporter)
 *  10. Accessibility feedback notification (to staff)
 *  11. Donor appreciation card delivery (to donor)
 *  12. Administrative alerts (moderation approval/rejection & security alerts)
 */

const DCVC_PURPLE = '#5A1E65';
const DCVC_PURPLE_DARK = '#3b0764';
const DCVC_AMBER = '#f59e0b';
const DCVC_BG = '#f8fafc';
const DCVC_ADDRESS = '2471 Portola Road, Suite 100, Ventura, CA 93003';
const DCVC_PHONE = '(805) 644-LGBT (5428)';
const DCVC_WEBSITE = 'https://diversitycollective.org';

function baseEmailWrapper({ title, headerSubtitle = '', contentHtml, actionButton = null }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: ${DCVC_BG}; margin: 0; padding: 24px; color: #1e293b;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 25px rgba(90, 30, 101, 0.08); border: 1px solid #e2e8f0;">
    <!-- Header Banner -->
    <tr>
      <td style="padding: 36px 32px; background: linear-gradient(135deg, ${DCVC_PURPLE} 0%, ${DCVC_PURPLE_DARK} 100%); text-align: center;">
        <span style="display: inline-block; padding: 4px 12px; background-color: rgba(255,255,255,0.15); border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 1px; color: #fef08a; text-transform: uppercase;">
          Diversity Collective Ventura County
        </span>
        <h1 style="color: #ffffff; font-size: 24px; margin: 14px 0 6px 0; font-weight: 800; letter-spacing: -0.5px;">
          ${title}
        </h1>
        ${headerSubtitle ? `<p style="color: #e9d5ff; font-size: 14px; margin: 0;">${headerSubtitle}</p>` : ''}
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding: 32px 32px;">
        ${contentHtml}

        ${actionButton ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${actionButton.url}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #e11d48 0%, ${DCVC_PURPLE} 50%, #6b21a8 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(90, 30, 101, 0.25);">
            ${actionButton.text}
          </a>
        </div>
        ` : ''}

        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 28px 0 20px 0;">
        <p style="font-size: 12px; line-height: 1.5; color: #64748b; margin: 0;">
          This message was sent by Diversity Collective Ventura County. Need immediate assistance? Call us at <strong>${DCVC_PHONE}</strong> or visit our <a href="${DCVC_WEBSITE}/contact" style="color: ${DCVC_PURPLE};">Contact Page</a>.
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">
        <p style="margin: 0 0 4px 0; font-weight: 700; color: #475569;">Diversity Collective Ventura County, Inc. (501(c)(3) Nonprofit)</p>
        <p style="margin: 0 0 6px 0;">${DCVC_ADDRESS} · ${DCVC_PHONE}</p>
        <p style="margin: 0;"><a href="${DCVC_WEBSITE}" style="color: #6b21a8; text-decoration: underline;">diversitycollective.org</a></p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * 1. Contact Inquiry Acknowledgment (to Visitor)
 */
export function templateContactAcknowledgment({ name, subject }) {
  const title = "We've Received Your Message";
  const contentHtml = `
    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 0;">
      Dear ${name || 'Friend'},
    </p>
    <p style="font-size: 15px; line-height: 1.6; color: #334155;">
      Thank you for contacting Diversity Collective Ventura County regarding <strong>"${subject || 'General Inquiry'}"</strong>.
    </p>
    <p style="font-size: 15px; line-height: 1.6; color: #334155;">
      Our Community Resource Center team has received your message and will review it promptly. We typically respond within 1–2 business days.
    </p>
    <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 12px; padding: 16px; margin: 20px 0;">
      <h4 style="margin: 0 0 6px 0; color: #581c87; font-size: 12px; text-transform: uppercase;">Community Resource Center Drop-In Hours</h4>
      <p style="margin: 0; font-size: 13px; color: #4c1d95; line-height: 1.5;">
        Monday – Friday: 1:00 PM – 5:00 PM PT<br>
        2471 Portola Road, Suite 100, Ventura, CA 93003
      </p>
    </div>
  `;

  return {
    subject: `We've received your inquiry — Diversity Collective`,
    html: baseEmailWrapper({ title, headerSubtitle: 'Thank you for reaching out', contentHtml }),
    text: `Hello ${name},\n\nThank you for reaching out to Diversity Collective Ventura County regarding "${subject}". Our staff will respond within 1-2 business days.\n\nDiversity Collective Team`
  };
}

/**
 * 2. Contact Inquiry Notification (to Staff)
 */
export function templateContactStaffNotification({ name, email, phone, subject, message, reference }) {
  const title = `[Website Inquiry] ${subject || 'General'}`;
  const contentHtml = `
    <div style="background-color: #f1f5f9; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>From:</strong> ${name} (&lt;${email}&gt;)</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Phone:</strong> ${phone || 'None provided'}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Subject:</strong> ${subject}</p>
      <p style="margin: 0; font-size: 12px; color: #64748b;"><strong>Reference ID:</strong> ${reference || 'N/A'}</p>
    </div>
    <h3 style="font-size: 14px; text-transform: uppercase; color: #475569; margin: 0 0 8px 0;">Message Content:</h3>
    <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; font-size: 14px; line-height: 1.6; color: #1e293b; white-space: pre-wrap;">
      ${message}
    </div>
  `;

  return {
    subject: `[Website Inquiry] ${subject} — from ${name}`,
    html: baseEmailWrapper({ title: 'New Website Inquiry', headerSubtitle: `From ${name}`, contentHtml }),
    text: `New website inquiry from ${name} (${email}):\nSubject: ${subject}\nPhone: ${phone}\n\nMessage:\n${message}`
  };
}

/**
 * 3. Volunteer Application Acknowledgment (to Applicant)
 */
export function templateVolunteerAcknowledgment({ fullName }) {
  const title = "Volunteer Application Received";
  const contentHtml = `
    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 0;">
      Dear ${fullName || 'Friend'},
    </p>
    <p style="font-size: 15px; line-height: 1.6; color: #334155;">
      Thank you for applying to volunteer with Diversity Collective Ventura County! Volunteers are the vital heartbeat of our safe harbor, youth programs, and annual Pride festival.
    </p>
    <p style="font-size: 15px; line-height: 1.6; color: #334155;">
      Our Volunteer Coordinator will review your application and reach out regarding our upcoming volunteer orientation and onboarding schedule.
    </p>
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 20px 0;">
      <h4 style="margin: 0 0 6px 0; color: #166534; font-size: 12px; text-transform: uppercase;">Youth Program Volunteers (Rainbow Umbrella & Little Unicorns)</h4>
      <p style="margin: 0; font-size: 13px; color: #15803d; line-height: 1.5;">
        Please note that volunteers directly supporting youth programs must be 21+ and complete a mandatory Live Scan fingerprint background check.
      </p>
    </div>
  `;

  return {
    subject: `Thank you for volunteering with DCVC! 🌟`,
    html: baseEmailWrapper({ title, headerSubtitle: 'Building community together', contentHtml }),
    text: `Dear ${fullName},\n\nThank you for applying to volunteer with Diversity Collective! Our volunteer coordinator will reach out to schedule an orientation.\n\nDiversity Collective Team`
  };
}

/**
 * 4. Volunteer Application Notification (to Staff)
 */
export function templateVolunteerStaffNotification({ fullName, email, phone, city, roles, availability, reference }) {
  const rolesList = Array.isArray(roles) ? roles.join(', ') : roles;
  const contentHtml = `
    <div style="background-color: #f1f5f9; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Applicant:</strong> ${fullName}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Email:</strong> ${email}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Phone:</strong> ${phone}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>City:</strong> ${city}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Areas of Interest:</strong> ${rolesList || 'General'}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Availability:</strong> ${availability || 'Flexible'}</p>
      <p style="margin: 0; font-size: 12px; color: #64748b;"><strong>Reference:</strong> ${reference || 'N/A'}</p>
    </div>
  `;

  return {
    subject: `[New Volunteer Application] ${fullName} (${city})`,
    html: baseEmailWrapper({ title: 'New Volunteer Application', headerSubtitle: `${fullName} • ${city}`, contentHtml }),
    text: `New volunteer application from ${fullName} (${email}, ${phone}, ${city}). Areas: ${rolesList}`
  };
}

/**
 * 5. Business Submission Acknowledgment (to Submitter)
 */
export function templateBusinessAcknowledgment({ businessName, ownerName }) {
  const title = "Directory Listing Submitted";
  const contentHtml = `
    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 0;">
      Dear ${ownerName || 'Business Owner'},
    </p>
    <p style="font-size: 15px; line-height: 1.6; color: #334155;">
      Thank you for submitting <strong>${businessName}</strong> to the Ventura County LGBTQ+ Affirming Business Directory and signing the DCVC Affirming Pledge.
    </p>
    <p style="font-size: 15px; line-height: 1.6; color: #334155;">
      Our moderation team verifies all directory submissions to ensure affirming standards. Your listing will be reviewed within 3–5 business days. Once approved, it will be published to our searchable directory.
    </p>
  `;

  return {
    subject: `Listing Received: ${businessName} — Affirming Business Directory`,
    html: baseEmailWrapper({ title, headerSubtitle: 'Affirming Business Directory', contentHtml }),
    text: `Hello ${ownerName},\n\nThank you for submitting ${businessName} to the DCVC Affirming Business Directory. Staff will verify your listing within 3-5 business days.`
  };
}

/**
 * 6. Business Moderation Notification (to Staff)
 */
export function templateBusinessModerationNotification({ businessName, category, city, ownerName, ownerEmail, reference }) {
  const contentHtml = `
    <div style="background-color: #f1f5f9; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Business Name:</strong> ${businessName}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Category:</strong> ${category}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>City:</strong> ${city}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Submitter:</strong> ${ownerName} (&lt;${ownerEmail}&gt;)</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Affirming Pledge Signed:</strong> Yes (Recorded)</p>
      <p style="margin: 0; font-size: 12px; color: #64748b;"><strong>Reference:</strong> ${reference || 'N/A'}</p>
    </div>
  `;

  return {
    subject: `[Directory Moderation] ${businessName} (${city}) pending review`,
    html: baseEmailWrapper({ 
      title: 'Directory Listing Pending Review', 
      headerSubtitle: `${businessName} • ${category}`, 
      contentHtml,
      actionButton: { text: 'Open Admin Dashboard', url: 'https://diversitycollective.org/admin' }
    }),
    text: `New directory listing pending review: ${businessName} (${category}, ${city}) submitted by ${ownerName} (${ownerEmail}).`
  };
}

/**
 * 7. Training Booking Acknowledgment (to Inquirer)
 */
export function templateTrainingAcknowledgment({ contactName, organizationName, courseTitle }) {
  const title = "Training Inquiry Received";
  const contentHtml = `
    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 0;">
      Dear ${contactName},
    </p>
    <p style="font-size: 15px; line-height: 1.6; color: #334155;">
      Thank you for requesting P.R.I.D.E. Cultural Humility & Competency Training for <strong>${organizationName}</strong> regarding workshop: <strong>"${courseTitle}"</strong>.
    </p>
    <p style="font-size: 15px; line-height: 1.6; color: #334155;">
      Our Education Coordinator will prepare a customized workshop proposal and contact you within 2 business days to discuss scheduling and attendee goals.
    </p>
  `;

  return {
    subject: `P.R.I.D.E. Training Request Received — ${organizationName}`,
    html: baseEmailWrapper({ title, headerSubtitle: 'P.R.I.D.E. Cultural Competency Education', contentHtml }),
    text: `Hello ${contactName},\n\nThank you for requesting P.R.I.D.E. training for ${organizationName}. An education coordinator will be in touch with a proposal.`
  };
}

/**
 * 8. Training Inquiry Notification (to Staff)
 */
export function templateTrainingStaffNotification({ organizationName, contactName, email, phone, courseTitle, attendees, preferredFormat, preferredDate, notes }) {
  const contentHtml = `
    <div style="background-color: #f1f5f9; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Organization:</strong> ${organizationName}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Contact:</strong> ${contactName} (&lt;${email}&gt;)</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Phone:</strong> ${phone || 'N/A'}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Course:</strong> ${courseTitle}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Estimated Attendees:</strong> ${attendees}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Format:</strong> ${preferredFormat}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Requested Date:</strong> ${preferredDate || 'Flexible'}</p>
      ${notes ? `<p style="margin: 8px 0 0 0; font-size: 14px;"><strong>Notes:</strong> ${notes}</p>` : ''}
    </div>
  `;

  return {
    subject: `[Training Request] ${organizationName} — ${courseTitle}`,
    html: baseEmailWrapper({ title: 'New Training Workshop Request', headerSubtitle: organizationName, contentHtml }),
    text: `Training request for ${organizationName} by ${contactName} (${email}). Course: ${courseTitle}, Attendees: ${attendees}, Format: ${preferredFormat}`
  };
}

/**
 * 9. Accessibility Feedback Acknowledgment (to Reporter)
 */
export function templateAccessibilityAcknowledgment({ contactName, pageUrl }) {
  const title = "Accessibility Feedback Received";
  const contentHtml = `
    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 0;">
      Dear ${contactName || 'Community Member'},
    </p>
    <p style="font-size: 15px; line-height: 1.6; color: #334155;">
      Thank you for reporting an accessibility barrier on our website (${pageUrl || 'diversitycollective.org'}).
    </p>
    <p style="font-size: 15px; line-height: 1.6; color: #334155;">
      Diversity Collective is committed to digital equity and WCAG 2.2 AA standards. Our digital accessibility team has received your ticket and will test and remediate the issue promptly.
    </p>
  `;

  return {
    subject: `Accessibility Barrier Report Received — Diversity Collective`,
    html: baseEmailWrapper({ title, headerSubtitle: 'Commitment to Digital Accessibility', contentHtml }),
    text: `Hello ${contactName || 'Friend'},\n\nThank you for reporting an accessibility barrier. Our digital accessibility team is reviewing the issue.\n\nDiversity Collective Team`
  };
}

/**
 * 10. Accessibility Feedback Notification (to Staff)
 */
export function templateAccessibilityStaffNotification({ pageUrl, barrierDescription, assistiveTech, contactName, contactEmail }) {
  const contentHtml = `
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #991b1b;"><strong>Page URL:</strong> ${pageUrl}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Assistive Technology:</strong> ${assistiveTech || 'Not specified'}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Reporter:</strong> ${contactName || 'Anonymous'} (${contactEmail || 'No email'})</p>
    </div>
    <h3 style="font-size: 14px; text-transform: uppercase; color: #475569; margin: 0 0 8px 0;">Barrier Description:</h3>
    <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; font-size: 14px; line-height: 1.6; color: #1e293b; white-space: pre-wrap;">
      ${barrierDescription}
    </div>
  `;

  return {
    subject: `[Accessibility Ticket] Barrier reported on ${pageUrl}`,
    html: baseEmailWrapper({ title: 'Accessibility Barrier Reported', headerSubtitle: 'WCAG Remediation Needed', contentHtml }),
    text: `Accessibility barrier reported on ${pageUrl}:\nReporter: ${contactName} (${contactEmail})\nTech: ${assistiveTech}\nDetails:\n${barrierDescription}`
  };
}

/**
 * 11. Donor Appreciation Card Email (to Donor)
 */
export function templateDonorAppreciationEmail({ donorDisplayName, formattedAmount, tierName, badge, tagline, impact, cardUrl, frequency }) {
  const title = `Thank You, ${donorDisplayName}!`;
  const contentHtml = `
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="display: inline-block; padding: 4px 14px; background-color: #faf5ff; border: 1px solid #d8b4fe; border-radius: 999px; font-size: 11px; font-weight: 800; color: #581c87; text-transform: uppercase; letter-spacing: 0.5px;">
        ${badge || tierName} • ${tierName}
      </span>
    </div>

    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 0;">
      We are deeply moved by your generous gift of <strong>${formattedAmount}</strong> ${frequency === 'monthly' ? '(Monthly Sustainer)' : ''}. Your kindness powers our safe harbor for LGBTQ+ individuals and families across Ventura County.
    </p>

    <!-- Static Keepsake Card Preview Block -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0; border: 2px solid #e9d5ff; border-radius: 20px; overflow: hidden; background: linear-gradient(135deg, #fdf4ff 0%, #faf5ff 50%, #f5f3ff 100%);">
      <tr>
        <td style="padding: 24px; text-align: center;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center">
                <div style="display: inline-block; padding: 6px 14px; background-color: #ffffff; border-radius: 999px; border: 1px solid #cbd5e1; font-size: 10px; font-weight: 800; letter-spacing: 1px; color: #581c87; text-transform: uppercase; margin-bottom: 12px;">
                  Official 501(c)(3) Keepsake Card
                </div>
              </td>
            </tr>
            <tr>
              <td align="center">
                <h3 style="margin: 4px 0 8px 0; font-family: Georgia, serif; font-size: 20px; font-weight: 700; color: #1e1b4b;">
                  With Heartfelt Thanks To
                </h3>
                <p style="margin: 0 0 16px 0; font-family: Georgia, serif; font-size: 24px; font-weight: 800; color: #581c87;">
                  ${donorDisplayName}
                </p>
                <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #f59e0b, #ec4899); margin: 0 auto 16px auto; border-radius: 2px;"></div>
              </td>
            </tr>
            <tr>
              <td align="center">
                <p style="margin: 0 0 20px 0; font-size: 13px; font-style: italic; color: #475569; max-width: 440px; line-height: 1.5;">
                  "${tagline}"
                </p>
              </td>
            </tr>
            <tr>
              <td align="center">
                <a href="${cardUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #e11d48 0%, ${DCVC_PURPLE} 50%, #6b21a8 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 800; padding: 14px 32px; border-radius: 14px; box-shadow: 0 6px 16px rgba(90, 30, 101, 0.25);">
                  Open & Unwrap Your Interactive Card ✨
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 16px; padding: 20px; margin: 24px 0;">
      <h4 style="margin: 0 0 8px 0; color: #581c87; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">What Your Gift Makes Possible</h4>
      <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #4c1d95;">
        ${impact}
      </p>
    </div>

    <p style="font-size: 12px; line-height: 1.5; color: #64748b; margin: 20px 0 0 0;">
      <strong>Tax Receipt Notice:</strong> This appreciation card is a cultural keepsake honoring your generous partnership. It is not an official IRS tax receipt. Official tax-deductible donation receipts are issued independently and securely via our nonprofit giving partner, Zeffy.
    </p>
  `;

  return {
    subject: `Your DCVC Appreciation Card has arrived! 💜 (${tierName})`,
    html: baseEmailWrapper({ title, headerSubtitle: `"${tagline}"`, contentHtml }),
    text: `Thank you, ${donorDisplayName}!

We are deeply grateful for your generous gift of ${formattedAmount} ${frequency === 'monthly' ? '(Monthly Sustainer)' : ''} to Diversity Collective Ventura County.

Tier: ${tierName} (${badge})
"${tagline}"

What Your Gift Makes Possible:
${impact}

Open & Unwrap Your Interactive Keepsake Card:
${cardUrl}

(Notice: This appreciation card is a cultural keepsake honoring your community support. It does not serve as an official IRS tax receipt. Official tax-deductible donation receipts are issued independently via Zeffy.)`
  };
}

/**
 * 12. Administrative Alerts (Status Changes / Security Alerts)
 */
export function templateAdminAlert({ action, details, actorEmail, targetType, targetId }) {
  const title = `[Admin Alert] ${action}`;
  const contentHtml = `
    <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Action:</strong> ${action}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Target:</strong> ${targetType} (ID: ${targetId || 'N/A'})</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Actor:</strong> ${actorEmail || 'System / Automated'}</p>
      <p style="margin: 0; font-size: 12px; color: #64748b;"><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
    </div>
    <h3 style="font-size: 14px; text-transform: uppercase; color: #475569; margin: 0 0 8px 0;">Event Details:</h3>
    <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; font-size: 14px; line-height: 1.6; color: #1e293b; white-space: pre-wrap;">
      ${typeof details === 'object' ? JSON.stringify(details, null, 2) : details}
    </div>
  `;

  return {
    subject: `[DCVC Security/Admin Alert] ${action}`,
    html: baseEmailWrapper({ title: 'Administrative Activity Alert', headerSubtitle: action, contentHtml }),
    text: `Admin Alert: ${action} on ${targetType} by ${actorEmail}.\nDetails: ${typeof details === 'object' ? JSON.stringify(details) : details}`
  };
}

/**
 * 13. Newsletter Welcome & Subscription Confirmation
 */
export function templateNewsletterWelcome({ email, unsubscribeUrl = `${DCVC_WEBSITE}/privacy` }) {
  const title = 'Welcome to the Diversity Collective Community! 🌈';
  const contentHtml = `
    <p style="font-size: 16px; line-height: 1.6; color: #1e293b; margin: 0 0 16px 0;">
      Thank you for subscribing to the <strong>Diversity Collective Ventura County</strong> newsletter!
    </p>
    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 20px 0;">
      You're now connected with Ventura County's premier LGBTQ+ community network. Here is what you can look forward to in your inbox:
    </p>

    <div style="background-color: #fdf4ff; border: 1px solid #f0abfc; border-radius: 16px; padding: 20px; margin: 0 0 24px 0;">
      <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: #701a75;">
        <li><strong>Ventura County Pride Announcements:</strong> Headliners, vendor applications, VIP passes & festival schedules.</li>
        <li><strong>Free Health Screenings & SHINES Updates:</strong> Rapid HIV/STI clinics, status-neutral harm reduction resources.</li>
        <li><strong>Rainbow Umbrella Youth Circles:</strong> Weekly peer support, art nights & Youth Pride Prom events.</li>
        <li><strong>LGBTQ+ Affirming Business Directory Spotlights:</strong> Celebrating local safe-space businesses across Ventura County.</li>
      </ul>
    </div>

    <p style="font-size: 14px; line-height: 1.6; color: #64748b; margin: 0 0 24px 0;">
      Our Community Resource Center in Ventura is open Tuesday through Friday for drop-in hours, our lending library, and computer workstations. Stop by and say hello!
    </p>

    <div style="text-align: center; margin: 24px 0 10px 0;">
      <a href="${DCVC_WEBSITE}/events" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #e11d48 0%, ${DCVC_PURPLE} 50%, #6b21a8 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(90, 30, 101, 0.25);">
        Explore Upcoming Community Events →
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 28px 0 16px 0;">
    <p style="font-size: 11px; line-height: 1.5; color: #94a3b8; text-align: center; margin: 0;">
      You subscribed with <strong>${email}</strong>. If you ever wish to opt out, you can <a href="${unsubscribeUrl}" style="color: #6b21a8; text-decoration: underline;">unsubscribe at any time</a>.
    </p>
  `;

  return {
    subject: 'Welcome to Diversity Collective Ventura County! 🌈✨',
    html: baseEmailWrapper({ title: 'Welcome to the DCVC Family!', headerSubtitle: 'Sanctuary, Advocacy & Care Across Ventura County', contentHtml }),
    text: `Welcome to Diversity Collective Ventura County!
Thank you for subscribing with ${email}.
You'll now receive updates on Ventura County Pride, free health clinics, Rainbow Umbrella youth circles, and local LGBTQ+ community advocacy.
Explore upcoming events: ${DCVC_WEBSITE}/events
To unsubscribe: ${unsubscribeUrl}`
  };
}

/**
 * 14. Professional Broadcast Newsletter Template
 */
export function templateNewsletterBroadcast({
  subject,
  preheader = '',
  headline,
  authorName = 'Diversity Collective Team',
  authorTitle = 'Community Leadership',
  contentHtml,
  ctaText = '',
  ctaUrl = '',
  unsubscribeUrl = `${DCVC_WEBSITE}/privacy`
}) {
  const displayTitle = headline || subject;

  const emailBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  ${preheader ? `
  <div style="display: none; max-height: 0px; overflow: hidden;">
    ${preheader}
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>
  ` : ''}
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: ${DCVC_BG}; margin: 0; padding: 24px; color: #1e293b;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 640px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(90, 30, 101, 0.08); border: 1px solid #e2e8f0;">
    
    <!-- Top Pride Color Band -->
    <tr>
      <td style="height: 6px; background: linear-gradient(90deg, #e11d48 0%, #ea580c 20%, #eab308 40%, #16a34a 60%, #0284c7 80%, #7c3aed 100%); line-height: 6px; font-size: 6px;">&nbsp;</td>
    </tr>

    <!-- Header Banner -->
    <tr>
      <td style="padding: 36px 36px 28px 36px; background: linear-gradient(135deg, ${DCVC_PURPLE} 0%, ${DCVC_PURPLE_DARK} 100%);">
        <div style="display: inline-block; padding: 4px 12px; background-color: rgba(255,255,255,0.15); border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 1.2px; color: #fef08a; text-transform: uppercase;">
          COMMUNITY DISPATCH · VENTURA COUNTY
        </div>
        <h1 style="color: #ffffff; font-size: 26px; line-height: 1.25; margin: 16px 0 10px 0; font-weight: 800; letter-spacing: -0.5px;">
          ${displayTitle}
        </h1>
        <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: #e9d5ff; padding-top: 4px;">
          <span>By <strong>${authorName}</strong>${authorTitle ? ` · ${authorTitle}` : ''}</span>
        </div>
      </td>
    </tr>

    <!-- Main Content Area -->
    <tr>
      <td style="padding: 36px 36px 28px 36px; font-size: 15px; line-height: 1.7; color: #334155;">
        ${contentHtml}

        ${ctaText && ctaUrl ? `
        <div style="text-align: center; margin: 36px 0 20px 0;">
          <a href="${ctaUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #e11d48 0%, ${DCVC_PURPLE} 50%, #6b21a8 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 700; padding: 16px 36px; border-radius: 14px; box-shadow: 0 6px 18px rgba(90, 30, 101, 0.28); text-align: center;">
            ${ctaText} →
          </a>
        </div>
        ` : ''}

        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 36px 0 20px 0;">

        <!-- Community Mutual Aid & Giving Callout -->
        <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 14px; padding: 18px 20px; font-size: 13px; line-height: 1.6; color: #581c87;">
          <strong>Support Community Sanctuary:</strong> Diversity Collective is Ventura County's only LGBTQ+ Community Resource Center. Our free services are funded by community members like you. <a href="${DCVC_WEBSITE}/donate" style="color: #7c2d12; font-weight: 700; text-decoration: underline;">Make a tax-deductible gift today</a>.
        </div>
      </td>
    </tr>

    <!-- CAN-SPAM Compliant Footer with Unsubscribe -->
    <tr>
      <td style="padding: 24px 36px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; line-height: 1.6; color: #94a3b8;">
        <p style="margin: 0 0 6px 0; font-weight: 700; color: #475569;">
          Diversity Collective Ventura County, Inc.
        </p>
        <p style="margin: 0 0 6px 0;">
          ${DCVC_ADDRESS} · Tel: ${DCVC_PHONE} · 501(c)(3) Nonprofit
        </p>
        <p style="margin: 0 0 10px 0;">
          <a href="${DCVC_WEBSITE}" style="color: #6b21a8; text-decoration: underline;">diversitycollective.org</a> · <a href="${DCVC_WEBSITE}/events" style="color: #6b21a8; text-decoration: underline;">Upcoming Events</a> · <a href="${DCVC_WEBSITE}/donate" style="color: #6b21a8; text-decoration: underline;">Donate</a>
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; width: 60%; margin: 12px auto;">
        <p style="margin: 0; color: #64748b;">
          You received this email because you subscribed to community announcements from Diversity Collective Ventura County.<br>
          <a href="${unsubscribeUrl}" style="color: #dc2626; text-decoration: underline; font-weight: 600;">Unsubscribe from this list</a> · <a href="${DCVC_WEBSITE}/privacy" style="color: #64748b; text-decoration: underline;">Privacy Policy</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return {
    subject,
    html: emailBody,
    text: `${headline || subject}\nBy ${authorName}\n\n${contentHtml.replace(/<[^>]+>/g, ' ')}\n\n${ctaText ? `${ctaText}: ${ctaUrl}\n\n` : ''}To unsubscribe: ${unsubscribeUrl}\nDiversity Collective Ventura County, Inc. ${DCVC_ADDRESS}`
  };
}

