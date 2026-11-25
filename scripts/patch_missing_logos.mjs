import fs from 'fs';
import path from 'path';
import https from 'https';

const LOGOS_DIR = path.resolve('public/logos');

function download(url, dest) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      if (res.statusCode === 200) {
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(true); });
      } else if (res.statusCode === 301 || res.statusCode === 302) {
        if (res.headers.location) {
          download(res.headers.location, dest).then(resolve);
        } else {
          resolve(false);
        }
      } else {
        resolve(false);
      }
    }).on('error', () => resolve(false));
  });
}

const DIRECT_URLS = {
  // Motocykle
  'moto-bmw': 'https://cdn.simpleicons.org/bmw/0066b1',
  'moto-kawasaki': 'https://cdn.simpleicons.org/kawasaki/69be28',
  'moto-indian': 'https://cdn.simpleicons.org/polaris/991b1b',
  'moto-benelli': 'https://cdn.simpleicons.org/benelli/059669',
  'moto-gasgas': 'https://cdn.simpleicons.org/gasgas/e11d48',
  'moto-canam': 'https://cdn.simpleicons.org/brp/f59e0b',
  'moto-cfmoto': 'https://cdn.simpleicons.org/cfmoto/0284c7',

  // Moda
  'fash-jacquemus': 'https://cdn.simpleicons.org/jacquemus/000000',
  'fash-dolce': 'https://cdn.simpleicons.org/dolcegabbana/000000',
  'fash-mcqueen': 'https://cdn.simpleicons.org/alexandermcqueen/000000',
  'fash-miumiu': 'https://cdn.simpleicons.org/miumiu/000000',
  'fash-offwhite': 'https://cdn.simpleicons.org/offwhite/000000',
  'fash-rimowa': 'https://cdn.simpleicons.org/rimowa/000000',
  'fash-loropiana': 'https://cdn.simpleicons.org/loropiana/475569',
  'fash-cartier': 'https://cdn.simpleicons.org/cartier/991b1b',
  'fash-tiffany': 'https://cdn.simpleicons.org/tiffanyandco/00a89d',

  // AI
  'ai-claude': 'https://cdn.simpleicons.org/anthropic/d97706',
  'ai-gemini': 'https://cdn.simpleicons.org/googlegemini/3b82f6',
  'ai-perplexity': 'https://cdn.simpleicons.org/perplexity/0d9488',
  'ai-copilot': 'https://cdn.simpleicons.org/githubcopilot/6e40c9',
  'ai-runway': 'https://cdn.simpleicons.org/runway/ec4899',
  'ai-notion': 'https://cdn.simpleicons.org/notion/000000',
  'ai-deepseek': 'https://cdn.simpleicons.org/deepseek/0284c7',
  'ai-huggingface': 'https://cdn.simpleicons.org/huggingface/ffd21e',
  'ai-cohere': 'https://cdn.simpleicons.org/cohere/f43f5e',
  'ai-synthesia': 'https://cdn.simpleicons.org/synthesia/2563eb',
  'ai-sora': 'https://cdn.simpleicons.org/openai/000000',
  'ai-suno': 'https://cdn.simpleicons.org/suno/ef4444',
  'ai-midjourney': 'https://cdn.simpleicons.org/midjourney/0284c7',
  'ai-characterai': 'https://cdn.simpleicons.org/characterai/000000',
  'ai-leonardo': 'https://cdn.simpleicons.org/leonardoai/f43f5e',

  // Kontent
  'cont-figma': 'https://cdn.simpleicons.org/figma/f24e1e',
  'cont-premiere': 'https://cdn.simpleicons.org/adobepremierepro/9999ff',
  'cont-capcut': 'https://cdn.simpleicons.org/capcut/000000',
  'cont-finalcut': 'https://cdn.simpleicons.org/apple/000000',
  'cont-procreate': 'https://cdn.simpleicons.org/procreate/000000',
  'cont-logicpro': 'https://cdn.simpleicons.org/apple/000000',
  'cont-ableton': 'https://cdn.simpleicons.org/abletonlive/000000',
  'cont-flstudio': 'https://cdn.simpleicons.org/flstudio/ea580c',
  'cont-cinema4d': 'https://cdn.simpleicons.org/cinema4d/0284c7',
  'cont-loom': 'https://cdn.simpleicons.org/loom/625df5'
};

async function patch() {
  console.log('🔄 Uzupełnianie brakujących logotypów...');
  for (const [id, url] of Object.entries(DIRECT_URLS)) {
    const dest = path.join(LOGOS_DIR, `${id}.png`);
    const ok = await download(url, dest);
    console.log(`  ${ok ? '✅' : '❌'} ${id} (${url})`);
  }

  // Update src/data/categories.js to ensure all items have local /logos/<id>.png
  const categoriesFile = path.resolve('src/data/categories.js');
  let content = fs.readFileSync(categoriesFile, 'utf8');

  // Replace any empty imageUrl with /logos/<id>.png if file exists
  const files = fs.readdirSync(LOGOS_DIR);
  for (const file of files) {
    const id = path.basename(file, path.extname(file));
    const publicUrl = `/logos/${file}`;
    // Find item with this id and replace its imageUrl
    const regex = new RegExp(`("id":\\s*"${id}"[\\s\\S]*?"imageUrl":\\s*")([^"]*)(")`, 'g');
    content = content.replace(regex, `$1${publicUrl}$3`);
  }

  fs.writeFileSync(categoriesFile, content, 'utf8');
  console.log('🎉 Baza zaktualizowana!');
}

patch();
