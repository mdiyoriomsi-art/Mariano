// Verifica contra la API real de Mercado Pago que un pago fue aprobado,
// antes de que el juego le active el Premium a alguien.
// Esto evita que cualquiera desbloquee el premium solo con editar la URL.
//
// Variable de entorno necesaria: MP_ACCESS_TOKEN

exports.handler = async (event) => {
  try {
    const params = event.queryStringParameters || {};
    const paymentId = params.payment_id;
    const externalReference = params.external_reference || null;

    if (!paymentId) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: "Falta payment_id" }) };
    }

    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) {
      return { statusCode: 500, body: JSON.stringify({ ok: false, error: "Falta configurar MP_ACCESS_TOKEN en Netlify" }) };
    }

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await mpResponse.json();

    if (!mpResponse.ok) {
      return { statusCode: 200, body: JSON.stringify({ ok: false, status: "no_encontrado" }) };
    }

    const approved = data.status === "approved";
    const matchesPlayer = !externalReference || data.external_reference === externalReference;

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: approved && matchesPlayer,
        status: data.status,
        external_reference: data.external_reference || null,
      }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: String(err) }) };
  }
};
