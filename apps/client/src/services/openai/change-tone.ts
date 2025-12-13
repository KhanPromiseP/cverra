export type Mood = "casual" | "professional" | "confident" | "friendly";

export const changeTone = async (text: string, mood: Mood) => {
  const res = await fetch('/api/openai/change-tone', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, mood }),
  });

  if (!res.ok) {
    throw new Error('Failed to change tone');
  }

  const data = await res.json();
  return data.result; // Backend returns { result: "..." }
};