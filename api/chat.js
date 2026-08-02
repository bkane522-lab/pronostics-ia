const VERSION = "V9_MULTI_CHAMPIONNATS";

const { LEAGUES, DEFAULT_LEAGUE, findLeague } = require("./leagues");
const { getRecentFixtures, getUpcomingFixtures, getStandings, statusToLabel } = require("./api-football");

// -----------------------------------------------------------------------
// IMPORTANT (bug corrigé par rapport à la V8.1) :
// en V8.1, les données étaient chargées UNE FOIS au démarrage du module et
// stockées dans des variables globales (let GROUPS/RESULTS/UPCOMING...).
// Ça fonctionnait car il n'y avait qu'un seul jeu de données (la CDM).
// En V9, plusieurs championnats peuvent être demandés par des requêtes
// concurrentes sur la même instance serverless "chaude". Utiliser des
// variables globales mutables ferait fuiter les données d'un championnat
// vers la réponse d'un autre. Toutes les fonctions ci-dessous reçoivent donc
// désormais un objet "ctx" en paramètre au lieu de lire des variables globales.
// -----------------------------------------------------------------------

function clean(v) {
  return String(v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function canon(name, ctx) {
  const x = clean(name);
  for (const group of ctx.GROUPS) {
    for (const team of group[1]) {
      if (clean(team) === x) return team;
    }
  }
  const aliases = {
    "senegal": "Sénégal", "cote ivoire": "Côte d’Ivoire", "cote d ivoire": "Côte d’Ivoire", "cote divoire": "Côte d’Ivoire",
    "coree du sud": "Corée du Sud", "rd congo": "RD Congo", "nouvelle zelande": "Nouvelle-Zélande", "egypte": "Égypte",
    "equateur": "Équateur", "haiti": "Haïti", "bresil": "Brésil", "suede": "Suède", "curacao": "Curaçao", "pays bas": "Pays-Bas",
    "arabie saoudite": "Arabie Saoudite", "cap vert": "Cap-Vert", "usa": "USA", "afrique du sud": "Afrique du Sud",
    "psg": "Paris Saint Germain", "om": "Marseille", "real": "Real Madrid", "barca": "Barcelona"
  };
  return aliases[x] || String(name || "").trim();
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch (e) { return {}; }
  }
  return req.body;
}

function parseMatch(input) {
  let raw = String(input || "")
    .replace(/CDM\s*2026/gi, "")
    .replace(/Coupe du Monde\s*2026/gi, "")
    .replace(/Groupe\s+[A-L]/gi, "")
    .trim();
  let parts = null;
  if (/\s+vs\s+/i.test(raw)) parts = raw.split(/\s+vs\s+/i);
  else if (/\s+contre\s+/i.test(raw)) parts = raw.split(/\s+contre\s+/i);
  else if (/\s+-\s+/i.test(raw)) parts = raw.split(/\s+-\s+/i);
  if (!parts || parts.length < 2) return null;
  return { aRaw: parts[0], bRaw: parts[1] };
}

function makeMatch(row) { return { date: row[0], group: row[1], home: row[2], away: row[3], hg: row[4], ag: row[5] }; }
function makeUpcoming(row) { return { date: row[0], group: row[1], home: row[2], away: row[3], status: row[4] || "À venir" }; }

function findGroup(a, b, ctx) {
  for (const g of ctx.GROUPS) {
    const hasA = g[1].some(t => clean(t) === clean(a));
    const hasB = g[1].some(t => clean(t) === clean(b));
    if (hasA && hasB) return g[0];
  }
  return "";
}

function findCompleted(a, b, ctx) {
  for (const row of ctx.RESULTS) {
    const m = makeMatch(row);
    const same = clean(m.home) === clean(a) && clean(m.away) === clean(b);
    const reverse = clean(m.home) === clean(b) && clean(m.away) === clean(a);
    if (same || reverse) return m;
  }
  return null;
}

function scoreFor(match, team) {
  if (clean(match.home) === clean(team)) return { gf: match.hg, ga: match.ag };
  if (clean(match.away) === clean(team)) return { gf: match.ag, ga: match.hg };
  return { gf: 0, ga: 0 };
}

// Calcule les stats (forme, BTTS, over/under, clean sheets) à partir de
// l'échantillon de résultats chargé (ctx.RESULTS). En mode live, c'est les
// N derniers matchs du championnat récupérés via API-Football.
function statsFromResults(team, ctx) {
  const s = { team, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0, points: 0, avgGF: 0, avgGA: 0, cleanSheets: 0, btts: 0, over15: 0, over25: 0, form: [] };
  for (const row of ctx.RESULTS) {
    const m = makeMatch(row);
    if (clean(m.home) !== clean(team) && clean(m.away) !== clean(team)) continue;
    const sc = scoreFor(m, team);
    const totalGoals = m.hg + m.ag;
    s.played++; s.gf += sc.gf; s.ga += sc.ga;
    if (sc.ga === 0) s.cleanSheets++;
    if (m.hg > 0 && m.ag > 0) s.btts++;
    if (totalGoals >= 2) s.over15++;
    if (totalGoals >= 3) s.over25++;
    if (sc.gf > sc.ga) { s.wins++; s.points += 3; s.form.push("V"); }
    else if (sc.gf === sc.ga) { s.draws++; s.points += 1; s.form.push("N"); }
    else { s.losses++; s.form.push("D"); }
  }
  s.gd = s.gf - s.ga;
  if (s.played > 0) { s.avgGF = Number((s.gf / s.played).toFixed(2)); s.avgGA = Number((s.ga / s.played).toFixed(2)); }
  return s;
}

// Stats "officielles" : on préfère les totaux du classement API-Football
// (saison complète) aux totaux calculés sur l'échantillon de derniers
// matchs (plus fiable pour points/GD/buts). La forme, BTTS et over/under
// restent calculés sur l'échantillon récent (ctx.RESULTS).
function stats(team, ctx) {
  const s = statsFromResults(team, ctx);
  const key = clean(team);
  if (ctx.STANDINGS_MAP && ctx.STANDINGS_MAP.has(key)) {
    const official = ctx.STANDINGS_MAP.get(key);
    s.played = official.played; s.wins = official.wins; s.draws = official.draws; s.losses = official.losses;
    s.gf = official.gf; s.ga = official.ga; s.gd = official.gd; s.points = official.points;
    if (s.played > 0) { s.avgGF = Number((s.gf / s.played).toFixed(2)); s.avgGA = Number((s.ga / s.played).toFixed(2)); }
  }
  return s;
}

function pct(v, total) { return total ? Math.round((v / total) * 100) : 0; }

function formatStats(s) {
  if (!s || s.played === 0) return s.team + " : aucune statistique disponible.";
  return s.team + " : " + s.played + " match(s), " + s.wins + "V, " + s.draws + "N, " + s.losses + "D, " +
    s.gf + " but(s) marqué(s), " + s.ga + " encaissé(s), diff " + (s.gd >= 0 ? "+" : "") + s.gd + ", " +
    s.points + " pt(s), clean sheet " + pct(s.cleanSheets, s.played) + "%, BTTS " + pct(s.btts, s.played) +
    "%, Over 1.5 " + pct(s.over15, s.played) + "%, forme " + (s.form.length ? s.form.join("-") : "N/D");
}

function groupTable(groupName, ctx) {
  const group = ctx.GROUPS.find(g => g[0] === groupName);
  if (!group) return [];
  const table = group[1].map(team => stats(team, ctx));
  table.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.team.localeCompare(b.team);
  });
  return table;
}

