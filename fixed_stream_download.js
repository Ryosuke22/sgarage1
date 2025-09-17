import { Client } from '@replit/object-storage';
import fs from 'fs';
import { pipeline } from 'stream/promises';

async function streamDownloadSgarage1() {
  try {
    const client = new Client();
    
    console.log('Starting streaming download of sgarage1.zip...');
    
    // downloadAsStream returns the stream directly, not wrapped in {value}
    const readableStream = await client.downloadAsStream('sgarage1.zip');
    
    console.log('Stream obtained successfully!');
    console.log('Stream type:', readableStream.constructor.name);
    
    // Create write stream to save file locally
    const writeStream = fs.createWriteStream('./sgarage1.zip');
    
    let downloadedBytes = 0;
    
    // Track progress
    const { Transform } = await import('stream');
    const trackingStream = new Transform({
      transform(chunk, encoding, callback) {
        downloadedBytes += chunk.length;
        const mbDownloaded = Math.round(downloadedBytes / 1024 / 1024);
        process.stdout.write(`\rDownloaded: ${mbDownloaded} MB`);
        callback(null, chunk);
      }
    });
    
    // Use pipeline for efficient streaming
    await pipeline(
      readableStream,      // Direct stream from downloadAsStream
      trackingStream,      // Progress tracking transform
      writeStream         // Write to local file
    );
    
    console.log('\n✅ Streaming download completed successfully!');
    
    // Check final file size
    const stats = fs.statSync('./sgarage1.zip');
    console.log(`Final file size: ${stats.size} bytes (${Math.round(stats.size / 1024 / 1024)} MB)`);
    
    return true;
    
  } catch (error) {
    console.error('Error during streaming download:', error);
    return false;
  }
}

streamDownloadSgarage1();