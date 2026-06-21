const VERSION = "V7_1_STATS_CDM_STABLE";

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

function canonTeam(name){
  var input = clean(name);

  for(var i = 0; i < GROUPS.length; i++){
    for(var j = 0; j < GROUPS[i].teams.length; j++){
      if(clean(GROUPS[i].teams[j]) === input){
        return GROUPS[i].teams[j];
      }
    }
  }

  var aliases = {
    "senegal":"Sénégal",
    "coree du sud":"Corée du Sud",
    "cote ivoire":"Côte d’Ivoire",
    "cote d ivoire":"Côte d’Ivoire",
    "cote divoire":"Côte d’Ivoire",
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
    "curacao":"Curaçao",
    "pays bas":"Pays-Bas",
    "arabie saoudite":"Arabie Saoudite"
  };

  return aliases[input] || String(name || "").trim();
}

function parseMatch(input){
  var raw = String(input || "")
    .replace(/CDM\s*2026/gi,"")
    .replace(/Coupe du Monde\s*2026/gi,"")
    .replace(/Groupe\s+[A-L]/gi,"")
    .trim();

  var parts = null;

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
    a: canonTeam(parts[0]),
    b: canonTeam(parts[1])
  };
}

function resultObjects(){
  return RESULTS.map(function(r){
    return {
      date:r[0],
      group:r[1],
      home:r[2],
      away:r[3],
      hg:r[4],
      ag:r[5]
    };
  });
}

function findGroup(a,b){
  for(var i = 0; i < GROUPS.length; i++){
    var hasA = false;
    var hasB = false;

    for(var j = 0; j < GROUPS[i].teams.length; j++){
      if(clean(GROUPS[i].teams[j]) === clean(a)){ hasA = true; }
      if(clean(GROUPS[i].teams[j]) === clean(b)){ hasB = true; }
    }

    if(hasA && hasB){
      return GROUPS[i].g;
    }
  }

  return "";
}

function findCompleted(a,b){
  var list = resultObjects();

  for(var i = 0; i < list.length; i++){
    var m = list[i];

    var same =
      clean(m.home) === clean(a) &&
      clean(m.away) === clean(b);

    var reverse =
      clean(m.home) === clean(b) &&
      clean(m.away) === clean(a);

    if(same || reverse){
      return m;
    }
  }

  return null;
}

function scoreFor(m, team){
  if(clean(m.home) === clean(team)){
    return { gf:m.hg, ga:m.ag };
  }

  if(clean(m.away) === clean(team)){
    return { gf:m.ag, ga:m.hg };
  }

  return { gf:0, ga:0 };
}

function winnerOf(m){
  if(m.hg > m.ag){ return m.home; }
  if(m.ag > m.hg){ return m.away; }
  return "Match nul";
}

function loserOf(m){
  if(m.hg > m.ag){ return m.away; }
  if(m.ag > m.hg){ return m.home; }
  return "Aucun";
}

