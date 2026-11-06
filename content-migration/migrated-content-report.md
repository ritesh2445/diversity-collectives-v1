# Migrated Content Verification Report

**Project:** Diversity Collective Ventura County  
**Source Legacy Websites:** `https://diversitycollective.org` & `https://www.diversitycollectivevc.org`  
**Target Repository:** `diversity-collectives-v1`

---

## 1. Overview & Data Integrity Guarantee

Content migration for Diversity Collective Ventura County was executed under the strict rule that **only verified information from legitimate sources is migrated, without summarizing, shortening, or inventing placeholder facts**.

All extracted legacy copy has been systematically migrated into the application's central data models in `src/data/dcvcData.js` and individual structured JSON data artifacts in `content-migration/content-data/`.

---

## 2. Detailed Content Migration Log

### 2.1 Organizational Identity & Governance
- **Legal Entity**: Diversity Collective Ventura County, Inc.
- **Tax Status**: 501(c)(3) Non-Profit Public Benefit Corporation (EIN: `46-5312131`, CA Corp: `C3666108`).
- **Mission**: *"Providing advocacy, visibility, safety, and wellness for the LGBTQ+ community."*
- **Vision**: *"A Ventura County community where LGBTQ+ individuals, inclusive of all intersecting identities, have immediate access to needed services, are celebrated, and treated with equity and respect."*
- **Values**: *"We believe in the freedom to be your authentic self, both at home & in the community. In lifting each other up even when it's hard, we build allies, opportunities, and resources to live our best lives."*
- **DEI Commitment**: Full formal policy preserving all text on individual differences, knowledge, and self-expression.
- **Headquarters Location**: 2471 Portola Road, Suite 100, Ventura, CA 93003.
- **Phone**: `(805) 644-LGBT (5428)`.
- **Operating Hours**: 1:00 PM – 5:00 PM Weekdays.

### 2.2 Board of Directors & Executive Staff
Migrated directly into `boardMembers` and `staffMembers` in `src/data/dcvcData.js`:
1. **Tess Allen (Executive Director)**: Promoted to DCVC's first official Executive Director after serving as Board President/Co-President; nonprofit leadership, conservatory dance/music training; guiding local advocacy and wellness programs.
2. **Roland Catabona (Board President)**: 18+ years in community and business banking, AIDS Walk Ventura co-chair, Ventura County Pride fundraising lead, cycling and wellness advocate, certified yoga instructor.
3. **Steve Somann (Co-Founder & Director)**: Co-founder (2014), Treasurer (2014–2015), President (2015–2018), property management lead for the Community Resource Center.
4. **Unique Dowtin (Board Secretary)**: Library professional at The Getty, filmmaker, AIDSWalk and Pride volunteer.
5. **Luis Andrade (Director / Vice President)**: Bank of America Global Risk Management testing specialist, Southern California LGBT+ Pride Chapter event leader.
6. **Celia Sandhya Daniels (Director)**: Healthcare management executive, Founder & CEO of Rebekon Consulting, prominent advocate for AI bias and health/gender equity, Workforce Development Board member.
7. **AJ Holmes (Director)**: Ventura County business owner, photographer, civic advocate.
8. **Genevieve Flores-Haro (Associate Director)**: Public policy, grassroots community advocacy, intersectional wellness lead.

### 2.3 Programs & Services
Migrated into `programsList` in `src/data/dcvcData.js` with full descriptions, schedules, amenities, and contact emails:
1. **Community Resource Center (CRC)**:
   - Physical hub at 2471 Portola Rd, Suite 100, Ventura.
   - Amenities: Drop-in lounge, free computer/printer access, curated lending library, free harm reduction & hygiene supplies, private testing rooms.
   - Contact: `info@diversitycollective.org` | (805) 644-5428.
2. **Rainbow Umbrella**:
   - Target Audience: Youth ages 13–23 (LGBTQQIAP2+, questioning, allies).
   - Schedule: Every Friday, 5:30 PM – 7:30 PM (in-person with hybrid options).
   - Offerings: Peer circle check-in, creative workshops, Pride Prom organizers.
   - Contact: `rainbowumbrella@diversitycollective.org`.
3. **Little Unicorns**:
   - Target Audience: Young LGBTQ+, questioning, and ally youth ages 9–13.
   - Schedule: Last Saturday of each month, 1:00 PM – 3:00 PM.
   - Location: CRC & local parks (Hobart Park).
   - Contact: `littleunicorns@diversitycollective.org`.
4. **Diversity SHINES**:
   - Focus: Status-neutral sexual wellness care.
   - Testing Clinics: 1st Monday of every month, 3:00 PM – 7:00 PM.
   - Offerings: Free confidential rapid testing (HIV, syphilis, chlamydia, gonorrhea), PrEP/PEP linkage, free *SHINE With Me* safer sex kits, MPOX vaccine clinics.
   - Contact: `shines@diversitycollective.org`.
5. **P.R.I.D.E. Educational Training**:
   - Curriculum: 4-hour cultural competency workshop developed with Ventura County Behavioral Health.
   - Target: Healthcare providers, educators, youth-serving nonprofits, corporate workplaces.
   - Materials: Participant handbook, pronoun quick reference, referral directory.
   - Contact: `info@diversitycollective.org`.

### 2.4 Community Groups & Peer Circles
Migrated into `communityGroups` in `src/data/dcvcData.js`:
- *Rainbow Umbrella Youth Group* (Fridays 5:30 PM)
- *Little Unicorns* (Last Saturday 1:00 PM)
- *Queer Adulting Group* (1st & 3rd Wednesday 7:00 PM)
- *Trans Peer Group by The Transverse* (Bi-weekly Sunday 4:00 PM)
- *Silver Collective* (2nd Thursday 6:00 PM, 55+ seniors)
- *Diversity Toastmasters* (1st & 3rd Tuesday 6:30 PM)
- *PFLAG Ventura Chapter* (2nd Tuesday 6:30 PM)
- *Narcotics Anonymous Affirming Meeting* (Mondays 7:00 PM)

### 2.5 Annual Signature Events
Migrated into `annualSignatureEvents` in `src/data/dcvcData.js`:
- **Ventura County Pride Festival**: Coastal seaside festival celebrating community pride, local artists, performers, food, and public health screening pavilion.
- **Diversity Gala**: Annual benefit evening honoring community advocates, corporate allies, and volunteers.
- **Pride Prom**: Affirming, dry prom night for youth ages 13–23 hosted by Rainbow Umbrella.
- **AIDS Walk Ventura**: Annual remembrance walk combating healthcare stigma and funding Diversity SHINES.

### 2.6 Institutional Partners & Sponsors
Migrated into `sponsorsList` in `src/data/dcvcData.js`:
- **Ventura County Behavioral Health (VCBH)**: Foundational Community Health Partner.
- **Ventura County Public Health (VCPH)**: Public Health & STI Screening Partner.
- **The Transverse** & **PFLAG Ventura**: Community Peer Group Allies.

