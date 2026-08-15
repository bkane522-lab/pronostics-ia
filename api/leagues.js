// Configuration des compétitions disponibles pour Pronostics IA Pro.
// Les championnats utilisent football-data.org.
// Le Trophée des Champions est un événement spécial ajouté manuellement,
// avec contexte Ligue 1 réutilisé côté api/chat.js.

const LEAGUES = [
  { slug: "ligue1", label: "Ligue 1", live: true, code: "FL1" },
  { slug: "trophee-des-champions", label: "🏆 Trophée des Champions", live: true, special: "tdc-2026" },
  { slug: "premier-league", label: "Premier League", live: true, code: "PL" },
  { slug: "liga", label: "Liga", live: true, code: "PD" },
  { slug: "serie-a", label: "Serie A", live: true, code: "SA" },
  { slug: "bundesliga", label: "Bundesliga", live: true, code: "BL1" },
  { slug: "champions-league", label: "Ligue des Champions", live: true, code: "CL" }
];

const DEFAULT_LEAGUE = "ligue1";

function findLeague(slug) {
  return LEAGUES.find(l => l.slug === slug) ||
    LEAGUES.find(l => l.slug === DEFAULT_LEAGUE);
}

module.exports = { LEAGUES, DEFAULT_LEAGUE, findLeague };
