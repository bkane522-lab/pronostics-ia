const API_BASE = "https://v3.football.api-sports.io";

const VERSION = "SEASON_FIX_2026_06_18";

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

async function getStats(teamId){
  const currentYear = new Date().getFullYear();

  const seasons = [
    currentYear,
    currentYear - 1,
    currentYear - 2,
    currentYear - 3
  ];

  let allFixtures = [];

  for(const season of seasons){
    const fixtures = await apiFetch("/fixtures", {
      team: teamId,
      season: season
    });

    allFixtures = allFixtures.concat(fixtures);
  }

  const finished = allFixtures
    .filter(fx =>
      fx &&
      fx.fixture &&
      fx.fixture.date &&
      fx.goals &&
      fx.goals.home !== null &&
      fx.goals.away !== null
    )
    .sort((a,b) => new Date(b.fixture.date) - new Date(a.fixture.date))
    .slice(0,5);

  let played = 0;
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  let cleanSheets = 0;

  finished.forEach(fx => {
    const isHome = fx.teams.home.id === teamId;

    const gf = isHome ? fx.goals.home : fx.goals.away;
    const ga = isHome ? fx.goals.away : fx.goals.home;

    played++;
    goalsFor += gf;
    goalsAgainst += ga;

    if(ga === 0) cleanSheets++;

    if(gf > ga) wins++;
    else if(gf === ga) draws++;
    else losses++;
  });

  if(played === 0){
    return null;
  }

  return {
    played,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    avgGF: Number((goalsFor / played).toFixed(2)),
    avgGA: Number((goalsAgainst / played).toFixed(2)),
    ppg: Number(((wins * 3 + draws) / played).toFixed(2)),
    cleanSheets
  };
}

function makePrediction(teamA, teamB, statsA, statsB){
  const powerA =
    statsA.ppg * 12 +
    statsA.avgGF * 8 -
    statsA.avgGA * 6 +
    statsA.cleanSheets * 1.5;

  const powerB =
    statsB.ppg * 12 +
    statsB.avgGF * 8 -
    statsB.avgGA * 6 +
    statsB.cleanSheets * 1.5;

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
    Math.round(52 + Math.abs(diff) * 2 + Math.min(statsA.played, statsB.played) * 2),
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

  let pariType = "Double chance";
  let pariValeur = doubleChance;
  let pariRaison = "Choix prudent basé sur la forme récente.";

  if(totalGoals >= 2.7){
    pariType = "Over/Under";
    pariValeur = "Over 1.5";
    pariRaison = "Les moyennes de buts récentes indiquent un match potentiellement ouvert.";
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
    pariRaison
  };
}

function buildResponse(teamA, teamB, statsA, statsB){
  const pred = makePrediction(teamA, teamB, statsA, statsB);
  const group = findGroup(teamA, teamB);

  return {
    match: teamA + " - " + teamB,
    competition: "Coupe du Monde 2026 / données réelles",
    date_info: "5 derniers matchs disponibles",
    is_world_cup: true,
    group,
    niveau_confiance_global: pred.confidence,

    pari_du_jour: {
      type: pred.pariType,
      valeur: pred.pariValeur,
      raison: pred.pariRaison + " À vérifier avec les compositions officielles.",
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
          pred.result === "1" ? "Victoire de " + teamA :
          pred.result === "2" ? "Victoire de " + teamB :
          "Match nul possible",
        confiance: pred.confidence,
        cote_estimee: ""
      },
      over_under: {
        valeur: pred.over,
        confiance: clamp(pred.confidence - 6,40,75),
        cote_estimee: ""
      },
      btts: {
        valeur: pred.btts,
        confiance: clamp(pred.confidence - 8,40,72),
        cote_estimee: ""
      },
      double_chance: {
        valeur: pred.doubleChance,
        confiance: clamp(pred.confidence + 8,55,82),
        cote_estimee: ""
      },
      handicap: {
        valeur: "À éviter",
        confiance: 45,
        cote_estimee: ""
      },
      premier_but: {
        valeur: pred.winner,
        confiance: clamp(pred.confidence - 12,35,65),
        cote_estimee: ""
      },
      mi_temps_fin: {
        valeur: "À éviter",
        confiance: 42,
        cote_estimee: ""
      },
      cage_inviolee: {
        valeur: "Donnée faible",
        confiance: 40,
        cote_estimee: ""
      },
      score_exact: {
        valeur: pred.scoreExact,
        confiance: 25,
        cote_estimee: ""
      },
      winner: {
        valeur: pred.winner,
        confiance: pred.confidence
      },
      perdant: {
        valeur: pred.loser,
        confiance: pred.result === "X" ? 0 : clamp(pred.confidence - 8,40,70)
      }
    },

    analyse_approfondie: {
      forces_A:
        statsA.avgGF + " buts marqués/match, " +
        statsA.ppg + " point/match.",
      faiblesses_A:
        statsA.avgGA + " buts encaissés/match.",
      forces_B:
        statsB.avgGF + " buts marqués/match, " +
        statsB.ppg + " point/match.",
      faiblesses_B:
        statsB.avgGA + " buts encaissés/match.",
      facteur_cle:
        "Vérifie toujours les compositions officielles, blessures et suspensions avant de jouer."
    },

    analysis: {
      forme_domicile: {
        score: clamp(Math.round(statsA.ppg * 33),10,100),
        detail:
          statsA.wins + " victoires, " +
          statsA.draws + " nuls, " +
          statsA.losses + " défaites"
      },
      forme_exterieur: {
        score: clamp(Math.round(statsB.ppg * 33),10,100),
        detail:
          statsB.wins + " victoires, " +
          statsB.draws + " nuls, " +
          statsB.losses + " défaites"
      },
      h2h: {
        score: 50,
        detail: "Face-à-face non utilisé dans cette version gratuite."
      },
      motivation: {
        score: 55,
        detail: "Motivation à confirmer selon classement réel."
      },
      blessures: {
        score: 50,
        detail: "Blessures à vérifier avant le match."
      }
    },

    buteurs_potentiels: [],

    verdict:
      pred.pariType + " : " +
      pred.pariValeur +
      ". Analyse basée sur données réelles disponibles, sans garantie."
  };
}

