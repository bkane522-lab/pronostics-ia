const VERSION = "V7_STATS_CDM_AUTOMATIQUES_2026_06_21";

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
  { date:"2026-06-18", group:"Groupe A", home:"Tchéquie", away:"Afrique du Sud", hg:1, ag:1 },
  { date:"2026-06-18", group:"Groupe B", home:"Suisse", away:"Bosnie", hg:4, ag:1 },

  { date:"2026-06-19", group:"Groupe B", home:"Canada", away:"Qatar", hg:6, ag:0 },
  { date:"2026-06-19", group:"Groupe A", home:"Mexique", away:"Corée du Sud", hg:1, ag:0 },
  { date:"2026-06-19", group:"Groupe D", home:"USA", away:"Australie", hg:2, ag:0 },

  { date:"2026-06-20", group:"Groupe C", home:"Écosse", away:"Maroc", hg:0, ag:1 },
  { date:"2026-06-20", group:"Groupe C", home:"Brésil", away:"Haïti", hg:3, ag:0 },
  { date:"2026-06-20", group:"Groupe D", home:"Turquie", away:"Paraguay", hg:0, ag:1 },
  { date:"2026-06-20", group:"Groupe F", home:"Pays-Bas", away:"Suède", hg:5, ag:1 },
  { date:"2026-06-20", group:"Groupe E", home:"Allemagne", away:"Côte d’Ivoire", hg:2, ag:1 },

  { date:"2026-06-21", group:"Groupe E", home:"Équateur", away:"Curaçao", hg:0, ag:0 },
  { date:"2026-06-21", group:"Groupe F", home:"Tunisie", away:"Japon", hg:0, ag:4 }
];

function clean(value){
  return String(value || "")
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
      if(clean(team) === input){
        return team;
      }
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
    "bosnie herzégovine":"Bosnie",
    "tcheque":"Tchéquie",
    "republique tcheque":"Tchéquie",
    "curacao":"Curaçao",
    "pays bas":"Pays-Bas",
    "arabie saoudite":"Arabie Saoudite",
    "cote divoire":"Côte d’Ivoire"
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

  if(/\s+vs\s+/i.test(raw)){
    parts = raw.split(/\s+vs\s+/i);
  }else if(/\s+contre\s+/i.test(raw)){
    parts = raw.split(/\s+contre\s+/i);
  }else if(/\s+-\s+/i.test(raw)){
    parts = raw.split(/\s+-\s+/i);
  }

  if(!parts || parts.length < 2){
    return null;
  }

  return {
    teamA: canonTeam(parts[0]),
    teamB: canonTeam(parts[1])
  };
}

function findGroup(teamA, teamB){
  for(const group of GROUPS){
    const hasA = group.teams.some(function(team){
      return clean(team) === clean(teamA);
    });

    const hasB = group.teams.some(function(team){
      return clean(team) === clean(teamB);
    });

    if(hasA && hasB){
      return group.g;
    }
  }

  return "";
}

