# AutoLux Drive Chile - Sistema de Renta de Vehículos (Versión Beta)

Este repositorio contiene la versión beta de la plataforma web de alquiler de vehículos para el mercado chileno. Es un proyecto en desarrollo activo orientado a la mejora continua, optimización de código y recepción de feedback.

## Descripción del Proyecto

El sistema está diseñado como una solución integral que abarca la gestión de flota de vehículos, reservas de clientes en tiempo real, cálculo de impuestos locales (IVA 19%), pase diario de peajes urbanos (TAG), asistente virtual de consultas y un panel de administración para la gestión de contenidos y estado de las unidades.

## Funcionalidades Incluidas

- Catálogo de vehículos con especificaciones técnicas detalladas (potencia, aceleración, consumo por litro, transmisión y capacidad).
- Sistema de comparación de especificaciones técnicas entre unidades de la flota.
- Motor de reservas con cálculo automático de tarifas, impuestos y adicionales opcionales.
- Carga de documentación de clientes (Cédula de Identidad / RUT y Licencia de Conducir).
- Registro de firma digital en pantalla para la emisión del contrato de arriendo en formato PDF.
- Asistente virtual de atención al cliente para resolver dudas sobre condiciones de alquiler y sugerencias de flota.
- Panel de control de administración (CMS) para gestión de inventario, actualización de precios, mantenimiento de unidades, sucursales y códigos de descuento.

## Arquitectura de la Aplicación

La solución se compone de dos módulos principales:

1. **Cliente (Frontend):** Aplicación de página única (SPA) desarrollada en HTML, CSS y JavaScript Vanilla, con diseño adaptativo y soporte multimoneda.
2. **Servidor (Backend):** API REST desarrollada en Node.js y Express para la persistencia de datos, procesamiento de solicitudes y lógica de negocios.

## Estructura del Repositorio

```text
autolux-chile/
├── cliente/
│   ├── index.html
│   ├── estilos.css
│   └── aplicacion.js
├── servidor/
│   ├── servidor.js
│   ├── base_datos.js
│   └── rutas/
│       ├── admin.js
│       ├── ai.js
│       ├── autos.js
│       ├── estadisticas.js
│       └── reservas.js
├── .gitignore
├── package.json
└── README.md
```

## Instrucciones de Instalación Local

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/JohanDiazGuerra/autolux-chile.git
   cd autolux-chile
   ```

2. Instalar las dependencias e iniciar el servidor:
   ```bash
   cd servidor
   npm install
   node servidor.js
   ```

3. Acceder mediante el navegador web en: `http://localhost:5001`

## Estado del Proyecto y Contribuciones

Este proyecto se encuentra en etapa beta y está abierto a sugerencias, correcciones y nuevas funcionalidades. Puedes abrir un issue o enviar un pull request para contribuir con mejoras en la arquitectura o la interfaz.
