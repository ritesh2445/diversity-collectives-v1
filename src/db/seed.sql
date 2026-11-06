-- Diversity Collective Ventura County — Seed Data SQL
-- For execution via: turso db shell <db-name> < src/db/seed.sql

INSERT OR REPLACE INTO businesses 
(id, slug, name, category, description, address, city, zip, phone, email, website, logo_url, cover_url, is_featured, is_verified, status, affirming_pledge_signed_at)
VALUES 
('biz-1', 'beacon-coffee-company', 'Beacon Coffee Company', 'Dining & Coffee', 'Artisanal, sustainably sourced specialty coffee roastery and welcoming community gathering spot with all-gender facilities and inclusive staff training.', '5777 Valentine Rd, Ventura, CA 93003', 'Ventura', '93003', '(805) 248-7054', 'hello@beaconcoffee.com', 'https://beaconcoffee.com', 'https://res.cloudinary.com/dcvc/image/upload/v1/directory/beacon-coffee-logo.png', 'https://res.cloudinary.com/dcvc/image/upload/v1/directory/beacon-coffee-cover.jpg', 1, 1, 'approved', '2024-01-15T10:00:00Z'),

('biz-2', 'coastal-pride-counseling', 'Coastal Pride Counseling & Wellness', 'Health & Wellness', 'Trauma-informed, gender-affirming psychotherapy and mental health counseling specializing in LGBTQ+ youth, gender transitions, and couples therapy.', '1070 E Front St, Suite 200, Ventura, CA 93001', 'Ventura', '93001', '(805) 555-0144', 'care@coastalpridecounseling.com', 'https://example.com/coastal-pride', 'https://res.cloudinary.com/dcvc/image/upload/v1/directory/coastal-pride-logo.png', 'https://res.cloudinary.com/dcvc/image/upload/v1/directory/coastal-pride-cover.jpg', 1, 1, 'approved', '2024-01-20T14:30:00Z'),

('biz-3', 'channel-islands-law-group', 'Channel Islands Inclusive Law Group', 'Legal & Financial', 'Full-service legal practice focusing on California legal name and gender-marker changes, estate planning for non-traditional families, and workplace advocacy.', '300 E Esplanade Dr, Suite 900, Oxnard, CA 93036', 'Oxnard', '93036', '(805) 555-0182', 'info@cilawgroup.example', 'https://example.com/cilaw', 'https://res.cloudinary.com/dcvc/image/upload/v1/directory/ci-law-logo.png', 'https://res.cloudinary.com/dcvc/image/upload/v1/directory/ci-law-cover.jpg', 0, 1, 'approved', '2024-02-01T09:15:00Z'),

('biz-4', 'ojai-valley-botanicals', 'Ojai Valley Botanicals & Tea Lounge', 'Retail & Gifts', 'Queer-owned organic herbal dispensary, local artwork gallery, and safe community space hosting queer book clubs and acoustic open mics.', '214 E Ojai Ave, Ojai, CA 93023', 'Ojai', '93023', '(805) 555-0199', 'herbs@ojaibotanicals.example', 'https://example.com/ojai-botanicals', 'https://res.cloudinary.com/dcvc/image/upload/v1/directory/ojai-botanicals-logo.png', 'https://res.cloudinary.com/dcvc/image/upload/v1/directory/ojai-botanicals-cover.jpg', 1, 1, 'approved', '2024-02-10T16:00:00Z'),

('biz-5', 'conejo-valley-fitness-collective', 'Conejo Valley Fitness Collective', 'Fitness & Recreation', 'Body-neutral, trans-inclusive functional movement studio with private changing suites, gender-neutral showers, and certified affirming personal trainers.', '145 E Thousand Oaks Blvd, Thousand Oaks, CA 91360', 'Thousand Oaks', '91360', '(805) 555-0123', 'train@conejofitness.example', 'https://example.com/conejofitness', 'https://res.cloudinary.com/dcvc/image/upload/v1/directory/conejo-fitness-logo.png', 'https://res.cloudinary.com/dcvc/image/upload/v1/directory/conejo-fitness-cover.jpg', 0, 1, 'approved', '2024-02-15T11:45:00Z'),

('biz-6', 'pacific-view-design-studio', 'Pacific View Creative & Web Studio', 'Professional Services', 'Full-stack digital design, web accessibility auditing, and brand strategy studio partnering with non-profits, progressive campaigns, and queer creators.', '4001 Mission Oaks Blvd, Camarillo, CA 93012', 'Camarillo', '93012', '(805) 555-0167', 'create@pacificview.example', 'https://example.com/pacificview', 'https://res.cloudinary.com/dcvc/image/upload/v1/directory/pacific-view-logo.png', 'https://res.cloudinary.com/dcvc/image/upload/v1/directory/pacific-view-cover.jpg', 1, 1, 'approved', '2024-02-20T13:00:00Z');

-- Pending business listing for moderation review workflow testing
INSERT OR REPLACE INTO businesses
(id, slug, name, category, description, address, city, zip, phone, email, website, is_featured, is_verified, status, affirming_pledge_signed_at, owner_name, owner_email)
VALUES
('biz-pending-1', 'harbor-books-ventura', 'Harbor Books & Community Corner', 'Retail & Gifts', 'Independent bookstore curating LGBTQ+ literature, banned books, and youth poetry workshops.', '123 Harbor Blvd, Ventura, CA 93001', 'Ventura', '93001', '(805) 555-0191', 'info@harborbooks.example', 'https://example.com/harborbooks', 0, 0, 'pending', '2026-03-01T12:00:00Z', 'Jordan Rivera', 'jordan@harborbooks.example');

-- Sample business correction request
INSERT OR REPLACE INTO business_corrections
(id, business_id, business_name, requester_name, requester_email, request_type, details, status)
VALUES
('corr-1', 'biz-1', 'Beacon Coffee Company', 'Store Manager', 'manager@beaconcoffee.com', 'update', 'Updated weekend opening hours: now open Saturday and Sunday from 7:00 AM to 4:00 PM.', 'pending');

-- Seed Administrative Users with PBKDF2-SHA256 salted password hashes
-- For staging/dev test account: Email: admin@diversitycollective.org (Password: DCVC-Admin-2026!)
INSERT OR REPLACE INTO admin_users
(id, email, name, role, password_hash, salt, is_active)
VALUES
('adm-1', 'admin@diversitycollective.org', 'Tess Allen (Executive Director)', 'admin', '8b5a794966c62c2f0fcf6408226068222383c27e3848b61e27a69623e1e07297', 'dcvc_salt_2026', 1),
('adm-2', 'moderator@diversitycollective.org', 'Community Directory Moderator', 'approver', '8b5a794966c62c2f0fcf6408226068222383c27e3848b61e27a69623e1e07297', 'dcvc_salt_2026', 1),
('adm-3', 'editor@diversitycollective.org', 'Communications Specialist', 'editor', '8b5a794966c62c2f0fcf6408226068222383c27e3848b61e27a69623e1e07297', 'dcvc_salt_2026', 1),
('adm-4', 'board-observer@diversitycollective.org', 'Board Secretary (Audit)', 'read_only', '8b5a794966c62c2f0fcf6408226068222383c27e3848b61e27a69623e1e07297', 'dcvc_salt_2026', 1);

