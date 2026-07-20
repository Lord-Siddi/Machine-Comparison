// src/compareApi.js
//
// Backend base URL is configurable via environment variable
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export async function fetchComparison(equipmentId) {
  const res = await fetch(`${BASE_URL}/api/equipment/${equipmentId}/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const errBody = await res.json();
      if (errBody?.error) message = errBody.error;
    } catch {
      // response wasn't JSON, keep default message
    }
    throw new Error(message);
  }

  return res.json();
}