function tableText(groupName, ctx) {
  const table = groupTable(groupName, ctx);
  if (!table.length) return "Classement indisponible.";
  return table.map((t, i) => (i + 1) + ". " + t.team + " " + t.points + " pts diff " + (t.gd >= 0 ? "+" : "") + t.gd).join(" | ");
}

function makePrediction(a, b, sa, sb) {
  const total = sa.played + sb.played;
  if (total < 2) {
    return { confidence: 35, result: "À éviter", doubleChance: "Pas de choix clair", overUnder: "À éviter", btts: "À éviter", score: "À éviter", winner: "Données insuffisantes", best: "Aucun pari fort conseillé", risk: "Risque élevé", confResult: 20, confDouble: 25, confOver: 25, confBtts: 20, confScore: 10, verdict: "Données trop limitées. Aucun pari fort conseillé." };
  }
  const powerA = sa.points * 8 + sa.gd * 3 + sa.gf * 2 + sa.wins * 5 - sa.ga;
  const powerB = sb.points * 8 + sb.gd * 3 + sb.gf * 2 + sb.wins * 5 - sb.ga;
  const diff = powerA - powerB;
  let result = "X", winner = "Match serré", doubleChance = "Pas de choix clair", confidence = 52;
  if (diff >= 12) { result = "1"; winner = a; doubleChance = "1X"; confidence = 62; }
  if (diff <= -12) { result = "2"; winner = b; doubleChance = "X2"; confidence = 62; }
  const avgGoals = sa.avgGF + sb.avgGF;
  let overUnder = "Ligne buts à éviter", confOver = 35;
  if (avgGoals >= 2.4) { overUnder = "Over 1.5 prudent"; confOver = 58; }
  else if (avgGoals <= 1.8) { overUnder = "Under 3.5 prudent"; confOver = 60; }
  let btts = "À éviter", confBtts = 30;
  if (sa.avgGF >= 1 && sb.avgGF >= 1 && sa.avgGA >= 0.7 && sb.avgGA >= 0.7) { btts = "Oui possible"; confBtts = 48; }
  const scoreA = Math.max(0, Math.round((sa.avgGF + sb.avgGA) / 2));
  const scoreB = Math.max(0, Math.round((sb.avgGF + sa.avgGA) / 2));
  let risk = "Risque moyen/élevé";
  if (total >= 4 && Math.abs(diff) >= 8) risk = "Risque modéré";
  let best = "Aucun pari fort conseillé";
  if (overUnder === "Under 3.5 prudent") best = "Option prudente : Under 3.5";
  if (overUnder === "Over 1.5 prudent") best = "Option prudente : Over 1.5";
  if (doubleChance !== "Pas de choix clair" && confidence >= 60) best = "Option prudente : Double chance " + doubleChance;
  return { confidence, result, doubleChance, overUnder, btts, score: scoreA + "-" + scoreB, winner, best, risk, confResult: confidence, confDouble: doubleChance === "Pas de choix clair" ? 35 : Math.min(75, confidence + 10), confOver, confBtts, confScore: 18, verdict: best + ". " + risk + ". Analyse basée sur les données statistiques enregistrées." };
}

