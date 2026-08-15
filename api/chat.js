const VERSION = "V14_AI_VALUE_LAB";

const { LEAGUES, DEFAULT_LEAGUE, findLeague } = require("./leagues");
const {
  getSeasonFixtures,
  filterRecentFixtures,
  filterUpcomingFixtures,
  getStandings,
  statusToLabel
} = require("./api-football");

const {
  LIGUE1_2026_2027,
  getClubByName
} = require("./knowledge/ligue1-2026-2027");

// -----------------------------------------------------------------------------
// Pronostics IA Pro — V9.8
// - données dynamiques : football-data.org
// - contexte Ligue 1 2026-2027 : base éditoriale structurée du guide fourni
//   par l'utilisateur
// - le contexte éditorial complète les statistiques mais ne les remplace jamais
// -----------------------------------------------------------------------------

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

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch (_) { return {}; }
  }
  return req.body;
}

function parseMatch(input) {
  const raw = String(input || "")
    .replace(/CDM\s*2026/gi, "")
    .replace(/Coupe du Monde\s*2026/gi, "")
    .replace(/Groupe\s+[A-L]/gi, "")
    .trim();

  let parts = null;
  if (/\s+vs\s+/i.test(raw)) parts = raw.split(/\s+vs\s+/i);
  else if (/\s+contre\s+/i.test(raw)) parts = raw.split(/\s+contre\s+/i);
  else if (/\s+-\s+/i.test(raw)) parts = raw.split(/\s+-\s+/i);

  if (!parts || parts.length < 2) return null;
  return { aRaw: parts[0].trim(), bRaw: parts[1].trim() };
}

function canon(name, ctx) {
  const x = clean(name);

  for (const group of ctx.GROUPS || []) {
    for (const team of group[1] || []) {
      if (clean(team) === x) return team;
    }
  }

  const aliases = {
    "psg": "Paris Saint-Germain",
    "paris sg": "Paris Saint-Germain",
    "paris saint germain": "Paris Saint-Germain",
    "om": "Olympique de Marseille",
    "marseille": "Olympique de Marseille",
    "ol": "Olympique Lyonnais",
    "lyon": "Olympique Lyonnais",
    "monaco": "AS Monaco",
    "auxerre": "AJ Auxerre",
    "angers": "Angers SCO",
    "troyes": "ESTAC Troyes",
    "lorient": "FC Lorient",
    "le havre": "Le Havre AC",
    "le mans": "Le Mans FC",
    "lille": "LOSC Lille",
    "nice": "OGC Nice",
    "paris fc": "Paris FC",
    "lens": "RC Lens",
    "strasbourg": "RC Strasbourg Alsace",
    "brest": "Stade Brestois 29",
    "rennes": "Stade Rennais FC",
    "toulouse": "Toulouse FC",
    "real": "Real Madrid",
    "barca": "Barcelona"
  };

  const alias = aliases[x];
  if (alias) {
    for (const group of ctx.GROUPS || []) {
      for (const team of group[1] || []) {
        if (clean(team) === clean(alias) || clean(team).includes(clean(alias)) || clean(alias).includes(clean(team))) {
          return team;
        }
      }
    }
    return alias;
  }

  return String(name || "").trim();
}

function makeMatch(row) {
  return { date: row[0], group: row[1], home: row[2], away: row[3], hg: row[4], ag: row[5] };
}

function makeUpcoming(row) {
  return { date: row[0], group: row[1], home: row[2], away: row[3], status: row[4] || "À venir" };
}

function findGroup(a, b, ctx) {
  for (const g of ctx.GROUPS || []) {
    const hasA = (g[1] || []).some(t => clean(t) === clean(a));
    const hasB = (g[1] || []).some(t => clean(t) === clean(b));
    if (hasA && hasB) return g[0];
  }
  return "";
}

function findCompleted(a, b, ctx) {
  for (const row of ctx.RESULTS || []) {
    const m = makeMatch(row);
    const same = clean(m.home) === clean(a) && clean(m.away) === clean(b);
    const reverse = clean(m.home) === clean(b) && clean(m.away) === clean(a);
    if (same || reverse) return m;
  }
  return null;
}

function scoreFor(match, team) {
  if (clean(match.home) === clean(team)) return { gf: Number(match.hg) || 0, ga: Number(match.ag) || 0 };
  if (clean(match.away) === clean(team)) return { gf: Number(match.ag) || 0, ga: Number(match.hg) || 0 };
  return { gf: 0, ga: 0 };
}

function statsFromResults(team, ctx) {
  const s = {
    team, played: 0, wins: 0, draws: 0, losses: 0,
    gf: 0, ga: 0, gd: 0, points: 0,
    avgGF: 0, avgGA: 0, cleanSheets: 0,
    btts: 0, over15: 0, over25: 0, form: []
  };

  for (const row of ctx.RESULTS || []) {
    const m = makeMatch(row);
    if (clean(m.home) !== clean(team) && clean(m.away) !== clean(team)) continue;

    const sc = scoreFor(m, team);
    const totalGoals = Number(m.hg || 0) + Number(m.ag || 0);

    s.played++;
    s.gf += sc.gf;
    s.ga += sc.ga;

    if (sc.ga === 0) s.cleanSheets++;
    if (Number(m.hg) > 0 && Number(m.ag) > 0) s.btts++;
    if (totalGoals >= 2) s.over15++;
    if (totalGoals >= 3) s.over25++;

    if (sc.gf > sc.ga) {
      s.wins++;
      s.points += 3;
      s.form.push("V");
    } else if (sc.gf === sc.ga) {
      s.draws++;
      s.points++;
      s.form.push("N");
    } else {
      s.losses++;
      s.form.push("D");
    }
  }

  s.gd = s.gf - s.ga;
  if (s.played > 0) {
    s.avgGF = Number((s.gf / s.played).toFixed(2));
    s.avgGA = Number((s.ga / s.played).toFixed(2));
  }
  return s;
}

function stats(team, ctx) {
  const s = statsFromResults(team, ctx);
  const key = clean(team);

  if (ctx.STANDINGS_MAP && ctx.STANDINGS_MAP.has(key)) {
    const official = ctx.STANDINGS_MAP.get(key);
    s.played = Number(official.played) || 0;
    s.wins = Number(official.wins) || 0;
    s.draws = Number(official.draws) || 0;
    s.losses = Number(official.losses) || 0;
    s.gf = Number(official.gf) || 0;
    s.ga = Number(official.ga) || 0;
    s.gd = Number(official.gd) || 0;
    s.points = Number(official.points) || 0;

    if (s.played > 0) {
      s.avgGF = Number((s.gf / s.played).toFixed(2));
      s.avgGA = Number((s.ga / s.played).toFixed(2));
    }
  }

  return s;
}

