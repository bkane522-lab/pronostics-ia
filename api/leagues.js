// Configuration des championnats disponibles pour Pronostics IA Pro V9.
//
// Utilise l'API football-data.org (https://www.football-data.org/) au lieu
// d'API-Football : son plan GRATUIT donne accès à la SAISON EN COURS (pas
// de restriction 2022-2024 comme sur API-Football). Nécessite la variable
// d'environnement FOOTBALL_DATA_KEY sur Vercel (Project Settings >
// Environment Variables). Ne jamais mettre cette clé dans le code.
//
// "code" est le code de compétition football-data.org (PL, PD, BL1, SA,
// FL1, CL...). Pas besoin de préciser de saison : l'API renvoie la saison
// en cours par défaut.

const LEAGUES = [
  { slug: "ligue1", label: "Ligue 1", live: true, code: "FL1" },
  { slug: "premier-league", label: "Premier League", live: true, code: "PL" },
  { slug: "liga", label: "Liga", live: true, code: "PD" },
  { slug: "serie-a", label: "Serie A", live: true, code: "SA" },
  { slug: "bundesliga", label: "Bundesliga", live: true, code: "BL1" },
  { slug: "champions-league", label: "Ligue des Champions", live: true, code: "CL" }
];

const DEFAULT_LEAGUE = "ligue1";

function findLeague(slug) {
  return LEAGUES.find(l => l.slug === slug) || LEAGUES.find(l => l.slug === DEFAULT_LEAGUE);
}

module.exports = { LEAGUES, DEFAULT_LEAGUE, findLeague };