function scorerTips(a, b, sa, sb) {
  const confA = sa.played ? Math.min(55, Math.round(25 + sa.avgGF * 15)) : 20;
  const confB = sb.played ? Math.min(55, Math.round(25 + sb.avgGF * 15)) : 20;
  const doubleConf = Math.max(10, Math.min(30, Math.round((sa.avgGF + sb.avgGF) * 8)));
  return [
    { type: "Buteur équipe A", equipe: a, valeur: confA >= 45 ? "Buteur à surveiller" : "Buteur à éviter", confiance: confA, raison: a + " marque en moyenne " + sa.avgGF + " but(s)/match." },
    { type: "Buteur équipe B", equipe: b, valeur: confB >= 45 ? "Buteur à surveiller" : "Buteur à éviter", confiance: confB, raison: b + " marque en moyenne " + sb.avgGF + " but(s)/match." },
    { type: "Doublé", equipe: "Tous", valeur: "À éviter", confiance: doubleConf, raison: "Pari très risqué sans compositions officielles et tireur de penalties." }
  ];
}

function completedResponse(a, b, m, ctx) {
  const sa = stats(a, ctx), sb = stats(b, ctx), scA = scoreFor(m, a), scB = scoreFor(m, b);
  const finalScore = m.home + " " + m.hg + "-" + m.ag + " " + m.away;
  let winner = "Match nul", loser = "Aucun";
  if (m.hg > m.ag) { winner = m.home; loser = m.away; } else if (m.ag > m.hg) { winner = m.away; loser = m.home; }
  return {
    match: a + " - " + b, competition: "Match terminé — " + ctx.league.label, date_info: m.date + " · " + m.group, is_world_cup: !ctx.league.live, group: m.group, niveau_confiance_global: 100,
    pari_du_jour: { type: "Match terminé", valeur: finalScore, raison: "Ce match est déjà joué. Aucun pari possible sur ce match.", cote_estimee: "N/D" },
    stats_techniques: {
      buts_marques_A: { valeur: scA.gf, detail: a + " : " + scA.gf + " but(s) dans ce match. Total échantillon : " + sa.gf },
      buts_encaisses_A: { valeur: scA.ga, detail: a + " : " + scA.ga + " but(s) encaissé(s). Total échantillon : " + sa.ga },
      buts_marques_B: { valeur: scB.gf, detail: b + " : " + scB.gf + " but(s) dans ce match. Total échantillon : " + sb.gf },
      buts_encaisses_B: { valeur: scB.ga, detail: b + " : " + scB.ga + " but(s) encaissé(s). Total échantillon : " + sb.ga },
      rapport_force: { detail: "Résultat final : " + finalScore }
    },
    pronostics: {
      resultat_1x2: { valeur: "Terminé", label: "Match terminé", confiance: 100, cote_estimee: "" }, over_under: { valeur: "Non applicable", confiance: 100, cote_estimee: "" }, btts: { valeur: m.hg > 0 && m.ag > 0 ? "Oui" : "Non", confiance: 100, cote_estimee: "" }, double_chance: { valeur: "Non applicable", confiance: 100, cote_estimee: "" }, handicap: { valeur: "Non applicable", confiance: 100, cote_estimee: "" }, premier_but: { valeur: "Non disponible", confiance: 0, cote_estimee: "" }, mi_temps_fin: { valeur: "Non disponible", confiance: 0, cote_estimee: "" }, cage_inviolee: { valeur: m.hg === 0 || m.ag === 0 ? "Oui" : "Non", confiance: 100, cote_estimee: "" }, score_exact: { valeur: m.hg + "-" + m.ag, confiance: 100, cote_estimee: "" }, winner: { valeur: winner, confiance: 100 }, perdant: { valeur: loser, confiance: loser === "Aucun" ? 0 : 100 }
    },
    analyse_approfondie: { forces_A: formatStats(sa), faiblesses_A: "Moyenne encaissée : " + sa.avgGA + " but(s)/match.", forces_B: formatStats(sb), faiblesses_B: "Moyenne encaissée : " + sb.avgGA + " but(s)/match.", facteur_cle: "Résultat final connu : " + finalScore + ". Aucun pari conseillé car le match est terminé." },
    analysis: {}, buteurs_potentiels: [], verdict: "Match terminé : " + finalScore + ". Aucun pari possible sur ce match."
  };
}

