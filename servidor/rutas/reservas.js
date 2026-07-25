const express = require('express');
const router = express.Router();
const { getDB, saveDB } = require('../base_datos');

// Helper: Check if date ranges overlap
function isDateOverlap(start1, end1, start2, end2) {
  const s1 = new Date(start1).getTime();
  const e1 = new Date(end1).getTime();
  const s2 = new Date(start2).getTime();
  const e2 = new Date(end2).getTime();

  return (s1 < e2 && s2 < e1);
}

// POST /api/bookings/validate-promo - Validar código promocional
router.post('/validate-promo', (req, res) => {
  const db = getDB();
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ success: false, message: 'Ingresa un código promocional' });
  }

  const promo = (db.promos || []).find(p => p.code.toUpperCase() === code.trim().toUpperCase());

  if (!promo) {
    return res.status(404).json({ success: false, message: 'Código promocional no válido o expirado' });
  }

  res.json({
    success: true,
    message: '¡Código de descuento aplicado correctamente!',
    data: promo
  });
});

// POST /api/reviews - Publicar nueva reseña de cliente
router.post('/reviews', (req, res) => {
  const db = getDB();
  const { carId, customerName, rating, comment } = req.body;

  if (!carId || !customerName || !comment) {
    return res.status(400).json({ success: false, message: 'Faltan campos obligatorios para la reseña' });
  }

  const newReview = {
    id: `rev-${Date.now()}`,
    carId,
    customerName,
    rating: parseInt(rating) || 5,
    date: "Hoy",
    comment
  };

  db.reviews = db.reviews || [];
  db.reviews.unshift(newReview);

  // Recalculate car average rating
  const car = db.cars.find(c => c.id === carId);
  if (car) {
    const carReviews = db.reviews.filter(r => r.carId === carId);
    const avg = carReviews.reduce((sum, r) => sum + r.rating, 0) / carReviews.length;
    car.rating = Math.round(avg * 100) / 100;
    car.reviewsCount = carReviews.length;
  }

  saveDB(db);

  res.status(201).json({
    success: true,
    message: '¡Muchas gracias! Tu opinión ha sido publicada exitosamente.',
    data: newReview
  });
});

// GET /api/bookings - Consultar reservas
router.get('/', (req, res) => {
  const db = getDB();
  let bookings = db.bookings || [];

  const { search, email, status } = req.query;

  if (email) {
    bookings = bookings.filter(b => b.customerEmail.toLowerCase() === email.toLowerCase());
  }

  if (status && status !== 'all') {
    bookings = bookings.filter(b => b.status.toLowerCase() === status.toLowerCase());
  }

  if (search) {
    const q = search.toLowerCase();
    bookings = bookings.filter(b =>
      b.id.toLowerCase().includes(q) ||
      b.customerName.toLowerCase().includes(q) ||
      b.carName.toLowerCase().includes(q)
    );
  }

  res.json({
    success: true,
    count: bookings.length,
    data: bookings
  });
});

// GET /api/bookings/:id - Buscar reserva por código
router.get('/:id', (req, res) => {
  const db = getDB();
  const booking = db.bookings.find(b => b.id.toUpperCase() === req.params.id.toUpperCase());

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Reserva no encontrada con ese código' });
  }

  res.json({
    success: true,
    data: booking
  });
});