module.exports = async function handler(req,res){
  if(req.method !== "POST"){
    return res.status(405).json({ error:"Méthode non autorisée." });
  }

  try{
    const parsed = parseMatch(req.body && req.body.match);

    if(!parsed){
      return res.status(400).json({
        error:"Écris un match complet, exemple : France vs Sénégal."
      });
    }

    const { teamA, teamB } = parsed;

    const [idA, idB] = await Promise.all([
      getTeamId(teamA),
      getTeamId(teamB)
    ]);

    const [statsA, statsB] = await Promise.all([
      getStats(idA),
      getStats(idB)
    ]);

    if(!statsA || !statsB || statsA.played < 3 || statsB.played < 3){
      return res.status(200).json({
        match: teamA + " - " + teamB,
        competition: "Données insuffisantes",
        date_info: "API-Football",
        is_world_cup: true,
        group: findGroup(teamA, teamB),
        niveau_confiance_global: 35,
        pari_du_jour: {
          type: "Aucun pari conseillé",
          valeur: "Données insuffisantes",
          raison: "Moins de 3 matchs récents disponibles.",
          cote_estimee: "N/D"
        },
        stats_techniques: null,
        pronostics: {
          resultat_1x2:{valeur:"À éviter",label:"Données insuffisantes",confiance:35,cote_estimee:""},
          over_under:{valeur:"À éviter",confiance:35,cote_estimee:""},
          btts:{valeur:"À éviter",confiance:35,cote_estimee:""},
          double_chance:{valeur:"À éviter",confiance:35,cote_estimee:""},
          handicap:{valeur:"À éviter",confiance:35,cote_estimee:""},
          premier_but:{valeur:"À éviter",confiance:35,cote_estimee:""},
          mi_temps_fin:{valeur:"À éviter",confiance:35,cote_estimee:""},
          cage_inviolee:{valeur:"À éviter",confiance:35,cote_estimee:""},
          score_exact:{valeur:"À éviter",confiance:20,cote_estimee:""},
          winner:{valeur:"Données insuffisantes",confiance:35},
          perdant:{valeur:"Données insuffisantes",confiance:35}
        },
        analyse_approfondie: {
          forces_A:"Données insuffisantes.",
          faiblesses_A:"Ne pas jouer sans données fiables.",
          forces_B:"Données insuffisantes.",
          faiblesses_B:"Ne pas jouer sans données fiables.",
          facteur_cle:"L’app refuse de fabriquer un pronostic quand les données sont trop faibles."
        },
        analysis:{},
        buteurs_potentiels:[],
        verdict:"Aucun pari conseillé : données insuffisantes."
      });
    }

    return res.status(200).json(buildResponse(teamA, teamB, statsA, statsB));

  }catch(error){
    return res.status(500).json({
      error:
        "VERSION " + VERSION + " — " +
        (error.message || "Erreur serveur.")
    });
  }
};
