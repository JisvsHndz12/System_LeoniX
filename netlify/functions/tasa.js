const axios = require('axios');

exports.handler = async (event, context) => {
  try {
    // Intentamos entrar al BCV desde los servidores de Netlify
    const { data } = await axios.get('https://www.bcv.org.ve/', {
      timeout: 5000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    // Buscamos los valores usando lógica de texto (sin librerías pesadas)
    const extract = (id) => {
      const regex = new RegExp(`id="${id}"[\\s\\S]*?<strong>\\s*([\\d,.]+)\\s*<\\/strong>`, 'i');
      const match = data.match(regex);
      return match ? parseFloat(match[1].replace(/\./g, '').replace(',', '.')) : null;
    };

    const usd = extract('dolar') || 490.04;
    const eur = extract('euro') || 574.03;

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" }, // Permite que tu script.js lo lea
      body: JSON.stringify({ usd, eur })
    };
  } catch (error) {
    return {
      statusCode: 200, // Retornamos 200 con fallback para que tu web no se cuelgue
      body: JSON.stringify({ usd: 490.04, eur: 574.03, error: true })
    };
  }
};