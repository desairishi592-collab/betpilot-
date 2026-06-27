export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── ODDS API PROXY (GET /api/chat?odds=1&sport=...) ──
  if (req.method === 'GET' && req.query.odds) {
    const oddsKey = process.env.ODDS_API_KEY;
    if (!oddsKey) return res.status(500).json({ error: 'Odds API key not configured.' });
    const sport = req.query.sport || 'americanfootball_nfl';
    const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds?apiKey=${oddsKey}&regions=us,uk&markets=h2h&oddsFormat=decimal&dateFormat=iso`;
    try {
      const r = await fetch(url);
      const d = await r.json();
      return res.status(r.status).json(d);
    } catch(e) {
      return res.status(500).json({ error: 'Failed to reach Odds API', details: e.message });
    }
  }

  // ── ODDS API LINE HISTORY (GET /api/chat?history=1&sport=...&eventId=...) ──
  if (req.method === 'GET' && req.query.history) {
    const oddsKey = process.env.ODDS_API_KEY;
    if (!oddsKey) return res.status(500).json({ error: 'Odds API key not configured.' });
    const sport = req.query.sport || 'americanfootball_nfl';
    const eventId = req.query.eventId;
    if (!eventId) return res.status(400).json({ error: 'eventId required' });
    const url = `https://api.the-odds-api.com/v4/sports/${sport}/events/${eventId}/odds?apiKey=${oddsKey}&regions=us&markets=h2h&oddsFormat=decimal`;
    try {
      const r = await fetch(url);
      const d = await r.json();
      return res.status(r.status).json(d);
    } catch(e) {
      return res.status(500).json({ error: 'Failed to reach Odds API', details: e.message });
    }
  }

  // ── GROQ AI PROXY (POST) ──
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return res.status(500).json({ error: 'Groq API key not configured.' });

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch(err) {
    return res.status(500).json({ error: 'Failed to reach Groq API', details: err.message });
  }
}
