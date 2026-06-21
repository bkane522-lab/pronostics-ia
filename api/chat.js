const VERSION = "V7_3_MINI_STABLE_BUTEURS";

const GROUPS = [
  ["Groupe A",["Mexique","Corée du Sud","Tchéquie","Afrique du Sud"]],
  ["Groupe B",["Suisse","Canada","Qatar","Bosnie"]],
  ["Groupe C",["Écosse","Maroc","Brésil","Haïti"]],
  ["Groupe D",["USA","Australie","Turquie","Paraguay"]],
  ["Groupe E",["Allemagne","Côte d’Ivoire","Équateur","Curaçao"]],
  ["Groupe F",["Suède","Japon","Pays-Bas","Tunisie"]],
  ["Groupe G",["Nouvelle-Zélande","Iran","Belgique","Égypte"]],
  ["Groupe H",["Uruguay","Arabie Saoudite","Espagne","Cap-Vert"]],
  ["Groupe I",["Norvège","France","Sénégal","Irak"]],
  ["Groupe J",["Argentine","Autriche","Jordanie","Algérie"]],
  ["Groupe K",["Portugal","RD Congo","Ouzbékistan","Colombie"]],
  ["Groupe L",["Angleterre","Croatie","Ghana","Panama"]]
];

const RESULTS = [
  ["2026-06-11","Groupe A","Mexique","Afrique du Sud",2,0],
  ["2026-06-12","Groupe A","Corée du Sud","Tchéquie",2,1],
  ["2026-06-12","Groupe B","Canada","Bosnie",1,1],
  ["2026-06-13","Groupe D","USA","Paraguay",4,1],
  ["2026-06-13","Groupe B","Qatar","Suisse",1,1],
  ["2026-06-14","Groupe C","Brésil","Maroc",1,1],
  ["2026-06-14","Groupe C","Haïti","Écosse",0,1],
  ["2026-06-14","Groupe D","Australie","Turquie",2,0],
  ["2026-06-14","Groupe E","Allemagne","Curaçao",7,1],
  ["2026-06-14","Groupe F","Pays-Bas","Japon",2,2],
  ["2026-06-15","Groupe E","Côte d’Ivoire","Équateur",1,0],
  ["2026-06-15","Groupe F","Suède","Tunisie",5,1],
  ["2026-06-15","Groupe H","Espagne","Cap-Vert",0,0],
  ["2026-06-15","Groupe G","Belgique","Égypte",1,1],
  ["2026-06-16","Groupe H","Arabie Saoudite","Uruguay",1,1],
  ["2026-06-16","Groupe G","Iran","Nouvelle-Zélande",2,2],
  ["2026-06-16","Groupe I","France","Sénégal",3,1],
  ["2026-06-17","Groupe I","Irak","Norvège",1,4],
  ["2026-06-17","Groupe J","Argentine","Algérie",3,0],
  ["2026-06-17","Groupe J","Autriche","Jordanie",3,1],
  ["2026-06-17","Groupe K","Portugal","RD Congo",1,1],
  ["2026-06-17","Groupe L","Angleterre","Croatie",4,2],
  ["2026-06-18","Groupe L","Ghana","Panama",1,0],
  ["2026-06-18","Groupe K","Ouzbékistan","Colombie",1,3],
  ["2026-06-18","Groupe A","Tchéquie","Afrique du Sud",1,1],
  ["2026-06-18","Groupe B","Suisse","Bosnie",4,1],
  ["2026-06-19","Groupe B","Canada","Qatar",6,0],
  ["2026-06-19","Groupe A","Mexique","Corée du Sud",1,0],
  ["2026-06-19","Groupe D","USA","Australie",2,0],
  ["2026-06-20","Groupe C","Écosse","Maroc",0,1],
  ["2026-06-20","Groupe C","Brésil","Haïti",3,0],
  ["2026-06-20","Groupe D","Turquie","Paraguay",0,1],
  ["2026-06-20","Groupe F","Pays-Bas","Suède",5,1],
  ["2026-06-20","Groupe E","Allemagne","Côte d’Ivoire",2,1],
  ["2026-06-21","Groupe E","Équateur","Curaçao",0,0],
  ["2026-06-21","Groupe F","Tunisie","Japon",0,4]
];

