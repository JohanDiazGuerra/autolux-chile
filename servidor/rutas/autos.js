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

// GET /api/cars/branches - Obtener sucursales en Chile
router.get('/branches', (req, res) => {
  const db = getDB();
  res.json({
    success: true,
    data: db.branches || []
  });
});

// GET /api/cars - Obtener lista de vehículos con disponibilidad por fechas y categoría
router.get('/', (req, res) => {
  const db = getDB();
  let cars = db.cars || [];

  const { category, brand, startDate, endDate, status } = req.query;

  if (category && category !== 'all') {
    cars = cars.filter(c => c.category.toLowerCase() === category.toLowerCase());
  }

  if (brand) {
    cars = cars.filter(c => c.brand.toLowerCase() === brand.toLowerCase());
  }

  if (status) {
    cars = cars.filter(c => c.status === status);
  }

  // Filtrar disponibilidad por fechas si se pasan parámetros
  if (startDate && endDate) {
    const bookings = db.bookings || [];
    cars = cars.map(car => {
      const activeBookings = bookings.filter(b =>
        b.carId === car.id && (b.status === 'Confirmed' || b.status === 'In Progress')
      );

      const hasConflict = activeBookings.some(b => isDateOverlap(startDate, endDate, b.startDate, b.endDate));

      return {
        ...car,
        isAvailableForDates: !hasConflict
      };
    });
  }

  res.json({
    success: true,
    count: cars.length,
    data: cars
  });
});

// GET /api/cars/:id - Obtener detalle de un vehículo por ID
router.get('/:id', (req, res) => {
  const db = getDB();
  const car = db.cars.find(c => c.id === req.params.id);

  if (!car) {
    return res.status(404).json({ success: false, message: 'Vehículo no encontrado' });
  }

  res.json({
    success: true,
    data: car
  });
});

// PUT /api/cars/:id - Editar detalles / estado del auto (Panel Admin)
router.put('/:id', (req, res) => {
  const db = getDB();
  const car = db.cars.find(c => c.id === req.params.id);

  if (!car) {
    return res.status(404).json({ success: false, message: 'Vehículo no encontrado' });
  }

  const { name, brand, category, pricePerDay, pricePerDayCLP, hp, status } = req.body;

  if (name) car.name = name;
  if (brand) car.brand = brand;
  if (category) car.category = category;
  if (pricePerDay) car.pricePerDay = parseFloat(pricePerDay);
  if (pricePerDayCLP) car.pricePerDayCLP = parseFloat(pricePerDayCLP);
  if (hp) car.hp = parseInt(hp);
  if (status) car.status = status;

  saveDB(db);

  res.json({
    success: true,
    message: 'Vehículo actualizado con éxito en el panel administrativo',
    data: car
  });
});

// POST /api/cars - Crear nuevo vehículo en el panel administrativo
router.post('/', (req, res) => {
  const db = getDB();
  const { name, brand, category, pricePerDay, hp, image } = req.body;

  if (!name || !brand || !category || !pricePerDay) {
    return res.status(400).json({ success: false, message: 'Faltan campos obligatorios (nombre, marca, categoría, precio)' });
  }

  const priceUSD = parseFloat(pricePerDay);
  const newCar = {
    id: `car-${Date.now()}`,
    name,
    brand,
    category,
    pricePerDay: priceUSD,
    pricePerDayCLP: Math.round(priceUSD * 950),
    securityDepositUSD: Math.round(priceUSD * 3),
    securityDepositCLP: Math.round(priceUSD * 3 * 950),
    hp: parseInt(hp) || 450,
    torque: "500 Nm",
    acceleration: "3.8s",
    topSpeed: "280 km/h",
    drivetrain: "Tracción Trasera (RWD)",
    seats: 4,
    passengerCapacity: "4 Pasajeros",
    engineSpecs: `${hp || 450} HP Engine`,
    fuelEconomy: "11.0 L / 100 km",
    transmission: "Automática",
    fuelType: "Gasolina Premium 98",
    fuelTank: "70 Litros",
    status: "available",
    rating: 5.0,
    reviewsCount: 1,
    image: image || "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=80",
    gallery: [image || "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=80"],
    features: ["Lujo VIP", "Transmisión Automática", "Asistencia de Manejo"],
    reviews: [],
    odometerKm: 1000,
    nextMaintenanceKm: 15000
  };

  db.cars.unshift(newCar);
  saveDB(db);

  res.status(201).json({
    success: true,
    message: 'Vehículo agregado exitosamente a la flota',
    data: newCar
  });
});

// DELETE /api/cars/:id - Eliminar vehículo de la flota
router.delete('/:id', (req, res) => {
  const db = getDB();
  const carIndex = db.cars.findIndex(c => c.id === req.params.id);

  if (carIndex === -1) {
    return res.status(404).json({ success: false, message: 'Vehículo no encontrado' });
  }

  const deletedCar = db.cars.splice(carIndex, 1);
  saveDB(db);

  res.json({
    success: true,
    message: 'Vehículo eliminado de la flota',
    data: deletedCar[0]
  });
});

module.exports = router;
