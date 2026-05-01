const Groq = require('groq-sdk');
const logger = require('../utils/logger');

// Initialize Groq client lazily to avoid crashing at startup if API key is missing
let groq = null;

const getGroqClient = () => {
  if (!groq) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error(
        'GROQ_API_KEY environment variable is not set. ' +
        'Please configure it in your .env file or as an environment variable.'
      );
    }
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return groq;
};

/**
 * Stream chat completions from Groq
 * @param {Object} options
 * @param {string} options.model - Model name (e.g., 'llama-3.3-70b-versatile')
 * @param {Array} options.messages - Chat messages array
 * @param {Function} options.onChunk - Callback for each text chunk
 * @param {number} options.temperature - Temperature (default: 0.7)
 * @param {number} options.maxTokens - Max tokens (default: 4096)
 * @returns {Promise<string>} Full accumulated response text
 */
const streamCompletion = async ({
  model = 'llama-3.3-70b-versatile',
  messages,
  onChunk,
  temperature = 0.7,
  maxTokens = 4096,
}) => {
  logger.info(`Groq streaming: model=${model}, messages=${messages.length}`);

  const stream = await getGroqClient().chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: true,
  });

  let fullContent = '';

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || '';
    if (delta) {
      fullContent += delta;
      if (onChunk) {
        onChunk(delta);
      }
    }
  }

  logger.info(`Groq complete: ${fullContent.length} chars`);
  return fullContent;
};

const MCP_TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'create_file',
      description: 'Create a file in the workspace',
      parameters: {
        type: 'object',
        properties: { filePath: { type: 'string', description: 'Path to the file to create' }, content: { type: 'string', description: 'File content' } },
        required: ['filePath', 'content'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read a file from workspace',
      parameters: {
        type: 'object',
        properties: { filePath: { type: 'string', description: 'Path to the file to read' } },
        required: ['filePath'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Write file content in workspace',
      parameters: {
        type: 'object',
        properties: { filePath: { type: 'string', description: 'Path to the file to write' }, content: { type: 'string', description: 'File content' } },
        required: ['filePath', 'content'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_files',
      description: 'List workspace files',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
];

const streamGroqWithTools = async ({
  model = 'llama-3.3-70b-versatile',
  messages,
  executeTool,
  onToolCall,
  onChunk,
  maxIterations = 8,
}) => {
  const workingMessages = [...messages];
  const toolTrace = [];

  for (let i = 0; i < maxIterations; i += 1) {
    try {
      const response = await getGroqClient().chat.completions.create({
        model,
        messages: workingMessages,
        tools: MCP_TOOL_DEFINITIONS,
        tool_choice: 'auto',
        temperature: 0.3,
        max_tokens: 4096,
        stream: false,
      });

      const message = response.choices?.[0]?.message;
      if (!message) break;

      const assistantMessage = { role: 'assistant', content: message.content || '' };
      if (message.tool_calls?.length) {
        assistantMessage.tool_calls = message.tool_calls;
      }
      workingMessages.push(assistantMessage);

      if (!message.tool_calls?.length) break;

      for (const toolCall of message.tool_calls) {
        const toolName = toolCall.function?.name;
        const args = JSON.parse(toolCall.function?.arguments || '{}');
        onToolCall?.({ toolName, args });
        const result = await executeTool(toolName, args);
        toolTrace.push({ toolName, args, result });
        workingMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }
    } catch (error) {
      logger.error(`Error in streamGroqWithTools iteration ${i}: ${error.message}`);
      if (error.status === 400 && error.code === 'tool_use_failed') {
        logger.error('Tool validation failed. Check tool definitions and function arguments.');
        throw new Error(`Groq tool call failed: ${error.message}`);
      }
      throw error;
    }
  }

  const finalResponse = await streamCompletion({
    model,
    messages: workingMessages,
    onChunk,
    temperature: 0.3,
    maxTokens: 4096,
  });

  return { content: finalResponse, toolTrace };
};

module.exports = { streamCompletion, streamGroqWithTools };
