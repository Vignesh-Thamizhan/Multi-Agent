
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config({ path: '/home/igris0410/multiagent/server/.env' });

const GOOGLE_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta';
const EMBEDDING_MODEL = 'gemini-embedding-001';

async function testEmbedding() {
  if (!GOOGLE_API_KEY) {
    console.error('GEMINI_API_KEY is not set');
    return;
  }

  try {
    const url = `${GOOGLE_API_ENDPOINT}/models/${EMBEDDING_MODEL}:embedContent?key=${GOOGLE_API_KEY}`;
    
    console.log(`Testing embedding with model: ${EMBEDDING_MODEL}`);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: { parts: [{ text: "Hello world" }] },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Google API error (${response.status}): ${errorBody}`);
      return;
    }

    const data = await response.json();
    const embedding = data.embedding?.values || [];
    console.log(`Success! Embedding length: ${embedding.length}`);
  } catch (error) {
    console.error(`Embedding generation failed: ${error.message}`);
  }
}

testEmbedding();
