export const fixGrammar = async (text: string) => {
  const res = await fetch('/api/openai/fix-grammar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    throw new Error('Failed to fix grammar');
  }

  const data = await res.json();
  return data.result; // backend returns { result: "..." }
};