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
 * @param {string} options.model - Model name (default: 'gemini-2.5-flash')
 * @returns {Promise<string>} Full accumulated response text
 */
const streamMultimodal = async ({
  prompt,
  file,
  onChunk,
  model = 'gemini-2.5-flash',
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

const MCP_TOOL_DEFINITIONS = [
  {
    name: 'create_file',
    description: 'Create a file in the workspace',
    parameters: {
      type: 'OBJECT',
      properties: { filePath: { type: 'STRING', description: 'Path to the file to create' }, content: { type: 'STRING', description: 'File content' } },
      required: ['filePath', 'content'],
    },
  },
  {
    name: 'read_file',
    description: 'Read a file from workspace',
    parameters: {
      type: 'OBJECT',
      properties: { filePath: { type: 'STRING', description: 'Path to the file to read' } },
      required: ['filePath'],
    },
  },
  {
    name: 'write_file',
    description: 'Write file content in workspace',
    parameters: {
      type: 'OBJECT',
      properties: { filePath: { type: 'STRING', description: 'Path to the file to write' }, content: { type: 'STRING', description: 'File content' } },
      required: ['filePath', 'content'],
    },
  },
  {
    name: 'list_files',
    description: 'List workspace files',
    parameters: { type: 'OBJECT', properties: {} },
  },
];

const streamGeminiWithTools = async ({
  model = 'gemini-2.5-flash',
  messages,
  executeTool,
  onToolCall,
  onChunk,
  maxIterations = 8,
}) => {
  logger.info(`Gemini tools streaming: model=${model}`);
  const ai = getGenAI();
  const geminiModel = ai.getGenerativeModel({
    model,
    tools: [{ functionDeclarations: MCP_TOOL_DEFINITIONS }],
  });

  const systemMessage = messages.find((m) => m.role === 'system')?.content || '';
  const userMessage = messages.find((m) => m.role === 'user')?.content || '';

  const chat = geminiModel.startChat({
    systemInstruction: { parts: [{ text: systemMessage }] },
    history: [],
  });

  let currentMessage = [{ text: userMessage }];
  let toolTrace = [];
  let finalContent = '';

  for (let i = 0; i < maxIterations; i += 1) {
    try {
      const response = await chat.sendMessageStream(currentMessage);
      
      let textContent = '';
      let hasToolCall = false;

      for await (const chunk of response.stream) {
        let text = '';
        try { text = chunk.text(); } catch (e) { /* ignore if no text */ }
        
        if (text) {
          textContent += text;
          if (onChunk) onChunk(text);
        }

        const calls = chunk.functionCalls();
        if (calls && calls.length > 0) {
          hasToolCall = true;
          const functionResponses = [];
          
          for (const call of calls) {
            const toolName = call.name;
            const args = call.args;
            onToolCall?.({ toolName, args });
            const result = await executeTool(toolName, args);
            toolTrace.push({ toolName, args, result });
            
            functionResponses.push({
              functionResponse: {
                name: toolName,
                response: { result: JSON.stringify(result) }
              }
            });
          }
          currentMessage = functionResponses;
          break; // Stop streaming this iteration, start next with tool responses
        }
      }
      
      finalContent += textContent;
      if (!hasToolCall) break;
      
    } catch (error) {
      logger.error(`Error in streamGeminiWithTools iteration ${i}: ${error.message}`);
      throw error;
    }
  }

  return { content: finalContent, toolTrace };
};

module.exports = { streamMultimodal, streamGeminiWithTools };
