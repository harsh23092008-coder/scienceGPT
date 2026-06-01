export default async function handler(req, res) {
  // CORS ke liye
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  
  if (req.method!== 'POST') {
    return res.status(405).json({ error: 'POST hi chalega' });
  }

  const { message } = req.body;
  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'API key nahi mili bhai' });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: message }]
      })
    });

    const data = await response.json();
    const reply = data.choices[0].message.content;
    res.status(200).json({ reply });
    
  } catch (error) {
    res.status(500).json({ error: 'Groq se reply nahi aaya' });
  }
}
