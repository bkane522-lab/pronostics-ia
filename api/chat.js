const VERSION = "STABLE_SANS_API_MATCHS_TERMINES";

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
  { date:"2026-06-18", group:"Groupe A", home:"Tchéquie", away:"Afrique du Sud", hg:1, ag:1 }
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
    "curacao":"Curaçao"
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
  } else if(/\s+contre\s+/i.test(raw)){
    parts = raw.split(/\s+contre\s+/i);
  } else if(/\s+-\s+/i.test(raw)){
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
    const hasA = group.teams.some(t => clean(t) === clean(teamA));
    const hasB = group.teams.some(t => clean(t) === clean(teamB));

    if(hasA && hasB){
      return group.g;
    }
  }

  return "";
}

function findCompletedMatch(teamA, teamB){
  return WC_2026_RESULTS.find(match => {
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
  if(match.hg > match.ag) return match.home;
  if(match.ag > match.hg) return match.away;
  return "Match nul";
}

function getLoser(match){
  if(match.hg > match.ag) return match.away;
  if(match.ag > match.hg) return match.home;
  return "Aucun";
}

function buildCompletedMatchResponse(teamA, teamB, match){
  const scoreA = getScoreForTeam(match, teamA);
  const scoreB = getScoreForTeam(match, teamB);

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
        detail: "Résultat final ajouté manuellement : " + finalScore
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
      faiblesses_A: "Non applicable après le match.",
      forces_B: "Match déjà joué. Analyse de pronostic désactivée.",
      faiblesses_B: "Non applicable après le match.",
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

    verdict: "Match terminé : " + finalScore + ". Aucun pari possible sur ce match."
  };
}

function buildUpcomingMatchResponse(teamA, teamB){
  const group = findGroup(teamA, teamB);

  return {
    match: teamA + " - " + teamB,
    competition: "Match non terminé / données insuffisantes",
    date_info: group ? group : "Coupe du Monde 2026",
    is_world_cup: true,
    group,
    niveau_confiance_global: 30,

    pari_du_jour: {
      type: "Aucun pari conseillé",
      valeur: "Données insuffisantes",
      raison: "Version stable sans API-Football. Les vraies statistiques récentes ne sont pas encore connectées.",
      cote_estimee: "N/D"
    },

    stats_techniques: {
      buts_marques_A: {
        valeur: 0,
        detail: "Données non disponibles dans cette version stable"
      },
      buts_encaisses_A: {
        valeur: 0,
        detail: "Données non disponibles dans cette version stable"
      },
      buts_marques_B: {
        valeur: 0,
        detail: "Données non disponibles dans cette version stable"
      },
      buts_encaisses_B: {
        valeur: 0,
        detail: "Données non disponibles dans cette version stable"
      },
      rapport_force: {
        detail: "Aucun pronostic fiable sans données récentes vérifiées."
      }
    },

    pronostics: {
      resultat_1x2: {
        valeur: "À éviter",
        label: "Données insuffisantes",
        confiance: 30,
        cote_estimee: ""
      },
      over_under: {
        valeur: "À éviter",
        confiance: 30,
        cote_estimee: ""
      },
      btts: {
        valeur: "À éviter",
        confiance: 30,
        cote_estimee: ""
      },
      double_chance: {
        valeur: "À éviter",
        confiance: 30,
        cote_estimee: ""
      },
      handicap: {
        valeur: "À éviter",
        confiance: 30,
        cote_estimee: ""
      },
      premier_but: {
        valeur: "À éviter",
        confiance: 30,
        cote_estimee: ""
      },
      mi_temps_fin: {
        valeur: "À éviter",
        confiance: 30,
        cote_estimee: ""
      },
      cage_inviolee: {
        valeur: "À éviter",
        confiance: 30,
        cote_estimee: ""
      },
      score_exact: {
        valeur: "À éviter",
        confiance: 15,
        cote_estimee: ""
      },
      winner: {
        valeur: "Données insuffisantes",
        confiance: 30
      },
      perdant: {
        valeur: "Données insuffisantes",
        confiance: 30
      }
    },

    analyse_approfondie: {
      forces_A: "Données insuffisantes.",
      faiblesses_A: "Ne pas jouer sans statistiques fiables.",
      forces_B: "Données insuffisantes.",
      faiblesses_B: "Ne pas jouer sans statistiques fiables.",
      facteur_cle: "Cette version stable sert à éviter les erreurs serveur. Elle n’invente pas de pronostic."
    },

    analysis: {
      forme_domicile: {
        score: 30,
        detail: "Données non disponibles"
      },
      forme_exterieur: {
        score: 30,
        detail: "Données non disponibles"
      },
      h2h: {
        score: 30,
        detail: "Données non disponibles"
      },
      motivation: {
        score: 30,
        detail: "À vérifier"
      },
      blessures: {
        score: 30,
        detail: "À vérifier"
      }
    },

    buteurs_potentiels: [],

    verdict: "Aucun pari conseillé : données insuffisantes dans cette version stable."
  };
}

module.exports = async function handler(req, res){
  try{
    if(req.method === "GET"){
      return res.status(200).json({
        ok: true,
        version: VERSION,
        message: "API active. Utilise POST avec { match: 'France vs Sénégal' }."
      });
    }

    if(req.method !== "POST"){
      return res.status(405).json({
        error: "Méthode non autorisée."
      });
    }

    const parsed = parseMatch(req.body && req.body.match);

    if(!parsed){
      return res.status(400).json({
        error: "Écris un match complet, exemple : France vs Sénégal."
      });
    }

    const { teamA, teamB } = parsed;

    const completedMatch = findCompletedMatch(teamA, teamB);

    if(completedMatch){
      return res.status(200).json(
        buildCompletedMatchResponse(teamA, teamB, completedMatch)
      );
    }

    return res.status(200).json(
      buildUpcomingMatchResponse(teamA, teamB)
    );

  }catch(error){
    return res.status(200).json({
      match: "Erreur contrôlée",
      competition: "Version stable",
      date_info: VERSION,
      is_world_cup: false,
      group: "",
      niveau_confiance_global: 0,
      pari_du_jour: {
        type: "Erreur contrôlée",
        valeur: "API stable",
        raison: error.message || "Erreur inconnue",
        cote_estimee: "N/D"
      },
      stats_techniques: null,
      pronostics: {
        resultat_1x2:{valeur:"Erreur",label:"Erreur contrôlée",confiance:0,cote_estimee:""},
        over_under:{valeur:"Erreur",confiance:0,cote_estimee:""},
        btts:{valeur:"Erreur",confiance:0,cote_estimee:""},
        double_chance:{valeur:"Erreur",confiance:0,cote_estimee:""},
        handicap:{valeur:"Erreur",confiance:0,cote_estimee:""},
        premier_but:{valeur:"Erreur",confiance:0,cote_estimee:""},
        mi_temps_fin:{valeur:"Erreur",confiance:0,cote_estimee:""},
        cage_inviolee:{valeur:"Erreur",confiance:0,cote_estimee:""},
        score_exact:{valeur:"Erreur",confiance:0,cote_estimee:""},
        winner:{valeur:"Erreur",confiance:0},
        perdant:{valeur:"Erreur",confiance:0}
      },
      analyse_approfondie: {
        forces_A:"Erreur contrôlée.",
        faiblesses_A:"Le serveur n’a pas crashé.",
        forces_B:"Erreur contrôlée.",
        faiblesses_B:"Corrigeable sans casser l’app.",
        facteur_cle:"Message technique : " + (error.message || "Erreur inconnue")
      },
      analysis:{},
      buteurs_potentiels:[],
      verdict:"Erreur contrôlée : le serveur répond quand même en JSON."
    });
  }
};
