
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config({ path: '/home/igris0410/multiagent/server/.env' });

const GOOGLE_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta';

async function listModels() {
  if (!GOOGLE_API_KEY) {
    console.error('GEMINI_API_KEY is not set');
    return;
  }

  try {
    const url = `${GOOGLE_API_ENDPOINT}/models?key=${GOOGLE_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.models) {
      console.log('Available models:');
      data.models.forEach(model => {
        if (model.supportedGenerationMethods.includes('embedContent')) {
          console.log(`- ${model.name} (supports embedContent)`);
        } else {
           console.log(`- ${model.name}`);
        }
      });
    } else {
      console.log('No models found or error:', data);
    }
  } catch (error) {
    console.error('Failed to list models:', error.message);
  }
}

listModels();
