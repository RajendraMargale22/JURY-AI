import axios from 'axios';

// The URL for the external FastAPI chatbot service.
const FASTAPI_SERVICE_URL = process.env.FASTAPI_URL || 'http://localhost:8000/ask/';

/**
 * Gets a legal analysis response from the FastAPI-based AI service.
 * @param message The user's question to send to the AI.
 * @returns A promise that resolves to the AI's response string.
 */
export const getAIResponse = async (message: string): Promise<string> => {
  try {
    // The FastAPI service expects URL-encoded form data because it uses `Form(...)`.
    const params = new URLSearchParams();
    params.append('question', message);

    const response = await axios.post(
      FASTAPI_SERVICE_URL,
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    // The FastAPI service returns a JSON object with an "answer" field.
    return response.data.answer || response.data.response || "I couldn't process your question. Please try again.";
  } catch (error) {
    console.error('Error calling the FastAPI AI service:', error);
    // Return a user-friendly error message
    return "I'm sorry, but I'm having trouble connecting to the legal analysis service. Please ensure it is running and accessible.";
  }
};
