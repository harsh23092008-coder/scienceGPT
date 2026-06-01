export default async function handler(req, res) {
  if (req.method!== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Vercel me body already parsed hoti hai
  const { message } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: 'No message found in request' });
  }

  try {
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: message }],
      }),
    });

    const data = await groqResponse.json();
    
    if (!groqResponse.ok) {
      return res.status(500).json({ error: data.error?.message || 'Groq API error' });
    }

    res.status(200).json({ reply: data.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
