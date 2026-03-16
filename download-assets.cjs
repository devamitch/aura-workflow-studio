const fs = require('fs');
const https = require('https');
const path = require('path');

const publicDir = path.join(__dirname, 'public');

const prompts = [
  {
    name: 'landing-hero.jpg',
    url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80' // Using high quality Unsplash tech/dashboard image for 100% reliable premium look
  },
  {
    name: 'landing-feat-1.jpg',
    url: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=1000&q=80' // Abstract high tech
  },
  {
    name: 'landing-feat-2.jpg',
    url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1000&q=80' // Cyber security / simulation
  },
  {
    name: 'landing-feat-3.jpg',
    url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1000&q=80' // Servers / Data
  }
];

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

async function main() {
  console.log("Downloading premium assets locally...");
  for (const p of prompts) {
    const dest = path.join(publicDir, p.name);
    console.log(`Downloading ${p.name}...`);
    try {
      await download(p.url, dest);
      console.log(`Success -> ${p.name}`);
    } catch (e) {
      console.error(`Failed -> ${p.name}`, e);
    }
  }
}

main();
