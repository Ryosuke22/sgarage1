import { Client } from '@replit/object-storage';

async function listStorageFiles() {
  try {
    const client = new Client();
    console.log('Connecting to Object Storage...');
    
    // List all files in the bucket
    const result = await client.list();
    
    if (result.error) {
      console.error('Error listing files:', result.error);
      return;
    }
    
    console.log('Files in Object Storage:');
    console.log('Total files:', result.value.length);
    
    result.value.forEach((file, index) => {
      console.log(`${index + 1}. ${file.name} (${file.size} bytes)`);
      if (file.name.includes('sgarage1')) {
        console.log('   *** FOUND sgarage1 related file! ***');
      }
    });
    
    // Look specifically for sgarage1
    const sgarage1Files = result.value.filter(file => 
      file.name.toLowerCase().includes('sgarage1') || 
      file.name.toLowerCase().includes('garage')
    );
    
    if (sgarage1Files.length > 0) {
      console.log('\n=== sgarage1/garage related files found ===');
      sgarage1Files.forEach(file => {
        console.log(`Name: ${file.name}`);
        console.log(`Size: ${file.size} bytes`);
        console.log(`Last modified: ${file.timeCreated}`);
        console.log('---');
      });
    } else {
      console.log('\nNo sgarage1 or garage related files found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

listStorageFiles();