function pct(v, total) {
  return total ? Math.round((v / total) * 100) : 0;
}

function formatStats(s) {
  if (!s || s.played === 0) return (s ? s.team : "Équipe") + " : aucune statistique dynamique disponible.";
  return s.team + " : " + s.played + " match(s), " +
    s.wins + "V, " + s.draws + "N, " + s.losses + "D, " +
    s.gf + " but(s) marqué(s), " + s.ga + " encaissé(s), diff " +
    (s.gd >= 0 ? "+" : "") + s.gd + ", " + s.points + " pt(s), " +
    "clean sheet " + pct(s.cleanSheets, s.played) + "%, BTTS " +
    pct(s.btts, s.played) + "%, Over 1.5 " + pct(s.over15, s.played) +
    "%, forme " + (s.form.length ? s.form.join("-") : "N/D");
}

function groupTable(groupName, ctx) {
  const group = (ctx.GROUPS || []).find(g => g[0] === groupName);
  if (!group) return [];

  const table = (group[1] || []).map(team => stats(team, ctx));
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
  return table
    .map((t, i) => (i + 1) + ". " + t.team + " " + t.points + " pts diff " + (t.gd >= 0 ? "+" : "") + t.gd)
    .join(" | ");
}

// ------------------------- Base contextuelle Ligue 1 -------------------------

function isLigue1(ctx) {
  const slug = clean(ctx && ctx.league && ctx.league.slug);
  const label = clean(ctx && ctx.league && ctx.league.label);
  return slug === "ligue 1" ||
    slug === "ligue1" ||
    slug === "trophee des champions" ||
    slug === "trophee-des-champions" ||
    label.includes("ligue 1") ||
    label.includes("trophee des champions");
}

function knowledgeForTeam(team, ctx) {
  if (!isLigue1(ctx)) return null;

  let found = getClubByName(team);
  if (found) return found;

  const q = clean(team);
  const aliases = {
    "paris saint germain": "Paris Saint-Germain",
    "paris sg": "Paris Saint-Germain",
    "psg": "Paris Saint-Germain",
    "marseille": "Olympique de Marseille",
    "olympique marseille": "Olympique de Marseille",
    "lyon": "Olympique Lyonnais",
    "olympique lyon": "Olympique Lyonnais",
    "monaco": "AS Monaco",
    "lille": "LOSC Lille",
    "lens": "RC Lens",
    "strasbourg": "RC Strasbourg Alsace",
    "rennes": "Stade Rennais FC",
    "brest": "Stade Brestois 29",
    "auxerre": "AJ Auxerre",
    "angers": "Angers SCO",
    "troyes": "ESTAC Troyes",
    "lorient": "FC Lorient",
    "havre": "Le Havre AC",
    "mans": "Le Mans FC",
    "nice": "OGC Nice",
    "toulouse": "Toulouse FC"
  };

  for (const [needle, official] of Object.entries(aliases)) {
    if (q.includes(needle) || needle.includes(q)) {
      found = getClubByName(official);
      if (found) return found;
    }
  }

  return null;
}

