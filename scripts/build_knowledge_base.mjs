import fs from 'fs';
import path from 'path';
import https from 'https';

const LOGOS_DIR = path.resolve('public/logos');
if (!fs.existsSync(LOGOS_DIR)) {
  fs.mkdirSync(LOGOS_DIR, { recursive: true });
}

function fetchJson(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'TheFloorTrainerBot/1.0 (https://thefloor.app; edu@thefloor.app)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

function downloadFile(url, destPath) {
  return new Promise((resolve) => {
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 500) {
      return resolve(true); // already downloaded
    }
    const file = fs.createWriteStream(destPath);
    https.get(url, { headers: { 'User-Agent': 'TheFloorTrainerBot/1.0 (https://thefloor.app; edu@thefloor.app)' } }, (res) => {
      if (res.statusCode === 200) {
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(true);
        });
      } else if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        if (res.headers.location) {
          downloadFile(res.headers.location, destPath).then(resolve);
        } else {
          resolve(false);
        }
      } else {
        file.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        resolve(false);
      }
    }).on('error', () => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      resolve(false);
    });
  });
}

async function getWikiThumbnail(title) {
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=600`;
  const data = await fetchJson(apiUrl);
  if (!data?.query?.pages) return null;
  const pages = Object.values(data.query.pages);
  if (pages.length > 0 && pages[0].thumbnail?.source) {
    return pages[0].thumbnail.source;
  }
  return null;
}

// Full items definition
const RAW_CATEGORIES = [
  {
    id: 'motorcycles',
    name: 'Motocykle',
    emoji: '🏍️',
    items: [
      { id: 'moto-ducati', name: 'Ducati', wiki: 'Ducati', aliases: ['ducati', 'dukati'] },
      { id: 'moto-harley', name: 'Harley-Davidson', wiki: 'Harley-Davidson', aliases: ['harley davidson', 'harley', 'hd', 'harlej'] },
      { id: 'moto-yamaha', name: 'Yamaha', wiki: 'Yamaha_Motor_Company', aliases: ['yamaha', 'jamaha'] },
      { id: 'moto-kawasaki', name: 'Kawasaki', wiki: 'Kawasaki_Heavy_Industries_Motorcycle_%26_Engine', aliases: ['kawasaki'] },
      { id: 'moto-bmw', name: 'BMW', wiki: 'BMW_Motorrad', aliases: ['bmw', 'bmw motorrad', 'beemka'] },
      { id: 'moto-ktm', name: 'KTM', wiki: 'KTM', aliases: ['ktm', 'ka te em'] },
      { id: 'moto-triumph', name: 'Triumph', wiki: 'Triumph_Motorcycles_Ltd', aliases: ['triumph', 'triumf'] },
      { id: 'moto-honda', name: 'Honda', wiki: 'Honda', aliases: ['honda'] },
      { id: 'moto-suzuki', name: 'Suzuki', wiki: 'Suzuki', aliases: ['suzuki'] },
      { id: 'moto-aprilia', name: 'Aprilia', wiki: 'Aprilia', aliases: ['aprilia', 'aprilla'] },
      { id: 'moto-motoguzzi', name: 'Moto Guzzi', wiki: 'Moto_Guzzi', aliases: ['moto guzzi', 'guzzi'] },
      { id: 'moto-husqvarna', name: 'Husqvarna', wiki: 'Husqvarna_Motorcycles', aliases: ['husqvarna', 'huskvarna'] },
      { id: 'moto-indian', name: 'Indian', wiki: 'Indian_Motocycle_Manufacturing_Company', aliases: ['indian', 'indian motorcycle'] },
      { id: 'moto-royalenfield', name: 'Royal Enfield', wiki: 'Royal_Enfield', aliases: ['royal enfield'] },
      { id: 'moto-vespa', name: 'Vespa', wiki: 'Vespa', aliases: ['vespa'] },
      { id: 'moto-mvagusta', name: 'MV Agusta', wiki: 'MV_Agusta', aliases: ['mv agusta', 'agusta'] },
      { id: 'moto-benelli', name: 'Benelli', wiki: 'Benelli_(motorcycles)', aliases: ['benelli'] },
      { id: 'moto-bimota', name: 'Bimota', wiki: 'Bimota', aliases: ['bimota'] },
      { id: 'moto-gasgas', name: 'GasGas', wiki: 'Gas_Gas', aliases: ['gas gas', 'gasgas'] },
      { id: 'moto-canam', name: 'Can-Am', wiki: 'Can-Am_motorcycles', aliases: ['can am', 'can-am'] },
      { id: 'moto-norton', name: 'Norton', wiki: 'Norton_Motorcycle_Company', aliases: ['norton'] },
      { id: 'moto-zero', name: 'Zero', wiki: 'Zero_Motorcycles', aliases: ['zero', 'zero motorcycles'] },
      { id: 'moto-piaggio', name: 'Piaggio', wiki: 'Piaggio', aliases: ['piaggio', 'piadżio'] },
      { id: 'moto-lambretta', name: 'Lambretta', wiki: 'Lambretta', aliases: ['lambretta'] },
      { id: 'moto-cfmoto', name: 'CFMOTO', wiki: 'CFMOTO', aliases: ['cfmoto', 'cf moto'] },
      { id: 'moto-ural', name: 'Ural', wiki: 'IMZ-Ural', aliases: ['ural'] },
      { id: 'moto-beta', name: 'Beta', wiki: 'Beta_(motorcycle_manufacturer)', aliases: ['beta'] },
      { id: 'moto-kymco', name: 'Kymco', wiki: 'Kymco', aliases: ['kymco', 'kimko'] },
      { id: 'moto-junak', name: 'Junak', wiki: 'SFM_Junak', aliases: ['junak'] }
    ]
  },
  {
    id: 'fashion',
    name: 'Moda Premium',
    emoji: '👗',
    items: [
      { id: 'fash-gucci', name: 'Gucci', wiki: 'Gucci', aliases: ['gucci', 'guczi'] },
      { id: 'fash-prada', name: 'Prada', wiki: 'Prada', aliases: ['prada'] },
      { id: 'fash-balenciaga', name: 'Balenciaga', wiki: 'Balenciaga', aliases: ['balenciaga', 'balensjaga'] },
      { id: 'fash-ysl', name: 'Saint Laurent', wiki: 'Yves_Saint_Laurent_(fashion_house)', aliases: ['saint laurent', 'ysl', 'yves saint laurent', 'sen loran'] },
      { id: 'fash-chanel', name: 'Chanel', wiki: 'Chanel', aliases: ['chanel', 'szanel'] },
      { id: 'fash-hermes', name: 'Hermès', wiki: 'Hermès', aliases: ['hermes', 'hermès'] },
      { id: 'fash-dior', name: 'Dior', wiki: 'Dior', aliases: ['dior', 'christian dior'] },
      { id: 'fash-versace', name: 'Versace', wiki: 'Versace', aliases: ['versace', 'wersacze'] },
      { id: 'fash-fendi', name: 'Fendi', wiki: 'Fendi', aliases: ['fendi'] },
      { id: 'fash-lv', name: 'Louis Vuitton', wiki: 'Louis_Vuitton', aliases: ['louis vuitton', 'lv', 'lui witon'] },
      { id: 'fash-burberry', name: 'Burberry', wiki: 'Burberry', aliases: ['burberry', 'barberi'] },
      { id: 'fash-bottega', name: 'Bottega Veneta', wiki: 'Bottega_Veneta', aliases: ['bottega veneta', 'bottega'] },
      { id: 'fash-jacquemus', name: 'Jacquemus', wiki: 'Jacquemus', aliases: ['jacquemus', 'żakmus'] },
      { id: 'fash-loewe', name: 'Loewe', wiki: 'Loewe_(fashion_brand)', aliases: ['loewe'] },
      { id: 'fash-celine', name: 'Celine', wiki: 'Celine_(brand)', aliases: ['celine', 'selin'] },
      { id: 'fash-valentino', name: 'Valentino', wiki: 'Valentino_(fashion_house)', aliases: ['valentino'] },
      { id: 'fash-givenchy', name: 'Givenchy', wiki: 'Givenchy', aliases: ['givenchy', 'żiwąszi'] },
      { id: 'fash-balmain', name: 'Balmain', wiki: 'Balmain_(fashion_house)', aliases: ['balmain', 'balmę'] },
      { id: 'fash-margiela', name: 'Maison Margiela', wiki: 'Maison_Margiela', aliases: ['maison margiela', 'margiela'] },
      { id: 'fash-dolce', name: 'Dolce & Gabbana', wiki: 'Dolce_%26_Gabbana', aliases: ['dolce gabbana', 'd&g', 'dolce i gabbana'] },
      { id: 'fash-mcqueen', name: 'Alexander McQueen', wiki: 'Alexander_McQueen_(brand)', aliases: ['alexander mcqueen', 'mcqueen'] },
      { id: 'fash-vivienne', name: 'Vivienne Westwood', wiki: 'Vivienne_Westwood', aliases: ['vivienne westwood', 'westwood'] },
      { id: 'fash-rickowens', name: 'Rick Owens', wiki: 'Rick_Owens', aliases: ['rick owens', 'owens'] },
      { id: 'fash-miumiu', name: 'Miu Miu', wiki: 'Miu_Miu', aliases: ['miu miu'] },
      { id: 'fash-schiaparelli', name: 'Schiaparelli', wiki: 'Elsa_Schiaparelli', aliases: ['schiaparelli', 'skiaparelli'] },
      { id: 'fash-offwhite', name: 'Off-White', wiki: 'Off-White_(company)', aliases: ['off white', 'off-white'] },
      { id: 'fash-moncler', name: 'Moncler', wiki: 'Moncler', aliases: ['moncler', 'monkler'] },
      { id: 'fash-rimowa', name: 'Rimowa', wiki: 'Rimowa', aliases: ['rimowa'] },
      { id: 'fash-louboutin', name: 'Christian Louboutin', wiki: 'Christian_Louboutin', aliases: ['louboutin', 'christian louboutin', 'lubutin'] },
      { id: 'fash-loropiana', name: 'Loro Piana', wiki: 'Loro_Piana', aliases: ['loro piana'] },
      { id: 'fash-goyard', name: 'Goyard', wiki: 'Goyard', aliases: ['goyard', 'gojar'] },
      { id: 'fash-cdg', name: 'Comme des Garçons', wiki: 'Comme_des_Garçons', aliases: ['comme des garcons', 'cdg', 'kom de garsą'] },
      { id: 'fash-cartier', name: 'Cartier', wiki: 'Cartier_(jeweler)', aliases: ['cartier', 'kartie'] },
      { id: 'fash-tiffany', name: 'Tiffany & Co.', wiki: 'Tiffany_%26_Co.', aliases: ['tiffany', 'tiffany & co'] }
    ]
  },
  {
    id: 'ai_tools',
    name: 'Loga AI',
    emoji: '🤖',
    items: [
      { id: 'ai-chatgpt', name: 'ChatGPT', wiki: 'ChatGPT', aliases: ['chatgpt', 'chat gpt', 'openai', 'czat gpt'] },
      { id: 'ai-claude', name: 'Claude', wiki: 'Claude_(language_model)', aliases: ['claude', 'anthropic', 'klod'] },
      { id: 'ai-midjourney', name: 'Midjourney', wiki: 'Midjourney', aliases: ['midjourney', 'mid dżurni'] },
      { id: 'ai-perplexity', name: 'Perplexity', wiki: 'Perplexity_AI', aliases: ['perplexity', 'perplexity ai'] },
      { id: 'ai-gemini', name: 'Gemini', wiki: 'Gemini_(chatbot)', aliases: ['gemini', 'google gemini', 'dżemini'] },
      { id: 'ai-copilot', name: 'GitHub Copilot', wiki: 'GitHub_Copilot', aliases: ['copilot', 'github copilot', 'kopilot'] },
      { id: 'ai-runway', name: 'Runway', wiki: 'Runway_(company)', aliases: ['runway', 'runway ml'] },
      { id: 'ai-elevenlabs', name: 'ElevenLabs', wiki: 'ElevenLabs', aliases: ['elevenlabs', 'eleven labs', 'ilewen labs'] },
      { id: 'ai-notion', name: 'Notion', wiki: 'Notion_(app)', aliases: ['notion', 'nouszyn'] },
      { id: 'ai-deepseek', name: 'DeepSeek', wiki: 'DeepSeek', aliases: ['deepseek', 'deep seek', 'dipsik'] },
      { id: 'ai-mistral', name: 'Mistral AI', wiki: 'Mistral_AI', aliases: ['mistral', 'mistral ai'] },
      { id: 'ai-suno', name: 'Suno', wiki: 'Suno_AI', aliases: ['suno', 'suno ai'] },
      { id: 'ai-udio', name: 'Udio', wiki: 'Udio', aliases: ['udio'] },
      { id: 'ai-stablediffusion', name: 'Stable Diffusion', wiki: 'Stable_Diffusion', aliases: ['stable diffusion', 'stability ai'] },
      { id: 'ai-huggingface', name: 'Hugging Face', wiki: 'Hugging_Face', aliases: ['hugging face', 'huggingface'] },
      { id: 'ai-grok', name: 'Grok', wiki: 'Grok_(chatbot)', aliases: ['grok', 'xai'] },
      { id: 'ai-sora', name: 'Sora', wiki: 'Sora_(text-to-video_model)', aliases: ['sora'] },
      { id: 'ai-cohere', name: 'Cohere', wiki: 'Cohere', aliases: ['cohere'] },
      { id: 'ai-synthesia', name: 'Synthesia', wiki: 'Synthesia_(company)', aliases: ['synthesia', 'syntezja'] },
      { id: 'ai-replit', name: 'Replit', wiki: 'Replit', aliases: ['replit'] },
      { id: 'ai-characterai', name: 'Character.ai', wiki: 'Character.ai', aliases: ['character ai', 'character.ai'] },
      { id: 'ai-cursor', name: 'Cursor', directUrl: 'https://cdn.simpleicons.org/cursor/6366f1', aliases: ['cursor', 'kursor'] },
      { id: 'ai-leonardo', name: 'Leonardo.ai', directUrl: 'https://cdn.simpleicons.org/leonardoai/f43f5e', aliases: ['leonardo', 'leonardo ai'] },
      { id: 'ai-v0', name: 'v0', directUrl: 'https://cdn.simpleicons.org/v0/000000', aliases: ['v0', 'fał zero'] }
    ]
  },
  {
    id: 'content_tools',
    name: 'Tworzenie kontentu',
    emoji: '🎬',
    items: [
      { id: 'cont-capcut', name: 'CapCut', wiki: 'CapCut', aliases: ['capcut', 'cap cut', 'kapkat'] },
      { id: 'cont-canva', name: 'Canva', wiki: 'Canva', aliases: ['canva', 'kanwa'] },
      { id: 'cont-premiere', name: 'Premiere Pro', wiki: 'Adobe_Premiere_Pro', aliases: ['premiere pro', 'premiere', 'adobe premiere', 'premier'] },
      { id: 'cont-photoshop', name: 'Photoshop', wiki: 'Adobe_Photoshop', aliases: ['photoshop', 'adobe photoshop', 'fotoszop'] },
      { id: 'cont-lightroom', name: 'Lightroom', wiki: 'Adobe_Lightroom', aliases: ['lightroom', 'lajtrium'] },
      { id: 'cont-figma', name: 'Figma', wiki: 'Figma', aliases: ['figma'] },
      { id: 'cont-davinci', name: 'DaVinci Resolve', wiki: 'DaVinci_Resolve', aliases: ['davinci resolve', 'davinci', 'dawinczi'] },
      { id: 'cont-finalcut', name: 'Final Cut Pro', wiki: 'Final_Cut_Pro', aliases: ['final cut', 'final cut pro', 'fcp'] },
      { id: 'cont-blender', name: 'Blender', wiki: 'Blender_(software)', aliases: ['blender'] },
      { id: 'cont-obs', name: 'OBS Studio', wiki: 'OBS_Studio', aliases: ['obs', 'obs studio'] },
      { id: 'cont-aftereffects', name: 'After Effects', wiki: 'Adobe_After_Effects', aliases: ['after effects', 'after', 'ae'] },
      { id: 'cont-illustrator', name: 'Illustrator', wiki: 'Adobe_Illustrator', aliases: ['illustrator', 'ai'] },
      { id: 'cont-audacity', name: 'Audacity', wiki: 'Audacity_(audio_editor)', aliases: ['audacity', 'odasiti'] },
      { id: 'cont-procreate', name: 'Procreate', wiki: 'Procreate_(software)', aliases: ['procreate', 'prokrejt'] },
      { id: 'cont-logicpro', name: 'Logic Pro', wiki: 'Logic_Pro', aliases: ['logic pro', 'logic'] },
      { id: 'cont-ableton', name: 'Ableton Live', wiki: 'Ableton_Live', aliases: ['ableton', 'ableton live'] },
      { id: 'cont-flstudio', name: 'FL Studio', wiki: 'FL_Studio', aliases: ['fl studio', 'fruity loops'] },
      { id: 'cont-cinema4d', name: 'Cinema 4D', wiki: 'Cinema_4D', aliases: ['cinema 4d', 'c4d'] },
      { id: 'cont-unreal', name: 'Unreal Engine', wiki: 'Unreal_Engine', aliases: ['unreal engine', 'unreal'] },
      { id: 'cont-unity', name: 'Unity', wiki: 'Unity_(game_engine)', aliases: ['unity'] },
      { id: 'cont-loom', name: 'Loom', wiki: 'Loom_(company)', aliases: ['loom'] }
    ]
  },
  {
    id: 'flags',
    name: 'Flagi',
    emoji: '🌍',
    items: [
      { id: 'flag-pl', name: 'Polska', flagCode: 'pl', aliases: ['polska', 'poland'] },
      { id: 'flag-de', name: 'Niemcy', flagCode: 'de', aliases: ['niemcy', 'germany'] },
      { id: 'flag-fr', name: 'Francja', flagCode: 'fr', aliases: ['francja', 'france'] },
      { id: 'flag-it', name: 'Włochy', flagCode: 'it', aliases: ['wlochy', 'włochy', 'italy'] },
      { id: 'flag-es', name: 'Hiszpania', flagCode: 'es', aliases: ['hiszpania', 'spain'] },
      { id: 'flag-jp', name: 'Japonia', flagCode: 'jp', aliases: ['japonia', 'japan'] },
      { id: 'flag-us', name: 'USA', flagCode: 'us', aliases: ['usa', 'stany zjednoczone', 'ameryka'] },
      { id: 'flag-gb', name: 'Wielka Brytania', flagCode: 'gb', aliases: ['wielka brytania', 'brytania', 'anglia', 'uk'] },
      { id: 'flag-br', name: 'Brazylia', flagCode: 'br', aliases: ['brazylia', 'brazil'] },
      { id: 'flag-ca', name: 'Kanada', flagCode: 'ca', aliases: ['kanada', 'canada'] },
      { id: 'flag-au', name: 'Australia', flagCode: 'au', aliases: ['australia'] },
      { id: 'flag-se', name: 'Szwecja', flagCode: 'se', aliases: ['szwecja', 'sweden'] },
      { id: 'flag-no', name: 'Norwegia', flagCode: 'no', aliases: ['norwegia', 'norway'] },
      { id: 'flag-is', name: 'Islandia', flagCode: 'is', aliases: ['islandia', 'iceland'] },
      { id: 'flag-dk', name: 'Dania', flagCode: 'dk', aliases: ['dania', 'denmark'] },
      { id: 'flag-fi', name: 'Finlandia', flagCode: 'fi', aliases: ['finlandia', 'finland'] },
      { id: 'flag-gr', name: 'Grecja', flagCode: 'gr', aliases: ['grecja', 'greece'] },
      { id: 'flag-ch', name: 'Szwajcaria', flagCode: 'ch', aliases: ['szwajcaria', 'switzerland'] },
      { id: 'flag-mx', name: 'Meksyk', flagCode: 'mx', aliases: ['meksyk', 'mexico'] },
      { id: 'flag-ar', name: 'Argentyna', flagCode: 'ar', aliases: ['argentyna', 'argentina'] },
      { id: 'flag-uy', name: 'Urugwaj', flagCode: 'uy', aliases: ['urugwaj', 'uruguay'] },
      { id: 'flag-mc', name: 'Monako', flagCode: 'mc', aliases: ['monako', 'monaco'] },
      { id: 'flag-id', name: 'Indonezja', flagCode: 'id', aliases: ['indonezja', 'indonesia'] },
      { id: 'flag-td', name: 'Czad', flagCode: 'td', aliases: ['czad', 'chad'] },
      { id: 'flag-ro', name: 'Rumunia', flagCode: 'ro', aliases: ['rumunia', 'romania'] },
      { id: 'flag-ie', name: 'Irlandia', flagCode: 'ie', aliases: ['irlandia', 'ireland'] },
      { id: 'flag-ci', name: 'Wybrzeże Kości Słoniowej', flagCode: 'ci', aliases: ['wybrzeze kosci sloniowej', 'wybrzeże kości słoniowej', 'wks'] },
      { id: 'flag-nl', name: 'Holandia', flagCode: 'nl', aliases: ['holandia', 'netherlands'] },
      { id: 'flag-lu', name: 'Luksemburg', flagCode: 'lu', aliases: ['luksemburg', 'luxembourg'] },
      { id: 'flag-jm', name: 'Jamajka', flagCode: 'jm', aliases: ['jamajka', 'jamaica'] },
      { id: 'flag-np', name: 'Nepal', flagCode: 'np', aliases: ['nepal'] },
      { id: 'flag-sc', name: 'Seszele', flagCode: 'sc', aliases: ['seszele', 'seychelles'] },
      { id: 'flag-bt', name: 'Bhutan', flagCode: 'bt', aliases: ['bhutan', 'butan'] },
      { id: 'flag-kz', name: 'Kazachstan', flagCode: 'kz', aliases: ['kazachstan', 'kazakhstan'] },
      { id: 'flag-kg', name: 'Kirgistan', flagCode: 'kg', aliases: ['kirgistan', 'kyrgyzstan'] },
      { id: 'flag-za', name: 'RPA', flagCode: 'za', aliases: ['rpa', 'republika poludniowej afryki'] },
      { id: 'flag-sm', name: 'San Marino', flagCode: 'sm', aliases: ['san marino'] },
      { id: 'flag-va', name: 'Watykan', flagCode: 'va', aliases: ['watykan', 'vatican'] },
      { id: 'flag-kr', name: 'Korea Południowa', flagCode: 'kr', aliases: ['korea poludniowa', 'korea południowa', 'korea'] },
      { id: 'flag-kp', name: 'Korea Północna', flagCode: 'kp', aliases: ['korea polnocna', 'korea północna'] }
    ]
  }
];

async function main() {
  console.log('🚀 Rozpoczynam pobieranie bazy wiedzy i oryginalnych logotypów...');
  const finalCategories = [];

  for (const cat of RAW_CATEGORIES) {
    console.log(`\n📂 Kategoria: ${cat.name} (${cat.items.length} pozycji)`);
    const finalItems = [];

    for (const item of cat.items) {
      const fileName = `${item.id}.png`;
      const localFilePath = path.join(LOGOS_DIR, fileName);
      const publicPath = `/logos/${fileName}`;
      let downloaded = false;
      let remoteUrl = null;

      if (item.flagCode) {
        remoteUrl = `https://flagcdn.com/w640/${item.flagCode}.png`;
        downloaded = await downloadFile(remoteUrl, localFilePath);
      } else if (item.directUrl) {
        remoteUrl = item.directUrl;
        downloaded = await downloadFile(remoteUrl, localFilePath);
      } else if (item.wiki) {
        const thumbUrl = await getWikiThumbnail(item.wiki);
        if (thumbUrl) {
          remoteUrl = thumbUrl;
          downloaded = await downloadFile(thumbUrl, localFilePath);
        }
      }

      // If downloaded successfully, use local path, otherwise keep remote URL
      const finalImageUrl = downloaded ? publicPath : (remoteUrl || '');
      console.log(`  ${downloaded ? '✅' : '⚠️'} ${item.name} -> ${finalImageUrl}`);

      finalItems.push({
        id: item.id,
        name: item.name,
        aliases: item.aliases,
        imageUrl: finalImageUrl
      });
    }

    finalCategories.push({
      id: cat.id,
      name: cat.name,
      emoji: cat.emoji,
      items: finalItems
    });
  }

  // Write out to src/data/categories.js
  const fileContent = `// Obszerna baza wiedzy The Floor - ${finalCategories.reduce((s, c) => s + c.items.length, 0)} sprawdzonych pozycji
export const DEFAULT_CATEGORIES = ${JSON.stringify(finalCategories, null, 2)};

export function normalizeAnswer(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

export function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export function checkAnswerMatch(input, item) {
  if (!input || !item) return false;
  const normInput = normalizeAnswer(input);
  if (!normInput || normInput.length < 2) return false;

  const validOptions = [item.name, ...(item.aliases || [])];
  
  for (const opt of validOptions) {
    const normOpt = normalizeAnswer(opt);
    if (!normOpt) continue;

    if (normInput === normOpt) return true;
    if (normInput.includes(normOpt) && normOpt.length >= 3) return true;
    if (normOpt.length >= 5 && normOpt.includes(normInput) && normInput.length >= 4) return true;

    const maxDistance = normOpt.length > 7 ? 2 : normOpt.length > 4 ? 1 : 0;
    if (maxDistance > 0 && Math.abs(normInput.length - normOpt.length) <= maxDistance) {
      if (levenshteinDistance(normInput, normOpt) <= maxDistance) {
        return true;
      }
    }
  }

  return false;
}
`;

  fs.writeFileSync(path.resolve('src/data/categories.js'), fileContent, 'utf8');
  console.log(`\n🎉 Gotowe! Zapisano ${finalCategories.reduce((s, c) => s + c.items.length, 0)} haseł do src/data/categories.js.`);
}

main();
