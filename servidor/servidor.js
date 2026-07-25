const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./base_datos');

const autosRouter = require('./rutas/autos');
const reservasRouter = require('./rutas/reservas');
const estadisticasRouter = require('./rutas/estadisticas');
const aiRouter = require('./rutas/ai');
const adminRouter = require('./rutas/admin');

const app = express();
const PORT = process.env.PORT || 5001;

// Inicializar Base de Datos
initDB();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del cliente frontend
app.use(express.static(path.join(__dirname, '../cliente')));

// Rutas de la API
app.use('/api/cars', autosRouter);
app.use('/api/bookings', reservasRouter);
app.use('/api/stats', estadisticasRouter);
app.use('/api/ai', aiRouter);
app.use('/api/admin', adminRouter);

// Endpoint de estado de la API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'AutoLux Rent-a-Car API Servidor Chile',
    timestamp: new Date()
  });
});

// Ruta de respaldo para la aplicación SPA
app.get('*', (req, res) => {
  const clienteIndex = path.join(__dirname, '../cliente/index.html');
  if (require('fs').existsSync(clienteIndex)) {
    res.sendFile(clienteIndex);
  } else {
    res.send('Servidor API AutoLux funcionando. Acceda a /api/cars o /api/bookings');
  }
});

// Iniciar Servidor
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚗 Servidor API AutoLux Rent-A-Car Funcionando!`);
  console.log(`📍 URL Servidor: http://localhost:${PORT}`);
  console.log(`⚡ Endpoints API: http://localhost:${PORT}/api/cars`);
  console.log(`🤖 AI Assistant Endpoint: http://localhost:${PORT}/api/ai/chat`);
  console.log(`🛠️ Master Admin CMS: http://localhost:${PORT}/api/admin/settings`);
  console.log(`=================================================`);
});
