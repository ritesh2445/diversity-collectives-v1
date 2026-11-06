// Diversity Collective Ventura County — Turso libSQL Database Seed Script
// Usage:
//   node src/db/seed.js [flags]
// Reads credentials from process.env.TURSO_DATABASE_URL and TURSO_AUTH_TOKEN

const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');

const seedData = [
  {
    id: "biz-1",
    slug: "beacon-coffee-company",
    name: "Beacon Coffee Company",
    category: "Dining & Coffee",
    city: "Ventura",
    address: "5777 Valentine Rd, Ventura, CA 93003",
    zip: "93003",
    phone: "(805) 248-7054",
    email: "hello@beaconcoffee.com",
    website: "https://beaconcoffee.com",
    description: "Artisanal, sustainably sourced specialty coffee roastery and welcoming community gathering spot with all-gender facilities and inclusive staff training.",
    logo_url: "https://res.cloudinary.com/dcvc/image/upload/v1/directory/beacon-coffee-logo.png",
    cover_url: "https://res.cloudinary.com/dcvc/image/upload/v1/directory/beacon-coffee-cover.jpg",
    is_featured: 1,
    is_verified: 1,
    status: "approved",
    affirming_pledge_signed_at: "2024-01-15T10:00:00Z"
  },
  {
    id: "biz-2",
    slug: "coastal-pride-counseling",
    name: "Coastal Pride Counseling & Wellness",
    category: "Health & Wellness",
    city: "Ventura",
    address: "1070 E Front St, Suite 200, Ventura, CA 93001",
    zip: "93001",
    phone: "(805) 555-0144",
    email: "care@coastalpridecounseling.com",
    website: "https://example.com/coastal-pride",
    description: "Trauma-informed, gender-affirming psychotherapy and mental health counseling specializing in LGBTQ+ youth, gender transitions, and couples therapy.",
    logo_url: "https://res.cloudinary.com/dcvc/image/upload/v1/directory/coastal-pride-logo.png",
    cover_url: "https://res.cloudinary.com/dcvc/image/upload/v1/directory/coastal-pride-cover.jpg",
    is_featured: 1,
    is_verified: 1,
    status: "approved",
    affirming_pledge_signed_at: "2024-01-20T14:30:00Z"
  },
  {
    id: "biz-3",
    slug: "channel-islands-law-group",
    name: "Channel Islands Inclusive Law Group",
    category: "Legal & Financial",
    city: "Oxnard",
    address: "300 E Esplanade Dr, Suite 900, Oxnard, CA 93036",
    zip: "93036",
    phone: "(805) 555-0182",
    email: "info@cilawgroup.example",
    website: "https://example.com/cilaw",
    description: "Full-service legal practice focusing on California legal name and gender-marker changes, estate planning for non-traditional families, and workplace advocacy.",
    logo_url: "https://res.cloudinary.com/dcvc/image/upload/v1/directory/ci-law-logo.png",
    cover_url: "https://res.cloudinary.com/dcvc/image/upload/v1/directory/ci-law-cover.jpg",
    is_featured: 0,
    is_verified: 1,
    status: "approved",
    affirming_pledge_signed_at: "2024-02-01T09:15:00Z"
  },
  {
    id: "biz-4",
    slug: "ojai-valley-botanicals",
    name: "Ojai Valley Botanicals & Tea Lounge",
    category: "Retail & Gifts",
    city: "Ojai",
    address: "214 E Ojai Ave, Ojai, CA 93023",
    zip: "93023",
    phone: "(805) 555-0199",
    email: "herbs@ojaibotanicals.example",
    website: "https://example.com/ojai-botanicals",
    description: "Queer-owned organic herbal dispensary, local artwork gallery, and safe community space hosting queer book clubs and acoustic open mics.",
    logo_url: "https://res.cloudinary.com/dcvc/image/upload/v1/directory/ojai-botanicals-logo.png",
    cover_url: "https://res.cloudinary.com/dcvc/image/upload/v1/directory/ojai-botanicals-cover.jpg",
    is_featured: 1,
    is_verified: 1,
    status: "approved",
    affirming_pledge_signed_at: "2024-02-10T16:00:00Z"
  },
  {
    id: "biz-5",
    slug: "conejo-valley-fitness-collective",
    name: "Conejo Valley Fitness Collective",
    category: "Fitness & Recreation",
    city: "Thousand Oaks",
    address: "145 E Thousand Oaks Blvd, Thousand Oaks, CA 91360",
    zip: "91360",
    phone: "(805) 555-0123",
    email: "train@conejofitness.example",
    website: "https://example.com/conejofitness",
    description: "Body-neutral, trans-inclusive functional movement studio with private changing suites, gender-neutral showers, and certified affirming personal trainers.",
    logo_url: "https://res.cloudinary.com/dcvc/image/upload/v1/directory/conejo-fitness-logo.png",
    cover_url: "https://res.cloudinary.com/dcvc/image/upload/v1/directory/conejo-fitness-cover.jpg",
    is_featured: 0,
    is_verified: 1,
    status: "approved",
    affirming_pledge_signed_at: "2024-02-15T11:45:00Z"
  },
  {
    id: "biz-6",
    slug: "pacific-view-design-studio",
    name: "Pacific View Creative & Web Studio",
    category: "Professional Services",
    city: "Camarillo",
    address: "4001 Mission Oaks Blvd, Camarillo, CA 93012",
    zip: "93012",
    phone: "(805) 555-0167",
    email: "create@pacificview.example",
    website: "https://example.com/pacificview",
    description: "Full-stack digital design, web accessibility auditing, and brand strategy studio partnering with non-profits, progressive campaigns, and queer creators.",
    logo_url: "https://res.cloudinary.com/dcvc/image/upload/v1/directory/pacific-view-logo.png",
    cover_url: "https://res.cloudinary.com/dcvc/image/upload/v1/directory/pacific-view-cover.jpg",
    is_featured: 1,
    is_verified: 1,
    status: "approved",
    affirming_pledge_signed_at: "2024-02-20T13:00:00Z"
  }
];

