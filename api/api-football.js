// Client pour football-data.org (https://www.football-data.org/).
// La clé n'est JAMAIS écrite ici : elle est lue depuis process.env.FOOTBALL_DATA_KEY
// (variable d'environnement Vercel), donc jamais présente dans le code GitHub.
//
// (Le fichier s'appelle encore "api-football.js" pour éviter de renommer et
// re-référencer un fichier sur GitHub, mais il parle bien à football-data.org.)

const API_BASE = "https://api.football-data.org/v4";

// Cache mémoire très simple : vit tant que l'instance serverless reste "chaude".
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

async function footballDataFetch(path) {
  const apiKey = process.env.FOOTBALL_DATA_KEY;
  if (!apiKey) {
    const err = new Error("FOOTBALL_DATA_KEY absente. Ajoute-la dans Vercel > Settings > Environment Variables.");
    err.code = "NO_API_KEY";
    throw err;
  }
  const url = API_BASE + path;
  const cached = cacheGet(url);
  if (cached) return cached;

  let res;
  try {
    res = await fetch(url, { headers: { "X-Auth-Token": apiKey } });
  } catch (e) {
    const err = new Error("Impossible de joindre football-data.org (réseau).");
    err.code = "NETWORK_ERROR";
    throw err;
  }
  if (!res.ok) {
    let detail = "";
    try { const body = await res.json(); detail = body && body.message ? " : " + body.message : ""; } catch (e) {}
    const err = new Error("Erreur football-data.org (HTTP " + res.status + ")" + detail);
    err.code = "HTTP_" + res.status;
    throw err;
  }
  const json = await res.json();
  cacheSet(url, json);
  return json;
}

function statusToLabel(status) {
  if (status === "FINISHED") return "Terminé";
  if (status === "SCHEDULED" || status === "TIMED") return "À venir";
  if (status === "IN_PLAY" || status === "PAUSED") return "En cours";
  if (status === "POSTPONED") return "Reporté";
  if (status === "SUSPENDED" || status === "CANCELLED") return "Annulé";
  return status || "À venir";
}

function mapFixtureRow(m) {
  const date = m.utcDate ? m.utcDate.slice(0, 10) : "";
  const round = m.matchday ? "Journée " + m.matchday : "";
  const home = m.homeTeam && m.homeTeam.name ? m.homeTeam.name : "?";
  const away = m.awayTeam && m.awayTeam.name ? m.awayTeam.name : "?";
  const status = m.status || "";
  const hg = m.score && m.score.fullTime ? m.score.fullTime.home : null;
  const ag = m.score && m.score.fullTime ? m.score.fullTime.away : null;
  const finished = status === "FINISHED";
  return { date, round, home, away, status, hg, ag, finished };
}

async function getSeasonFixtures(leagueCode) {
  // Pas de paramètre "season" : football-data.org renvoie la saison en
  // cours par défaut sur cet endpoint, ce qui règle le blocage qu'on avait
  // avec API-Football (accès saison en cours = payant chez eux).
  const json = await footballDataFetch("/competitions/" + leagueCode + "/matches");
  return (json.matches || []).map(mapFixtureRow);
}

// Fonctions pures (pas d'appel réseau) : on leur passe la liste déjà
// récupérée par getSeasonFixtures.
function filterRecentFixtures(allFixtures, count) {
  return allFixtures
    .filter(f => f.finished)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, count || 30)
    .reverse();
}

function filterUpcomingFixtures(allFixtures, count) {
  return allFixtures
    .filter(f => !f.finished)
    .sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0))
    .slice(0, count || 15);
}

async function getStandings(leagueCode) {
  const json = await footballDataFetch("/competitions/" + leagueCode + "/standings");
  const competitionName = json.competition && json.competition.name ? json.competition.name : "Classement";
  const totalTable = (json.standings || []).find(s => s.type === "TOTAL");
  if (!totalTable) return [];
  return [{
    label: competitionName,
    teams: (totalTable.table || []).map(row => ({
      team: row.team.name,
      played: row.playedGames,
      wins: row.won,
      draws: row.draw,
      losses: row.lost,
      gf: row.goalsFor,
      ga: row.goalsAgainst,
      gd: row.goalDifference,
      points: row.points
    }))
  }];
}

module.exports = { getSeasonFixtures, filterRecentFixtures, filterUpcomingFixtures, getStandings, statusToLabel };
