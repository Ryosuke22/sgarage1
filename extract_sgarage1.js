import yauzl from 'yauzl';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const yauzlOpen = promisify(yauzl.open);

async function extractSgarage1() {
  try {
    console.log('Opening sgarage1.zip...');
    const zipfile = await yauzlOpen('./sgarage1.zip', { lazyEntries: true });
    
    console.log('Creating extraction directory...');
    const extractDir = './extracted-sgarage1';
    if (!fs.existsSync(extractDir)) {
      fs.mkdirSync(extractDir, { recursive: true });
    }
    
    let entryCount = 0;
    let extractedCount = 0;
    
    return new Promise((resolve, reject) => {
      zipfile.readEntry();
      
      zipfile.on('entry', (entry) => {
        entryCount++;
        
        if (/\/$/.test(entry.fileName)) {
          // Directory entry
          const dirPath = path.join(extractDir, entry.fileName);
          fs.mkdirSync(dirPath, { recursive: true });
          console.log(`Created directory: ${entry.fileName}`);
          zipfile.readEntry();
        } else {
          // File entry
          console.log(`Extracting: ${entry.fileName} (${entry.uncompressedSize} bytes)`);
          
          zipfile.openReadStream(entry, (err, readStream) => {
            if (err) {
              console.error('Error opening read stream:', err);
              zipfile.readEntry();
              return;
            }
            
            const filePath = path.join(extractDir, entry.fileName);
            const dirPath = path.dirname(filePath);
            
            // Ensure directory exists
            fs.mkdirSync(dirPath, { recursive: true });
            
            const writeStream = fs.createWriteStream(filePath);
            readStream.pipe(writeStream);
            
            writeStream.on('close', () => {
              extractedCount++;
              console.log(`Extracted: ${entry.fileName} (${extractedCount}/${entryCount})`);
              zipfile.readEntry();
            });
            
            writeStream.on('error', (err) => {
              console.error(`Error writing ${entry.fileName}:`, err);
              zipfile.readEntry();
            });
          });
        }
      });
      
      zipfile.on('end', () => {
        console.log(`✅ Extraction complete! Extracted ${extractedCount} files from ${entryCount} entries.`);
        resolve();
      });
      
      zipfile.on('error', (err) => {
        console.error('Zip file error:', err);
        reject(err);
      });
    });
    
  } catch (error) {
    console.error('Error extracting:', error);
  }
}

extractSgarage1();