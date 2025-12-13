export const improveWriting = async (text: string) => {
  const res = await fetch('/api/openai/improve-writing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error('Failed to improve writing');
  const data = await res.json();
  return data.result;
};