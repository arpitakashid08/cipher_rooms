import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'fake-key-for-dev' // Replace with proper check in prod
});

export const summarizeChat = async (messages: string[]): Promise<string> => {
  try {
    if (!process.env.OPENAI_API_KEY) return 'AI feature disabled: Missing API Key';
    
    const prompt = `Summarize the following chat conversation concisely:\n${messages.join('\n')}`;
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });
    return response.choices[0].message?.content || 'Unable to summarize';
  } catch (error) {
    console.error('OpenAI Error', error);
    return 'Error generating summary';
  }
};

export const extractTasks = async (messages: string[]): Promise<string> => {
  try {
    if (!process.env.OPENAI_API_KEY) return 'AI feature disabled: Missing API Key';
    
    const prompt = `Extract tasks and action items from the following chat:\n${messages.join('\n')}`;
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });
    return response.choices[0].message?.content || 'No tasks found';
  } catch (error) {
    console.error('OpenAI Error', error);
    return 'Error extracting tasks';
  }
};

export const askSmartAssistant = async (question: string): Promise<string> => {
  try {
    if (!process.env.OPENAI_API_KEY) return 'AI feature disabled: Missing API Key';
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are CipherMind AI, a helpful collaboration assistant for the CipherRooms platform.' },
        { role: 'user', content: question }
      ],
    });
    return response.choices[0].message?.content || 'I could not process the request';
  } catch (error) {
    console.error('OpenAI Error', error);
    return 'Error processing request';
  }
};