function findCompletedMatch(teamA, teamB){
  return WC_2026_RESULTS.find(function(match){
    const sameOrder =
      clean(match.home) === clean(teamA) &&
      clean(match.away) === clean(teamB);

    const reverseOrder =
      clean(match.home) === clean(teamB) &&
      clean(match.away) === clean(teamA);

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
  if(match.hg > match.ag){
    return match.home;
  }

  if(match.ag > match.hg){
    return match.away;
  }

  return "Match nul";
}

function getLoser(match){
  if(match.hg > match.ag){
    return match.away;
  }

  if(match.ag > match.hg){
    return match.home;
  }

  return "Aucun";
}

function baseStats(team){
  return {
    team: team,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
    points: 0,
    avgGF: 0,
    avgGA: 0,
    form: [],
    lastMatches: []
  };
}

function getTeamStats(team){
  const stats = baseStats(team);

  const matches = WC_2026_RESULTS
    .filter(function(match){
      return clean(match.home) === clean(team) || clean(match.away) === clean(team);
    })
    .sort(function(a,b){
      return new Date(a.date) - new Date(b.date);
    });

  matches.forEach(function(match){
    const score = getScoreForTeam(match, team);

    stats.played += 1;
    stats.goalsFor += score.gf;
    stats.goalsAgainst += score.ga;

    let result = "N";

    if(score.gf > score.ga){
      stats.wins += 1;
      stats.points += 3;
      result = "V";
    }else if(score.gf === score.ga){
      stats.draws += 1;
      stats.points += 1;
      result = "N";
    }else{
      stats.losses += 1;
      result = "D";
    }

    stats.form.push(result);

    stats.lastMatches.push({
      date: match.date,
      group: match.group,
      score: match.home + " " + match.hg + "-" + match.ag + " " + match.away,
      result: result
    });
  });

  stats.goalDiff = stats.goalsFor - stats.goalsAgainst;

  if(stats.played > 0){
    stats.avgGF = Number((stats.goalsFor / stats.played).toFixed(2));
    stats.avgGA = Number((stats.goalsAgainst / stats.played).toFixed(2));
  }

  return stats;
}

function formatStats(stats){
  if(!stats || stats.played === 0){
    return stats.team + " : aucune statistique CDM 2026 disponible pour le moment.";
  }

  return stats.team + " : " +
    stats.played + " match(s), " +
    stats.wins + " victoire(s), " +
    stats.draws + " nul(s), " +
    stats.losses + " défaite(s), " +
    stats.goalsFor + " but(s) marqué(s), " +
    stats.goalsAgainst + " encaissé(s), " +
    "différence " + (stats.goalDiff >= 0 ? "+" : "") + stats.goalDiff + ", " +
    stats.points + " point(s). Forme : " + stats.form.join("-");
}

function getGroupTable(groupName){
  const group = GROUPS.find(function(g){
    return g.g === groupName;
  });

  if(!group){
    return [];
  }

  return group.teams
    .map(function(team){
      return getTeamStats(team);
    })
    .sort(function(a,b){
      if(b.points !== a.points){
        return b.points - a.points;
      }

      if(b.goalDiff !== a.goalDiff){
        return b.goalDiff - a.goalDiff;
      }

      if(b.goalsFor !== a.goalsFor){
        return b.goalsFor - a.goalsFor;
      }

      return a.team.localeCompare(b.team);
    });
}

function powerScore(stats){
  if(!stats || stats.played === 0){
    return 0;
  }

  return (
    stats.points * 8 +
    stats.goalDiff * 3 +
    stats.goalsFor * 2 -
    stats.goalsAgainst * 1 +
    stats.wins * 5
  );
}

function cautiousPrediction(teamA, teamB, statsA, statsB){
  const totalGames = statsA.played + statsB.played;

  if(totalGames < 2){
    return {
      global: 30,
      label: "Données limitées",
      result: "À éviter",
      doubleChance: "À éviter",
      overUnder: "À éviter",
      btts: "À éviter",
      score: "À éviter",
      winner: "Données insuffisantes",
      verdict: "Données encore trop limitées. Aucun pari fort conseillé."
    };
  }

  const powerA = powerScore(statsA);
  const powerB = powerScore(statsB);
  const diff = powerA - powerB;

  let winner = "Match équilibré";
  let result = "X";
  let doubleChance = "1X / X2";
  let global = 45;

  if(diff >= 12){
    winner = teamA;
    result = "1";
    doubleChance = "1X";
    global = 62;
  }else if(diff <= -12){
    winner = teamB;
    result = "2";
    doubleChance = "X2";
    global = 62;
  }else{
    winner = "Match serré";
    result = "X";
    doubleChance = "1X / X2";
    global = 50;
  }

  const avgTotalGoals = statsA.avgGF + statsB.avgGF;
  const overUnder = avgTotalGoals >= 2.4 ? "Over 1.5 prudent" : "Under 3.5 prudent";

  const btts =
    statsA.avgGF >= 1 &&
    statsB.avgGF >= 1 &&
    statsA.avgGA >= 0.7 &&
    statsB.avgGA >= 0.7
      ? "Oui possible"
      : "À éviter";

  const scoreA = Math.max(0, Math.round((statsA.avgGF + statsB.avgGA) / 2));
  const scoreB = Math.max(0, Math.round((statsB.avgGF + statsA.avgGA) / 2));

  return {
    global: global,
    label: "Analyse prudente",
    result: result,
    doubleChance: doubleChance,
    overUnder: overUnder,
    btts: btts,
    score: scoreA + "-" + scoreB,
    winner: winner,
    verdict: "Analyse basée seulement sur les résultats CDM 2026 enregistrés. À confirmer avec compositions, blessures et contexte du match."
  };
}

function buildCompletedMatchResponse(teamA, teamB, match){
  const scoreA = getScoreForTeam(match, teamA);
  const scoreB = getScoreForTeam(match, teamB);

  const statsA = getTeamStats(teamA);
  const statsB = getTeamStats(teamB);

  const finalScore = match.home + " " + match.hg + "-" + match.ag + " " + match.away;
  const winner = getWinner(match);
  const loser = getLoser(match);

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
        detail: teamA + " : " + scoreA.gf + " but(s) dans ce match. Total CDM : " + statsA.goalsFor
      },
      buts_encaisses_A: {
        valeur: scoreA.ga,
        detail: teamA + " : " + scoreA.ga + " but(s) encaissé(s) dans ce match. Total CDM : " + statsA.goalsAgainst
      },
      buts_marques_B: {
        valeur: scoreB.gf,
        detail: teamB + " : " + scoreB.gf + " but(s) dans ce match. Total CDM : " + statsB.goalsFor
      },
      buts_encaisses_B: {
        valeur: scoreB.ga,
        detail: teamB + " : " + scoreB.ga + " but(s) encaissé(s) dans ce match. Total CDM : " + statsB.goalsAgainst
      },
      rapport_force: {
        detail: "Résultat final : " + finalScore
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
      forces_A: formatStats(statsA),
      faiblesses_A: statsA.played > 0 ? "Moyenne encaissée : " + statsA.avgGA + " but(s)/match." : "Données insuffisantes.",
      forces_B: formatStats(statsB),
      faiblesses_B: statsB.played > 0 ? "Moyenne encaissée : " + statsB.avgGA + " but(s)/match." : "Données insuffisantes.",
      facteur_cle: "Résultat final connu : " + finalScore + ". Aucun pari conseillé car le match est terminé."
    },

    analysis: {
      forme_domicile: {
        score: 100,
        detail: formatStats(statsA)
      },
      forme_exterieur: {
        score: 100,
        detail: formatStats(statsB)
      },
      h2h: {
        score: 100,
        detail: "Match terminé"
      },
      motivation: {
        score: 100,
        detail: "Non applicable après match"
      },
      blessures: {
        score: 100,
        detail: "Non applicable après match"
      }
    },

    buteurs_potentiels: [],

    verdict: "Match terminé : " + finalScore + ". Aucun pari possible sur ce match."
  };
}

