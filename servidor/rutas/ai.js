const express = require('express');
const router = express.Router();
const { getDB } = require('../base_datos');

// Helper: Format price for response
function formatCLP(amount) {
  return `$${Math.round(amount).toLocaleString('de-DE')} CLP`;
}

// POST /api/ai/chat - Motor de respuesta del Asistente IA Luxi
router.post('/chat', (req, res) => {
  const { message } = req.body;
  const db = getDB();
  const cars = db.cars || [];

  if (!message || message.trim() === '') {
    return res.status(400).json({ success: false, message: 'Ingresa una pregunta' });
  }

  const q = message.toLowerCase();
  let replyText = "";
  let suggestedCar = null;

  // 1. Preguntas sobre recomendaciones de autos por uso/destino
  if (q.includes('recomiendas') || q.includes('recomienda') || q.includes('cual') || q.includes('cuál') || q.includes('opcion') || q.includes('opción')) {
    if (q.includes('viña') || q.includes('mar') || q.includes('playa') || q.includes('escapada') || q.includes('fin de semana')) {
      suggestedCar = cars.find(c => c.name.includes('Porsche 911') || c.category === 'Supercar');
      replyText = `Para una escapada perfecta a Viña del Mar o la Quinta Región, te recomiendo totalmente el **${suggestedCar.name}**. Es ágil, dinámico y te brindará una experiencia inolvidable por la Ruta 68 por solo **${formatCLP(suggestedCar.pricePerDayCLP)} / día**.`;
    } else if (q.includes('familia') || q.includes('pasajeros') || q.includes('7') || q.includes('espacio') || q.includes('grupo')) {
      suggestedCar = cars.find(c => c.name.includes('Escalade') || c.passengerCapacity.includes('7'));
      replyText = `Para viajar con la familia o un grupo grande con total comodidad VIP, la mejor opción es la **${suggestedCar.name}** (${suggestedCar.passengerCapacity}). Espaciosa, potente y ultra segura por **${formatCLP(suggestedCar.pricePerDayCLP)} / día**.`;
    } else if (q.includes('electrico') || q.includes('eléctrico') || q.includes('tesla') || q.includes('ecológico') || q.includes('autonomia')) {
      suggestedCar = cars.find(c => c.category === 'Eléctrico');
      replyText = `Si buscas rendimiento sin emisiones y máxima tecnología, el **${suggestedCar.name}** (1,020 HP, 0-100km/h en 2.1s) es impresionante. Su tarifa es de **${formatCLP(suggestedCar.pricePerDayCLP)} / día**.`;
    } else {
      suggestedCar = cars.find(c => c.name.includes('Urus') || c.category === 'SUV Lujo');
      replyText = `Te sugiero el imponente **${suggestedCar.name}** (${suggestedCar.hp} HP). Combina la potencia de un superdeportivo con la comodidad de un SUV de lujo para cualquier ruta en Chile por **${formatCLP(suggestedCar.pricePerDayCLP)} / día**.`;
    }
  }
  // 2. Requisitos de arriendo en Chile
  else if (q.includes('requisito') || q.includes('licencia') || q.includes('rut') || q.includes('documento') || q.includes('edad')) {
    replyText = `En **AutoLux Chile 🇨🇱**, los requisitos principales son:\n1. Licencia de Conducir vigente (Chilena o Internacional).\n2. Cédula de Identidad (RUT) o Pasaporte.\n3. Tarjeta de crédito para la garantía temporal.\n4. Edad mínima de 22 años.`;
  }
  // 3. TAG / Peajes Autopistas Santiago
  else if (q.includes('tag') || q.includes('peaje') || q.includes('autopista') || q.includes('costanera')) {
    replyText = `¡Sí! Durante el checkout puedes incluir el opcional **Pase Diario TAG Autopistas Chile** (+$20 USD/día). Con él podrás transitar libremente por Costanera Norte, Vespucio Norte, Autopista Central y Túnel San Cristóbal sin preocuparte por cobros posteriores.`;
  }
  // 4. Coberturas y Seguro Cobertura Zero
  else if (q.includes('seguro') || q.includes('cobertura') || q.includes('garantia') || q.includes('garantía') || q.includes('deposito') || q.includes('depósito')) {
    replyText = `Todos nuestros arriendos incluyen Seguro de Cobertura Básica. Además, ofrecemos el **Seguro Total Cobertura Zero** sin deducible. El depósito en garantía se realiza mediante una retención temporal en tu tarjeta de crédito que se libera al entregar el auto.`;
  }
  // 5. Sucursales en Chile
  else if (q.includes('sucursal') || q.includes('donde') || q.includes('dónde') || q.includes('aeropuerto') || q.includes('scl') || q.includes('entrega')) {
    replyText = `Contamos con atención VIP y entrega directa en:\n📍 Aeropuerto SCL (Terminal VIP FBO)\n📍 Las Condes / Vitacura Hub\n📍 Viña del Mar Marina & Resort\n📍 Puerto Varas / Pucón (Entrega a Domicilio).`;
  }
  // 6. Respuesta por defecto con sugerencia de superdeportivo
  else {
    suggestedCar = cars[0];
    replyText = `Hola, soy **Luxi**, tu Concierge Virtual en Chile 🇨🇱. Puedo ayudarte a elegir el vehículo ideal para tu viaje. Por ejemplo, nuestro modelo más cotizado hoy es el **${suggestedCar.name}** por **${formatCLP(suggestedCar.pricePerDayCLP)} / día**. ¿Te gustaría reservarlo o consultar otra especificación?`;
  }

  res.json({
    success: true,
    reply: replyText,
    suggestedCar: suggestedCar ? {
      id: suggestedCar.id,
      name: suggestedCar.name,
      priceCLP: formatCLP(suggestedCar.pricePerDayCLP),
      image: suggestedCar.image
    } : null
  });
});

module.exports = router;
