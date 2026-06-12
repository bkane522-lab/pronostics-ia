export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { match } = req.body;
    if (!match) return res.status(400).json({ error: 'Match requis' });
    const SYSTEM = `Tu es PRONOSTICS IA expert football. Utilise web_search pour chercher infos actuelles. La CDM 2026 a démarré le 11 juin 2026. Retourne UNIQUEMENT un JSON valide:\n{"match":"A vs B","competition":"nom","date_info":"date","is_world_cup":true,"group":"Groupe X","web_sources":["src"],"analysis":{"forme_domicile":{"score":75,"detail":"..."},"forme_exterieur":{"score":60,"detail":"..."},"h2h":{"score":65,"detail":"..."},"motivation":{"score":80,"detail":"..."},"blessures":{"score":55,"detail":"..."}},"pronostics":{"resultat_1x2":{"valeur":"1","confiance":70,"label":"Victoire A"},"over_under":{"valeur":"Over 2.5","confiance":65,"label":"Plus 2.5 buts"},"btts":{"valeur":"Oui","confiance":60,"label":"BTTS"},"score_exact":{"valeur":"2-1","confiance":20,"label":"Score"},"winner":{"valeur":"A","confiance":70,"label":"Vainqueur"},"perdant":{"valeur":"B","confiance":70,"label":"Perdant"}},"buteurs_potentiels":[{"nom":"Nom","equipe":"A","probabilite":50,"raison":"raison"}],"verdict":"analyse 2-3 phrases","niveau_confiance_global":67}`;
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: SYSTEM,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: `Pronostic pour : ${match}` }]
      })
    });
    const data = await r.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    const raw = (data.content || []).map(b => b.text || '').join('');
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: 'Pas de JSON' });
    return res.status(200).json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
