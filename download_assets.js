import fs from 'fs';
import https from 'https';
import http from 'http';
import path from 'path';

const assets = {
  'logo-square.png': 'https://www.diversitycollectivevc.org/wp-content/uploads/2018/12/diversity-collective-logo-2024.png',
  'crc-building.jpg': 'https://www.diversitycollectivevc.org/wp-content/uploads/2020/04/community_resource_web.jpg',
  'shines-logo.jpg': 'https://www.diversitycollectivevc.org/wp-content/uploads/2023/09/DiversityShines_Logo-300px-300x300.jpg',
  'shines-screening.jpg': 'https://www.diversitycollectivevc.org/wp-content/uploads/2025/02/Shines-screening-2025.jpg',
  'volunteers.jpg': 'https://www.diversitycollectivevc.org/wp-content/uploads/2020/08/74229588_3269190849779173_6067963620758004961_o.jpg',
  'little-unicorns.png': 'https://www.diversitycollectivevc.org/wp-content/uploads/2023/06/Untitled-design.png',
  'pride-prom.jpeg': 'https://www.diversitycollectivevc.org/wp-content/uploads/2026/04/pridepromposter-960x1200.jpeg',
  'botanical-flyer.jpg': 'https://www.diversitycollectivevc.org/wp-content/uploads/bb-plugin/cache/botannical-flyer-custom_crop.jpg',
  'vcbh-logo.jpg': 'https://www.diversitycollectivevc.org/wp-content/uploads/2020/06/VCBH-Logo-2020-500x293.jpg',
  'vcph-logo.png': 'https://www.diversitycollectivevc.org/wp-content/uploads/2024/03/VCPH-2.png',
  'accessibility-badge.png': 'https://www.diversitycollectivevc.org/wp-content/uploads/2024/03/Accessibility-icon-Purple-2.png',
  'hero-community.jpg': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1400&q=85',
  'community-gathering.jpg': 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=85',
  'youth-umbrella.jpg': 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=1400&q=85',
  'ventura-coast.jpg': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=85'
};

const dir = path.join(process.cwd(), 'public', 'images');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

function download(filename, url) {
  return new Promise((resolve) => {
    const dest = path.join(dir, filename);
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(filename, res.headers.location).then(resolve);
      }
      if (res.statusCode !== 200) {
        console.log(`Failed ${filename}: HTTP ${res.statusCode}`);
        return resolve();
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Saved: ${filename}`);
        resolve();
      });
    });
    req.on('error', (err) => {
      console.log(`Error ${filename}: ${err.message}`);
      resolve();
    });
    req.setTimeout(12000, () => {
      req.destroy();
      console.log(`Timeout ${filename}`);
      resolve();
    });
  });
}

async function run() {
  for (const [fn, url] of Object.entries(assets)) {
    await download(fn, url);
  }
  console.log('Done downloading assets');
}

run();
