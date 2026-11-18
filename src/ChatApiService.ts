import { fetchWithTimeout } from "./api/fetchWithTimeout";
import { chatResponseSchema } from "./schemas/config";
import { API_CONFIG } from "./config";

/**
 * Send chat message to backend and get AI response
 * 
 * @param chatApiUrl - Full URL to chat API endpoint
 * @param storeId - Store identifier
 * @param history - Message history for context
 * @returns Validated chat response ({ reply } or { message })
 */
export default async function chatApi(
  chatApiUrl: string,
  storeId: string,
  history: { role: string; content: string }[]
) {
  try {
    const res = await fetchWithTimeout(chatApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId, messages: history }),
      timeout: API_CONFIG.CHAT_API_TIMEOUT,
      retries: 0, // Don't retry chat messages (they're stateful)
    });

    // Validate response before returning
    if (!res.ok) {
      throw new Error(`[ChatAssistant] Chat API failed: ${res.status}`);
    }

    const data = await res.json();
    
    // Ensure response matches expected shape
    // Return the parsed data: the response body can only be read once
    return chatResponseSchema.parse(data);
  } catch (err) {
    console.error("[ChatAssistant] Chat API error:", err);
    throw err;
  }
}
