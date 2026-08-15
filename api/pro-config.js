module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false });
  }

  let productUrl = String(process.env.GUMROAD_PRODUCT_URL || "").trim();

  if (productUrl && !/[?&]wanted=true(?:&|$)/.test(productUrl)) {
    productUrl += (productUrl.includes("?") ? "&" : "?") + "wanted=true";
  }

  return res.status(200).json({
    ok: true,
    productUrl: productUrl
  });
};
