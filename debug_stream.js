import { Client } from '@replit/object-storage';

async function debugStream() {
  try {
    const client = new Client();
    
    console.log('Getting stream for sgarage1.zip...');
    const result = await client.downloadAsStream('sgarage1.zip');
    
    console.log('Result structure:');
    console.log('- result.error:', result.error);
    console.log('- result.value type:', typeof result.value);
    console.log('- result.value:', result.value);
    console.log('- result keys:', Object.keys(result));
    
    if (result.value) {
      console.log('Stream properties:');
      console.log('- constructor:', result.value.constructor.name);
      console.log('- readable:', result.value.readable);
      console.log('- pipe function?:', typeof result.value.pipe);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugStream();