import https from 'https';
import fs from 'fs';
import path from 'path';

const LOGOS_DIR = path.resolve('public/logos');

function getCommonsThumbUrl(fileName) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent('File:' + fileName)}&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json`;
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'TheFloorTrainerBot/2.0 (edu@thefloor.app)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const page = Object.values(json?.query?.pages || {})[0];
          const thumb = page?.imageinfo?.[0]?.thumburl || page?.imageinfo?.[0]?.url;
          resolve(thumb || null);
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

function download(url, dest) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'TheFloorTrainerBot/2.0 (edu@thefloor.app)' } }, (res) => {
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

// Map of EVERY brand to its exact official pure vector logo file on Wikimedia Commons
const PURE_LOGO_FILES = {
  // MOTOCYKLE (Same emblematy i loga)
  'moto-ducati': 'Ducati_red_logo.svg',
  'moto-harley': 'Harley-Davidson_logo.svg',
  'moto-yamaha': 'Yamaha_Motor_logo_(red).svg',
  'moto-kawasaki': 'Kawasaki-logo.svg',
  'moto-bmw': 'BMW.svg',
  'moto-ktm': 'KTM-Logo.svg',
  'moto-triumph': 'Triumph_Motorcycles_logo_and_claim_2015.svg',
  'moto-honda': 'Honda_Logo.svg',
  'moto-suzuki': 'Suzuki_logo_2.svg',
  'moto-aprilia': 'Aprilia-logo.svg',
  'moto-motoguzzi': 'Moto_Guzzi_logo.png',
  'moto-husqvarna': 'Husqvarna_logo.svg',
  'moto-indian': 'Indian_Motorcycle_logo.svg',
  'moto-royalenfield': 'Royal_Enfield_logo.svg',
  'moto-vespa': 'Vespa-logo.svg',
  'moto-mvagusta': 'MV_Agusta_Logo.svg',
  'moto-bimota': 'Bimota_Logo.svg',
  'moto-norton': 'Norton_Motorcycle_Company_logo.svg',
  'moto-zero': 'Zero_Motorcycles_logo.svg',
  'moto-piaggio': 'Piaggio_logo.svg',
  'moto-lambretta': 'Lambretta_logo.svg',
  'moto-cfmoto': 'CFMOTO_Logo.svg',
  'moto-ural': 'IMZ-Ural_logo.svg',
  'moto-beta': 'Beta_Motor_logo.svg',
  'moto-kymco': 'Kymco_logo.svg',
  'moto-junak': 'Junak_logo.png',

  // MODA PREMIUM (Czyste logotypy i monogramy, ZERO sklepów)
  'fash-gucci': 'Gucci_logo.svg',
  'fash-prada': 'Prada-Logo.svg',
  'fash-balenciaga': 'Balenciaga_Logo.svg',
  'fash-ysl': 'Saint_Laurent_Paris_SVG_Logo.svg',
  'fash-chanel': 'Chanel_logo.svg',
  'fash-hermes': 'Hermès_logo.svg',
  'fash-dior': 'Dior_Logo.svg',
  'fash-versace': 'Versace_logo.svg',
  'fash-fendi': 'Fendi_logo.svg',
  'fash-lv': 'Louis_Vuitton_logo_and_wordmark.svg',
  'fash-burberry': 'Burberry_Logo_Subline.svg',
  'fash-bottega': 'Logo_Bottega_Veneta.svg',
  'fash-jacquemus': 'Logo-Jacquemus.svg',
  'fash-loewe': 'Loewe_logo.svg',
  'fash-celine': 'Celine_logo.svg',
  'fash-valentino': 'Valentino_logo.svg',
  'fash-givenchy': 'Givenchy_Logo.svg',
  'fash-balmain': 'Balmain_logo.svg',
  'fash-margiela': 'Maison_Margiela_logo.svg',
  'fash-dolce': 'Dolce_&_Gabbana_-_logo_(Italy,_1985-).svg',
  'fash-mcqueen': 'Alexander_McQueen_logo.svg',
  'fash-vivienne': 'VivienneWestwood.svg',
  'fash-rickowens': 'Rick_Owens_logo.svg',
  'fash-miumiu': 'Miu_Miu_-_logo_(Italy,_1993).svg',
  'fash-schiaparelli': 'Schiaparelli_logo.svg',
  'fash-offwhite': 'Off-White_Logo.svg',
  'fash-moncler': 'Moncler_logo.svg',
  'fash-rimowa': 'Rimowa_logo.svg',
  'fash-louboutin': 'Christian_Louboutin_logo.svg',
  'fash-loropiana': 'Loro_Piana_logo.png',
  'fash-goyard': 'Goyard_logo.svg',
  'fash-cdg': 'Comme_des_Garcons_logo.svg',
  'fash-cartier': 'Cartier_logo.svg',

  // AI (Logotypy narzędzi)
  'ai-chatgpt': 'ChatGPT_logo.svg',
  'ai-claude': 'Anthropic_logo.svg',
  'ai-midjourney': 'Midjourney_Emblem.png',
  'ai-perplexity': 'Perplexity_AI_logo.svg',
  'ai-gemini': 'Google_Gemini_logo.svg',
  'ai-copilot': 'GitHub_Copilot_logo.svg',
  'ai-runway': 'Runway_Black_Logo_SVG.svg',
  'ai-elevenlabs': 'ElevenLabs_logo.svg',
  'ai-notion': 'Notion-logo.svg',
  'ai-deepseek': 'DeepSeek_logo.svg',
  'ai-mistral': 'Mistral_AI_logo.svg',
  'ai-suno': 'Suno_logo.svg',
  'ai-huggingface': 'Hugging_Face_logo.svg',
  'ai-grok': 'Grok_logo.svg',
  'ai-sora': 'OpenAI_Logo.svg',
  'ai-cohere': 'Cohere-Logo.png',
  'ai-synthesia': 'Synthesia_Logo_2024.png',
  'ai-replit': 'Replit_Logo.svg',
  'ai-characterai': 'Character.ai_2025_vector_logo.svg',

  // KONTENT (Same ikony i loga aplikacji)
  'cont-capcut': 'Capcut-icon.svg',
  'cont-canva': 'Canva_Logo.svg',
  'cont-premiere': 'Adobe_Premiere_Pro_CC_icon.svg',
  'cont-photoshop': 'Adobe_Photoshop_CC_icon.svg',
  'cont-lightroom': 'Adobe_Photoshop_Lightroom_CC_logo.svg',
  'cont-figma': 'Figma-logo.svg',
  'cont-davinci': 'DaVinci_Resolve_Studio.png',
  'cont-finalcut': 'Final_Cut_Pro_X_Logo.svg',
  'cont-blender': 'Blender_logo_no_text.svg',
  'cont-obs': 'OBS_Studio_Logo.svg',
  'cont-aftereffects': 'Adobe_After_Effects_CC_icon.svg',
  'cont-illustrator': 'Adobe_Illustrator_CC_icon.svg',
  'cont-audacity': 'Audacity_Logo_no_text.svg',
  'cont-procreate': 'Procreate_logo.png',
  'cont-ableton': 'Ableton_Live_Logo.svg',
  'cont-flstudio': 'FL_Studio_Logo_Wordmark.svg',
  'cont-unreal': 'Unreal_Engine_Logo.svg',
  'cont-unity': 'Unity_Technologies_logo.svg'
};

async function main() {
  console.log('🚀 Pobieram wyłącznie CZYSTE, ODOSOBNIONE LOGOTYPY (zero sklepów!)...');

  let successCount = 0;
  for (const [id, fileName] of Object.entries(PURE_LOGO_FILES)) {
    const thumbUrl = await getCommonsThumbUrl(fileName);
    const dest = path.join(LOGOS_DIR, `${id}.png`);
    if (thumbUrl) {
      const ok = await download(thumbUrl, dest);
      if (ok) {
        successCount++;
        console.log(`  ✅ [${id}] ${fileName} -> OK`);
      } else {
        console.log(`  ❌ [${id}] Błąd pobierania: ${thumbUrl}`);
      }
    } else {
      console.log(`  ⚠️ [${id}] Brak pliku na Commons: ${fileName}`);
    }
  }

  console.log(`\n🎉 Gotowe! Pobrane czyste logotypy: ${successCount} / ${Object.keys(PURE_LOGO_FILES).length}`);
}

main();
