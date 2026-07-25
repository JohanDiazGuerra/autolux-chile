# 🚗 AutoLux Drive Chile 🇨🇱 (Versión Beta Enterprise)

Plataforma Web de Alquiler de Superdeportivos, SUVs de Lujo y Vehículos Eléctricos para el Mercado Chileno 🇨🇱.

---

## 🚀 Características Principales

- **🏎️ Flota de 16 Vehículos Exóticos:** Fichas técnicas completas (HP, 0-100km/h, consumo por litro, maletero, tracción).
- **⚖️ Comparador Lado a Lado:** Comparativa en paralelo de hasta 3 vehículos simultáneos.
- **💱 Selector de Monedas en Tiempo Real:** Pesos Chilenos (`CLP $`), USD, EUR, DOP y MXN.
- **🇨🇱 Facturación Transparente Chile:** Cálculo del **19% de IVA oficial**, Pase Diario TAG Autopistas Urbanas y Seguro Zero Excess.
- **📄 Uploader de Licencia/RUT:** Carga de fotos de documentos durante el checkout.
- **✍️ Firma Digital Táctil:** Firma en pantalla que se imprime en el **Contrato Digital PDF**.
- **🤖 Luxi AI Concierge:** Asistente Virtual IA 24/7 con recomendaciones de autos y reserva directa.
- **💬 WhatsApp VIP Concierge 24/7:** Contacto directo en 1 clic.
- **🛠️ Panel CMS Master Admin:** Gestor completo de flota, precios en CLP, reservas, sucursales, cupones de descuento y configuraciones del sitio.

---

## 🛠️ Instalación y Ejecución Local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/TU-USUARIO/autolux-drive-chile.git
   cd autolux-drive-chile
   ```

2. **Instalar dependencias:**
   ```bash
   npm run setup
   ```

3. **Iniciar servidor:**
   ```bash
   npm start
   ```

4. **Abrir en el navegador:**
   👉 `http://localhost:5001`

---

## 📁 Estructura del Proyecto

```text
/renta car
├── /cliente/              # Frontend SPA (HTML5, CSS3, JavaScript Vanilla)
│   ├── index.html         # Vista Principal
│   ├── estilos.css        # Sistema de Diseño de Lujo Dark Mode
│   └── aplicacion.js      # Lógica de Interacción, AI Chat y Checkout
│
├── /servidor/             # Backend REST API (Node.js & Express)
│   ├── servidor.js        # Punto de Entrada
│   ├── base_datos.js      # Base de Datos JSON
│   └── /rutas/            # Endpoints API (cars, bookings, ai, admin, stats)
│
├── .gitignore
├── package.json
└── README.md
```

---

## 📜 Licencia
Proyecto desarrollado para **AutoLux Drive Chile SpA** (RUT: 77.892.410-9). Todos los derechos reservados.
