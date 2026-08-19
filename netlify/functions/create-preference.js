// Crea un "link de pago" (preferencia) de Mercado Pago para Aura Premium.
// El front-end llama a esta función, nosotros le pedimos a Mercado Pago
// que genere el link, y se lo devolvemos para redirigir al usuario.
//
// Variables de entorno necesarias (se configuran en Netlify, NUNCA en el código):
//   MP_ACCESS_TOKEN  -> tu Access Token privado de Mercado Pago (producción)
//   SITE_URL         -> https://aurafarmear.com.ar  (sin barra al final)

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const { playerId } = JSON.parse(event.body || "{}");
    if (!playerId) {
      return { statusCode: 400, body: JSON.stringify({ error: "Falta playerId" }) };
    }

    const token = process.env.MP_ACCESS_TOKEN;
    const siteUrl = (process.env.SITE_URL || "https://aurafarmear.com.ar").replace(/\/$/, "");

    if (!token) {
      return { statusCode: 500, body: JSON.stringify({ error: "Falta configurar MP_ACCESS_TOKEN en Netlify" }) };
    }

    // ⚠️ EDITÁ EL PRECIO ACÁ (en pesos argentinos, sin puntos ni comas)
    const PRECIO_PREMIUM_ARS = 2000;

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            title: "Aura Premium — Aura Farm",
            description: "+15% de aura permanente e insignia dorada en la Liga",
            quantity: 1,
            unit_price: PRECIO_PREMIUM_ARS,
            currency_id: "ARS",
          },
        ],
        external_reference: playerId,
        back_urls: {
          success: `${siteUrl}/?premium_return=1`,
          failure: `${siteUrl}/?premium_failed=1`,
          pending: `${siteUrl}/?premium_pending=1`,
        },
        auto_return: "approved",
      }),
    });

    const data = await mpResponse.json();

    if (!mpResponse.ok) {
      return { statusCode: 502, body: JSON.stringify({ error: "Mercado Pago rechazó la solicitud", detail: data }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ init_point: data.init_point }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
