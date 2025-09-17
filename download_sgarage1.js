import { Client } from '@replit/object-storage';
import fs from 'fs';

async function downloadSgarage1() {
  try {
    const client = new Client();
    console.log('Downloading sgarage1.zip from Object Storage...');
    
    // Download the file
    const result = await client.downloadAsBytes('sgarage1.zip');
    
    if (result.error) {
      console.error('Error downloading file:', result.error);
      return;
    }
    
    // Convert to Buffer and save to local filesystem
    const buffer = Buffer.from(result.value);
    fs.writeFileSync('./sgarage1.zip', buffer);
    console.log('Successfully downloaded sgarage1.zip!');
    console.log('File size:', buffer.length, 'bytes');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

downloadSgarage1();