async function seedDatabase() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    console.warn("⚠️ TURSO_DATABASE_URL not found in environment. Generating SQL seed file instead.");
    generateSqlSeedFile();
    return;
  }

  const client = createClient({ url, authToken });

  console.log("🌱 Seeding Turso libSQL database with verified business directory listings...");

  for (const biz of seedData) {
    await client.execute({
      sql: `INSERT OR REPLACE INTO businesses 
            (id, slug, name, category, description, address, city, zip, phone, email, website, logo_url, cover_url, is_featured, is_verified, status, affirming_pledge_signed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        biz.id,
        biz.slug,
        biz.name,
        biz.category,
        biz.description,
        biz.address,
        biz.city,
        biz.zip,
        biz.phone,
        biz.email,
        biz.website,
        biz.logo_url,
        biz.cover_url,
        biz.is_featured,
        biz.is_verified,
        biz.status,
        biz.affirming_pledge_signed_at
      ]
    });
    console.log(`  ✓ Inserted: ${biz.name} (${biz.city})`);
  }

  console.log("✅ Database seeding completed successfully.");
}

function generateSqlSeedFile() {
  let sql = "-- Diversity Collective Seed Data\n";
  for (const biz of seedData) {
    sql += `INSERT OR REPLACE INTO businesses (id, slug, name, category, description, address, city, zip, phone, email, website, logo_url, cover_url, is_featured, is_verified, status, affirming_pledge_signed_at)\nVALUES ('${biz.id}', '${biz.slug}', '${biz.name.replace(/'/g, "''")}', '${biz.category}', '${biz.description.replace(/'/g, "''")}', '${biz.address.replace(/'/g, "''")}', '${biz.city}', '${biz.zip}', '${biz.phone}', '${biz.email}', '${biz.website}', '${biz.logo_url}', '${biz.cover_url}', ${biz.is_featured}, ${biz.is_verified}, '${biz.status}', '${biz.affirming_pledge_signed_at}');\n\n`;
  }
  const outputPath = path.join(__dirname, 'seed.sql');
  fs.writeFileSync(outputPath, sql, 'utf8');
  console.log(`✅ Generated seed SQL file at: ${outputPath}`);
}

if (require.main === module) {
  seedDatabase().catch((err) => {
    console.error("❌ Seed error:", err);
    process.exit(1);
  });
}

module.exports = { seedData, seedDatabase };