// POST /api/bookings - Crear nueva reserva con IVA 19% Chile & RUT
router.post('/', (req, res) => {
  const db = getDB();
  const {
    carId,
    customerName,
    customerRut,
    customerEmail,
    customerPhone,
    pickupLocation,
    dropoffLocation,
    startDate,
    endDate,
    signatureData,
    addOns = [],
    promoCode = ''
  } = req.body;

  if (!carId || !customerName || !customerEmail || !startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: 'Faltan campos obligatorios para completar la reserva (vehículo, cliente, fechas)'
    });
  }

  const car = db.cars.find(c => c.id === carId);
  if (!car) {
    return res.status(404).json({ success: false, message: 'El vehículo seleccionado no existe' });
  }

  // Verificar solapamiento de fechas con reservas activas
  const existingBookings = (db.bookings || []).filter(b =>
    b.carId === carId && (b.status === 'Confirmed' || b.status === 'In Progress')
  );

  const hasConflict = existingBookings.some(b => isDateOverlap(startDate, endDate, b.startDate, b.endDate));

  if (hasConflict) {
    return res.status(409).json({
      success: false,
      message: 'Este vehículo ya tiene una reserva en el rango de fechas seleccionado. Por favor elige otras fechas u otro auto.'
    });
  }

  // Calcular duración en días
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const dailyRate = car.pricePerDay;

  // Precios de adicionales por día
  const addOnPrices = {
    "Seguro Total Cobertura Zero": 45,
    "GPS Satelital Offline": 15,
    "Silla de Bebé Premium": 12,
    "Conductor Adicional": 25,
    "Entrega VIP a Domicilio": 50,
    "Kilometraje Ilimitado": 30
  };

  let addOnsTotalPerDay = 0;
  addOns.forEach(addon => {
    if (addOnPrices[addon]) {
      addOnsTotalPerDay += addOnPrices[addon];
    }
  });

  const grossSubtotal = (dailyRate + addOnsTotalPerDay) * diffDays;

  // Validar cupón de descuento
  let discountAmount = 0;
  let appliedPromo = null;
  if (promoCode) {
    appliedPromo = (db.promos || []).find(p => p.code.toUpperCase() === promoCode.trim().toUpperCase());
    if (appliedPromo) {
      if (appliedPromo.discountType === 'percentage') {
        discountAmount = Math.round((grossSubtotal * appliedPromo.discountValue) / 100);
      } else if (appliedPromo.discountType === 'fixed') {
        discountAmount = Math.min(grossSubtotal, appliedPromo.discountValue);
      }
    }
  }

  const netSubtotal = Math.max(0, grossSubtotal - discountAmount);
  const tax = Math.round(netSubtotal * 0.19); // IVA 19% Chile
  const totalPrice = netSubtotal + tax;

  const bookingCode = `BK-${Math.floor(1000 + Math.random() * 9000)}`;

  const newBooking = {
    id: bookingCode,
    carId: car.id,
    carName: car.name,
    carImage: car.image,
    customerName,
    customerRut: customerRut || 'N/A',
    customerEmail,
    customerPhone: customerPhone || 'N/A',
    pickupLocation: pickupLocation || 'Aeropuerto SCL Terminal VIP',
    dropoffLocation: dropoffLocation || pickupLocation || 'Aeropuerto SCL Terminal VIP',
    startDate,
    endDate,
    totalDays: diffDays,
    dailyRate,
    addOns,
    promoCode: appliedPromo ? appliedPromo.code : '',
    discountAmount,
    subtotal: netSubtotal,
    tax,
    totalPrice,
    signatureData: signatureData || null,
    status: "Confirmed",
    createdAt: new Date().toISOString()
  };

  db.bookings.unshift(newBooking);
  car.reviewsCount = (car.reviewsCount || 0) + 1;
  saveDB(db);

  res.status(201).json({
    success: true,
    message: '¡Reserva confirmada con éxito!',
    data: newBooking
  });
});

// PUT /api/bookings/:id/status - Cambiar estado
router.put('/:id/status', (req, res) => {
  const db = getDB();
  const { status } = req.body;

  const booking = db.bookings.find(b => b.id.toUpperCase() === req.params.id.toUpperCase());
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Reserva no encontrada' });
  }

  booking.status = status || booking.status;
  saveDB(db);

  res.json({
    success: true,
    message: `Estado de la reserva actualizado a: ${booking.status}`,
    data: booking
  });
});

// DELETE /api/bookings/:id - Cancelar reserva
router.delete('/:id', (req, res) => {
  const db = getDB();
  const index = db.bookings.findIndex(b => b.id.toUpperCase() === req.params.id.toUpperCase());

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Reserva no encontrada' });
  }

  db.bookings[index].status = "Cancelled";
  saveDB(db);

  res.json({
    success: true,
    message: 'La reserva ha sido cancelada correctamente',
    data: db.bookings[index]
  });
});

module.exports = router;
