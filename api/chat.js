const API_BASE = "https://v3.football.api-sports.io";

const VERSION = "V3_CDM2026_MATCH_TERMINE_PRUDENT";

const GROUPS = [
  { g:"Groupe A", teams:["Mexique","Corée du Sud","Tchéquie","Afrique du Sud"] },
  { g:"Groupe B", teams:["Suisse","Canada","Qatar","Bosnie"] },
  { g:"Groupe C", teams:["Écosse","Maroc","Brésil","Haïti"] },
  { g:"Groupe D", teams:["USA","Australie","Turquie","Paraguay"] },
  { g:"Groupe E", teams:["Allemagne","Côte d’Ivoire","Équateur","Curaçao"] },
  { g:"Groupe F", teams:["Suède","Japon","Pays-Bas","Tunisie"] },
  { g:"Groupe G", teams:["Nouvelle-Zélande","Iran","Belgique","Égypte"] },
  { g:"Groupe H", teams:["Uruguay","Arabie Saoudite","Espagne","Cap-Vert"] },
  { g:"Groupe I", teams:["Norvège","France","Sénégal","Irak"] },
  { g:"Groupe J", teams:["Argentine","Autriche","Jordanie","Algérie"] },
  { g:"Groupe K", teams:["Portugal","RD Congo","Ouzbékistan","Colombie"] },
  { g:"Groupe L", teams:["Angleterre","Croatie","Ghana","Panama"] }
];

const API_NAMES = {
  "France":"France",
  "Sénégal":"Senegal",
  "Allemagne":"Germany",
  "Côte d’Ivoire":"Ivory Coast",
  "Corée du Sud":"Korea Republic",
  "Tchéquie":"Czech Republic",
  "Écosse":"Scotland",
  "Brésil":"Brazil",
  "Haïti":"Haiti",
  "Équateur":"Ecuador",
  "Curaçao":"Curacao",
  "Suède":"Sweden",
  "Pays-Bas":"Netherlands",
  "Nouvelle-Zélande":"New Zealand",
  "Égypte":"Egypt",
  "Cap-Vert":"Cape Verde",
  "Norvège":"Norway",
  "Algérie":"Algeria",
  "RD Congo":"Congo DR",
  "Ouzbékistan":"Uzbekistan",
  "Angleterre":"England",
  "Suisse":"Switzerland",
  "Arabie Saoudite":"Saudi Arabia",
  "Mexique":"Mexico",
  "Canada":"Canada",
  "Qatar":"Qatar",
  "Bosnie":"Bosnia and Herzegovina",
  "Maroc":"Morocco",
  "USA":"USA",
  "Australie":"Australia",
  "Turquie":"Turkey",
  "Paraguay":"Paraguay",
  "Japon":"Japan",
  "Tunisie":"Tunisia",
  "Iran":"Iran",
  "Belgique":"Belgium",
  "Uruguay":"Uruguay",
  "Espagne":"Spain",
  "Irak":"Iraq",
  "Argentine":"Argentina",
  "Autriche":"Austria",
  "Jordanie":"Jordan",
  "Portugal":"Portugal",
  "Colombie":"Colombia",
  "Croatie":"Croatia",
  "Ghana":"Ghana",
  "Panama":"Panama",
  "Afrique du Sud":"South Africa"
};

