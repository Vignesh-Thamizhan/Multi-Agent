const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

let genAI;

const getGenAI = () => {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

/**
 * Process multimodal content with Gemini
 * @param {Object} options
 * @param {string} options.prompt - Text prompt
 * @param {Object} options.file - File object { buffer, mimeType, originalname }
 * @param {Function} options.onChunk - Callback for each text chunk
 * @param {string} options.model - Model name (default: 'gemini-1.5-flash')
 * @returns {Promise<string>} Full accumulated response text
 */
const streamMultimodal = async ({
  prompt,
  file,
  onChunk,
  model = 'gemini-1.5-flash',
}) => {
  logger.info(`Gemini streaming: model=${model}, file=${file?.originalname || 'none'}`);

  const ai = getGenAI();
  const geminiModel = ai.getGenerativeModel({ model });

  const parts = [];

  // Add file as inline data if present
  if (file && file.buffer) {
    const isTextBased = file.mimeType.startsWith('text/') ||
      file.mimeType === 'application/json' ||
      file.mimeType === 'application/xml';

    if (isTextBased) {
      // For text files, send as text content
      const textContent = file.buffer.toString('utf-8');
      parts.push({
        text: `File: ${file.originalname}\n\`\`\`\n${textContent}\n\`\`\`\n`,
      });
    } else {
      // For binary files (images, PDFs), send as inline data
      parts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.buffer.toString('base64'),
        },
      });
    }
  }

  // Add text prompt
  parts.push({ text: prompt });

  const result = await geminiModel.generateContentStream(parts);

  let fullContent = '';

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      fullContent += text;
      if (onChunk) {
        onChunk(text);
      }
    }
  }

  logger.info(`Gemini complete: ${fullContent.length} chars`);
  return fullContent;
};

module.exports = { streamMultimodal };
