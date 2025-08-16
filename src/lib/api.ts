import type { ProcessPayload } from "../types"

// TODO: Replace with your backend URL
const PROCESS_URL = process.env.EXPO_PUBLIC_PROCESS_URL || "https://your-backend.com"

export const callProcess = async (payload: ProcessPayload): Promise<void> => {
  try {
    const response = await fetch(`${PROCESS_URL}/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Process API failed: ${response.status}`)
    }

    // The backend will update Firestore directly
    // No need to handle response data here
  } catch (error) {
    console.error("Process API call failed:", error)
    throw error
  }
}
