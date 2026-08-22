const LEAGUES = [
  { slug: "ligue1", label: "Ligue 1", live: true, code: "FL1" },
  { slug: "premier-league", label: "Premier League", live: true, code: "PL" },
  { slug: "liga", label: "Liga", live: true, code: "PD" },
  { slug: "serie-a", label: "Serie A", live: true, code: "SA" },
  { slug: "bundesliga", label: "Bundesliga", live: true, code: "BL1" },
  { slug: "champions-league", label: "Ligue des Champions", live: true, code: "CL" },
  { slug: "championship", label: "Championship (Angleterre)", live: true, code: "ELC" }
];

const DEFAULT_LEAGUE = "ligue1";

function normalizeSlug(v) {
  return String(v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/\s+/g, "-")
    .trim();
}

function findLeague(slug) {
  const normalized = normalizeSlug(slug);

  // Cas particulier : le Trophée des Champions n'est pas une compétition
  // à part entière côté API, elle réutilise le contexte Ligue 1.
  if (normalized === "trophee-des-champions" || normalized === "trophee des champions") {
    return { slug: "trophee-des-champions", label: "Trophée des Champions", live: false, code: "FL1" };
  }

  const found = LEAGUES.find(l => l.slug === normalized);
  if (found) return found;

  return LEAGUES.find(l => l.slug === DEFAULT_LEAGUE) || LEAGUES[0];
}

module.exports = { LEAGUES, DEFAULT_LEAGUE, findLeague };
