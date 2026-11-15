import React from 'react';

const SITE_URL = 'https://diversitycollective.pages.dev';
const ADMIN_URL = 'https://diversitycollective.pages.dev/admin';

const QUICK_LINKS = [
  {
    title: 'Full Website Admin Portal',
    description:
      'Edit Homepage Hero copy & spotlight photo, customize button colors & site fonts, reorder sections & cards, moderate the Business Directory, review form inquiries, send newsletters, and manage Gallery photos & 2FA.',
    href: ADMIN_URL,
    cta: 'Open Admin Control Center →',
    primary: true
  },
  {
    title: 'Live Public Website',
    description:
      'Preview the live public Diversity Collective Ventura County website in a new browser tab.',
    href: SITE_URL,
    cta: 'Open Live Website →',
    primary: false
  }
];

const SCHEMA_GUIDE = [
  { label: 'Site Settings & Global Info', count: 'Singleton', note: 'Org name, EIN, hours, top announcement banner' },
  { label: 'Programs & Services', count: '6 chapters', note: 'Youth, Seniors, Trans, HIV Care, Pantry, Center' },
  { label: 'Calendar Events', count: 'Calendar', note: 'Events, recurring schedules, cancellation flags' },
  { label: 'Board of Directors & Staff', count: 'Governance', note: 'Circular portraits, bios, display order' },
  { label: 'Community Resources & News', count: 'Directory', note: 'Crisis, medical, legal, stories, and gallery items' }
];

export default function AdminPanelTool() {
  return (
    <div
      style={{
        minHeight: '100%',
        backgroundColor: '#F8FAFC',
        color: '#0F172A',
        padding: '32px 24px',
        fontFamily:
          "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}
    >
      <div style={{ maxWidth: '980px', margin: '0 auto', display: 'grid', gap: '24px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #3B0764 0%, #5A1E65 60%, #1E1B4B 100%)',
            color: '#FFFFFF',
            borderRadius: '20px',
            padding: '28px 32px',
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.14)'
          }}
        >
          <div
            style={{
              display: 'inline-block',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#FDE68A',
              backgroundColor: 'rgba(255, 255, 255, 0.14)',
              padding: '4px 10px',
              borderRadius: '9999px',
              marginBottom: '12px'
            }}
          >
            Diversity Collective Ventura County
          </div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '26px', fontWeight: 900, color: '#FFFFFF' }}>
            DCVC Website Admin &amp; Design Control Center
          </h1>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: '#E9D5FF', maxWidth: '720px' }}>
            Sanity Studio manages structured CMS collections (Programs, Events, Board, Staff, News, Gallery, Resources)
            under the <strong>Structure</strong> tab above. Visual controls — Hero editor, button colors, typography,
            section &amp; card ordering, directory moderation, inquiries, and newsletter tools — live in the Website Admin Portal.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px'
          }}
        >
          {QUICK_LINKS.map((item) => (
            <div
              key={item.title}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '18px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px',
                boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)'
              }}
            >
              <div>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                  {item.title}
                </h2>
                <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.55, color: '#475569' }}>
                  {item.description}
                </p>
              </div>
              <a
                href={item.href}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 800,
                  textDecoration: 'none',
                  backgroundColor: item.primary ? '#5A1E65' : '#F1F5F9',
                  color: item.primary ? '#FFFFFF' : '#0F172A',
                  border: item.primary ? 'none' : '1px solid #CBD5E1'
                }}
              >
                {item.cta}
              </a>
            </div>
          ))}
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '18px',
            padding: '24px'
          }}
        >
          <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
            Sanity CMS Collections (Available in Structure Tab)
          </h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            {SCHEMA_GUIDE.map((row) => (
              <div
                key={row.label}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0'
                }}
              >
                <div>
                  <strong style={{ fontSize: '13px', color: '#0F172A' }}>{row.label}</strong>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>{row.note}</div>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#5A1E65',
                    backgroundColor: '#F3E8FF',
                    padding: '4px 10px',
                    borderRadius: '9999px'
                  }}
                >
                  {row.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

