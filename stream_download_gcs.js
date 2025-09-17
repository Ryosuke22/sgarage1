import { Storage } from '@google-cloud/storage';
import fs from 'fs';

async function streamDownloadFromGCS() {
  try {
    // Replit automatically provides authentication for Google Cloud Storage
    const storage = new Storage();
    
    // Get the bucket ID from environment variables
    const bucketId = process.env.PUBLIC_OBJECT_SEARCH_PATHS ? 
      process.env.PUBLIC_OBJECT_SEARCH_PATHS.split('/')[1] : 
      'replit-objstore-b3f7f56b-ce22-4050-9508-1020539ab7d7';
    
    console.log('Using bucket:', bucketId);
    
    const bucket = storage.bucket(bucketId);
    const file = bucket.file('sgarage1.zip');
    
    console.log('Starting streaming download of sgarage1.zip...');
    
    // Create a write stream to save the file locally
    const writeStream = fs.createWriteStream('./sgarage1.zip');
    
    let downloadedBytes = 0;
    
    // Stream the file
    file.createReadStream()
      .on('error', (err) => {
        console.error('Download error:', err);
      })
      .on('response', (response) => {
        console.log('Server responded with status:', response.statusCode);
        const fileSize = response.headers['content-length'];
        if (fileSize) {
          console.log('File size:', parseInt(fileSize), 'bytes (', Math.round(parseInt(fileSize) / 1024 / 1024), 'MB)');
        }
      })
      .on('data', (chunk) => {
        downloadedBytes += chunk.length;
        const mbDownloaded = Math.round(downloadedBytes / 1024 / 1024);
        process.stdout.write(`\rDownloaded: ${mbDownloaded} MB`);
      })
      .on('end', () => {
        console.log('\n✅ Download completed successfully!');
        console.log('File saved as: ./sgarage1.zip');
        
        // Check file stats
        const stats = fs.statSync('./sgarage1.zip');
        console.log('Local file size:', stats.size, 'bytes');
      })
      .pipe(writeStream);
      
  } catch (error) {
    console.error('Error:', error);
  }
}

streamDownloadFromGCS();