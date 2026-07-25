const express = require('express');
const router = express.Router();
const { getDB } = require('../base_datos');

// GET /api/stats - Métricas del Dashboard de Administración
router.get('/', (req, res) => {
  const db = getDB();
  const cars = db.cars || [];
  const bookings = db.bookings || [];

  const totalCars = cars.length;
  const availableCars = cars.filter(c => c.status === 'available').length;
  const rentedCars = cars.filter(c => c.status === 'rented').length;

  const totalBookings = bookings.length;
  const activeBookings = bookings.filter(b => b.status === 'Confirmed' || b.status === 'In Progress').length;
  const completedBookings = bookings.filter(b => b.status === 'Completed').length;

  const totalRevenue = bookings
    .filter(b => b.status !== 'Cancelled')
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  const occupancyRate = totalCars > 0 ? Math.round(((totalCars - availableCars) / totalCars) * 100) : 0;

  res.json({
    success: true,
    data: {
      totalCars,
      availableCars,
      rentedCars,
      totalBookings,
      activeBookings,
      completedBookings,
      totalRevenue,
      occupancyRate
    }
  });
});

module.exports = router;
