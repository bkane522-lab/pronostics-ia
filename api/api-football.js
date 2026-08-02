// Client pour l'API-Football (api-sports.io).
// La clé n'est JAMAIS écrite ici : elle est lue depuis process.env.API_FOOTBALL_KEY
// (variable d'environnement Vercel), donc jamais présente dans le code GitHub.

const API_BASE = "https://v3.football.api-sports.io";

// Cache mémoire très simple : vit tant que l'instance serverless reste "chaude".
// Objectif : éviter de retaper l'API-Football à chaque clic utilisateur et
// économiser le quota (les plans gratuits sont limités en requêtes/jour).
const CACHE = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function cacheGet(key) {
  const hit = CACHE.get(key);
  if (!hit) return null;
  if (Date.now() - hit.time > CACHE_TTL_MS) { CACHE.delete(key); return null; }
  return hit.value;
}
function cacheSet(key, value) {
  CACHE.set(key, { value, time: Date.now() });
}

async function apiFootballFetch(path, params) {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    const err = new Error("API_FOOTBALL_KEY absente. Ajoute-la dans Vercel > Settings > Environment Variables.");
    err.code = "NO_API_KEY";
    throw err;
  }
  const url = new URL(API_BASE + path);
  Object.keys(params || {}).forEach(k => {
    if (params[k] !== undefined && params[k] !== null) url.searchParams.set(k, params[k]);
  });
  const cacheKey = url.toString();
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  let res;
  try {
    res = await fetch(url.toString(), { headers: { "x-apisports-key": apiKey } });
  } catch (e) {
    const err = new Error("Impossible de joindre API-Football (réseau).");
    err.code = "NETWORK_ERROR";
    throw err;
  }
  if (!res.ok) {
    const err = new Error("Erreur API-Football (HTTP " + res.status + ")");
    err.code = "HTTP_" + res.status;
    throw err;
  }
  const json = await res.json();
  const hasErrors = json.errors && (Array.isArray(json.errors) ? json.errors.length : Object.keys(json.errors).length);
  if (hasErrors) {
    const err = new Error("API-Football a renvoyé une erreur : " + JSON.stringify(json.errors));
    err.code = "API_ERROR";
    throw err;
  }
  cacheSet(cacheKey, json);
  return json;
}

function statusToLabel(short) {
  if (short === "FT" || short === "AET" || short === "PEN") return "Terminé";
  if (short === "NS" || short === "TBD") return "À venir";
  if (["1H", "2H", "HT", "ET", "BT", "P", "LIVE"].indexOf(short) !== -1) return "En cours";
  return short || "À venir";
}

function mapFixtureRow(fx) {
  const date = (fx.fixture && fx.fixture.date) ? fx.fixture.date.slice(0, 10) : "";
  const round = (fx.league && fx.league.round) ? fx.league.round : "";
  const home = fx.teams && fx.teams.home ? fx.teams.home.name : "?";
  const away = fx.teams && fx.teams.away ? fx.teams.away.name : "?";
  const status = fx.fixture && fx.fixture.status ? fx.fixture.status.short : "";
  const hg = fx.goals ? fx.goals.home : null;
  const ag = fx.goals ? fx.goals.away : null;
  const finished = status === "FT" || status === "AET" || status === "PEN";
  return { date, round, home, away, status, hg, ag, finished };
}

async function getRecentFixtures(leagueId, season, count) {
  const json = await apiFootballFetch("/fixtures", { league: leagueId, season, last: count || 30 });
  return (json.response || []).map(mapFixtureRow).filter(f => f.finished);
}

async function getUpcomingFixtures(leagueId, season, count) {
  const json = await apiFootballFetch("/fixtures", { league: leagueId, season, next: count || 15 });
  return (json.response || []).map(mapFixtureRow);
}

async function getStandings(leagueId, season) {
  const json = await apiFootballFetch("/standings", { league: leagueId, season });
  const blocks = (json.response && json.response[0] && json.response[0].league && json.response[0].league.standings) || [];
  // blocks est un tableau de tableaux : plusieurs groupes pour la Ligue des
  // Champions (phase de groupes), un seul groupe pour un championnat classique.
  return blocks.map((group, idx) => ({
    label: group[0] && group[0].group ? group[0].group : "Classement",
    teams: group.map(row => ({
      team: row.team.name,
      played: row.all.played,
      wins: row.all.win,
      draws: row.all.draw,
      losses: row.all.lose,
      gf: row.all.goals.for,
      ga: row.all.goals.against,
      gd: row.goalsDiff,
      points: row.points
    }))
  }));
}

module.exports = { getRecentFixtures, getUpcomingFixtures, getStandings, statusToLabel };
