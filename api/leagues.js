// Configuration des championnats disponibles pour Pronostics IA Pro V9.
//
// Tous les championnats utilisent l'API-Football (https://www.api-football.com/)
// et nécessitent la variable d'environnement API_FOOTBALL_KEY sur Vercel
// (Project Settings > Environment Variables). Ne jamais mettre cette clé dans le code.
//
// IMPORTANT : le plan GRATUIT d'API-Football ne donne accès qu'aux saisons
// 2022 à 2024 (confirmé par l'erreur "Free plans do not have access to this
// season, try from 2022 to 2024."). season:2023 = saison 2023-2024, la plus
// récente disponible gratuitement. Passer à une saison plus récente (2025,
// 2026...) nécessite un plan payant API-Football.

const LEAGUES = [
  { slug: "ligue1", label: "Ligue 1", live: true, apiId: 61, season: 2023 },
  { slug: "premier-league", label: "Premier League", live: true, apiId: 39, season: 2023 },
  { slug: "liga", label: "Liga", live: true, apiId: 140, season: 2023 },
  { slug: "serie-a", label: "Serie A", live: true, apiId: 135, season: 2023 },
  { slug: "bundesliga", label: "Bundesliga", live: true, apiId: 78, season: 2023 },
  { slug: "champions-league", label: "Ligue des Champions", live: true, apiId: 2, season: 2023 }
];

const DEFAULT_LEAGUE = "ligue1";

function findLeague(slug) {
  return LEAGUES.find(l => l.slug === slug) || LEAGUES.find(l => l.slug === DEFAULT_LEAGUE);
}

module.exports = { LEAGUES, DEFAULT_LEAGUE, findLeague };
