export default async function handler(req, res) {
  if (req.method!== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Frontend se pura messages array lo
  const { messages, model, temperature, max_tokens } = req.body || {};

  if (!messages ||!Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  try {
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'llama-3.1-8b-instant',
        messages: messages, // Frontend se jo aaya wahi bhej do
        temperature: temperature || 0.3,
        max_tokens: max_tokens || 2000,
      }),
    });

    const data = await groqResponse.json();
    
    if (!groqResponse.ok) {
      console.error('Groq Error:', data);
      return res.status(500).json({ error: data.error?.message || 'Groq API error' });
    }

    // Frontend ko OpenAI jaisa reply bhej rahe
    res.status(200).json({ 
      reply: data.choices[0].message.content,
      choices: data.choices 
    });
    
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: error.message });
  }
}
