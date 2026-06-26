const DATA_VERSION = "DATA_CDM_2026_2026_06_21";

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

module.exports = {
  DATA_VERSION,
  GROUPS,
  RESULTS
};