function stats(team){
  var s = {
    team:team,
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
    form:[]
  };

  var list = resultObjects();

  for(var i = 0; i < list.length; i++){
    var m = list[i];

    if(clean(m.home) !== clean(team) && clean(m.away) !== clean(team)){
      continue;
    }

    var sc = scoreFor(m, team);

    s.played += 1;
    s.gf += sc.gf;
    s.ga += sc.ga;

    if(sc.gf > sc.ga){
      s.wins += 1;
      s.points += 3;
      s.form.push("V");
    }else if(sc.gf === sc.ga){
      s.draws += 1;
      s.points += 1;
      s.form.push("N");
    }else{
      s.losses += 1;
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

function formatStats(s){
  if(!s || s.played === 0){
    return s.team + " : aucune statistique disponible pour le moment.";
  }

  return s.team + " : " +
    s.played + " match(s), " +
    s.wins + " victoire(s), " +
    s.draws + " nul(s), " +
    s.losses + " défaite(s), " +
    s.gf + " but(s) marqué(s), " +
    s.ga + " encaissé(s), " +
    "différence " + (s.gd >= 0 ? "+" : "") + s.gd + ", " +
    s.points + " point(s), forme " + s.form.join("-");
}

function groupTable(groupName){
  var group = null;

  for(var i = 0; i < GROUPS.length; i++){
    if(GROUPS[i].g === groupName){
      group = GROUPS[i];
    }
  }

  if(!group){
    return [];
  }

  var table = group.teams.map(function(t){
    return stats(t);
  });

  table.sort(function(a,b){
    if(b.points !== a.points){ return b.points - a.points; }
    if(b.gd !== a.gd){ return b.gd - a.gd; }
    if(b.gf !== a.gf){ return b.gf - a.gf; }
    return a.team.localeCompare(b.team);
  });

  return table;
}

function tableText(groupName){
  var table = groupTable(groupName);

  if(!table.length){
    return "Classement indisponible.";
  }

  return table.map(function(t, i){
    return (i + 1) + ". " + t.team + " " + t.points + " pts diff " + (t.gd >= 0 ? "+" : "") + t.gd;
  }).join(" | ");
}

function prediction(a,b,sa,sb){
  var total = sa.played + sb.played;

  if(total < 2){
    return {
      confidence:30,
      result:"À éviter",
      doubleChance:"À éviter",
      overUnder:"À éviter",
      btts:"À éviter",
      score:"À éviter",
      winner:"Données insuffisantes",
      verdict:"Données encore trop limitées. Aucun pari fort conseillé."
    };
  }

  var powerA = sa.points * 8 + sa.gd * 3 + sa.gf * 2 + sa.wins * 5 - sa.ga;
  var powerB = sb.points * 8 + sb.gd * 3 + sb.gf * 2 + sb.wins * 5 - sb.ga;
  var diff = powerA - powerB;

  var winner = "Match serré";
  var result = "X";
  var dc = "1X / X2";
  var confidence = 50;

  if(diff >= 12){
    winner = a;
    result = "1";
    dc = "1X";
    confidence = 62;
  }

  if(diff <= -12){
    winner = b;
    result = "2";
    dc = "X2";
    confidence = 62;
  }

  var totalGoalsAvg = sa.avgGF + sb.avgGF;
  var overUnder = totalGoalsAvg >= 2.4 ? "Over 1.5 prudent" : "Under 3.5 prudent";

  var btts = "À éviter";

  if(sa.avgGF >= 1 && sb.avgGF >= 1 && sa.avgGA >= 0.7 && sb.avgGA >= 0.7){
    btts = "Oui possible";
  }

  var scoreA = Math.max(0, Math.round((sa.avgGF + sb.avgGA) / 2));
  var scoreB = Math.max(0, Math.round((sb.avgGF + sa.avgGA) / 2));

  return {
    confidence:confidence,
    result:result,
    doubleChance:dc,
    overUnder:overUnder,
    btts:btts,
    score:scoreA + "-" + scoreB,
    winner:winner,
    verdict:"Analyse prudente basée seulement sur les résultats CDM enregistrés. À confirmer avec compositions, blessures et contexte."
  };
}

function completedResponse(a,b,m){
  var sa = stats(a);
  var sb = stats(b);
  var scA = scoreFor(m,a);
  var scB = scoreFor(m,b);
  var finalScore = m.home + " " + m.hg + "-" + m.ag + " " + m.away;

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
      winner:{ valeur:winnerOf(m), confiance:100 },
      perdant:{ valeur:loserOf(m), confiance:loserOf(m) === "Aucun" ? 0 : 100 }
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
  var group = findGroup(a,b);
  var sa = stats(a);
  var sb = stats(b);
  var p = prediction(a,b,sa,sb);
  var classement = tableText(group);

  return {
    match:a + " - " + b,
    competition:"Match à venir / statistiques CDM 2026",
    date_info:group || "Coupe du Monde 2026",
    is_world_cup:true,
    group:group,
    niveau_confiance_global:p.confidence,
    pari_du_jour:{
      type:"Analyse prudente",
      valeur:p.confidence < 50 ? "Aucun pari fort conseillé" : "Option prudente",
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
      resultat_1x2:{ valeur:p.result, label:p.winner, confiance:p.confidence, cote_estimee:"" },
      over_under:{ valeur:p.overUnder, confiance:Math.max(25,p.confidence - 10), cote_estimee:"" },
      btts:{ valeur:p.btts, confiance:Math.max(25,p.confidence - 12), cote_estimee:"" },
      double_chance:{ valeur:p.doubleChance, confiance:Math.min(75,p.confidence + 10), cote_estimee:"" },
      handicap:{ valeur:"À éviter", confiance:30, cote_estimee:"" },
      premier_but:{ valeur:"À éviter", confiance:25, cote_estimee:"" },
      mi_temps_fin:{ valeur:"À éviter", confiance:25, cote_estimee:"" },
      cage_inviolee:{ valeur:"À éviter", confiance:25, cote_estimee:"" },
      score_exact:{ valeur:p.score, confiance:18, cote_estimee:"" },
      winner:{ valeur:p.winner, confiance:p.confidence },
      perdant:{ valeur:"Données insuffisantes", confiance:0 }
    },
    analyse_approfondie:{
      forces_A:formatStats(sa),
      faiblesses_A:sa.played > 0 ? "Moyenne encaissée : " + sa.avgGA + " but(s)/match." : "Données insuffisantes.",
      forces_B:formatStats(sb),
      faiblesses_B:sb.played > 0 ? "Moyenne encaissée : " + sb.avgGA + " but(s)/match." : "Données insuffisantes.",
      facteur_cle:"Classement du groupe : " + classement + ". Analyse prudente, car les données CDM restent limitées."
    },
    analysis:{},
    buteurs_potentiels:[],
    verdict:p.verdict
  };
}

module.exports = async function handler(req,res){
  try{
    if(req.method === "GET"){
      return res.status(200).json({
        ok:true,
        version:VERSION,
        message:"API active V7.1 Stats Stable. Utilise POST avec { match: 'Espagne vs Arabie Saoudite' }."
      });
    }

    if(req.method !== "POST"){
      return res.status(405).json({ error:"Méthode non autorisée." });
    }

    var parsed = parseMatch(req.body && req.body.match);

    if(!parsed){
      return res.status(400).json({
        error:"Écris un match complet, exemple : France vs Sénégal."
      });
    }

    var a = parsed.a;
    var b = parsed.b;
    var completed = findCompleted(a,b);

    if(completed){
      return res.status(200).json(completedResponse(a,b,completed));
    }

    return res.status(200).json(upcomingResponse(a,b));

  }catch(e){
    return res.status(200).json({
      match:"Erreur contrôlée",
      competition:"Version stable V7.1",
      date_info:VERSION,
      is_world_cup:false,
      group:"",
      niveau_confiance_global:0,
      pari_du_jour:{
        type:"Erreur contrôlée",
        valeur:"API stable",
        raison:e.message || "Erreur inconnue",
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
        facteur_cle:"Message technique : " + (e.message || "Erreur inconnue")
      },
      analysis:{},
      buteurs_potentiels:[],
      verdict:"Erreur contrôlée : le serveur répond quand même en JSON."
    });
  }
};
