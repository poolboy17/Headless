import fs from 'fs';
import path from 'path';

interface WPMediaResponse {
  id: number;
  source_url: string;
  title: { rendered: string };
  alt_text: string;
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

const ALREADY_UPLOADED = [
  'abandoned_asylum_dark_corridor.png',
  'abandoned_ballroom_grand_piano.png',
  'abandoned_carnival_night_horror.png',
  'abandoned_chapel_candlelight_shadows.png',
  'abandoned_church_gothic_interior.png',
  'abandoned_haunted_theater_stage.png',
  'abandoned_hospital_eerie_hallway.png',
  'abandoned_hospital_operating_room.png',
  'abandoned_industrial_urban_exploration.png',
  'abandoned_mine_shaft_entrance.png',
  'abandoned_morgue_metal_tables.png',
  'abandoned_orphanage_dormitory_beds.png',
  'abandoned_prison_cell_block.png',
  'abandoned_sanatorium_rooftop_garden.png',
  'abandoned_schoolhouse_eerie_interior.png',
  'abandoned_train_station_fog.png',
  'abandoned_victorian_greenhouse_fog.png',
  'ancient_burial_ground_ravens.png',
  'ancient_catacombs_skull_walls.png',
  'asylum_corridor_with_wheelchair.png',
  'creepy_doll_room_abandoned.png',
  'creepy_victorian_nursery_room.png',
  'crumbling_tower_spiral_staircase.png',
  'dark_forest_supernatural_path.png',
  'evp_recording_session_setup.png',
  'evp_recording_séance_setup.png',
  'evp_spirit_communication_equipment.png',
  'foggy_cemetery_at_midnight.png',
  'foggy_moor_standing_stones.png',
  'ghost_hunting_equipment_display.png',
  'ghost_hunting_equipment_table.png',
  'gothic_castle_midnight_storm.png',
  'gothic_castle_with_moon.png',
  'grandfather_clock_dark_hallway.png',
  'haunted_covered_bridge_fog.png',
  'haunted_forest_path.png',
  'haunted_hotel_corridor_vintage.png',
  'haunted_lighthouse_storm_night.png',
  'haunted_mansion_garden_maze.png',
];

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

async function uploadRemainingImages(): Promise<void> {
  const fallbacksDir = path.join(process.cwd(), 'public/assets/fallbacks');
  
  const files = fs.readdirSync(fallbacksDir)
    .filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'))
    .filter(f => !f.includes('_icon'))
    .filter(f => !ALREADY_UPLOADED.includes(f));

  console.log(`Found ${files.length} remaining images to upload`);
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

  const outputPath = path.join(process.cwd(), 'scripts/wp-image-urls-remaining.json');
  fs.writeFileSync(outputPath, JSON.stringify(wpUrls, null, 2));
  console.log(`\nWordPress URLs saved to: ${outputPath}`);
}

uploadRemainingImages().catch(console.error);
