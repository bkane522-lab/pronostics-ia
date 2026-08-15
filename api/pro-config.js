// api/pro-config.js
// Configuration publique PRO.
// GUMROAD_PRODUCT_URL peut être définie dans Vercel, mais l'app garde
// un fallback public afin que le bouton Acheter PRO ne soit jamais bloqué.

const FALLBACK_PRODUCT_URL =
  "https://kizombaatlas.gumroad.com/l/pronostics-ia-pro";

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  return res.status(200).json({
    ok: true,
    productUrl: process.env.GUMROAD_PRODUCT_URL || FALLBACK_PRODUCT_URL,
    price: "9,99 €",
    paymentType: "paiement unique"
  });
};
