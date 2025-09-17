import { Client } from '@replit/object-storage';

async function checkStorageAPI() {
  try {
    const client = new Client();
    
    console.log('=== Checking @replit/object-storage API methods ===');
    console.log('Available methods on client:');
    console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(client)).filter(name => name !== 'constructor'));
    
    // Check if there are any URL generation methods
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(client));
    const urlMethods = methods.filter(method => 
      method.toLowerCase().includes('url') || 
      method.toLowerCase().includes('sign') ||
      method.toLowerCase().includes('stream') ||
      method.toLowerCase().includes('read')
    );
    
    console.log('Potential URL/Stream methods:', urlMethods);
    
    // Try to see if there are any undocumented methods
    console.log('\nAll client properties:');
    for (const prop in client) {
      console.log(`- ${prop}: ${typeof client[prop]}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkStorageAPI();