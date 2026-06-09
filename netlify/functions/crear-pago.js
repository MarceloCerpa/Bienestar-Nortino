exports.handler = async function(event, context) {
  // Solo aceptar POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

  if (!ACCESS_TOKEN) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Token no configurado' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch(e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Body inválido' }) };
  }

  const { precio, descripcion } = body;

  if (!precio || !descripcion) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Faltan datos' }) };
  }

  try {
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        items: [{
          title: descripcion,
          quantity: 1,
          unit_price: Number(precio),
          currency_id: 'CLP'
        }],
        back_urls: {
          success: 'https://www.bienestarnortino.com',
          failure: 'https://www.bienestarnortino.com',
          pending: 'https://www.bienestarnortino.com'
        },
        auto_return: 'approved',
        statement_descriptor: 'Bienestar Nortino',
        payment_methods: {
          installments: 3
        }
      })
    });

    const data = await response.json();

    if (data.init_point) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ init_point: data.init_point })
      };
    } else {
      console.error('MP error:', JSON.stringify(data));
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'No se pudo crear la preferencia', detalle: data })
      };
    }

  } catch(err) {
    console.error('Fetch error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error de conexión con Mercado Pago' })
    };
  }
};
