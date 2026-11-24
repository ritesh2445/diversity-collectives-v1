import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildLiveOrgInfo } from '../src/hooks/useCmsLive.js';
import { cmsStore } from '../src/services/cmsStore.js';
import { orgInfo } from '../src/data/dcvcData.js';

describe('Global Site Settings Live Reflection Engine', () => {
  it('correctly maps all custom global site settings in buildLiveOrgInfo', () => {
    const customSettings = {
      name: 'Diversity Collective VC Official',
      tagline: 'Always Welcoming LGBTQ+ Ventura County',
      mission: 'Community-led advocacy and compassionate care for everyone.',
      ein: '99-1234567',
      caCorpNumber: 'C9999999',
      phone: '(805) 555-0199',
      email: 'hello@diversitycollective.org',
      hours: 'Mon–Thu 11:00 AM – 7:00 PM (Drop-ins Welcome)',
      address: '100 Main St, Suite 200, Ventura, CA 93001',
      googleMapsUrl: 'https://maps.google.com/?q=Ventura',
      voicemailOnly: true,
      bannerAlertActive: true,
      bannerAlertText: 'Special Community Forum This Friday at 6 PM',
      emergencyCrisisNotice: '24/7 Crisis Hotline: Dial 988',
      zeffyDonationUrl: 'https://www.zeffy.com/en-US/donation-form/custom-campaign-2026',
      facebook: 'https://facebook.com/custom-dcvc',
      instagram: 'https://instagram.com/custom_dcvc',
      youtube: 'https://youtube.com/@custom_dcvc'
    };

    const live = buildLiveOrgInfo(customSettings);

    assert.equal(live.name, 'Diversity Collective VC Official');
    assert.equal(live.tagline, 'Always Welcoming LGBTQ+ Ventura County');
    assert.equal(live.mission, 'Community-led advocacy and compassionate care for everyone.');
    assert.equal(live.ein, '99-1234567');
    assert.equal(live.caCorpNumber, 'C9999999');
    assert.equal(live.phone, '(805) 555-0199');
    assert.equal(live.phoneRaw, '+18055550199');
    assert.equal(live.email, 'hello@diversitycollective.org');
    assert.equal(live.hours, 'Mon–Thu 11:00 AM – 7:00 PM (Drop-ins Welcome)');
    assert.equal(live.address.full, '100 Main St, Suite 200, Ventura, CA 93001');
    assert.equal(live.address.googleMapsUrl, 'https://maps.google.com/?q=Ventura');
    assert.equal(live.voicemailOnly, true);
    assert.equal(live.bannerAlertActive, true);
    assert.equal(live.bannerAlertText, 'Special Community Forum This Friday at 6 PM');
    assert.equal(live.emergencyCrisisNotice, '24/7 Crisis Hotline: Dial 988');
    assert.equal(live.zeffyDonationUrl, 'https://www.zeffy.com/en-US/donation-form/custom-campaign-2026');
    assert.equal(live.zeffyGeneralUrl, 'https://www.zeffy.com/en-US/donation-form/custom-campaign-2026');
    assert.equal(live.socials.facebook, 'https://facebook.com/custom-dcvc');
    assert.equal(live.socials.instagram, 'https://instagram.com/custom_dcvc');
    assert.equal(live.socials.youtube, 'https://youtube.com/@custom_dcvc');
  });

  it('updates live settings via cmsStore.saveSettings and reflects immediately', () => {
    const original = cmsStore.getSettings();

    const patch = {
      phone: '(805) 999-8877',
      hours: 'Tuesday–Saturday 12 PM – 6 PM',
      bannerAlertActive: false,
      bannerAlertText: '',
      zeffyDonationUrl: 'https://www.zeffy.com/en-US/donation-form/donate-to-change-lives-30236'
    };

    const saved = cmsStore.saveSettings(patch);
    assert.equal(saved.phone, '(805) 999-8877');
    assert.equal(saved.hours, 'Tuesday–Saturday 12 PM – 6 PM');
    assert.equal(saved.bannerAlertActive, false);

    const live = buildLiveOrgInfo(cmsStore.getSettings());
    assert.equal(live.phone, '(805) 999-8877');
    assert.equal(live.phoneRaw, '+18059998877');
    assert.equal(live.hours, 'Tuesday–Saturday 12 PM – 6 PM');
    assert.equal(live.bannerAlertActive, false);
    assert.equal(live.zeffyDonationUrl, 'https://www.zeffy.com/en-US/donation-form/donate-to-change-lives-30236');
    assert.equal(live.zeffyGeneralUrl, 'https://www.zeffy.com/en-US/donation-form/donate-to-change-lives-30236');

    // Restore original settings
    cmsStore.saveSettings(original);
  });
});
