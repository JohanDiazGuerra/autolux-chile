const express = require('express');
const router = express.Router();
const { getDB, saveDB } = require('../base_datos');

// PUT /api/admin/cars/:id - Editar cualquier parámetro de un auto
router.put('/cars/:id', (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const carIndex = db.cars.findIndex(c => c.id === id);

  if (carIndex === -1) {
    return res.status(404).json({ success: false, message: 'Vehículo no encontrado' });
  }

  const updatedCar = { ...db.cars[carIndex], ...req.body };
  
  // Recalcular CLP o USD si alguno se actualiza
  if (req.body.pricePerDay && !req.body.pricePerDayCLP) {
    updatedCar.pricePerDayCLP = Math.round(req.body.pricePerDay * 950);
  }

  db.cars[carIndex] = updatedCar;
  saveDB(db);

  res.json({
    success: true,
    message: 'Vehículo actualizado con éxito',
    data: updatedCar
  });
});

// GET & POST /api/admin/promos - Gestor de Cupones Promocionales
router.get('/promos', (req, res) => {
  const db = getDB();
  res.json({ success: true, data: db.promos || [] });
});

router.post('/promos', (req, res) => {
  const { code, discountType, discountValue, description } = req.body;
  const db = getDB();
  db.promos = db.promos || [];

  if (!code || !discountValue) {
    return res.status(400).json({ success: false, message: 'Faltan datos del cupón' });
  }

  const newPromo = {
    code: code.toUpperCase().trim(),
    discountType: discountType || 'percentage',
    discountValue: parseFloat(discountValue),
    description: description || `Descuento especial ${code}`
  };

  db.promos.push(newPromo);
  saveDB(db);

  res.json({ success: true, message: 'Cupón creado con éxito', data: newPromo });
});

router.delete('/promos/:code', (req, res) => {
  const { code } = req.params;
  const db = getDB();
  db.promos = (db.promos || []).filter(p => p.code !== code.toUpperCase());
  saveDB(db);

  res.json({ success: true, message: 'Cupón eliminado' });
});

// POST & PUT & DELETE /api/admin/branches - Gestor de Sucursales Chile
router.post('/branches', (req, res) => {
  const { city, name, address, phone, hours } = req.body;
  const db = getDB();
  db.branches = db.branches || [];

  const newBranch = {
    id: `branch-${Date.now()}`,
    city: city || 'Santiago',
    name,
    address,
    phone: phone || '+56 2 2977 4000',
    hours: hours || 'Lunes a Domingo 09:00 - 19:00'
  };

  db.branches.push(newBranch);
  saveDB(db);

  res.json({ success: true, message: 'Sucursal agregada con éxito', data: newBranch });
});

router.delete('/branches/:id', (req, res) => {
  const { id } = req.params;
  const db = getDB();
  db.branches = (db.branches || []).filter(b => b.id !== id);
  saveDB(db);

  res.json({ success: true, message: 'Sucursal eliminada' });
});

// GET & PUT /api/admin/settings - CMS Site Settings
router.get('/settings', (req, res) => {
  const db = getDB();
  const settings = db.siteSettings || {
    companyPhone: '+56 9 8765 4321',
    companyEmail: 'contacto@autoluxdrive.cl',
    whatsappNumber: '56912345678',
    companyAddress: 'Av. El Golf 99, Las Condes, Santiago',
    vatRate: 19,
    heroTitle1: 'Vive la Emoción de Conducir',
    heroTitle2: 'Lo Extraordinario'
  };
  res.json({ success: true, data: settings });
});

router.put('/settings', (req, res) => {
  const db = getDB();
  db.siteSettings = { ...(db.siteSettings || {}), ...req.body };
  saveDB(db);

  res.json({ success: true, message: 'Configuración del sitio guardada', data: db.siteSettings });
});

module.exports = router;
