// Vérification de licence Gumroad — Pronostics IA Pro V9.4.
//
// Le frontend ne décide JAMAIS seul si un utilisateur est PRO : il envoie la
// clé de licence saisie ici, et c'est ce backend qui interroge Gumroad et
// tranche. Aucun secret Gumroad n'est jamais présent côté navigateur.
//
// Variables d'environnement Vercel requises :
// - GUMROAD_PRODUCT_ID : le "permalink" de ton produit Gumroad (la partie
//   après /l/ dans l'URL de vente, ex: "pronostics-ia-pro"). Ce n'est pas un
//   secret à proprement parler (il apparaît dans l'URL publique du produit),
//   mais on le garde côté serveur pour ne jamais coder en dur une valeur
//   métier dans le HTML public.
// - GUMROAD_ACCESS_TOKEN : non utilisé par l'endpoint de vérification de
//   licence de Gumroad (qui est public), mais réservé/prévu si on ajoute plus
//   tard des fonctionnalités qui en ont besoin (ex: désactiver une licence).

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch (e) { return {}; }
  }
  return req.body;
}

module.exports = async function handler(req, res) {
  try {
    res.setHeader("Content-Type", "application/json; charset=utf-8");

    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Méthode non autorisée." });
    }

    const body = parseBody(req);
    const licenseKey = String(body.license_key || "").trim();
    if (!licenseKey) {
      return res.status(400).json({ ok: false, error: "Merci d'entrer une clé de licence." });
    }

    const productId = process.env.GUMROAD_PRODUCT_ID;
    if (!productId) {
      return res.status(200).json({ ok: false, error: "Vérification PRO indisponible pour le moment (configuration manquante côté serveur)." });
    }

    const params = new URLSearchParams();
    params.set("product_id", productId);
    params.set("license_key", licenseKey);
    params.set("increment_uses_count", "true");

    let gumroadRes;
    try {
      gumroadRes = await fetch("https://api.gumroad.com/v2/licenses/verify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString()
      });
    } catch (e) {
      return res.status(200).json({ ok: false, error: "Impossible de joindre Gumroad pour le moment. Réessaie dans un instant." });
    }

    let data;
    try {
      data = await gumroadRes.json();
    } catch (e) {
      return res.status(200).json({ ok: false, error: "Réponse Gumroad invalide. Réessaie dans un instant." });
    }

    if (!data || data.success !== true) {
      return res.status(200).json({ ok: false, error: "Clé de licence invalide." });
    }

    const purchase = data.purchase || {};
    if (purchase.refunded || purchase.chargebacked || purchase.disputed) {
      return res.status(200).json({ ok: false, error: "Cette licence n'est plus valide (remboursement ou litige en cours)." });
    }

    return res.status(200).json({ ok: true, message: "Licence PRO validée." });
  } catch (e) {
    return res.status(200).json({ ok: false, error: "Erreur serveur, réessaie plus tard." });
  }
};