/*
  Résultats CDM 2026 ajoutés manuellement.
  Mets cette liste à jour après chaque match terminé.
*/
const WC_2026_RESULTS = [
  { date:"2026-06-11", group:"Groupe A", home:"Mexique", away:"Afrique du Sud", hg:2, ag:0 },
  { date:"2026-06-12", group:"Groupe A", home:"Corée du Sud", away:"Tchéquie", hg:2, ag:1 },
  { date:"2026-06-12", group:"Groupe B", home:"Canada", away:"Bosnie", hg:1, ag:1 },

  { date:"2026-06-13", group:"Groupe D", home:"USA", away:"Paraguay", hg:4, ag:1 },
  { date:"2026-06-13", group:"Groupe B", home:"Qatar", away:"Suisse", hg:1, ag:1 },

  { date:"2026-06-14", group:"Groupe C", home:"Brésil", away:"Maroc", hg:1, ag:1 },
  { date:"2026-06-14", group:"Groupe C", home:"Haïti", away:"Écosse", hg:0, ag:1 },
  { date:"2026-06-14", group:"Groupe D", home:"Australie", away:"Turquie", hg:2, ag:0 },
  { date:"2026-06-14", group:"Groupe E", home:"Allemagne", away:"Curaçao", hg:7, ag:1 },
  { date:"2026-06-14", group:"Groupe F", home:"Pays-Bas", away:"Japon", hg:2, ag:2 },

  { date:"2026-06-15", group:"Groupe E", home:"Côte d’Ivoire", away:"Équateur", hg:1, ag:0 },
  { date:"2026-06-15", group:"Groupe F", home:"Suède", away:"Tunisie", hg:5, ag:1 },
  { date:"2026-06-15", group:"Groupe H", home:"Espagne", away:"Cap-Vert", hg:0, ag:0 },
  { date:"2026-06-15", group:"Groupe G", home:"Belgique", away:"Égypte", hg:1, ag:1 },

  { date:"2026-06-16", group:"Groupe H", home:"Arabie Saoudite", away:"Uruguay", hg:1, ag:1 },
  { date:"2026-06-16", group:"Groupe G", home:"Iran", away:"Nouvelle-Zélande", hg:2, ag:2 },
  { date:"2026-06-16", group:"Groupe I", home:"France", away:"Sénégal", hg:3, ag:1 },

  { date:"2026-06-17", group:"Groupe I", home:"Irak", away:"Norvège", hg:1, ag:4 },
  { date:"2026-06-17", group:"Groupe J", home:"Argentine", away:"Algérie", hg:3, ag:0 },
  { date:"2026-06-17", group:"Groupe J", home:"Autriche", away:"Jordanie", hg:3, ag:1 },
  { date:"2026-06-17", group:"Groupe K", home:"Portugal", away:"RD Congo", hg:1, ag:1 },
  { date:"2026-06-17", group:"Groupe L", home:"Angleterre", away:"Croatie", hg:4, ag:2 },

  { date:"2026-06-18", group:"Groupe L", home:"Ghana", away:"Panama", hg:1, ag:0 },
  { date:"2026-06-18", group:"Groupe K", home:"Ouzbékistan", away:"Colombie", hg:1, ag:3 },
  { date:"2026-06-18", group:"Groupe A", home:"Tchéquie", away:"Afrique du Sud", hg:1, ag:1 }
];