function upcomingResponse(a, b, ctx) {
  const group = findGroup(a, b, ctx), sa = stats(a, ctx), sb = stats(b, ctx), p = makePrediction(a, b, sa, sb), classement = tableText(group, ctx);
  return {
    match: a + " - " + b, competition: "Match à venir / statistiques — " + ctx.league.label, date_info: group || ctx.league.label, is_world_cup: !ctx.league.live, group, niveau_confiance_global: p.confidence,
    pari_du_jour: { type: "Analyse prudente", valeur: p.best, raison: p.verdict, cote_estimee: "N/D" },
    stats_techniques: {
      buts_marques_A: { valeur: sa.avgGF, detail: a + " : " + sa.gf + " but(s) marqué(s) en " + sa.played + " match(s). Moyenne : " + sa.avgGF },
      buts_encaisses_A: { valeur: sa.avgGA, detail: a + " : " + sa.ga + " but(s) encaissé(s). Moyenne : " + sa.avgGA },
      buts_marques_B: { valeur: sb.avgGF, detail: b + " : " + sb.gf + " but(s) marqué(s) en " + sb.played + " match(s). Moyenne : " + sb.avgGF },
      buts_encaisses_B: { valeur: sb.avgGA, detail: b + " : " + sb.ga + " but(s) encaissé(s). Moyenne : " + sb.avgGA },
      rapport_force: { detail: "Classement " + group + " : " + classement }
    },
    pronostics: {
      resultat_1x2: { valeur: p.result, label: p.winner, confiance: p.confResult, cote_estimee: "" }, over_under: { valeur: p.overUnder, confiance: p.confOver, cote_estimee: "" }, btts: { valeur: p.btts, confiance: p.confBtts, cote_estimee: "" }, double_chance: { valeur: p.doubleChance, confiance: p.confDouble, cote_estimee: "" }, handicap: { valeur: "À éviter", confiance: 30, cote_estimee: "" }, premier_but: { valeur: "À éviter", confiance: 25, cote_estimee: "" }, mi_temps_fin: { valeur: "À éviter", confiance: 25, cote_estimee: "" }, cage_inviolee: { valeur: "À éviter", confiance: 25, cote_estimee: "" }, score_exact: { valeur: p.score, confiance: p.confScore, cote_estimee: "" }, winner: { valeur: p.winner, confiance: p.confResult }, perdant: { valeur: "Données insuffisantes", confiance: 0 }
    },
    analyse_approfondie: { forces_A: formatStats(sa), faiblesses_A: "Moyenne encaissée : " + sa.avgGA + " but(s)/match. Tendance : Over 1.5 " + pct(sa.over15, sa.played) + "%, BTTS " + pct(sa.btts, sa.played) + "%.", forces_B: formatStats(sb), faiblesses_B: "Moyenne encaissée : " + sb.avgGA + " but(s)/match. Tendance : Over 1.5 " + pct(sb.over15, sb.played) + "%, BTTS " + pct(sb.btts, sb.played) + "%.", facteur_cle: "Niveau de risque : " + p.risk + ". Classement : " + classement + ". Meilleure lecture prudente : " + p.best + "." },
    analysis: {}, buteurs_potentiels: scorerTips(a, b, sa, sb), verdict: p.verdict
  };
}

