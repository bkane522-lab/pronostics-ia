// api/verify-license.js
// Vérifie une clé de licence Gumroad côté serveur Vercel.
// La variable GUMROAD_PRODUCT_ID doit être définie dans Vercel.

module.exports = async function handler(req, res) {
  // Autorise le test de la route directement dans le navigateur.
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      route: "/api/verify-license",
      message: "Route de vérification PRO active (Gumroad + mode propriétaire sécurisé)."
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({
      ok: false,
      error: "Méthode non autorisée."
    });
  }

  let body = req.body;

  // Vercel peut parfois transmettre le corps sous forme de chaîne.
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (error) {
      return res.status(400).json({
        ok: false,
        error: "Corps JSON invalide."
      });
    }
  }

  const licenseKey =
    body && typeof body.license_key === "string"
      ? body.license_key.trim()
      : body && typeof body.licenseKey === "string"
        ? body.licenseKey.trim()
        : "";

  const email =
    body && typeof body.email === "string"
      ? body.email.trim().toLowerCase()
      : "";

  if (!licenseKey) {
    return res.status(400).json({
      ok: false,
      error: "Clé de licence manquante."
    });
  }

  // Mode propriétaire / test sécurisé.
  // Les secrets restent exclusivement dans les variables Vercel.
  const ownerEmail = String(process.env.OWNER_TEST_EMAIL || "").trim().toLowerCase();
  const adminTestKey = String(process.env.ADMIN_TEST_KEY || "").trim();

  if (
    ownerEmail &&
    adminTestKey &&
    email === ownerEmail &&
    licenseKey === adminTestKey
  ) {
    return res.status(200).json({
      ok: true,
      valid: true,
      test_mode: true,
      message: "Mode PRO propriétaire activé.",
      email
    });
  }

  // Pour les licences clients Gumroad seulement.
  const productId = process.env.GUMROAD_PRODUCT_ID;

  if (!productId) {
    return res.status(500).json({
      ok: false,
      error: "GUMROAD_PRODUCT_ID absente dans Vercel."
    });
  }

  try {
    const gumroadBody = new URLSearchParams();
    gumroadBody.set("product_id", productId);
    gumroadBody.set("license_key", licenseKey);
    gumroadBody.set("increment_uses_count", "false");

    const gumroadResponse = await fetch(
      "https://api.gumroad.com/v2/licenses/verify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: gumroadBody.toString()
      }
    );

    const rawText = await gumroadResponse.text();

    let gumroadData;

    try {
      gumroadData = JSON.parse(rawText);
    } catch (error) {
      return res.status(502).json({
        ok: false,
        error: "Réponse Gumroad illisible.",
        status: gumroadResponse.status
      });
    }

    if (!gumroadResponse.ok) {
      return res.status(502).json({
        ok: false,
        error:
          gumroadData.message ||
          gumroadData.error ||
          "Erreur de communication avec Gumroad.",
        status: gumroadResponse.status
      });
    }

    if (gumroadData.success === true) {
      const purchase = gumroadData.purchase || {};

      // Refuse une licence remboursée, contestée ou annulée.
      if (
        purchase.refunded === true ||
        purchase.disputed === true ||
        purchase.chargeback_date
      ) {
        return res.status(403).json({
          ok: false,
          valid: false,
          error: "Cette licence n'est plus active."
        });
      }

      return res.status(200).json({
        ok: true,
        valid: true,
        message: "Licence PRO valide.",
        email: purchase.email || "",
        product_name: purchase.product_name || "",
        uses: purchase.uses || 0
      });
    }

    return res.status(401).json({
      ok: false,
      valid: false,
      error:
        gumroadData.message ||
        "Clé invalide ou ne correspondant pas à ce produit."
    });
  } catch (error) {
    console.error("Gumroad verification error:", error);

    return res.status(500).json({
      ok: false,
      error: "Impossible de vérifier la licence pour le moment."
    });
  }
};
