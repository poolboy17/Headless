import fs from 'fs';
import path from 'path';

interface WPMediaResponse {
  id: number;
  source_url: string;
  title: { rendered: string };
  alt_text: string;
  media_details?: {
    width: number;
    height: number;
    sizes?: Record<string, { source_url: string; width: number; height: number }>;
  };
}

interface UploadResult {
  filename: string;
  success: boolean;
  wpId?: number;
  wpUrl?: string;
  error?: string;
}

const WORDPRESS_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://wp.cursedtours.com';
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

async function uploadImageToWordPress(
  filePath: string,
  title: string,
  altText: string
): Promise<WPMediaResponse> {
  if (!WP_USERNAME || !WP_APP_PASSWORD) {
    throw new Error('WP_USERNAME and WP_APP_PASSWORD environment variables are required');
  }

  const filename = path.basename(filePath);
  const fileBuffer = fs.readFileSync(filePath);
  const mimeType = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';

  const authHeader = 'Basic ' + Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

  const response = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/media`, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': mimeType,
    },
    body: fileBuffer,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed (${response.status}): ${errorText}`);
  }

  const data = await response.json() as WPMediaResponse;

  if (altText && data.id) {
    await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/media/${data.id}`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        alt_text: altText,
        title: title,
      }),
    });
  }

  return data;
}

async function uploadAllFallbackImages(): Promise<void> {
  const fallbacksDir = path.join(process.cwd(), 'public/assets/fallbacks');
  
  if (!fs.existsSync(fallbacksDir)) {
    console.error('Fallbacks directory not found:', fallbacksDir);
    process.exit(1);
  }

  const files = fs.readdirSync(fallbacksDir)
    .filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'))
    .filter(f => !f.includes('_icon')); // Skip icon files

  console.log(`Found ${files.length} images to upload`);
  console.log(`WordPress URL: ${WORDPRESS_URL}`);
  console.log(`Username: ${WP_USERNAME}`);
  console.log('---');

  const results: UploadResult[] = [];
  const wpUrls: Record<string, string> = {};

  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const filePath = path.join(fallbacksDir, filename);
    
    const title = filename
      .replace(/\.(png|jpg|jpeg)$/, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
    
    const altText = title;

    console.log(`[${i + 1}/${files.length}] Uploading: ${filename}`);

    try {
      const response = await uploadImageToWordPress(filePath, title, altText);
      results.push({
        filename,
        success: true,
        wpId: response.id,
        wpUrl: response.source_url,
      });
      wpUrls[filename] = response.source_url;
      console.log(`  -> Success! ID: ${response.id}`);
      console.log(`  -> URL: ${response.source_url}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.push({
        filename,
        success: false,
        error: errorMessage,
      });
      console.error(`  -> Failed: ${errorMessage}`);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n--- SUMMARY ---');
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`Successful: ${successful.length}`);
  console.log(`Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log('\nFailed uploads:');
    failed.forEach(f => console.log(`  - ${f.filename}: ${f.error}`));
  }

  const outputPath = path.join(process.cwd(), 'scripts/wp-image-urls.json');
  fs.writeFileSync(outputPath, JSON.stringify(wpUrls, null, 2));
  console.log(`\nWordPress URLs saved to: ${outputPath}`);

  const inlineImagesCode = generateInlineImagesCode(wpUrls);
  const codePath = path.join(process.cwd(), 'scripts/inline-images-code.ts');
  fs.writeFileSync(codePath, inlineImagesCode);
  console.log(`Generated INLINE_IMAGES code saved to: ${codePath}`);
}

function generateInlineImagesCode(wpUrls: Record<string, string>): string {
  const categories: Record<string, Array<{ url: string; alt: string }>> = {
    'abandoned-asylums-hospitals': [],
    'haunted-castles-estates': [],
    'ghost-hunting-techniques-tools': [],
    'historical-hauntings-insights': [],
    'urban-exploration-paranormal': [],
    'default': [],
  };

  const categoryMappings: Record<string, string[]> = {
    'abandoned-asylums-hospitals': [
      'asylum', 'hospital', 'psychiatric', 'mental_institution', 'morgue', 
      'orphanage', 'sanatorium', 'operating_room', 'ward'
    ],
    'haunted-castles-estates': [
      'castle', 'mansion', 'ballroom', 'staircase', 'attic', 'tower', 
      'victorian', 'grandfather_clock', 'mirror', 'nursery', 'piano', 'maze'
    ],
    'ghost-hunting-techniques-tools': [
      'ghost_hunting', 'investigator', 'emf', 'evp', 'thermal', 'equipment',
      'seance', 'darkroom', 'ouija'
    ],
    'historical-hauntings-insights': [
      'catacombs', 'chapel', 'burial', 'moor', 'standing_stones', 
      'apothecary', 'crypt', 'church', 'historical', 'sepia'
    ],
    'urban-exploration-paranormal': [
      'industrial', 'hotel', 'doll', 'theater', 'train_station', 'prison',
      'carnival', 'schoolhouse', 'mine', 'greenhouse', 'wine_cellar', 'library'
    ],
  };

  for (const [filename, url] of Object.entries(wpUrls)) {
    const altText = filename
      .replace(/\.(png|jpg|jpeg)$/, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());

    let assigned = false;
    for (const [category, keywords] of Object.entries(categoryMappings)) {
      if (keywords.some(kw => filename.toLowerCase().includes(kw))) {
        categories[category].push({ url, alt: altText });
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      categories['default'].push({ url, alt: altText });
    }
  }

  let code = `const INLINE_IMAGES: Record<string, Array<{ url: string; alt: string }>> = {\n`;
  
  for (const [category, images] of Object.entries(categories)) {
    if (images.length > 0) {
      code += `  '${category}': [\n`;
      for (const img of images) {
        code += `    { url: '${img.url}', alt: '${img.alt}' },\n`;
      }
      code += `  ],\n`;
    }
  }
  
  code += `};\n`;
  
  return code;
}

uploadAllFallbackImages().catch(console.error);