function clean(s){
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .replace(/[’']/g,"")
    .replace(/-/g," ")
    .replace(/\s+/g," ")
    .trim();
}

function canonTeam(name){
  const input = clean(name);

  for(const group of GROUPS){
    for(const team of group.teams){
      if(clean(team) === input) return team;
    }
  }

  const aliases = {
    "senegal":"Sénégal",
    "coree du sud":"Corée du Sud",
    "cote ivoire":"Côte d’Ivoire",
    "cote d ivoire":"Côte d’Ivoire",
    "rd congo":"RD Congo",
    "nouvelle zelande":"Nouvelle-Zélande",
    "egypte":"Égypte",
    "equateur":"Équateur",
    "haiti":"Haïti",
    "bresil":"Brésil",
    "suede":"Suède",
    "norvege":"Norvège",
    "algerie":"Algérie",
    "ouzbekistan":"Ouzbékistan",
    "cap vert":"Cap-Vert",
    "capvert":"Cap-Vert",
    "usa":"USA",
    "etats unis":"USA",
    "afrique du sud":"Afrique du Sud",
    "bosnie herzegovine":"Bosnie",
    "bosnie herzégovine":"Bosnie"
  };

  return aliases[input] || String(name || "").trim();
}

function parseMatch(input){
  let raw = String(input || "").trim();

  raw = raw
    .replace(/CDM\s*2026/gi,"")
    .replace(/Coupe du Monde\s*2026/gi,"")
    .replace(/Groupe\s+[A-L]/gi,"")
    .trim();

  let parts = null;

  if(raw.includes(" vs ")) parts = raw.split(/\s+vs\s+/i);
  else if(raw.includes(" contre ")) parts = raw.split(/\s+contre\s+/i);
  else if(raw.includes(" - ")) parts = raw.split(/\s+-\s+/);

  if(!parts || parts.length < 2) return null;

  return {
    teamA: canonTeam(parts[0]),
    teamB: canonTeam(parts[1])
  };
}

function findGroup(a,b){
  for(const group of GROUPS){
    const hasA = group.teams.some(t => clean(t) === clean(a));
    const hasB = group.teams.some(t => clean(t) === clean(b));

    if(hasA && hasB) return group.g;
  }

  return "";
}

function findCompletedMatch(teamA, teamB){
  return WC_2026_RESULTS.find(m => {
    const sameOrder =
      clean(m.home) === clean(teamA) &&
      clean(m.away) === clean(teamB);

    const reverseOrder =
      clean(m.home) === clean(teamB) &&
      clean(m.away) === clean(teamA);

    return sameOrder || reverseOrder;
  });
}

function getScoreForTeam(match, team){
  if(clean(match.home) === clean(team)){
    return {
      gf: match.hg,
      ga: match.ag
    };
  }

  if(clean(match.away) === clean(team)){
    return {
      gf: match.ag,
      ga: match.hg
    };
  }

  return {
    gf: 0,
    ga: 0
  };
}

function getWinner(match){
  if(match.hg > match.ag) return match.home;
  if(match.ag > match.hg) return match.away;
  return "Match nul";
}

function getLoser(match){
  if(match.hg > match.ag) return match.away;
  if(match.ag > match.hg) return match.home;
  return "Aucun";
}

function clamp(n,min,max){
  return Math.max(min, Math.min(max, n));
}

async function apiFetch(path, params){
  const key = process.env.API_FOOTBALL_KEY;

  if(!key){
    throw new Error("Clé API_FOOTBALL_KEY manquante dans Vercel.");
  }

  const url = new URL(API_BASE + path);

  Object.entries(params || {}).forEach(([k,v]) => {
    if(v !== undefined && v !== null && v !== ""){
      url.searchParams.set(k,v);
    }
  });

  const response = await fetch(url, {
    headers: {
      "x-apisports-key": key
    }
  });

  const data = await response.json();

  if(!response.ok){
    throw new Error("Erreur API-Football.");
  }

  if(data.errors && Object.keys(data.errors).length > 0){
    throw new Error("Erreur API-Football : " + JSON.stringify(data.errors));
  }

  return data.response || [];
}

async function getTeamId(team){
  const search = API_NAMES[team] || team;

  const results = await apiFetch("/teams", { search });

  if(!results.length){
    throw new Error("Équipe introuvable : " + team);
  }

  const national = results.find(x => x.team && x.team.national === true);
  const selected = national || results[0];

  return selected.team.id;
}

function getManualTeamGames(team){
  return WC_2026_RESULTS
    .filter(m => clean(m.home) === clean(team) || clean(m.away) === clean(team))
    .map(m => {
      const score = getScoreForTeam(m, team);

      return {
        date: m.date,
        gf: score.gf,
        ga: score.ga,
        source: "CDM 2026 manuelle"
      };
    });
}

async function getApiTeamGames(teamId){
  const seasons = [2024, 2023, 2022];
  let games = [];

  for(const season of seasons){
    try{
      const fixtures = await apiFetch("/fixtures", {
        team: teamId,
        season: season
      });

      const seasonGames = fixtures
        .filter(fx =>
          fx &&
          fx.fixture &&
          fx.fixture.date &&
          fx.teams &&
          fx.goals &&
          fx.goals.home !== null &&
          fx.goals.away !== null
        )
        .map(fx => {
          const isHome = fx.teams.home.id === teamId;

          return {
            date: fx.fixture.date.slice(0,10),
            gf: isHome ? fx.goals.home : fx.goals.away,
            ga: isHome ? fx.goals.away : fx.goals.home,
            source: "API-Football gratuit " + season
          };
        });

      games = games.concat(seasonGames);
    }catch(e){
      // On continue même si une saison est vide ou bloquée.
    }
  }

  return games;
}

function buildStatsFromGames(team, games){
  const sorted = games
    .sort((a,b) => new Date(b.date) - new Date(a.date))
    .slice(0,5);

  let played = 0;
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  let cleanSheets = 0;
  let manualGames = 0;

  sorted.forEach(g => {
    played++;
    goalsFor += g.gf;
    goalsAgainst += g.ga;

    if(g.ga === 0) cleanSheets++;

    if(g.gf > g.ga) wins++;
    else if(g.gf === g.ga) draws++;
    else losses++;

    if(g.source.includes("CDM 2026")) manualGames++;
  });

  if(played === 0){
    return null;
  }

  return {
    team,
    played,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    avgGF: Number((goalsFor / played).toFixed(2)),
    avgGA: Number((goalsAgainst / played).toFixed(2)),
    ppg: Number(((wins * 3 + draws) / played).toFixed(2)),
    cleanSheets,
    manualGames,
    sources: [...new Set(sorted.map(g => g.source))]
  };
}

async function getCombinedStats(team, teamId){
  const manualGames = getManualTeamGames(team);
  const apiGames = await getApiTeamGames(teamId);

  const allGames = manualGames.concat(apiGames);

  return buildStatsFromGames(team, allGames);
}

function buildCompletedMatchResponse(teamA, teamB, match){
  const scoreA = getScoreForTeam(match, teamA);
  const scoreB = getScoreForTeam(match, teamB);

  const winner = getWinner(match);
  const loser = getLoser(match);

  const finalScore =
    match.home + " " + match.hg + "-" + match.ag + " " + match.away;

  return {
    match: teamA + " - " + teamB,
    competition: "Match terminé — Coupe du Monde 2026",
    date_info: match.date + " · " + match.group,
    is_world_cup: true,
    group: match.group,
    niveau_confiance_global: 100,

    pari_du_jour: {
      type: "Match terminé",
      valeur: finalScore,
      raison: "Ce match est déjà joué. Aucun pari possible sur ce match.",
      cote_estimee: "N/D"
    },

    stats_techniques: {
      buts_marques_A: {
        valeur: scoreA.gf,
        detail: teamA + " : " + scoreA.gf + " but(s)"
      },
      buts_encaisses_A: {
        valeur: scoreA.ga,
        detail: teamA + " : " + scoreA.ga + " but(s) encaissé(s)"
      },
      buts_marques_B: {
        valeur: scoreB.gf,
        detail: teamB + " : " + scoreB.gf + " but(s)"
      },
      buts_encaisses_B: {
        valeur: scoreB.ga,
        detail: teamB + " : " + scoreB.ga + " but(s) encaissé(s)"
      },
      rapport_force: {
        detail: "Score final officiel ajouté manuellement : " + finalScore
      }
    },

    pronostics: {
      resultat_1x2: {
        valeur: "Terminé",
        label: "Match terminé",
        confiance: 100,
        cote_estimee: ""
      },
      over_under: {
        valeur: "Non applicable",
        confiance: 100,
        cote_estimee: ""
      },
      btts: {
        valeur: match.hg > 0 && match.ag > 0 ? "Oui" : "Non",
        confiance: 100,
        cote_estimee: ""
      },
      double_chance: {
        valeur: "Non applicable",
        confiance: 100,
        cote_estimee: ""
      },
      handicap: {
        valeur: "Non applicable",
        confiance: 100,
        cote_estimee: ""
      },
      premier_but: {
        valeur: "Non disponible",
        confiance: 0,
        cote_estimee: ""
      },
      mi_temps_fin: {
        valeur: "Non disponible",
        confiance: 0,
        cote_estimee: ""
      },
      cage_inviolee: {
        valeur: match.hg === 0 || match.ag === 0 ? "Oui" : "Non",
        confiance: 100,
        cote_estimee: ""
      },
      score_exact: {
        valeur: match.hg + "-" + match.ag,
        confiance: 100,
        cote_estimee: ""
      },
      winner: {
        valeur: winner,
        confiance: 100
      },
      perdant: {
        valeur: loser,
        confiance: loser === "Aucun" ? 0 : 100
      }
    },

    analyse_approfondie: {
      forces_A: "Match déjà joué. Analyse de pronostic désactivée.",
      faiblesses_A: "Non applicable après le coup de sifflet final.",
      forces_B: "Match déjà joué. Analyse de pronostic désactivée.",
      faiblesses_B: "Non applicable après le coup de sifflet final.",
      facteur_cle: "Résultat final : " + finalScore + ". Aucun pari conseillé, car le match est terminé."
    },

    analysis: {
      forme_domicile: {
        score: 100,
        detail: "Résultat final connu"
      },
      forme_exterieur: {
        score: 100,
        detail: "Résultat final connu"
      },
      h2h: {
        score: 100,
        detail: "Match terminé"
      },
      motivation: {
        score: 100,
        detail: "Non applicable"
      },
      blessures: {
        score: 100,
        detail: "Non applicable"
      }
    },

    buteurs_potentiels: [],

    verdict:
      "Match terminé : " + finalScore + ". Aucun pari possible sur ce match."
  };
}

function riskLevel(confidence, statsA, statsB){
  const totalManual = (statsA.manualGames || 0) + (statsB.manualGames || 0);

  if(confidence >= 70 && totalManual >= 2) return "Risque moyen";
  if(confidence >= 62) return "Risque moyen/élevé";
  return "Risque élevé";
}

function makePrediction(teamA, teamB, statsA, statsB){
  const powerA =
    statsA.ppg * 12 +
    statsA.avgGF * 8 -
    statsA.avgGA * 6 +
    statsA.cleanSheets * 1.5 +
    statsA.manualGames * 1.5;

  const powerB =
    statsB.ppg * 12 +
    statsB.avgGF * 8 -
    statsB.avgGA * 6 +
    statsB.cleanSheets * 1.5 +
    statsB.manualGames * 1.5;

  const diff = powerA - powerB;

  const expectedA = clamp((statsA.avgGF + statsB.avgGA) / 2, 0.2, 3.5);
  const expectedB = clamp((statsB.avgGF + statsA.avgGA) / 2, 0.2, 3.5);

  let scoreA = Math.round(expectedA);
  let scoreB = Math.round(expectedB);

  if(diff > 8 && scoreA <= scoreB) scoreA = scoreB + 1;
  if(diff < -8 && scoreB <= scoreA) scoreB = scoreA + 1;

  let result = "X";
  let winner = "Match nul";
  let loser = "Aucun";

  if(diff > 5){
    result = "1";
    winner = teamA;
    loser = teamB;
  }

  if(diff < -5){
    result = "2";
    winner = teamB;
    loser = teamA;
  }

  const confidence = clamp(
    Math.round(50 + Math.abs(diff) * 2 + Math.min(statsA.played, statsB.played) * 2),
    45,
    78
  );

  const totalGoals = expectedA + expectedB;
  const over = totalGoals >= 2.4 ? "Over 2.5" : "Under 2.5";

  const btts =
    statsA.avgGF >= 0.9 &&
    statsB.avgGF >= 0.9 &&
    statsA.avgGA >= 0.7 &&
    statsB.avgGA >= 0.7
      ? "Oui"
      : "Non";

  const doubleChance =
    result === "1" ? "1X" :
    result === "2" ? "X2" :
    "1X / X2";

  const risk = riskLevel(confidence, statsA, statsB);

  let pariType = "Pronostic prudent";
  let pariValeur = "Double chance : " + doubleChance;
  let pariRaison = "Choix plus prudent que le score exact. À vérifier avec les compositions officielles.";

  if(risk === "Risque élevé"){
    pariType = "Aucun pari fort conseillé";
    pariValeur = "À surveiller";
    pariRaison = "Données limitées ou écart statistique insuffisant.";
  }

  return {
    result,
    winner,
    loser,
    confidence,
    scoreExact: scoreA + "-" + scoreB,
    over,
    btts,
    doubleChance,
    pariType,
    pariValeur,
    pariRaison,
    risk
  };
}

function buildPredictionResponse(teamA, teamB, statsA, statsB){
  const pred = makePrediction(teamA, teamB, statsA, statsB);
  const group = findGroup(teamA, teamB);

  const sourcesText = [
    "CDM 2026 manuelle si disponible",
    "API-Football gratuit saisons 2022-2024"
  ].join(" + ");

  return {
    match: teamA + " - " + teamB,
    competition: "Données réelles : CDM 2026 + API-Football gratuit",
    date_info: sourcesText,
    is_world_cup: true,
    group,
    niveau_confiance_global: pred.confidence,

    pari_du_jour: {
      type: pred.pariType,
      valeur: pred.pariValeur,
      raison: pred.pariRaison + " Niveau : " + pred.risk + ".",
      cote_estimee: "N/D"
    },

    stats_techniques: {
      buts_marques_A: {
        valeur: statsA.avgGF,
        detail: statsA.goalsFor + " buts sur " + statsA.played + " matchs"
      },
      buts_encaisses_A: {
        valeur: statsA.avgGA,
        detail: statsA.goalsAgainst + " buts encaissés sur " + statsA.played + " matchs"
      },
      buts_marques_B: {
        valeur: statsB.avgGF,
        detail: statsB.goalsFor + " buts sur " + statsB.played + " matchs"
      },
      buts_encaisses_B: {
        valeur: statsB.avgGA,
        detail: statsB.goalsAgainst + " buts encaissés sur " + statsB.played + " matchs"
      },
      rapport_force: {
        detail:
          teamA + " : " +
          statsA.wins + "V-" +
          statsA.draws + "N-" +
          statsA.losses + "D | " +
          teamB + " : " +
          statsB.wins + "V-" +
          statsB.draws + "N-" +
          statsB.losses + "D"
      }
    },

    pronostics: {
      resultat_1x2: {
        valeur: pred.result,
        label:
          pred.result === "1" ? "Avantage " + teamA :
          pred.result === "2" ? "Avantage " + teamB :
          "Match nul possible",
        confiance: pred.confidence,
        cote_estimee: ""
      },
      over_under: {
        valeur: pred.over,
        confiance: clamp(pred.confidence - 8,35,72),
        cote_estimee: ""
      },
      btts: {
        valeur: pred.btts,
        confiance: clamp(pred.confidence - 10,35,70),
        cote_estimee: ""
      },
      double_chance: {
        valeur: pred.doubleChance,
        confiance: clamp(pred.confidence + 8,55,82),
        cote_estimee: ""
      },
      handicap: {
        valeur: "À éviter",
        confiance: 40,
        cote_estimee: ""
      },
      premier_but: {
        valeur: "À éviter",
        confiance: 38,
        cote_estimee: ""
      },
      mi_temps_fin: {
        valeur: "À éviter",
        confiance: 35,
        cote_estimee: ""
      },
      cage_inviolee: {
        valeur: "À éviter",
        confiance: 35,
        cote_estimee: ""
      },
      score_exact: {
        valeur: pred.scoreExact,
        confiance: 20,
        cote_estimee: ""
      },
      winner: {
        valeur: pred.winner,
        confiance: pred.confidence
      },
      perdant: {
        valeur: pred.loser,
        confiance: pred.result === "X" ? 0 : clamp(p
