import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sourceDir = join(__dirname, '../node_modules/@jlongster/sql.js/dist');
const targetDir = join(__dirname, '../public');

// Create public directory if it doesn't exist
if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
}

// Copy WASM file
const wasmFile = 'sql-wasm.wasm';
try {
    copyFileSync(
        join(sourceDir, wasmFile),
        join(targetDir, wasmFile)
    );
    console.log(`Copied ${wasmFile} to public directory`);
} catch (err) {
    console.error(`Error copying ${wasmFile}:`, err);
}