function clean(v){
  return String(v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .replace(/[’']/g,"")
    .replace(/-/g," ")
    .replace(/\s+/g," ")
    .trim();
}

function canon(name){
  const x = clean(name);

  for(const group of GROUPS){
    for(const team of group[1]){
      if(clean(team) === x) return team;
    }
  }

  const aliases = {
    "senegal":"Sénégal",
    "cote ivoire":"Côte d’Ivoire",
    "cote d ivoire":"Côte d’Ivoire",
    "cote divoire":"Côte d’Ivoire",
    "coree du sud":"Corée du Sud",
    "rd congo":"RD Congo",
    "nouvelle zelande":"Nouvelle-Zélande",
    "egypte":"Égypte",
    "equateur":"Équateur",
    "haiti":"Haïti",
    "bresil":"Brésil",
    "suede":"Suède",
    "curacao":"Curaçao",
    "pays bas":"Pays-Bas",
    "arabie saoudite":"Arabie Saoudite",
    "cap vert":"Cap-Vert",
    "usa":"USA",
    "afrique du sud":"Afrique du Sud"
  };

  return aliases[x] || String(name || "").trim();
}

function parseBody(req){
  if(!req.body) return {};
  if(typeof req.body === "string"){
    try{
      return JSON.parse(req.body);
    }catch(e){
      return {};
    }
  }
  return req.body;
}

function parseMatch(input){
  let raw = String(input || "")
    .replace(/CDM\s*2026/gi,"")
    .replace(/Coupe du Monde\s*2026/gi,"")
    .replace(/Groupe\s+[A-L]/gi,"")
    .trim();

  let parts = null;

  if(/\s+vs\s+/i.test(raw)) parts = raw.split(/\s+vs\s+/i);
  else if(/\s+contre\s+/i.test(raw)) parts = raw.split(/\s+contre\s+/i);
  else if(/\s+-\s+/i.test(raw)) parts = raw.split(/\s+-\s+/i);

  if(!parts || parts.length < 2) return null;

  return {
    a: canon(parts[0]),
    b: canon(parts[1])
  };
}

function findGroup(a,b){
  for(const g of GROUPS){
    const hasA = g[1].some(t => clean(t) === clean(a));
    const hasB = g[1].some(t => clean(t) === clean(b));
    if(hasA && hasB) return g[0];
  }
  return "";
}

function findCompleted(a,b){
  for(const r of RESULTS){
    const home = r[2];
    const away = r[3];

    const same = clean(home) === clean(a) && clean(away) === clean(b);
    const reverse = clean(home) === clean(b) && clean(away) === clean(a);

    if(same || reverse){
      return {
        date:r[0],
        group:r[1],
        home:r[2],
        away:r[3],
        hg:r[4],
        ag:r[5]
      };
    }
  }
  return null;
}

function scoreFor(match, team){
  if(clean(match.home) === clean(team)){
    return { gf:match.hg, ga:match.ag };
  }
  if(clean(match.away) === clean(team)){
    return { gf:match.ag, ga:match.hg };
  }
  return { gf:0, ga:0 };
}

function stats(team){
  const s = {
    team,
    played:0,
    wins:0,
    draws:0,
    losses:0,
    gf:0,
    ga:0,
    gd:0,
    points:0,
    avgGF:0,
    avgGA:0,
    cleanSheets:0,
    btts:0,
    over15:0,
    over25:0,
    form:[]
  };

  for(const r of RESULTS){
    const m = {
      date:r[0],
      group:r[1],
      home:r[2],
      away:r[3],
      hg:r[4],
      ag:r[5]
    };

    if(clean(m.home) !== clean(team) && clean(m.away) !== clean(team)){
      continue;
    }

    const sc = scoreFor(m, team);
    const totalGoals = m.hg + m.ag;

    s.played++;
    s.gf += sc.gf;
    s.ga += sc.ga;

    if(sc.ga === 0) s.cleanSheets++;
    if(m.hg > 0 && m.ag > 0) s.btts++;
    if(totalGoals >= 2) s.over15++;
    if(totalGoals >= 3) s.over25++;

    if(sc.gf > sc.ga){
      s.wins++;
      s.points += 3;
      s.form.push("V");
    }else if(sc.gf === sc.ga){
      s.draws++;
      s.points += 1;
      s.form.push("N");
    }else{
      s.losses++;
      s.form.push("D");
    }
  }

  s.gd = s.gf - s.ga;

  if(s.played > 0){
    s.avgGF = Number((s.gf / s.played).toFixed(2));
    s.avgGA = Number((s.ga / s.played).toFixed(2));
  }

  return s;
}

function pct(v,total){
  if(!total) return 0;
  return Math.round((v / total) * 100);
}

function formatStats(s){
  if(!s || s.played === 0){
    return s.team + " : aucune statistique disponible.";
  }

  return s.team + " : " +
    s.played + " match(s), " +
    s.wins + "V, " +
    s.draws + "N, " +
    s.losses + "D, " +
    s.gf + " but(s) marqué(s), " +
    s.ga + " encaissé(s), diff " +
    (s.gd >= 0 ? "+" : "") + s.gd + ", " +
    s.points + " pt(s), clean sheet " +
    pct(s.cleanSheets,s.played) + "%, BTTS " +
    pct(s.btts,s.played) + "%, Over 1.5 " +
    pct(s.over15,s.played) + "%, forme " +
    s.form.join("-");
}

function tableText(groupName){
  const group = GROUPS.find(g => g[0] === groupName);
  if(!group) return "Classement indisponible.";

  const table = group[1].map(t => stats(t));

  table.sort((a,b) => {
    if(b.points !== a.points) return b.points - a.points;
    if(b.gd !== a.gd) return b.gd - a.gd;
    if(b.gf !== a.gf) return b.gf - a.gf;
    return a.team.localeCompare(b.team);
  });

  return table.map((t,i) => {
    return (i + 1) + ". " + t.team + " " + t.points + " pts diff " + (t.gd >= 0 ? "+" : "") + t.gd;
  }).join(" | ");
}

function makePrediction(a,b,sa,sb){
  const total = sa.played + sb.played;

  if(total < 2){
    return {
      confidence:35,
      result:"À éviter",
      doubleChance:"Pas de choix clair",
      overUnder:"À éviter",
      btts:"À éviter",
      score:"À éviter",
      winner:"Données insuffisantes",
      best:"Aucun pari fort conseillé",
      risk:"Risque élevé",
      confResult:20,
      confDouble:25,
      confOver:25,
      confBtts:20,
      confScore:10,
      verdict:"Données trop limitées. Aucun pari fort conseillé."
    };
  }

  const powerA = sa.points * 8 + sa.gd * 3 + sa.gf * 2 + sa.wins * 5 - sa.ga;
  const powerB = sb.points * 8 + sb.gd * 3 + sb.gf * 2 + sb.wins * 5 - sb.ga;
  const diff = powerA - powerB;

  let result = "X";
  let winner = "Match serré";
  let doubleChance = "Pas de choix clair";
  let confidence = 52;

  if(diff >= 12){
    result = "1";
    winner = a;
    doubleChance = "1X";
    confidence = 62;
  }

  if(diff <= -12){
    result = "2";
    winner = b;
    doubleChance = "X2";
    confidence = 62;
  }

  const avgGoals = sa.avgGF + sb.avgGF;
  let overUnder = "Ligne buts à éviter";
  let confOver = 35;

  if(avgGoals >= 2.4){
    overUnder = "Over 1.5 prudent";
    confOver = 58;
  }else if(avgGoals <= 1.8){
    overUnder = "Under 3.5 prudent";
    confOver = 60;
  }

  let btts = "À éviter";
  let confBtts = 30;

  if(sa.avgGF >= 1 && sb.avgGF >= 1 && sa.avgGA >= 0.7 && sb.avgGA >= 0.7){
    btts = "Oui possible";
    confBtts = 48;
  }

  const scoreA = Math.max(0, Math.round((sa.avgGF + sb.avgGA) / 2));
  const scoreB = Math.max(0, Math.round((sb.avgGF + sa.avgGA) / 2));

  let risk = "Risque moyen/élevé";
  if(total >= 4 && Math.abs(diff) >= 8) risk = "Risque modéré";
  if(total < 2) risk = "Risque élevé";

  let best = "Aucun pari fort conseillé";

  if(overUnder === "Under 3.5 prudent") best = "Option prudente : Under 3.5";
  if(overUnder === "Over 1.5 prudent") best = "Option prudente : Over 1.5";
  if(doubleChance !== "Pas de choix clair" && confidence >= 60){
    best = "Option prudente : Double chance " + doubleChance;
  }

  return {
    confidence,
    result,
    doubleChance,
    overUnder,
    btts,
    score:scoreA + "-" + scoreB,
    winner,
    best,
    risk,
    confResult:confidence,
    confDouble:doubleChance === "Pas de choix clair" ? 35 : Math.min(75, confidence + 10),
    confOver,
    confBtts,
    confScore:18,
    verdict:best + ". " + risk + ". Analyse basée sur les résultats CDM enregistrés."
  };
}

function scorerTips(a,b,sa,sb){
  const confA = sa.played ? Math.min(55, Math.round(25 + sa.avgGF * 15)) : 20;
  const confB = sb.played ? Math.min(55, Math.round(25 + sb.avgGF * 15)) : 20;
  const doubleConf = Math.max(10, Math.min(30, Math.round((sa.avgGF + sb.avgGF) * 8)));

  return [
    {
      type:"Buteur équipe A",
      equipe:a,
      valeur:confA >= 45 ? "Buteur à surveiller" : "Buteur à éviter",
      confiance:confA,
      raison:a + " marque en moyenne " + sa.avgGF + " but(s)/match."
    },
    {
      type:"Buteur équipe B",
      equipe:b,
      valeur:confB >= 45 ? "Buteur à surveiller" : "Buteur à éviter",
      confiance:confB,
      raison:b + " marque en moyenne " + sb.avgGF + " but(s)/match."
    },
    {
      type:"Doublé",
      equipe:"Tous",
      valeur:"À éviter",
      confiance:doubleConf,
      raison:"Pari très risqué sans compositions officielles et tireur de penalties."
    }
  ];
}

function completedResponse(a,b,m){
  const sa = stats(a);
  const sb = stats(b);
  const scA = scoreFor(m,a);
  const scB = scoreFor(m,b);
  const finalScore = m.home + " " + m.hg + "-" + m.ag + " " + m.away;

  let winner = "Match nul";
  let loser = "Aucun";

  if(m.hg > m.ag){
    winner = m.home;
    loser = m.away;
  }else if(m.ag > m.hg){
    winner = m.away;
    loser = m.home;
  }

  return {
    match:a + " - " + b,
    competition:"Match terminé — Coupe du Monde 2026",
    date_info:m.date + " · " + m.group,
    is_world_cup:true,
    group:m.group,
    niveau_confiance_global:100,
    pari_du_jour:{
      type:"Match terminé",
      valeur:finalScore,
      raison:"Ce match est déjà joué. Aucun pari possible sur ce match.",
      cote_estimee:"N/D"
    },
    stats_techniques:{
      buts_marques_A:{ valeur:scA.gf, detail:a + " : " + scA.gf + " but(s) dans ce match. Total CDM : " + sa.gf },
      buts_encaisses_A:{ valeur:scA.ga, detail:a + " : " + scA.ga + " but(s) encaissé(s). Total CDM : " + sa.ga },
      buts_marques_B:{ valeur:scB.gf, detail:b + " : " + scB.gf + " but(s) dans ce match. Total CDM : " + sb.gf },
      buts_encaisses_B:{ valeur:scB.ga, detail:b + " : " + scB.ga + " but(s) encaissé(s). Total CDM : " + sb.ga },
      rapport_force:{ detail:"Résultat final : " + finalScore }
    },
    pronostics:{
      resultat_1x2:{ valeur:"Terminé", label:"Match terminé", confiance:100, cote_estimee:"" },
      over_under:{ valeur:"Non applicable", confiance:100, cote_estimee:"" },
      btts:{ valeur:m.hg > 0 && m.ag > 0 ? "Oui" : "Non", confiance:100, cote_estimee:"" },
      double_chance:{ valeur:"Non applicable", confiance:100, cote_estimee:"" },
      handicap:{ valeur:"Non applicable", confiance:100, cote_estimee:"" },
      premier_but:{ valeur:"Non disponible", confiance:0, cote_estimee:"" },
      mi_temps_fin:{ valeur:"Non disponible", confiance:0, cote_estimee:"" },
      cage_inviolee:{ valeur:m.hg === 0 || m.ag === 0 ? "Oui" : "Non", confiance:100, cote_estimee:"" },
      score_exact:{ valeur:m.hg + "-" + m.ag, confiance:100, cote_estimee:"" },
      winner:{ valeur:winner, confiance:100 },
      perdant:{ valeur:loser, confiance:loser === "Aucun" ? 0 : 100 }
    },
    analyse_approfondie:{
      forces_A:formatStats(sa),
      faiblesses_A:"Moyenne encaissée : " + sa.avgGA + " but(s)/match.",
      forces_B:formatStats(sb),
      faiblesses_B:"Moyenne encaissée : " + sb.avgGA + " but(s)/match.",
      facteur_cle:"Résultat final connu : " + finalScore + ". Aucun pari conseillé car le match est terminé."
    },
    analysis:{},
    buteurs_potentiels:[],
    verdict:"Match terminé : " + finalScore + ". Aucun pari possible sur ce match."
  };
}

function upcomingResponse(a,b){
  const group = findGroup(a,b);
  const sa = stats(a);
  const sb = stats(b);
  const p = makePrediction(a,b,sa,sb);
  const classement = tableText(group);

  return {
    match:a + " - " + b,
    competition:"Match à venir / statistiques CDM 2026",
    date_info:group || "Coupe du Monde 2026",
    is_world_cup:true,
    group,
    niveau_confiance_global:p.confidence,
    pari_du_jour:{
      type:"Analyse prudente",
      valeur:p.best,
      raison:p.verdict,
      cote_estimee:"N/D"
    },
    stats_techniques:{
      buts_marques_A:{ valeur:sa.avgGF, detail:a + " : " + sa.gf + " but(s) marqué(s) en " + sa.played + " match(s). Moyenne : " + sa.avgGF },
      buts_encaisses_A:{ valeur:sa.avgGA, detail:a + " : " + sa.ga + " but(s) encaissé(s). Moyenne : " + sa.avgGA },
      buts_marques_B:{ valeur:sb.avgGF, detail:b + " : " + sb.gf + " but(s) marqué(s) en " + sb.played + " match(s). Moyenne : " + sb.avgGF },
      buts_encaisses_B:{ valeur:sb.avgGA, detail:b + " : " + sb.ga + " but(s) encaissé(s). Moyenne : " + sb.avgGA },
      rapport_force:{ detail:"Classement " + group + " : " + classement }
    },
    pronostics:{
      resultat_1x2:{ valeur:p.result, label:p.winner, confiance:p.confResult, cote_estimee:"" },
      over_under:{ valeur:p.overUnder, confiance:p.confOver, cote_estimee:"" },
      btts:{ valeur:p.btts, confiance:p.confBtts, cote_estimee:"" },
      double_chance:{ valeur:p.doubleChance, confiance:p.confDouble, cote_estimee:"" },
      handicap:{ valeur:"À éviter", confiance:30, cote_estimee:"" },
      premier_but:{ valeur:"À éviter", confiance:25, cote_estimee:"" },
      mi_temps_fin:{ valeur:"À éviter", confiance:25, cote_estimee:"" },
      cage_inviolee:{ valeur:"À éviter", confiance:25, cote_estimee:"" },
      score_exact:{ valeur:p.score, confiance:p.confScore, cote_estimee:"" },
      winner:{ valeur:p.winner, confiance:p.confResult },
      perdant:{ valeur:"Données insuffisantes", confiance:0 }
    },
    analyse_approfondie:{
      forces_A:formatStats(sa),
      faiblesses_A:"Moyenne encaissée : " + sa.avgGA + " but(s)/match. Tendance : Over 1.5 " + pct(sa.over15,sa.played) + "%, BTTS " + pct(sa.btts,sa.played) + "%.",
      forces_B:formatStats(sb),
      faiblesses_B:"Moyenne encaissée : " + sb.avgGA + " but(s)/match. Tendance : Over 1.5 " + pct(sb.over15,sb.played) + "%, BTTS " + pct(sb.btts,sb.played) + "%.",
      facteur_cle:"Niveau de risque : " + p.risk + ". Classement du groupe : " + classement + ". Meilleure lecture prudente : " + p.best + "."
    },
    analysis:{},
    buteurs_potentiels:scorerTips(a,b,sa,sb),
    verdict:p.verdict
  };
}

function errorResponse(message){
  return {
    match:"Erreur contrôlée",
    competition:"Version stable " + VERSION,
    date_info:VERSION,
    is_world_cup:false,
    group:"",
    niveau_confiance_global:0,
    pari_du_jour:{
      type:"Erreur contrôlée",
      valeur:"API stable",
      raison:message || "Erreur inconnue",
      cote_estimee:"N/D"
    },
    stats_techniques:null,
    pronostics:{
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
    analyse_approfondie:{
      forces_A:"Erreur contrôlée.",
      faiblesses_A:"Le serveur n’a pas crashé.",
      forces_B:"Erreur contrôlée.",
      faiblesses_B:"Corrigeable sans casser l’app.",
      facteur_cle:"Message technique : " + (message || "Erreur inconnue")
    },
    analysis:{},
    buteurs_potentiels:[],
    verdict:"Erreur contrôlée : le serveur répond quand même en JSON."
  };
}

module.exports = async function handler(req,res){
  try{
    res.setHeader("Content-Type","application/json; charset=utf-8");

    if(req.method === "GET"){
      return res.status(200).json({
        ok:true,
        version:VERSION,
        message:"API active. Utilise POST avec { match: 'Espagne vs Arabie Saoudite' }."
      });
    }

    if(req.method !== "POST"){
      return res.status(405).json({ error:"Méthode non autorisée." });
    }

    const body = parseBody(req);
    const parsed = parseMatch(body.match);

    if(!parsed){
      return res.status(400).json({
        error:"Écris un match complet, exemple : Espagne vs Arabie Saoudite."
      });
    }

    const a = parsed.a;
    const b = parsed.b;
    const completed = findCompleted(a,b);

    if(completed){
      return res.status(200).json(completedResponse(a,b,completed));
    }

    return res.status(200).json(upcomingResponse(a,b));

  }catch(e){
    return res.status(200).json(errorResponse(e.message));
  }
};
