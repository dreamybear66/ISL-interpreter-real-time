import fs from 'fs';
import path from 'path';

const METADATA_PATH = path.join(process.cwd(), 'backend', 'src', 'data', 'raw', 'WLASL_v0.3.json');
const VIDEOS_DIR = path.join(process.cwd(), 'backend', 'public', 'videos');
const DB_JSON_PATH = path.join(process.cwd(), 'backend', 'src', 'data', 'signs.json');
const BASE_URL = 'http://localhost:3000/videos';

async function main() {
    console.log('Starting WLASL import to JSON...');

    if (!fs.existsSync(METADATA_PATH)) {
        console.error(`Metadata file not found at ${METADATA_PATH}`);
        return;
    }

    const data = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf-8'));
    console.log(`Loaded ${data.length} glosses from metadata.`);

    const signs: any[] = [];
    let importedCount = 0;
    let skippedCount = 0;

    // Ensure directory exists
    const dbDir = path.dirname(DB_JSON_PATH);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    for (const entry of data) {
        const word = entry.gloss.toUpperCase();

        // 1. Try to find a local video instance first
        const localInstance = entry.instances.find((inst: any) => {
            const videoPath = path.join(VIDEOS_DIR, `${inst.video_id}.mp4`);
            return fs.existsSync(videoPath);
        });

        if (localInstance) {
            const videoUrl = `${BASE_URL}/${localInstance.video_id}.mp4`;
            signs.push({
                word,
                videoUrl,
                durationMs: null,
                dominantHand: 'RIGHT',
            });
            importedCount++;
        } else {
            // 2. Fallback: Use the first instance with a valid external URL
            const externalInstance = entry.instances.find((inst: any) => inst.url && inst.url.startsWith('http'));

            if (externalInstance) {
                signs.push({
                    word,
                    videoUrl: externalInstance.url,
                    durationMs: null,
                    dominantHand: 'RIGHT',
                });
                importedCount++;
            } else {
                skippedCount++;
            }
        }
    }

    fs.writeFileSync(DB_JSON_PATH, JSON.stringify(signs, null, 2));

    console.log(`Import complete!`);
    console.log(`Saved to ${DB_JSON_PATH}`);
    console.log(`Total Imported: ${importedCount}`);
    console.log(`Total Skipped (no local video): ${skippedCount}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
