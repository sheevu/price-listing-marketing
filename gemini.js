// This serverless function proxies requests to the Gemini API.
// It uses a Vercel Edge Function/Serverless Function-style handler.
// You should set the GEMINI_API_KEY environment variable in your Vercel project
// settings so the key is never exposed to clients.

export default async function handler(req, res) {
  // Only allow POST requests to avoid accidental exposure via GET.
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Missing prompt' });
    return;
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY environment variable is not set' });
    return;
  }
  // Use the specified Gemini model. This can be updated if you choose a different model.
  const model = 'models/gemini-2.5-flash-preview-05-20';
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`;
  try {
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [ { text: prompt } ],
        },
      ],
    };
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorText = await response.text();
      res.status(response.status).json({ error: errorText });
      return;
    }
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.status(200).json({ text });
  } catch (err) {
    console.error('Error calling Gemini API:', err);
    res.status(500).json({ error: 'Failed to fetch response from Gemini' });
  }
}