function parseGuideRank(text) {
  const nums = String(text || "").match(/\d+/g);
  if (!nums || !nums.length) return null;
  const values = nums.map(Number).filter(Number.isFinite);
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function strengthValue(v) {
  const s = clean(v);
  if (s.includes("excellente")) return 5;
  if (s.includes("tres forte")) return 4.7;
  if (s.includes("plutot forte")) return 4;
  if (s.includes("forte")) return 4.2;
  if (s.includes("moyenne a correcte")) return 3.1;
  if (s.includes("correcte")) return 3.2;
  if (s.includes("moyenne")) return 2.8;
  return 3;
}

function editorialPower(k) {
  if (!k) return 0;

  const rank = parseGuideRank(k.guide_prediction);
  let rankScore = 0;
  if (rank !== null) {
    // 1er ≈ +6 ; 18e ≈ -6. Ce bonus reste volontairement faible.
    rankScore = Math.max(-6, Math.min(6, (9.5 - rank) * 0.7));
  }

  const st = k.strengths || {};
  const quality = (
    strengthValue(st.attack) +
    strengthValue(st.defense) +
    strengthValue(st.coach)
  ) / 3;

  const qualityScore = Math.max(-2, Math.min(2, (quality - 3.5) * 1.5));
  return Number((rankScore + qualityScore).toFixed(2));
}

function knowledgeSummary(k) {
  if (!k) return null;
  return {
    club: k.club,
    season: k.season,
    coach: k.coach || null,
    formation_reference: k.formation || null,
    objectif: k.objective || null,
    pronostic_guide: k.guide_prediction || null,
    forces_guide: k.strengths || null,
    profils: k.profile || [],
    visages: k.faces || {},
    joueur_a_surveiller: k.watch || null,
    onze_reference: k.lineup || [],
    source: "Base contextuelle Ligue 1 2026-2027 — source éditoriale secondaire"
  };
}

function contextText(k) {
  if (!k) return "Aucun contexte éditorial interne disponible.";
  const star = k.faces && k.faces.star ? k.faces.star.name : "N/D";
  const cadre = k.faces && k.faces.cadre ? k.faces.cadre.name : "N/D";
  return [
    "Objectif : " + (k.objective || "N/D"),
    "projection guide : " + (k.guide_prediction || "N/D"),
    "formation de référence : " + (k.formation || "N/D"),
    "coach : " + (k.coach || "N/D"),
    "star : " + star,
    "cadre : " + cadre
  ].join(" ; ") + ".";
}

function offensiveCandidate(k) {
  if (!k) return null;

  const candidates = [];
  if (k.faces) {
    for (const key of ["star", "jeune", "cadre", "recrue", "prodige"]) {
      if (k.faces[key]) candidates.push(k.faces[key]);
    }
  }
  if (k.watch) candidates.push(k.watch);

  const offensive = candidates.find(x => {
    const role = clean(x.role);
    return role.includes("attaquant") || role.includes("ailier") || role.includes("milieu offensif");
  });

  return offensive || null;
}

// ------------------------------- Prédiction ---------------------------------



function teamFaceName(k, key) {
  return k && k.faces && k.faces[key] && k.faces[key].name
    ? k.faces[key].name
    : null;
}

function buildThreats(k, side) {
  if (!k) return [];
  const out = [];
  const push = (name, role, level, reason) => {
    if (!name) return;
    if (out.some(x => clean(x.name) === clean(name))) return;
    out.push({ name, role: role || "", level, reason });
  };

  if (k.faces) {
    for (const key of ["star", "jeune", "cadre", "recrue", "prodige"]) {
      const p = k.faces[key];
      if (!p) continue;
      const role = clean(p.role);
      if (role.includes("attaquant") || role.includes("ailier") || role.includes("milieu offensif")) {
        push(
          p.name,
          p.role,
          key === "star" ? "élevé" : "moyen/élevé",
          (key === "star" ? "Star offensive du profil de saison." : "Profil offensif identifié dans la base de saison.")
        );
      }
    }
  }

  if (k.watch) {
    const role = clean(k.watch.role);
    if (role.includes("attaquant") || role.includes("ailier") || role.includes("milieu offensif")) {
      push(k.watch.name, k.watch.role, "moyen", "Joueur à surveiller identifié dans la base de saison.");
    }
  }

  return out.slice(0, 3).map((x, i) => ({
    rank: i + 1,
    side,
    name: x.name,
    role: x.role,
    threat_level: x.level,
    reason: x.reason,
    lineup_status: "Titularisation à confirmer"
  }));
}

function buildTeamIntel(k, teamName) {
  if (!k) return null;
  const positives = [];
  const cautions = [];

  const st = k.strengths || {};
  if (strengthValue(st.attack) >= 4) positives.push("potentiel offensif élevé");
  if (strengthValue(st.defense) >= 4) positives.push("base défensive solide");
  if (strengthValue(st.coach) >= 4) positives.push("coach valorisé");
  if (k.formation) positives.push("structure " + k.formation);
  if ((k.profile || []).some(x => clean(x).includes("stabil"))) positives.push("stabilité du projet");
  if ((k.profile || []).some(x => clean(x).includes("jeun"))) positives.push("jeunesse et marge de progression");
  if ((k.profile || []).some(x => clean(x).includes("transition"))) cautions.push("effectif / projet en transition");
  if ((k.profile || []).some(x => clean(x).includes("risque"))) cautions.push("niveau de risque élevé");
  if ((k.profile || []).some(x => clean(x).includes("nouveau coach"))) cautions.push("nouveau cycle avec coach à intégrer");

  return {
    team: teamName,
    formation: k.formation || null,
    objective: k.objective || null,
    guide_projection: k.guide_prediction || null,
    coach: k.coach || null,
    star: teamFaceName(k, "star"),
    cadre: teamFaceName(k, "cadre"),
    positives: positives.slice(0, 4),
    cautions: cautions.slice(0, 3)
  };
}

function scenarioIfScoresFirst(teamScoring, otherTeam, favoriteName, isFavorite) {
  if (isFavorite) {
    return {
      trigger: teamScoring + " marque en premier",
      effects: [
        "contrôle territorial et gestion du tempo en hausse",
        otherTeam + " devra prendre davantage de risques",
        "espaces de transition plus nombreux",
        "probabilité de victoire de " + teamScoring + " en hausse"
      ]
    };
  }

  return {
    trigger: teamScoring + " marque en premier",
    effects: [
      "rapport de force immédiatement rééquilibré",
      favoriteName + " devra accélérer et attaquer plus haut",
      "probabilité de BTTS en hausse",
      "variance du match nettement plus élevée"
    ]
  };
}

function buildTacticalZones(ka, kb, a, b) {
  const fa = ka && ka.formation ? ka.formation : "N/D";
  const fb = kb && kb.formation ? kb.formation : "N/D";

  const zones = [];
  if (fa.startsWith("3-") && fb.startsWith("4-3-3")) {
    zones.push("couloirs : duel pistons contre latéraux");
    zones.push("demi-espaces : risque entre piston et défenseur central");
    zones.push("milieu : densité centrale déterminante");
  } else if (fa === "4-2-3-1" && fb === "4-3-3") {
    zones.push("zone du numéro 10 face au milieu à trois");
    zones.push("couloirs offensifs");
    zones.push("sortie de balle sous pression");
  } else {
    zones.push("milieu de terrain");
    zones.push("transitions");
    zones.push("coups de pied arrêtés");
  }

  return {
    duel: a + " " + fa + " vs " + b + " " + fb,
    zones
  };
}

function scoreScenarios(favIsA, fav, dog, pA, pD, pB) {
  const candidates = [];
  if (Math.abs(pA - pB) < 8) {
    candidates.push({ score: "1-1", label: "scénario central", weight: 28 });
    candidates.push({ score: favIsA ? "2-1" : "1-2", label: "avantage favori", weight: 23 });
    candidates.push({ score: "0-0", label: "match fermé", weight: 16 });
  } else {
    candidates.push({ score: favIsA ? "2-1" : "1-2", label: "scénario central", weight: 27 });
    candidates.push({ score: favIsA ? "1-0" : "0-1", label: "victoire courte", weight: 21 });
    candidates.push({ score: favIsA ? "2-0" : "0-2", label: "maîtrise du favori", weight: 18 });
  }
  return candidates;
}


function dnaValueFromStrength(v) {
  const n = strengthValue(v);
  return Math.max(35, Math.min(95, Math.round(35 + (n - 2.5) * 28)));
}

function buildPredictionDNA(k) {
  if (!k) return null;
  const rank = parseGuideRank(k.guide_prediction);
  let context = 58;
  if (rank !== null) context = Math.max(40, Math.min(92, Math.round(95 - rank * 3.2)));

  const profileText = clean((k.profile || []).join(" "));
  let stability = 66;
  if (profileText.includes("stabil")) stability += 12;
  if (profileText.includes("transition")) stability -= 16;
  if (profileText.includes("nouveau coach")) stability -= 10;
  stability = Math.max(35, Math.min(92, stability));

  return {
    attaque: dnaValueFromStrength(k.strengths && k.strengths.attack),
    defense: dnaValueFromStrength(k.strengths && k.strengths.defense),
    coach: dnaValueFromStrength(k.strengths && k.strengths.coach),
    contexte: context,
    stabilite: stability
  };
}

function contextualPrediction(a, b, ka, kb, ctx) {
  // Ce moteur n'est utilisé que lorsque les statistiques dynamiques sont
  // insuffisantes. Il exploite les données structurées du guide comme
  // contexte secondaire et diminue volontairement la confiance.
  if (!ka && !kb) {
    return {
      confidence: 30,
      reliability: 25,
      mode: "données insuffisantes",
      result: "À éviter",
      doubleChance: "Pas de choix clair",
      overUnder: "À éviter",
      btts: "À éviter",
      score: "N/D",
      scoreRange: "N/D",
      winner: "Données insuffisantes",
      best: "Aucun pari fort conseillé",
      risk: "Risque élevé",
      confResult: 20,
      confDouble: 20,
      confOver: 20,
      confBtts: 20,
      confScore: 10,
      combine: "À éviter",
      confCombine: 10,
      scenario: "Pas assez d'informations fiables pour établir un scénario.",
      tactical: "Données tactiques insuffisantes.",
      keyFactors: [],
      verdict: "Données insuffisantes : aucune lecture exploitable."
    };
  }

  const aPower = editorialPower(ka);
  const bPower = editorialPower(kb);

  // Petit bonus terrain pour l'équipe A, sauf terrain neutre. Pour le Trophée
  // des Champions Lens-PSG à Bollaert, Lens est bien l'équipe hôte.
  const venueBonus = 1.0;
  const rawDiff = (aPower + venueBonus) - bPower;

  // Convertit l'écart éditorial en probabilités modérées.
  // On évite volontairement les très hautes probabilités sans données récentes.
  let pA = 34 + rawDiff * 2.5;
  let pB = 34 - rawDiff * 2.5;
  let pD = 32;

  pA = Math.max(18, Math.min(58, pA));
  pB = Math.max(18, Math.min(58, pB));
  const total = pA + pB + pD;
  pA = Math.round((pA / total) * 100);
  pB = Math.round((pB / total) * 100);
  pD = 100 - pA - pB;

  let result = "X";
  let winner = "Match serré";
  let doubleChance = "1X";
  let confResult = Math.max(pA, pB, pD);

  if (pA >= pB && pA >= pD) {
    result = "1";
    winner = a;
    doubleChance = "1X";
  } else if (pB >= pA && pB >= pD) {
    result = "2";
    winner = b;
    doubleChance = "X2";
  } else {
    result = "X";
    winner = "Match nul";
    doubleChance = pA >= pB ? "1X" : "X2";
  }

  const attackA = ka && ka.strengths ? strengthValue(ka.strengths.attack) : 3;
  const attackB = kb && kb.strengths ? strengthValue(kb.strengths.attack) : 3;
  const defenseA = ka && ka.strengths ? strengthValue(ka.strengths.defense) : 3;
  const defenseB = kb && kb.strengths ? strengthValue(kb.strengths.defense) : 3;

  const attackMean = (attackA + attackB) / 2;
  const defenseMean = (defenseA + defenseB) / 2;

  let overUnder = "Under 4.5";
  let confOver = 51;
  if (attackMean >= 4.3) {
    overUnder = "Over 1.5";
    confOver = 56;
  } else if (defenseMean >= 4.2) {
    overUnder = "Under 3.5";
    confOver = 54;
  }

  let btts = "À éviter";
  let confBtts = 42;
  if (attackA >= 4 && attackB >= 4) {
    btts = "Oui possible";
    confBtts = 49;
  } else if (defenseA >= 4.4 || defenseB >= 4.4) {
    btts = "Non possible";
    confBtts = 47;
  }

  const favIsA = pA >= pB;
  const fav = favIsA ? a : b;
  const dog = favIsA ? b : a;

  let score = favIsA ? "2-1" : "1-2";
  let scoreRange = fav + " 1–3 buts · " + dog + " 0–2 buts";
  if (Math.abs(pA - pB) < 8) {
    score = "1-1";
    scoreRange = "Match serré · 1 à 3 buts au total";
  }

  const keyFactors = [];
  if (ka) {
    keyFactors.push(a + " : " + (ka.formation || "formation N/D") + ", objectif " + (ka.objective || "N/D") + ".");
  }
  if (kb) {
    keyFactors.push(b + " : " + (kb.formation || "formation N/D") + ", objectif " + (kb.objective || "N/D") + ".");
  }
  if (ctx && ctx.league && ctx.league.slug === "trophee-des-champions") {
    keyFactors.push("Finale sur un match : variance plus élevée qu'en championnat.");
    keyFactors.push("Lens joue à Bollaert : avantage terrain intégré mais limité.");
  }

  const tactical = (ka && kb)
    ? (a + " en " + (ka.formation || "système non renseigné") +
       " face à " + b + " en " + (kb.formation || "système non renseigné") +
       ". La projection compare surtout structure, objectifs de saison et qualité éditoriale des lignes.")
    : "Lecture tactique partielle : une seule équipe possède un profil structuré.";

  const scenario = fav + " part avec un avantage contextuel, mais la confiance reste modérée faute de forme récente 2026-2027. " +
    dog + " conserve une vraie capacité à faire basculer le match, surtout sur phases de transition et coups de pied arrêtés.";

  // Fiabilité séparée de la probabilité du résultat : c'est essentiel.
  const reliability = 52;

  const teamIntelA = buildTeamIntel(ka, a);
  const teamIntelB = buildTeamIntel(kb, b);
  const tacticalIntel = buildTacticalZones(ka, kb, a, b);
  const threats = [
    ...buildThreats(ka, "A"),
    ...buildThreats(kb, "B")
  ];
  const scores = scoreScenarios(favIsA, fav, dog, pA, pD, pB);

  const scenarioTree = [
    scenarioIfScoresFirst(a, b, fav, fav === a),
    scenarioIfScoresFirst(b, a, fav, fav === b)
  ];

  const modelLimits = [
    "saison 2026-2027 encore pauvre en données récentes",
    "compositions officielles non confirmées",
    "forme individuelle et blessures à actualiser",
    "finale sur un match : variance plus élevée"
  ];

  return {
    confidence: reliability,
    reliability,
    mode: "contextuel / pré-saison",
    probabilities: { home: pA, draw: pD, away: pB },
    result,
    doubleChance,
    overUnder,
    btts,
    score,
    scoreRange,
    winner,
    best: "Double chance " + doubleChance,
    risk: "Risque élevé à modéré",
    confResult: Math.min(58, confResult),
    confDouble: Math.min(66, Math.max(pA + pD, pB + pD)),
    confOver,
    confBtts,
    confScore: 22,
    combine: "Double chance " + doubleChance + " + " + overUnder,
    confCombine: 34,
    scenario,
    tactical,
    keyFactors,
    tactical_intel: tacticalIntel,
    team_intel: { A: teamIntelA, B: teamIntelB },
    threats,
    score_scenarios: scores,
    scenario_tree: scenarioTree,
    model_limits: modelLimits,
    edge: {
      favorite: fav,
      challenger: dog,
      label: fav + " avantage contextuel",
      value: Math.min(20, Math.max(4, Math.round(Math.abs(pA - pB))))
    },
    match_pulse: {
      home: pA,
      draw: pD,
      away: pB,
      balance: Math.max(-100, Math.min(100, Math.round((pB - pA) * 2)))
    },
    prediction_dna: {
      A: buildPredictionDNA(ka),
      B: buildPredictionDNA(kb)
    },
    simulation_base: {
      home: pA,
      draw: pD,
      away: pB,
      teamA: a,
      teamB: b
    },
    confidence_matrix: {
      data: 28,
      tactical: 76,
      context: 84,
      lineup: 35,
      recency: 22
    },
    fair_odds: {
      home: Number((100 / Math.max(1, pA)).toFixed(2)),
      draw: Number((100 / Math.max(1, pD)).toFixed(2)),
      away: Number((100 / Math.max(1, pB)).toFixed(2))
    },
    value_lab: {
      enabled: true,
      formula: "edge = probabilité IA × cote bookmaker - 1",
      note: "Compare une cote bookmaker saisie par l’utilisateur à la cote théorique IA sans marge."
    },
    ai_reasoning_cards: [
      {
        title: "Pourquoi " + fav + " ?",
        value: fav,
        detail: "Avantage contextuel issu de la projection de saison, de la structure tactique et de la qualité globale des lignes."
      },
      {
        title: "Point de bascule",
        value: "Premier but",
        detail: "Dans une finale sur un match, le premier but modifie fortement le rythme, les espaces et la prise de risque."
      },
      {
        title: "Signal de prudence",
        value: "Données récentes faibles",
        detail: "La fiabilité reste plafonnée tant que la forme 2026-2027 et les compositions officielles ne sont pas disponibles."
      }
    ],
    verdict: "Lecture contextuelle : avantage " + fav +
      ", mais confiance limitée car la saison 2026-2027 n'offre pas encore assez de données dynamiques."
  };
}

function makePrediction(a, b, sa, sb, ka, kb, ctx) {
  const total = sa.played + sb.played;

  if (total < 2) {
    return contextualPrediction(a, b, ka, kb, ctx);
  }

  // Statistiques dynamiques = base principale.
  let powerA = sa.points * 8 + sa.gd * 3 + sa.gf * 2 + sa.wins * 5 - sa.ga;
  let powerB = sb.points * 8 + sb.gd * 3 + sb.gf * 2 + sb.wins * 5 - sb.ga;

  // Contexte éditorial = micro-ajustement volontairement plafonné.
  powerA += editorialPower(ka);
  powerB += editorialPower(kb);

  const diff = powerA - powerB;

  let result = "X";
  let winner = "Match serré";
  let doubleChance = "Pas de choix clair";
  let confidence = 52;

  if (diff >= 12) {
    result = "1";
    winner = a;
    doubleChance = "1X";
    confidence = Math.min(65, 62 + Math.round(Math.min(3, Math.abs(diff) / 20)));
  } else if (diff <= -12) {
    result = "2";
    winner = b;
    doubleChance = "X2";
    confidence = Math.min(65, 62 + Math.round(Math.min(3, Math.abs(diff) / 20)));
  }

  const avgGoals = sa.avgGF + sb.avgGF;
  let overUnder = "Ligne buts à éviter";
  let confOver = 35;

  if (avgGoals >= 2.4) {
    overUnder = "Over 1.5 prudent";
    confOver = 58;
  } else if (avgGoals <= 1.8) {
    overUnder = "Under 3.5 prudent";
    confOver = 60;
  }

  let btts = "À éviter";
  let confBtts = 30;
  if (sa.avgGF >= 1 && sb.avgGF >= 1 && sa.avgGA >= 0.7 && sb.avgGA >= 0.7) {
    btts = "Oui possible";
    confBtts = 48;
  }

  const scoreA = Math.max(0, Math.round((sa.avgGF + sb.avgGA) / 2));
  const scoreB = Math.max(0, Math.round((sb.avgGF + sa.avgGA) / 2));

  let risk = "Risque moyen/élevé";
  if (total >= 4 && Math.abs(diff) >= 8) risk = "Risque modéré";

  const confDoubleVal = doubleChance === "Pas de choix clair"
    ? 35
    : Math.min(75, confidence + 10);

  let best = "Aucun pari fort conseillé";
  if (overUnder === "Under 3.5 prudent") best = "Option prudente : Under 3.5";
  if (overUnder === "Over 1.5 prudent") best = "Option prudente : Over 1.5";
  if (doubleChance !== "Pas de choix clair" && confidence >= 60) {
    best = "Option prudente : Double chance " + doubleChance;
  }

  let combine = "Aucun combiné fiable";
  let confCombine = 15;
  if (doubleChance !== "Pas de choix clair" && overUnder.includes("prudent")) {
    combine = "Double chance " + doubleChance + " + " + overUnder.replace(" prudent", "");
    confCombine = Math.max(10, Math.round(((confDoubleVal + confOver) / 2) * 0.55));
  }

  return {
    confidence,
    result,
    doubleChance,
    overUnder,
    btts,
    score: scoreA + "-" + scoreB,
    winner,
    best,
    risk,
    confResult: confidence,
    confDouble: confDoubleVal,
    confOver,
    confBtts,
    confScore: 18,
    combine,
    confCombine,
    verdict: best + ". " + risk + ". Statistiques dynamiques prioritaires ; contexte Ligue 1 utilisé uniquement comme complément."
  };
}

function scorerTips(a, b, sa, sb, ka, kb) {
  const ca = offensiveCandidate(ka);
  const cb = offensiveCandidate(kb);

  const confA = sa.played ? Math.min(55, Math.round(25 + sa.avgGF * 15)) : 20;
  const confB = sb.played ? Math.min(55, Math.round(25 + sb.avgGF * 15)) : 20;
  const doubleConf = Math.max(10, Math.min(30, Math.round((sa.avgGF + sb.avgGF) * 8)));

  return [
    {
      type: "Buteur équipe A",
      equipe: a,
      valeur: ca ? ca.name : (confA >= 45 ? "Profil offensif à surveiller" : "Buteur à éviter"),
      confiance: Math.min(55, confA),
      raison: ca
        ? ca.name + " est identifié dans la base de saison comme profil offensif (" + ca.role + "). À confirmer avec la composition officielle."
        : a + " marque en moyenne " + sa.avgGF + " but(s)/match. Aucun nom fiable sans composition officielle."
    },
    {
      type: "Buteur équipe B",
      equipe: b,
      valeur: cb ? cb.name : (confB >= 45 ? "Profil offensif à surveiller" : "Buteur à éviter"),
      confiance: Math.min(55, confB),
      raison: cb
        ? cb.name + " est identifié dans la base de saison comme profil offensif (" + cb.role + "). À confirmer avec la composition officielle."
        : b + " marque en moyenne " + sb.avgGF + " but(s)/match. Aucun nom fiable sans composition officielle."
    },
    {
      type: "Doublé",
      equipe: "Tous",
      valeur: "À éviter",
      confiance: doubleConf,
      raison: "Pari très risqué sans composition officielle, forme individuelle récente et tireur de penalties confirmé."
    }
  ];
}

function completedResponse(a, b, m, ctx) {
  const sa = stats(a, ctx);
  const sb = stats(b, ctx);
  const scA = scoreFor(m, a);
  const scB = scoreFor(m, b);
  const finalScore = m.home + " " + m.hg + "-" + m.ag + " " + m.away;

  let winner = "Match nul";
  let loser = "Aucun";

  if (Number(m.hg) > Number(m.ag)) {
    winner = m.home;
    loser = m.away;
  } else if (Number(m.ag) > Number(m.hg)) {
    winner = m.away;
    loser = m.home;
  }

  return {
    match: a + " - " + b,
    competition: "Match terminé — " + ctx.league.label,
    date_info: m.date + " · " + m.group,
    is_world_cup: !ctx.league.live,
    group: m.group,
    niveau_confiance_global: 100,
    pari_du_jour: {
      type: "Match terminé",
      valeur: finalScore,
      raison: "Ce match est déjà joué. Aucun pari possible sur ce match.",
      cote_estimee: "N/D"
    },
    stats_techniques: {
      buts_marques_A: { valeur: scA.gf, detail: a + " : " + scA.gf + " but(s) dans ce match. Total échantillon : " + sa.gf },
      buts_encaisses_A: { valeur: scA.ga, detail: a + " : " + scA.ga + " but(s) encaissé(s). Total échantillon : " + sa.ga },
      buts_marques_B: { valeur: scB.gf, detail: b + " : " + scB.gf + " but(s) dans ce match. Total échantillon : " + sb.gf },
      buts_encaisses_B: { valeur: scB.ga, detail: b + " : " + scB.ga + " but(s) encaissé(s). Total échantillon : " + sb.ga },
      rapport_force: { detail: "Résultat final : " + finalScore }
    },
    pronostics: {
      resultat_1x2: { valeur: "Terminé", label: "Match terminé", confiance: 100, cote_estimee: "" },
      over_under: { valeur: "Non applicable", confiance: 100, cote_estimee: "" },
      btts: { valeur: Number(m.hg) > 0 && Number(m.ag) > 0 ? "Oui" : "Non", confiance: 100, cote_estimee: "" },
      double_chance: { valeur: "Non applicable", confiance: 100, cote_estimee: "" },
      handicap: { valeur: "Non applicable", confiance: 100, cote_estimee: "" },
      premier_but: { valeur: "Non disponible", confiance: 0, cote_estimee: "" },
      mi_temps_fin: { valeur: "Non disponible", confiance: 0, cote_estimee: "" },
      cage_inviolee: { valeur: Number(m.hg) === 0 || Number(m.ag) === 0 ? "Oui" : "Non", confiance: 100, cote_estimee: "" },
      score_exact: { valeur: m.hg + "-" + m.ag, confiance: 100, cote_estimee: "" },
      combine_prudent: { valeur: "Non applicable", confiance: 100, cote_estimee: "" },
      winner: { valeur: winner, confiance: 100 },
      perdant: { valeur: loser, confiance: loser === "Aucun" ? 0 : 100 }
    },
    analyse_approfondie: {
      forces_A: formatStats(sa),
      faiblesses_A: "Moyenne encaissée : " + sa.avgGA + " but(s)/match.",
      forces_B: formatStats(sb),
      faiblesses_B: "Moyenne encaissée : " + sb.avgGA + " but(s)/match.",
      facteur_cle: "Résultat final connu : " + finalScore + ". Aucun pari conseillé car le match est terminé."
    },
    analysis: {},
    contexte_clubs: null,
    buteurs_potentiels: [],
    verdict: "Match terminé : " + finalScore + ". Aucun pari possible sur ce match.",
    avertissement: "⚠️ Aucun pari garanti. Estimations informatives uniquement."
  };
}

function upcomingResponse(a, b, ctx) {
  const group = findGroup(a, b, ctx);
  const sa = stats(a, ctx);
  const sb = stats(b, ctx);
  const ka = knowledgeForTeam(a, ctx);
  const kb = knowledgeForTeam(b, ctx);
  const p = makePrediction(a, b, sa, sb, ka, kb, ctx);
  const classement = tableText(group, ctx);

  const editorialContext = ka || kb
    ? " Contexte saison — " + a + " : " + contextText(ka) + " " + b + " : " + contextText(kb)
    : "";

  return {
    match: a + " - " + b,
    competition: "Match à venir / statistiques — " + ctx.league.label,
    date_info: group || ctx.league.label,
    is_world_cup: !ctx.league.live,
    group,
    niveau_confiance_global: p.confidence,

    pari_du_jour: {
      type: "Analyse prudente",
      valeur: p.best,
      raison: p.verdict,
      cote_estimee: "N/D"
    },

    stats_techniques: {
      buts_marques_A: {
        valeur: sa.avgGF,
        detail: a + " : " + sa.gf + " but(s) marqué(s) en " + sa.played + " match(s). Moyenne : " + sa.avgGF
      },
      buts_encaisses_A: {
        valeur: sa.avgGA,
        detail: a + " : " + sa.ga + " but(s) encaissé(s). Moyenne : " + sa.avgGA
      },
      buts_marques_B: {
        valeur: sb.avgGF,
        detail: b + " : " + sb.gf + " but(s) marqué(s) en " + sb.played + " match(s). Moyenne : " + sb.avgGF
      },
      buts_encaisses_B: {
        valeur: sb.avgGA,
        detail: b + " : " + sb.ga + " but(s) encaissé(s). Moyenne : " + sb.avgGA
      },
      rapport_force: {
        detail: "Classement : " + classement + editorialContext
      }
    },

    pronostics: {
      resultat_1x2: { valeur: p.result, label: p.winner, confiance: p.confResult, cote_estimee: "" },
      over_under: { valeur: p.overUnder, confiance: p.confOver, cote_estimee: "" },
      btts: { valeur: p.btts, confiance: p.confBtts, cote_estimee: "" },
      double_chance: { valeur: p.doubleChance, confiance: p.confDouble, cote_estimee: "" },
      handicap: { valeur: "À éviter", confiance: 30, cote_estimee: "" },
      premier_but: { valeur: "À éviter", confiance: 25, cote_estimee: "" },
      mi_temps_fin: { valeur: "À éviter", confiance: 25, cote_estimee: "" },
      cage_inviolee: { valeur: "À éviter", confiance: 25, cote_estimee: "" },
      score_exact: { valeur: p.score, confiance: p.confScore, cote_estimee: "" },
      combine_prudent: { valeur: p.combine, confiance: p.confCombine, cote_estimee: "" },
      winner: { valeur: p.winner, confiance: p.confResult },
      perdant: { valeur: "Données insuffisantes", confiance: 0 }
    },

    analyse_approfondie: {
      forces_A: formatStats(sa) + (ka ? " | Contexte : " + contextText(ka) : ""),
      faiblesses_A: "Moyenne encaissée : " + sa.avgGA + " but(s)/match. Tendance : Over 1.5 " + pct(sa.over15, sa.played) + "%, BTTS " + pct(sa.btts, sa.played) + "%.",
      forces_B: formatStats(sb) + (kb ? " | Contexte : " + contextText(kb) : ""),
      faiblesses_B: "Moyenne encaissée : " + sb.avgGA + " but(s)/match. Tendance : Over 1.5 " + pct(sb.over15, sb.played) + "%, BTTS " + pct(sb.btts, sb.played) + "%.",
      facteur_cle: "Niveau de risque : " + p.risk + ". Classement : " + classement + ". Meilleure lecture prudente : " + p.best + "."
    },

    analysis: {
      methodology: p.mode === "contextuel / pré-saison"
        ? "Mode contextuel : base Ligue 1 2026-2027 + comparaison tactique, sans inventer de forme récente."
        : "Statistiques dynamiques prioritaires + contexte Ligue 1 2026-2027 en complément.",
      mode: p.mode || "dynamique",
      reliability: p.reliability || p.confidence,
      probabilities: p.probabilities || null,
      score_range: p.scoreRange || null,
      scenario: p.scenario || null,
      tactical: p.tactical || null,
      key_factors: p.keyFactors || [],
      tactical_intel: p.tactical_intel || null,
      team_intel: p.team_intel || null,
      threats: p.threats || [],
      score_scenarios: p.score_scenarios || [],
      scenario_tree: p.scenario_tree || [],
      model_limits: p.model_limits || [],
      edge: p.edge || null,
      match_pulse: p.match_pulse || null,
      prediction_dna: p.prediction_dna || null,
      simulation_base: p.simulation_base || null,
      confidence_matrix: p.confidence_matrix || null,
      fair_odds: p.fair_odds || null,
      value_lab: p.value_lab || null,
      ai_reasoning_cards: p.ai_reasoning_cards || [],
      editorial_context_weight: "faible et plafonné",
      source_note: "Les objectifs, formations de référence, forces et projections de classement proviennent d’une source éditoriale secondaire et peuvent évoluer."
    },

    contexte_clubs: {
      equipe_A: knowledgeSummary(ka),
      equipe_B: knowledgeSummary(kb)
    },

    buteurs_potentiels: scorerTips(a, b, sa, sb, ka, kb),
    verdict: p.verdict,
    avertissement: "⚠️ Aucun pari garanti. Estimations informatives uniquement."
  };
}

function dashboardResponse(ctx) {
  return {
    ok: true,
    version: VERSION,
    league: ctx.league.slug,
    league_label: ctx.league.label,
    data_version: ctx.dataVersion,
    data_loaded: ctx.loadError ? false : true,
    load_error: ctx.loadError,
    results_count: ctx.RESULTS.length,
    upcoming_count: ctx.UPCOMING.length,
    recent: ctx.RESULTS.slice(-10).reverse().map(makeMatch),
    upcoming: ctx.UPCOMING.map(makeUpcoming),
    standings: ctx.GROUPS.map(g => ({ group: g[0], teams: groupTable(g[0], ctx) })),
    leagues: LEAGUES.map(l => ({ slug: l.slug, label: l.label, live: l.live })),
    knowledge: isLigue1(ctx)
      ? { active: true, season: LIGUE1_2026_2027.meta.season, clubs: LIGUE1_2026_2027.meta.club_count }
      : { active: false }
  };
}

function errorResponse(message, leagueSlug) {
  return {
    match: "Données temporairement indisponibles",
    competition: "Pronostics IA Pro",
    date_info: "",
    is_world_cup: false,
    group: "",
    niveau_confiance_global: 0,
    league: leagueSlug || DEFAULT_LEAGUE,
    pari_du_jour: {
      type: "Analyse indisponible",
      valeur: "Réessaie dans quelques instants",
      raison: "Les données nécessaires ne sont pas disponibles pour le moment.",
      cote_estimee: "N/D"
    },
    stats_techniques: null,
    pronostics: {
      resultat_1x2: { valeur: "Indisponible", label: "Données indisponibles", confiance: 0, cote_estimee: "" },
      over_under: { valeur: "Indisponible", confiance: 0, cote_estimee: "" },
      btts: { valeur: "Indisponible", confiance: 0, cote_estimee: "" },
      double_chance: { valeur: "Indisponible", confiance: 0, cote_estimee: "" },
      handicap: { valeur: "Indisponible", confiance: 0, cote_estimee: "" },
      premier_but: { valeur: "Indisponible", confiance: 0, cote_estimee: "" },
      mi_temps_fin: { valeur: "Indisponible", confiance: 0, cote_estimee: "" },
      cage_inviolee: { valeur: "Indisponible", confiance: 0, cote_estimee: "" },
      score_exact: { valeur: "Indisponible", confiance: 0, cote_estimee: "" },
      combine_prudent: { valeur: "Indisponible", confiance: 0, cote_estimee: "" },
      winner: { valeur: "Indisponible", confiance: 0 },
      perdant: { valeur: "Indisponible", confiance: 0 }
    },
    analyse_approfondie: {
      forces_A: "Données temporairement indisponibles.",
      faiblesses_A: "",
      forces_B: "Données temporairement indisponibles.",
      faiblesses_B: "",
      facteur_cle: "Réessaie dans quelques instants."
    },
    analysis: {},
    contexte_clubs: null,
    buteurs_potentiels: [],
    verdict: "Analyse temporairement indisponible.",
    avertissement: "⚠️ Aucun pari garanti. Estimations informatives uniquement.",
    _technical_error: process.env.NODE_ENV === "development" ? String(message || "") : undefined
  };
}

async function loadContext(leagueSlug) {
  const league = findLeague(leagueSlug);

  // Trophée des Champions 2026-2027 :
  // match officiel Lens - PSG ajouté manuellement, tout en réutilisant
  // les données Ligue 1 dynamiques comme contexte lorsqu'elles sont disponibles.
  if (league.slug === "trophee-des-champions") {
    const staticUpcoming = [
      ["16/08/2026 · 20:45", "Finale · Stade Bollaert-Delelis", "RC Lens", "Paris Saint-Germain", "À venir"]
    ];

    try {
      const [standingsBlocks, seasonFixtures] = await Promise.all([
        getStandings("FL1"),
        getSeasonFixtures("FL1")
      ]);

      const recent = filterRecentFixtures(seasonFixtures, 30);

      const GROUPS = standingsBlocks.length
        ? standingsBlocks.map(b => [b.label, b.teams.map(t => t.team)])
        : [["Trophée des Champions", ["RC Lens", "Paris Saint-Germain"]]];

      const STANDINGS_MAP = new Map();
      standingsBlocks.forEach(b => {
        b.teams.forEach(t => STANDINGS_MAP.set(clean(t.team), t));
      });

      const RESULTS = recent.map(f => [f.date, f.round, f.home, f.away, f.hg, f.ag]);

      return {
        league,
        loadError: "",
        dataVersion: "TDC_2026_LENS_PSG_PLUS_FL1_CONTEXT",
        GROUPS,
        RESULTS,
        UPCOMING: staticUpcoming,
        STANDINGS_MAP
      };
    } catch (e) {
      // Même si football-data.org est temporairement limité (429), le match
      // reste visible et analysable de manière prudente avec la base contextuelle.
      return {
        league,
        loadError: "",
        dataVersion: "TDC_2026_LENS_PSG_STATIC_CONTEXT",
        GROUPS: [["Trophée des Champions", ["RC Lens", "Paris Saint-Germain"]]],
        RESULTS: [],
        UPCOMING: staticUpcoming,
        STANDINGS_MAP: null
      };
    }
  }

  if (!league.live) {
    try {
      const data = require("./data");
      return {
        league,
        loadError: "",
        dataVersion: data.DATA_VERSION || "DATA_SANS_VERSION",
        GROUPS: data.GROUPS || [],
        RESULTS: data.RESULTS || [],
        UPCOMING: data.UPCOMING || [],
        STANDINGS_MAP: null
      };
    } catch (e) {
      return {
        league,
        loadError: e.message || "Impossible de charger api/data.js",
        dataVersion: "DATA_NON_CHARGEE",
        GROUPS: [],
        RESULTS: [],
        UPCOMING: [],
        STANDINGS_MAP: null
      };
    }
  }

  try {
    const [standingsBlocks, seasonFixtures] = await Promise.all([
      getStandings(league.code),
      getSeasonFixtures(league.code)
    ]);

    const recent = filterRecentFixtures(seasonFixtures, 30);
    const upcoming = filterUpcomingFixtures(seasonFixtures, 15);

    const GROUPS = standingsBlocks.map(b => [
      b.label,
      b.teams.map(t => t.team)
    ]);

    const STANDINGS_MAP = new Map();
    standingsBlocks.forEach(b => {
      b.teams.forEach(t => STANDINGS_MAP.set(clean(t.team), t));
    });

    const RESULTS = recent.map(f => [f.date, f.round, f.home, f.away, f.hg, f.ag]);
    const UPCOMING = upcoming.map(f => [f.date, f.round, f.home, f.away, statusToLabel(f.status)]);

    return {
      league,
      loadError: "",
      dataVersion: league.slug + "_SAISON_ACTUELLE_LIVE",
      GROUPS,
      RESULTS,
      UPCOMING,
      STANDINGS_MAP
    };
  } catch (e) {
    return {
      league,
      loadError: e.message || "Erreur football-data.org",
      dataVersion: "DATA_NON_CHARGEE",
      GROUPS: [],
      RESULTS: [],
      UPCOMING: [],
      STANDINGS_MAP: null
    };
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
        ok: true,
        version: VERSION,
        message: "API Pronostics IA Pro active.",
        leagues: LEAGUES.map(l => ({ slug: l.slug, label: l.label, live: l.live })),
        knowledge_ligue1: {
          active: true,
          season: LIGUE1_2026_2027.meta.season,
          clubs: LIGUE1_2026_2027.meta.club_count
        }
      });
    }

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Méthode non autorisée." });
    }

    const body = parseBody(req);
    const leagueSlug = body.league || DEFAULT_LEAGUE;
    const ctx = await loadContext(leagueSlug);

    if (ctx.loadError) {
      return res.status(200).json(
        errorResponse("Chargement des données impossible (" + ctx.league.label + ") : " + ctx.loadError, leagueSlug)
      );
    }

    const parsed = parseMatch(body.match);
    if (!parsed) {
      return res.status(400).json({
        error: "Écris un match complet, exemple : PSG vs Marseille."
      });
    }

    const a = canon(parsed.aRaw, ctx);
    const b = canon(parsed.bRaw, ctx);

    const completed = findCompleted(a, b, ctx);
    if (completed) {
      return res.status(200).json(completedResponse(a, b, completed, ctx));
    }

    return res.status(200).json(upcomingResponse(a, b, ctx));
  } catch (e) {
    return res.status(200).json(errorResponse(e.message));
  }
};