function buildUpcomingMatchResponse(teamA, teamB){
  const group = findGroup(teamA, teamB);
  const statsA = getTeamStats(teamA);
  const statsB = getTeamStats(teamB);
  const prediction = cautiousPrediction(teamA, teamB, statsA, statsB);
  const table = getGroupTable(group);

  const tableText = table.length
    ? table.map(function(t, index){
        return (index + 1) + ". " + t.team + " — " + t.points + " pts, diff " + (t.goalDiff >= 0 ? "+" : "") + t.goalDiff;
      }).join(" | ")
    : "Classement non disponible.";

  return {
    match: teamA + " - " + teamB,
    competition: "Match à venir / statistiques CDM 2026",
    date_info: group ? group : "Coupe du Monde 2026",
    is_world_cup: true,
    group: group,
    niveau_confiance_global: prediction.global,

    pari_du_jour: {
      type: prediction.label,
      valeur: prediction.verdict.indexOf("Aucun pari fort") !== -1 ? "Aucun pari fort conseillé" : "Analyse prudente",
      raison: prediction.verdict,
      cote_estimee: "N/D"
    },

    stats_techniques: {
      buts_marques_A: {
        valeur: statsA.avgGF,
        detail: teamA + " : " + statsA.goalsFor + " but(s) marqué(s) en " + statsA.played + " match(s). Moyenne : " + statsA.avgGF
      },
      buts_encaisses_A: {
        valeur: statsA.avgGA,
        detail: teamA + " : " + statsA.goalsAgainst + " but(s) encaissé(s). Moyenne : " + statsA.avgGA
      },
      buts_marques_B: {
        valeur: statsB.avgGF,
        detail: teamB + " : " + statsB.goalsFor + " but(s) marqué(s) en " + statsB.played + " match(s). Moyenne : " + statsB.avgGF
      },
      buts_encaisses_B: {
        valeur: statsB.avgGA,
        detail: teamB + " : " + statsB.goalsAgainst + " but(s) encaissé(s). Moyenne : " + statsB.avgGA
      },
      rapport_force: {
        detail: "Classement " + group + " : " + tableText
      }
    },

    pronostics: {
      resultat_1x2: {
        valeur: prediction.result,
        label: prediction.winner,
        confiance: prediction.global,
        cote_estimee: ""
      },
      over_under: {
        valeur: prediction.overUnder,
        confiance: Math.max(25, prediction.global - 10),
        cote_estimee: ""
      },
      btts: {
        valeur: prediction.btts,
        confiance: Math.max(25, prediction.global - 12),
        cote_estimee: ""
      },
      double_chance: {
        valeur: prediction.doubleChance,
        confiance: Math.min(75, prediction.global + 10),
        cote_estimee: ""
      },
      handicap: {
        valeur: "À éviter",
        confiance: 30,
        cote_estimee: ""
      },
      premier_but: {
        valeur: "À éviter",
        confiance: 25,
        cote_estimee: ""
      },
      mi_temps_fin: {
        valeur: "À éviter",
        confiance: 25,
        cote_estimee: ""
      },
      cage_inviolee: {
        valeur: "À éviter",
        confiance: 25,
        cote_estimee: ""
      },
      score_exact: {
        valeur: prediction.score,
        confiance: 18,
        cote_estimee: ""
      },
      winner: {
        valeur: prediction.winner,
        confiance: prediction.global
      },
      perdant: {
        valeur: prediction.winner === teamA ? teamB : prediction.winner === teamB ? teamA : "Données insuffisantes",
        confiance: prediction.winner === "Match serré" || prediction.winner === "Données insuffisantes" ? 0 : Math.max(25, prediction.global - 12)
      }
    },

    analyse_approfondie: {
      forces_A: formatStats(statsA),
      faiblesses_A: statsA.played > 0 ? "Moyenne encaissée : " + statsA.avgGA + " but(s)/match. Forme : " + (statsA.form.join("-") || "N/D") : "Données insuffisantes.",
      forces_B: formatStats(statsB),
      faiblesses_B: statsB.played > 0 ? "Moyenne encaissée : " + statsB.avgGA + " but(s)/match. Forme : " + (statsB.form.join("-") || "N/D") : "Données insuffisantes.",
      facteur_cle: "Classement du groupe : " + tableText + ". Analyse prudente, car les données CDM restent limitées."
    },

    analysis: {
      forme_domicile: {
        score: statsA.played ? Math.min(100, statsA.points * 20 + statsA.goalDiff * 5 + 40)