function dashboardResponse(ctx) {
  return {
    ok: true, version: VERSION, league: ctx.league.slug, league_label: ctx.league.label, data_version: ctx.dataVersion, data_loaded: ctx.loadError ? false : true, load_error: ctx.loadError,
    results_count: ctx.RESULTS.length, upcoming_count: ctx.UPCOMING.length,
    recent: ctx.RESULTS.slice(-10).reverse().map(makeMatch),
    upcoming: ctx.UPCOMING.map(makeUpcoming),
    standings: ctx.GROUPS.map(g => ({ group: g[0], teams: groupTable(g[0], ctx) })),
    leagues: LEAGUES.map(l => ({ slug: l.slug, label: l.label, live: l.live }))
  };
}

function errorResponse(message, leagueSlug) {
  return {
    match: "Erreur contrôlée", competition: "Version stable " + VERSION, date_info: VERSION, is_world_cup: false, group: "", niveau_confiance_global: 0, league: leagueSlug || DEFAULT_LEAGUE,
    pari_du_jour: { type: "Erreur contrôlée", valeur: "API stable", raison: message || "Erreur inconnue", cote_estimee: "N/D" },
    stats_techniques: null,
    pronostics: { resultat_1x2: { valeur: "Erreur", label: "Erreur contrôlée", confiance: 0, cote_estimee: "" }, over_under: { valeur: "Erreur", confiance: 0, cote_estimee: "" }, btts: { valeur: "Erreur", confiance: 0, cote_estimee: "" }, double_chance: { valeur: "Erreur", confiance: 0, cote_estimee: "" }, handicap: { valeur: "Erreur", confiance: 0, cote_estimee: "" }, premier_but: { valeur: "Erreur", confiance: 0, cote_estimee: "" }, mi_temps_fin: { valeur: "Erreur", confiance: 0, cote_estimee: "" }, cage_inviolee: { valeur: "Erreur", confiance: 0, cote_estimee: "" }, score_exact: { valeur: "Erreur", confiance: 0, cote_estimee: "" }, winner: { valeur: "Erreur", confiance: 0 }, perdant: { valeur: "Erreur", confiance: 0 } },
    analyse_approfondie: { forces_A: "Erreur contrôlée.", faiblesses_A: "Le serveur n’a pas crashé.", forces_B: "Erreur contrôlée.", faiblesses_B: "Corrigeable sans casser l’app.", facteur_cle: "Message technique : " + (message || "Erreur inconnue") },
    analysis: {}, buteurs_potentiels: [], verdict: "Erreur contrôlée : le serveur répond quand même en JSON."
  };
}

