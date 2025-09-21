import OpenAI from 'openai';

// Lazily create a client for general use
let cachedClient = null;

export const getOpenAIClient = () => {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.OPENAI_API_SECRET;
  if (!apiKey) {
    throw new Error('OPENAI_API_SECRET is not set');
  }
  cachedClient = new OpenAI({ apiKey });
  return cachedClient;
};

// Safe verification helper to validate connectivity at startup
export const verifyOpenAIConnection = async () => {
  const apiKey = process.env.OPENAI_API_SECRET;
  if (!apiKey) {
    console.warn('OpenAI not configured: missing OPENAI_API_SECRET');
    return false;
  }
  try {
    const client = new OpenAI({ apiKey });
    const models = await client.models.list();
    const count = Array.isArray(models?.data) ? models.data.length : 0;
    console.log(`OpenAI connection successful. Models available: ${count}`);
    return true;
  } catch (error) {
    console.error('OpenAI connection failed:', error?.message || error);
    return false;
  }
};

export default getOpenAIClient;


