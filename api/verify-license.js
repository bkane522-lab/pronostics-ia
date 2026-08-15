module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ valid: false, message: "Méthode non autorisée." });
  }

  const productId = process.env.GUMROAD_PRODUCT_ID;

  if (!productId) {
    return res.status(503).json({
      valid: false,
      message: "Activation PRO non configurée : GUMROAD_PRODUCT_ID absent dans Vercel."
    });
  }

  const body = req.body || {};
  const email = String(body.email || "").trim().toLowerCase();
  const licenseKey = String(body.licenseKey || "").trim();

  if (!email || !licenseKey) {
    return res.status(400).json({
      valid: false,
      message: "E-mail d’achat et clé de licence requis."
    });
  }

  if (email.length > 254 || licenseKey.length > 200) {
    return res.status(400).json({
      valid: false,
      message: "Informations de licence invalides."
    });
  }

  try {
    const form = new URLSearchParams();
    form.set("product_id", productId);
    form.set("license_key", licenseKey);
    form.set("increment_uses_count", "false");

    const response = await fetch("https://api.gumroad.com/v2/licenses/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: form.toString()
    });

    let data = null;

    try {
      data = await response.json();
    } catch (_) {
      data = null;
    }

    if (!response.ok || !data || data.success !== true) {
      return res.status(401).json({
        valid: false,
        message: data && data.message
          ? String(data.message)
          : "Clé de licence Gumroad invalide."
      });
    }

    const purchase = data.purchase || {};
    const purchaseEmail = String(purchase.email || "").trim().toLowerCase();

    if (!purchaseEmail || purchaseEmail !== email) {
      return res.status(401).json({
        valid: false,
        message: "Cette clé ne correspond pas à cet e-mail d’achat."
      });
    }

    if (purchase.refunded === true) {
      return res.status(403).json({
        valid: false,
        message: "Cette commande a été remboursée."
      });
    }

    if (purchase.chargebacked === true) {
      return res.status(403).json({
        valid: false,
        message: "Cette commande n’est plus éligible à l’accès PRO."
      });
    }

    return res.status(200).json({
      valid: true,
      productName: purchase.product_name || "Pronostics IA Pro",
      email: purchaseEmail,
      purchaseId: purchase.id || null,
      orderNumber: purchase.order_number || null
    });
  } catch (error) {
    console.error("Gumroad license verification failed:", error && error.message ? error.message : error);

    return res.status(502).json({
      valid: false,
      message: "Impossible de joindre Gumroad pour le moment. Réessaie plus tard."
    });
  }
};
