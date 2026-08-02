// Configuration des championnats disponibles pour Pronostics IA Pro V9.
//
// "cdm2026-demo" reste 100% local (fichier api/data.js, aucune clé API requise).
// C'est le mode démo : il garantit que l'app fonctionne même si
// API_FOOTBALL_KEY n'est pas encore configurée sur Vercel.
//
// Les autres championnats utilisent l'API-Football (https://www.api-football.com/)
// et nécessitent la variable d'environnement API_FOOTBALL_KEY sur Vercel
// (Project Settings > Environment Variables). Ne jamais mettre cette clé dans le code.
//
// IMPORTANT : le champ "season" suit la convention API-Football (année de
// DÉBUT de saison, ex: 2025 pour la saison 2025/2026). Vérifie/ajuste cette
// valeur pour chaque championnat une fois la clé branchée : si un championnat
// renvoie 0 résultat, c'est presque toujours que "season" ne correspond pas
// à la saison en cours côté API-Football.

const LEAGUES = [
  { slug: "cdm2026-demo", label: "Démo CDM 2026", live: false },
  { slug: "ligue1", label: "Ligue 1", live: true, apiId: 61, season: 2025 },
  { slug: "premier-league", label: "Premier League", live: true, apiId: 39, season: 2025 },
  { slug: "liga", label: "Liga", live: true, apiId: 140, season: 2025 },
  { slug: "serie-a", label: "Serie A", live: true, apiId: 135, season: 2025 },
  { slug: "bundesliga", label: "Bundesliga", live: true, apiId: 78, season: 2025 },
  { slug: "champions-league", label: "Ligue des Champions", live: true, apiId: 2, season: 2025 }
];

const DEFAULT_LEAGUE = "cdm2026-demo";

function findLeague(slug) {
  return LEAGUES.find(l => l.slug === slug) || LEAGUES.find(l => l.slug === DEFAULT_LEAGUE);
}

module.exports = { LEAGUES, DEFAULT_LEAGUE, findLeague };
