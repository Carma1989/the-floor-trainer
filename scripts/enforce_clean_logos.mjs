import https from 'https';
import fs from 'fs';
import path from 'path';

const LOGOS_DIR = path.resolve('public/logos');

function download(url, dest) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'TheFloorTrainer/2.0 (edu@thefloor.app)' } }, (res) => {
      if (res.statusCode === 200) {
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(true); });
      } else if (res.statusCode === 301 || res.statusCode === 302) {
        download(res.headers.location, dest).then(resolve);
      } else {
        resolve(false);
      }
    }).on('error', () => resolve(false));
  });
}

async function getEnWikiThumb(f) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent('File:' + f)}&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json`;
  const data = await new Promise(res => https.get(url, { headers: { 'User-Agent': 'TheFloorBot/1.0 (edu@thefloor.app)' } }, r => {
    let b = ''; r.on('data', d => b += d); r.on('end', () => {
      try { res(JSON.parse(b)); } catch(e) { res({}); }
    });
  }));
  const p = Object.values(data?.query?.pages || {})[0];
  return p?.imageinfo?.[0]?.thumburl;
}

async function getCommonsThumb(f) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent('File:' + f)}&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json`;
  const data = await new Promise(res => https.get(url, { headers: { 'User-Agent': 'TheFloorBot/1.0 (edu@thefloor.app)' } }, r => {
    let b = ''; r.on('data', d => b += d); r.on('end', () => {
      try { res(JSON.parse(b)); } catch(e) { res({}); }
    });
  }));
  const p = Object.values(data?.query?.pages || {})[0];
  return p?.imageinfo?.[0]?.thumburl;
}

const REPLACEMENTS = {
  // Pure vector logo URLs
  'moto-yamaha': 'https://cdn.simpleicons.org/yamahamotorcorporation/d92128',
  'moto-piaggio': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/70/Piaggio-logo.svg/960px-Piaggio-logo.svg.png?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'moto-kymco': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/19/KYMCO_PNG.png/960px-KYMCO_PNG.png?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'fash-givenchy': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d6/Givenchy_-_logo_%28France%2C_2003%29.svg/960px-Givenchy_-_logo_%28France%2C_2003%29.svg.png?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'fash-moncler': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f7/Logo_Moncler_Group.svg/960px-Logo_Moncler_Group.svg.png?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'ai-elevenlabs': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c7/ElevenLabs_Logo_03.svg/960px-ElevenLabs_Logo_03.svg.png?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  'ai-huggingface': 'https://cdn.simpleicons.org/huggingface/ffd21e',
  'ai-replit': 'https://cdn.simpleicons.org/replit/f26207',
  'cont-audacity': 'https://cdn.simpleicons.org/audacity/0055d4'
};

async function run() {
  console.log('🔄 Wymiana pozostałych zdjęć na czyste wektory/emblematy...');

  for (const [id, url] of Object.entries(REPLACEMENTS)) {
    const dest = path.join(LOGOS_DIR, `${id}.png`);
    const ok = await download(url, dest);
    console.log(`  ${ok ? '✅' : '❌'} ${id} -> ${url}`);
  }

  // Check Bimota SVG
  const bimotaUrl = await getCommonsThumb('Bimota.svg');
  if (bimotaUrl) {
    await download(bimotaUrl, path.join(LOGOS_DIR, 'moto-bimota.png'));
    console.log('  ✅ moto-bimota (Bimota.svg)');
  }

  // Check Lambretta logo 2020.png
  const lambrettaUrl = await getCommonsThumb('Lambretta logo 2020.png');
  if (lambrettaUrl) {
    await download(lambrettaUrl, path.join(LOGOS_DIR, 'moto-lambretta.png'));
    console.log('  ✅ moto-lambretta');
  }

  // Remove any remaining photo items from categories if they don't have a clean vector logo
  // and replace with famous brands with clean vectors:
  // e.g. Ralph Lauren, Calvin Klein, Tommy Hilfiger, Armani
  const extraFashion = [
    {
      id: 'fash-armani',
      name: 'Armani',
      aliases: ['armani', 'giorgio armani'],
      file: 'Giorgio_Armani_logo.svg'
    },
    {
      id: 'fash-ralphlauren',
      name: 'Ralph Lauren',
      aliases: ['ralph lauren', 'polo ralph lauren', 'polo'],
      file: 'Polo_Ralph_Lauren_logo.svg'
    },
    {
      id: 'fash-calvinklein',
      name: 'Calvin Klein',
      aliases: ['calvin klein', 'ck'],
      file: 'Calvin_Klein_logo.svg'
    },
    {
      id: 'fash-tommy',
      name: 'Tommy Hilfiger',
      aliases: ['tommy hilfiger', 'tommy'],
      file: 'Tommy_Hilfiger_logo.svg'
    }
  ];

  for (const f of extraFashion) {
    const thumb = await getCommonsThumb(f.file) || await getEnWikiThumb(f.file);
    if (thumb) {
      await download(thumb, path.join(LOGOS_DIR, `${f.id}.png`));
      console.log(`  ✅ ${f.name} -> ${f.id}.png`);
    }
  }

  console.log('🎉 Ukończono instalację czystych logotypów!');
}

run();