// Charge les données d'un championnat. Ne modifie AUCUNE variable globale :
// tout est renvoyé dans un objet "ctx" propre à cette requête.
async function loadContext(leagueSlug) {
  const league = findLeague(leagueSlug);

  if (!league.live) {
    // Mode démo local (utilisé uniquement si un jour un championnat non-live est réajouté).
    try {
      const data = require("./data");
      return {
        league, loadError: "",
        dataVersion: data.DATA_VERSION || "DATA_SANS_VERSION",
        GROUPS: data.GROUPS || [], RESULTS: data.RESULTS || [], UPCOMING: data.UPCOMING || [],
        STANDINGS_MAP: null
      };
    } catch (e) {
      return { league, loadError: e.message || "Impossible de charger api/data.js", dataVersion: "DATA_NON_CHARGEE", GROUPS: [], RESULTS: [], UPCOMING: [], STANDINGS_MAP: null };
    }
  }

  // Mode live : API-Football.
  try {
    const [standingsBlocks, recent, upcoming] = await Promise.all([
      getStandings(league.apiId, league.season),
      getRecentFixtures(league.apiId, league.season, 30),
      getUpcomingFixtures(league.apiId, league.season, 15)
    ]);
    const GROUPS = standingsBlocks.map(b => [b.label, b.teams.map(t => t.team)]);
    const STANDINGS_MAP = new Map();
    standingsBlocks.forEach(b => b.teams.forEach(t => STANDINGS_MAP.set(clean(t.team), t)));
    const RESULTS = recent.map(f => [f.date, f.round, f.home, f.away, f.hg, f.ag]);
    const UPCOMING = upcoming.map(f => [f.date, f.round, f.home, f.away, statusToLabel(f.status)]);
    return {
      league, loadError: "",
      dataVersion: league.slug + "_" + league.season + "_LIVE",
      GROUPS, RESULTS, UPCOMING, STANDINGS_MAP
    };
  } catch (e) {
    return { league, loadError: e.message || "Erreur API-Football", dataVersion: "DATA_NON_CHARGEE", GROUPS: [], RESULTS: [], UPCOMING: [], STANDINGS_MAP: null };
  }
}

module.exports = async function handler(req, res) {
  try {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    const url = new URL(req.url || "/api/chat", "https://pronostics-ia.local");

    if (req.method === "GET") {
      const leagueSlug = url.searchParams.get("league") || DEFAULT_LEAGUE;
      if (url.searchParams.get("dashboard") === "1") {
        const ctx = await loadContext(leagueSlug);
        return res.status(200).json(dashboardResponse(ctx));
      }
      return res.status(200).json({
        ok: true, version: VERSION, message: "API active V9. Dashboard: /api/chat?dashboard=1&league=<slug>",
        leagues: LEAGUES.map(l => ({ slug: l.slug, label: l.label, live: l.live }))
      });
    }

    if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée." });

    const body = parseBody(req);
    const leagueSlug = body.league || DEFAULT_LEAGUE;
    const ctx = await loadContext(leagueSlug);
    if (ctx.loadError) return res.status(200).json(errorResponse("Chargement des données impossible (" + ctx.league.label + ") : " + ctx.loadError, leagueSlug));

    const parsed = parseMatch(body.match);
    if (!parsed) return res.status(400).json({ error: "Écris un match complet, exemple : PSG vs Marseille." });
    const a = canon(parsed.aRaw, ctx), b = canon(parsed.bRaw, ctx);

    const completed = findCompleted(a, b, ctx);
    if (completed) return res.status(200).json(completedResponse(a, b, completed, ctx));
    return res.status(200).json(upcomingResponse(a, b, ctx));
  } catch (e) {
    return res.status(200).json(errorResponse(e.message));
  }
};
