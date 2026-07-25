/* ==========================================================================
   AUTOLUX DRIVE CHILE 🇨🇱 - FRONTEND JAVASCRIPT APP LOGIC WITH MASTER ADMIN CMS
   ========================================================================== */

const API_BASE_URL = window.location.origin.includes('localhost')
  ? 'http://localhost:5001/api'
  : '/api';

// Currency Rates relative to 1 USD (Default CLP for Chile)
const CURRENCIES = {
  CLP: { rate: 950.0, symbol: '$', code: 'CLP' },
  USD: { rate: 1.0, symbol: '$', code: 'USD' },
  EUR: { rate: 0.92, symbol: '€', code: 'EUR' },
  DOP: { rate: 60.0, symbol: 'RD$', code: 'DOP' },
  MXN: { rate: 18.0, symbol: '$', code: 'MXN' }
};

// Multi-Language Dictionary (ES / EN)
const I18N = {
  ES: {
    nav_home: "Inicio",
    nav_fleet: "Nuestra Flota",
    nav_benefits: "Ventajas VIP Chile",
    nav_faq: "Preguntas",
    btn_my_bookings: "Mis Reservas",
    btn_admin: "Panel Admin",
    hero_tag: "Experiencia de Conducción Ultra-VIP Chile 🇨🇱",
    hero_title_1: "Vive la Emoción de Conducir",
    hero_title_2: "Lo Extraordinario",
    hero_desc: "Alquiler de vehículos exóticos, superdeportivos y SUVs de lujo en Chile. Entrega directa en Aeropuerto SCL (Terminal VIP FBO), Las Condes, Vitacura o Viña del Mar.",
    stat_cars: "Autos Exóticos",
    stat_rating: "Calificación Clientes",
    stat_support: "Concierge Chile",
    search_widget_title: "Encuentra tu Auto Ideal en Chile",
    lbl_pickup: "Lugar de Recogida en Chile",
    lbl_category: "Categoría de Auto",
    lbl_start_date: "Fecha Inicio",
    lbl_end_date: "Fecha Devolución",
    btn_search_cars: "Buscar Vehículos Disponibles en Chile",
    fleet_badge: "Nuestra Flota Exclusiva en Chile 🇨🇱",
    fleet_title: "Elige tu Próxima Máquina",
    fleet_subtitle: "Mantenidos según los estándares de fábrica más exigentes para brindarte la máxima potencia y confort."
  },
  EN: {
    nav_home: "Home",
    nav_fleet: "Our Fleet",
    nav_benefits: "VIP Chile Perks",
    nav_faq: "FAQ",
    btn_my_bookings: "My Bookings",
    btn_admin: "Admin Portal",
    hero_tag: "Ultra-VIP Chile Driving Experience 🇨🇱",
    hero_title_1: "Experience the Thrill of Driving",
    hero_title_2: "The Extraordinary",
    hero_desc: "Exotic supercar & luxury SUV rentals in Chile. Direct delivery to SCL Airport VIP Terminal, Las Condes, Vitacura, or Viña del Mar.",
    stat_cars: "Exotic Cars",
    stat_rating: "Client Rating",
    stat_support: "Chile Concierge",
    search_widget_title: "Find Your Ideal Car in Chile",
    lbl_pickup: "Pickup Location in Chile",
    lbl_category: "Car Category",
    lbl_start_date: "Start Date",
    lbl_end_date: "Return Date",
    btn_search_cars: "Search Available Cars in Chile",
    fleet_badge: "Our Exclusive Chile Fleet 🇨🇱",
    fleet_title: "Choose Your Next Machine",
    fleet_subtitle: "Maintained to the highest factory standards to deliver maximum power and comfort."
  }
};

// App State
let state = {
  cars: [],
  filteredCars: [],
  branches: [],
  promos: [],
  comparisonList: [],
  selectedCategory: 'all',
  searchQuery: '',
  activeCurrency: 'CLP',
  activeLanguage: 'ES',
  selectedCarForBooking: null,
  selectedCarForDetail: null,
  activeMainGalleryImage: '',
  appliedPromo: null,
  signatureDataUrl: null,
  uploadedDocName: null,
  siteSettings: {},
  bookingForm: {
    startDate: '',
    endDate: '',
    pickupLocation: 'Aeropuerto SCL (Terminal VIP FBO)',
    dropoffLocation: 'Aeropuerto SCL (Terminal VIP FBO)',
    selectedAddons: [],
    customerName: '',
    customerRut: '',
    customerEmail: '',
    customerPhone: ''
  },
  adminStats: null,
  adminBookings: []
};

// Helper: Format Price in Active Currency
function formatPrice(priceInUSD) {
  const curr = CURRENCIES[state.activeCurrency] || CURRENCIES.CLP;
  const converted = Math.round(priceInUSD * curr.rate);
  return `${curr.symbol}${converted.toLocaleString('de-DE')} ${curr.code}`;
}

// Toast Notifications System
function showToast(message, icon = 'fa-circle-check', type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast-item';
  toast.innerHTML = `<i class="fa-solid ${icon}" style="color: var(--accent-gold); font-size: 18px;"></i> <span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4000);
}

// Signature Canvas Variables
let isDrawing = false;
let sigCanvas, sigCtx;

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
  initDateInputs();
  fetchCars();
  fetchBranches();
  fetchSiteSettings();
  checkApiHealth();
  setupEventListeners();
  initSignaturePad();
  initDocDropzone();
  initAiAssistant();
});

// Fetch CMS Site Settings
async function fetchSiteSettings() {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/settings`);
    const data = await res.json();
    if (data.success) {
      state.siteSettings = data.data;
      updateCmsUI(data.data);
    }
  } catch (err) {
    console.error('Error fetching CMS settings:', err);
  }
}

// Update CMS Elements in Frontend UI
function updateCmsUI(s) {
  if (s.companyPhone) {
    const p = document.getElementById('cmsPhone');
    if (p) p.textContent = s.companyPhone;
  }
  if (s.companyEmail) {
    const e = document.getElementById('cmsEmail');
    if (e) e.textContent = s.companyEmail;
  }
  if (s.companyAddress) {
    const a = document.getElementById('cmsAddress');
    const fa = document.getElementById('cmsFooterAddress');
    if (a) a.textContent = s.companyAddress;
    if (fa) fa.textContent = s.companyAddress;
  }
  if (s.whatsappNumber) {
    const btn = document.getElementById('whatsappFloatBtn');
    if (btn) btn.href = `https://wa.me/${s.whatsappNumber}?text=Hola%20AutoLux%20Chile!%20Deseo%20consultar%20por%20un%20alquiler%20VIP`;
  }
}

// Initialize Luxi AI Assistant Logic
function initAiAssistant() {
  const toggleBtn = document.getElementById('aiChatToggleBtn');
  const closeBtn = document.getElementById('btnCloseAiChat');
  const chatWin = document.getElementById('aiChatWindow');
  const chatForm = document.getElementById('aiChatForm');
  const chatInput = document.getElementById('aiInputText');
  const messagesBox = document.getElementById('aiChatMessages');

  if (!toggleBtn || !chatWin || !chatForm) return;

  toggleBtn.addEventListener('click', () => {
    chatWin.classList.toggle('active');
  });

  closeBtn?.addEventListener('click', () => {
    chatWin.classList.remove('active');
  });

  // Quick Chips Click Handlers
  document.querySelectorAll('.ai-quick-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      const promptText = e.currentTarget.getAttribute('data-prompt');
      if (promptText) {
        sendAiMessage(promptText);
      }
    });
  });

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = chatInput.value.trim();
    if (!msg) return;
    chatInput.value = '';
    sendAiMessage(msg);
  });

  async function sendAiMessage(userMsg) {
    appendMessage(userMsg, 'user');

    const typingElem = document.createElement('div');
    typingElem.className = 'ai-msg bot';
    typingElem.id = 'aiTyping';
    typingElem.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Luxi está pensando...`;
    messagesBox.appendChild(typingElem);
    messagesBox.scrollTop = messagesBox.scrollHeight;

    try {
      const res = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });

      const data = await res.json();
      document.getElementById('aiTyping')?.remove();

      if (data.success) {
        let botHtml = data.reply.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');

        if (data.suggestedCar) {
          botHtml += `
            <div style="margin-top: 10px; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 10px; border: 1px solid var(--border-gold); text-align: center;">
              <img src="${data.suggestedCar.image}" style="width: 100%; height: 75px; object-fit: cover; border-radius: 6px; margin-bottom: 6px;">
              <div style="font-weight: 700; font-size: 12px; margin-bottom: 6px;">${data.suggestedCar.name}</div>
              <button class="btn btn-primary btn-sm btn-ai-reserve" data-id="${data.suggestedCar.id}" style="width: 100%; padding: 4px 8px; font-size: 11px;">
                <i class="fa-solid fa-key"></i> Reservar ${data.suggestedCar.name}
              </button>
            </div>
          `;
        }

        appendMessage(botHtml, 'bot', true);

        messagesBox.querySelectorAll('.btn-ai-reserve').forEach(btn => {
          btn.onclick = (e) => {
            const carId = e.currentTarget.getAttribute('data-id');
            chatWin.classList.remove('active');
            openBookingModal(carId);
          };
        });

      } else {
        appendMessage('Lo siento, ocurrió un inconveniente. Intenta nuevamente.', 'bot');
      }
    } catch (err) {
      document.getElementById('aiTyping')?.remove();
      appendMessage('Error de conexión con el Asistente Luxi AI.', 'bot');
    }
  }

  function appendMessage(text, sender, isHtml = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `ai-msg ${sender}`;
    if (isHtml) {
      msgDiv.innerHTML = text;
    } else {
      msgDiv.textContent = text;
    }
    messagesBox.appendChild(msgDiv);
    messagesBox.scrollTop = messagesBox.scrollHeight;
  }
}

// Initialize Date Inputs
function initDateInputs() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const next4Days = new Date(today);
  next4Days.setDate(next4Days.getDate() + 4);

  const startDateStr = tomorrow.toISOString().split('T')[0];
  const endDateStr = next4Days.toISOString().split('T')[0];

  const searchStart = document.getElementById('searchStartDate');
  const searchEnd = document.getElementById('searchEndDate');

  if (searchStart) searchStart.value = startDateStr;
  if (searchEnd) searchEnd.value = endDateStr;

  state.bookingForm.startDate = startDateStr;
  state.bookingForm.endDate = endDateStr;
}

// Initialize Document Dropzone File Uploader
function initDocDropzone() {
  const dropzone = document.getElementById('docDropzone');
  const fileInput = document.getElementById('docFileInput');
  const msg = document.getElementById('docPreviewMsg');

  if (!dropzone || !fileInput) return;

  dropzone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      state.uploadedDocName = file.name;
      msg.textContent = `✓ Documento Adjunto: ${file.name}`;
      showToast(`Documento (${file.name}) adjunto correctamente`, 'fa-file-circle-check');
    }
  });
}

// Initialize Touch Signature Pad
function initSignaturePad() {
  sigCanvas = document.getElementById('signatureCanvas');
  if (!sigCanvas) return;
  sigCtx = sigCanvas.getContext('2d');
  sigCtx.strokeStyle = '#0f172a';
  sigCtx.lineWidth = 2.5;

  function getPos(e) {
    const rect = sigCanvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  function startDraw(e) {
    isDrawing = true;
    const pos = getPos(e);
    sigCtx.beginPath();
    sigCtx.moveTo(pos.x, pos.y);
  }

  function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPos(e);
    sigCtx.lineTo(pos.x, pos.y);
    sigCtx.stroke();
  }

  function stopDraw() {
    if (isDrawing) {
      isDrawing = false;
      state.signatureDataUrl = sigCanvas.toDataURL();
    }
  }

  sigCanvas.addEventListener('mousedown', startDraw);
  sigCanvas.addEventListener('mousemove', draw);
  sigCanvas.addEventListener('mouseup', stopDraw);

  sigCanvas.addEventListener('touchstart', startDraw);
  sigCanvas.addEventListener('touchmove', draw);
  sigCanvas.addEventListener('touchend', stopDraw);

  document.getElementById('btnClearSignature')?.addEventListener('click', () => {
    sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
    state.signatureDataUrl = null;
    showToast('Firma limpiada', 'fa-eraser');
  });
}

// Check Backend API Health
async function checkApiHealth() {
  const badge = document.getElementById('apiStatusBadge');
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (res.ok) {
      badge.innerHTML = `<span class="badge badge-success"><i class="fa-solid fa-signal"></i> API Backend En Línea (Chile Port 5001)</span>`;
    } else {
      badge.innerHTML = `<span class="badge badge-warning"><i class="fa-solid fa-triangle-exclamation"></i> API Backend Inestable</span>`;
    }
  } catch (err) {
    badge.innerHTML = `<span class="badge badge-danger"><i class="fa-solid fa-plug-circle-xmark"></i> API Backend Desconectado</span>`;
  }
}

// Fetch Chilean Branches
async function fetchBranches() {
  try {
    const res = await fetch(`${API_BASE_URL}/cars/branches`);
    const data = await res.json();
    if (data.success) {
      state.branches = data.data;
      renderBranchesGrid();
    }
  } catch (err) {
    console.error('Error al cargar sucursales:', err);
  }
}

// Render Chilean Branches Cards
function renderBranchesGrid() {
  const container = document.getElementById('branchesGrid');
  if (!container || !state.branches) return;

  container.innerHTML = state.branches.map(b => `
    <div class="branch-card">
      <div style="font-size: 12px; color: var(--accent-gold); font-weight: 700; text-transform: uppercase;"><i class="fa-solid fa-location-dot"></i> ${b.city}</div>
      <h3 style="font-size: 18px; margin: 6px 0;">${b.name}</h3>
      <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;"><i class="fa-solid fa-map-pin"></i> ${b.address}</p>
      <div style="font-size: 12px; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px;">
        <span><i class="fa-solid fa-phone" style="color: var(--accent-cyan);"></i> ${b.phone}</span>
        <span><i class="fa-solid fa-clock" style="color: var(--accent-cyan);"></i> ${b.hours}</span>
      </div>
    </div>
  `).join('');
}

// Fetch Cars from REST API
async function fetchCars() {
  try {
    const start = state.bookingForm.startDate;
    const end = state.bookingForm.endDate;
    let url = `${API_BASE_URL}/cars`;

    if (start && end) {
      url += `?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`;
    }

    const res = await fetch(url);
    const data = await res.json();

    if (data.success) {
      state.cars = data.data;
      filterAndRenderCars();
    }
  } catch (err) {
    console.error('Error al cargar la flota de vehículos:', err);
  }
}

// Filter and Render Cars
function filterAndRenderCars() {
  let list = [...state.cars];

  if (state.selectedCategory !== 'all') {
    list = list.filter(c => c.category.toLowerCase() === state.selectedCategory.toLowerCase());
  }

  if (state.searchQuery.trim() !== '') {
    const q = state.searchQuery.toLowerCase();
    list = list.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.brand.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      (c.engineSpecs && c.engineSpecs.toLowerCase().includes(q))
    );
  }

  state.filteredCars = list;
  renderCarsGrid(list);
}

// Render Cars Cards into HTML Grid
function renderCarsGrid(cars) {
  const container = document.getElementById('carsGrid');
  if (!container) return;

  if (cars.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-subtle);">
        <i class="fa-solid fa-car-side" style="font-size: 48px; color: var(--text-muted); margin-bottom: 16px;"></i>
        <h3>No se encontraron vehículos</h3>
        <p style="color: var(--text-secondary); margin-top: 8px;">Intenta cambiar los filtros o el término de búsqueda.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = cars.map(car => {
    const isAvailable = car.isAvailableForDates !== false && car.status === 'available';
    const isCompared = state.comparisonList.some(c => c.id === car.id);

    return `
      <div class="car-card" style="${!isAvailable ? 'opacity: 0.8;' : ''}">
        <div class="car-image-box">
          <img src="${car.image}" alt="${car.name}" class="car-image" onerror="this.src='https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80'">
          <div class="category-tag">${car.category}</div>
          <div class="rating-tag"><i class="fa-solid fa-star"></i> ${car.rating || '5.0'}</div>
        </div>

        <div class="car-card-body">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="car-brand">${car.brand}</span>
            <label style="font-size: 11px; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 4px;">
              <input type="checkbox" class="comp-checkbox" data-id="${car.id}" ${isCompared ? 'checked' : ''}> Comparar
            </label>
          </div>
          <h3 class="car-name">${car.name}</h3>

          <div class="specs-grid">
            <div class="spec-item" title="Motor">
              <i class="fa-solid fa-microchip"></i>
              <div class="spec-text">
                <span class="spec-label">Motor</span>
                <span class="spec-value">${car.engineSpecs ? car.engineSpecs.split('(')[0] : `${car.hp} HP`}</span>
              </div>
            </div>

            <div class="spec-item" title="Rendimiento">
              <i class="fa-solid fa-gas-pump"></i>
              <div class="spec-text">
                <span class="spec-label">Rendimiento</span>
                <span class="spec-value">${car.fuelEconomy ? car.fuelEconomy.split('(')[0] : '11.5 L/100km'}</span>
              </div>
            </div>

            <div class="spec-item" title="Capacidad">
              <i class="fa-solid fa-users"></i>
              <div class="spec-text">
                <span class="spec-label">Capacidad</span>
                <span class="spec-value">${car.passengerCapacity ? car.passengerCapacity.split('(')[0] : `${car.seats} Pasajeros`}</span>
              </div>
            </div>

            <div class="spec-item" title="Aceleración">
              <i class="fa-solid fa-stopwatch"></i>
              <div class="spec-text">
                <span class="spec-label">0-100 km/h</span>
                <span class="spec-value">${car.acceleration || '3.5s'}</span>
              </div>
            </div>
          </div>

          <div class="car-card-footer">
            <div class="car-price">
              <span class="price-amount">${formatPrice(car.pricePerDay)}</span>
              <span class="price-unit">/ día</span>
            </div>

            <div style="display: flex; gap: 8px;">
              <button class="btn btn-secondary btn-sm btn-view-detail" data-id="${car.id}" title="Ver Ficha Técnica Completa">
                <i class="fa-solid fa-eye"></i> Detalles
              </button>

              ${isAvailable ? `
                <button class="btn btn-primary btn-sm btn-reserve" data-id="${car.id}">
                  <i class="fa-solid fa-key"></i> Reservar
                </button>
              ` : `
                <button class="btn btn-secondary btn-sm" disabled style="opacity: 0.6; cursor: not-allowed;">
                  <i class="fa-solid fa-calendar-xmark"></i> Reservado
                </button>
              `}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Attach button handlers
  document.querySelectorAll('.btn-view-detail').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const carId = e.currentTarget.getAttribute('data-id');
      openCarDetailModal(carId);
    });
  });

  document.querySelectorAll('.btn-reserve').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const carId = e.currentTarget.getAttribute('data-id');
      openBookingModal(carId);
    });
  });

  document.querySelectorAll('.comp-checkbox').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const carId = e.currentTarget.getAttribute('data-id');
      toggleCarComparison(carId, e.currentTarget.checked);
    });
  });
}

// Toggle Car Comparison Selection
function toggleCarComparison(carId, isChecked) {
  const car = state.cars.find(c => c.id === carId);
  if (!car) return;

  if (isChecked) {
    if (state.comparisonList.length >= 3) {
      showToast('Puedes comparar máximo 3 vehículos a la vez', 'fa-triangle-exclamation', 'warning');
      filterAndRenderCars();
      return;
    }
    if (!state.comparisonList.some(c => c.id === carId)) {
      state.comparisonList.push(car);
      showToast(`${car.name} añadido al comparador`, 'fa-code-compare');
    }
  } else {
    state.comparisonList = state.comparisonList.filter(c => c.id !== carId);
  }

  updateComparisonBarUI();
}

// Update Floating Comparison Bar UI
function updateComparisonBarUI() {
  const bar = document.getElementById('comparisonBar');
  const countEl = document.getElementById('compCount');
  const listEl = document.getElementById('compItemsList');

  if (!bar || !countEl || !listEl) return;

  countEl.textContent = state.comparisonList.length;

  if (state.comparisonList.length > 0) {
    bar.classList.add('active');
    listEl.innerHTML = state.comparisonList.map(c => `
      <span class="comp-pill">
        ${c.name}
        <i class="fa-solid fa-xmark btn-remove-comp" data-id="${c.id}"></i>
      </span>
    `).join('');

    listEl.querySelectorAll('.btn-remove-comp').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        toggleCarComparison(id, false);
        filterAndRenderCars();
      });
    });
  } else {
    bar.classList.remove('active');
  }
}

// Open Vehicle Comparator Modal
function openComparatorModal() {
  if (state.comparisonList.length === 0) return;

  const container = document.getElementById('comparatorTableContainer');
  if (!container) return;

  container.innerHTML = `
    <table class="dossier-table" style="text-align: center;">
      <thead>
        <tr>
          <th style="text-align: left; padding: 12px;">Especificación</th>
          ${state.comparisonList.map(c => `
            <th style="padding: 12px; min-width: 200px;">
              <img src="${c.image}" style="width: 100%; height: 110px; object-fit: cover; border-radius: var(--radius-md); margin-bottom: 8px;">
              <div style="font-size: 16px; font-weight: 800; color: var(--text-primary);">${c.name}</div>
              <div style="font-size: 18px; font-weight: 800; color: var(--accent-gold); margin-top: 4px;">${formatPrice(c.pricePerDay)} / día</div>
            </th>
          `).join('')}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-align: left;"><i class="fa-solid fa-microchip"></i> Motor:</td>
          ${state.comparisonList.map(c => `<td>${c.engineSpecs || `${c.hp} HP`}</td>`).join('')}
        </tr>
        <tr>
          <td style="text-align: left;"><i class="fa-solid fa-bolt"></i> Potencia:</td>
          ${state.comparisonList.map(c => `<td><strong>${c.hp} HP</strong></td>`).join('')}
        </tr>
        <tr>
          <td style="text-align: left;"><i class="fa-solid fa-stopwatch"></i> 0-100 km/h:</td>
          ${state.comparisonList.map(c => `<td style="color: var(--accent-cyan); font-weight: 700;">${c.acceleration || 'N/A'}</td>`).join('')}
        </tr>
        <tr>
          <td style="text-align: left;"><i class="fa-solid fa-gauge-high"></i> Vel. Máxima:</td>
          ${state.comparisonList.map(c => `<td>${c.topSpeed || 'N/A'}</td>`).join('')}
        </tr>
        <tr>
          <td style="text-align: left;"><i class="fa-solid fa-gas-pump"></i> Consumo:</td>
          ${state.comparisonList.map(c => `<td>${c.fuelEconomy || 'N/A'}</td>`).join('')}
        </tr>
        <tr>
          <td style="text-align: left;"><i class="fa-solid fa-shield-cat"></i> Depósito Garantía:</td>
          ${state.comparisonList.map(c => `<td style="color: var(--accent-gold); font-weight: 700;">${formatPrice(c.securityDepositUSD || 2000)}</td>`).join('')}
        </tr>
        <tr>
          <td style="text-align: left;">Acción:</td>
          ${state.comparisonList.map(c => `
            <td>
              <button class="btn btn-primary btn-sm btn-reserve-comp" data-id="${c.id}">
                Reservar ${c.brand}
              </button>
            </td>
          `).join('')}
        </tr>
      </tbody>
    </table>
  `;

  container.querySelectorAll('.btn-reserve-comp').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      document.getElementById('comparatorModal').classList.remove('active');
      openBookingModal(id);
    });
  });

  document.getElementById('comparatorModal').classList.add('active');
}

// Open Dedicated Car Detail View Modal (#carDetailModal)
async function openCarDetailModal(carId) {
  const car = state.cars.find(c => c.id === carId);
  if (!car) return;

  state.selectedCarForDetail = car;

  document.getElementById('detailCarCategory').textContent = car.category;
  document.getElementById('detailCarName').textContent = car.name;
  document.getElementById('detailCarPrice').textContent = `${formatPrice(car.pricePerDay)} / día`;
  document.getElementById('detailSecurityDeposit').textContent = formatPrice(car.securityDepositUSD || 2000);

  const mainImg = document.getElementById('detailHeroImage');
  mainImg.src = car.image;

  const gallery = car.gallery && car.gallery.length > 0 ? car.gallery : [car.image];
  const thumbsContainer = document.getElementById('detailGalleryThumbs');
  thumbsContainer.innerHTML = gallery.map((url, idx) => `
    <img src="${url}" class="thumb-img ${url === car.image ? 'active' : ''}" data-url="${url}" alt="Foto ${idx+1}">
  `).join('');

  thumbsContainer.querySelectorAll('.thumb-img').forEach(t => {
    t.addEventListener('click', (e) => {
      const url = e.currentTarget.getAttribute('data-url');
      mainImg.src = url;
      thumbsContainer.querySelectorAll('.thumb-img').forEach(img => img.classList.remove('active'));
      e.currentTarget.classList.add('active');
    });
  });

  const featuresBox = document.getElementById('detailFeaturesList');
  const features = car.features || ["Lujo VIP", "Full Equipado", "Seguridad Avanzada"];
  featuresBox.innerHTML = features.map(f => `
    <span class="feature-chip"><i class="fa-solid fa-check-circle"></i> ${f}</span>
  `).join('');

  document.getElementById('detailSpecEngine').textContent = car.engineSpecs || `${car.hp} HP`;
  document.getElementById('detailSpecHp').textContent = `${car.hp} HP Caballos de Fuerza`;
  document.getElementById('detailSpecTorque').textContent = car.torque || 'N/A';
  document.getElementById('detailSpecAccel').textContent = car.acceleration || 'N/A';
  document.getElementById('detailSpecTopSpeed').textContent = car.topSpeed || 'N/A';
  document.getElementById('detailSpecDrivetrain').textContent = car.drivetrain || 'Tracción Trasera (RWD)';
  document.getElementById('detailSpecTransmission').textContent = car.transmission || 'Automática';
  document.getElementById('detailSpecFuelEconomy').textContent = car.fuelEconomy || 'N/A';
  document.getElementById('detailSpecCapacity').textContent = car.passengerCapacity || `${car.seats} Pasajeros`;
  document.getElementById('detailSpecFuelTank').textContent = car.fuelTank || '75 Litros';

  renderCarReviewsList(car);

  const btnReserve = document.getElementById('btnReserveFromDetail');
  btnReserve.onclick = () => {
    document.getElementById('carDetailModal').classList.remove('active');
    openBookingModal(car.id);
  };

  document.getElementById('carDetailModal').classList.add('active');
}

// Render Customer Reviews for a Car
function renderCarReviewsList(car) {
  const reviewsContainer = document.getElementById('detailReviewsList');
  if (!reviewsContainer) return;

  const carReviews = car.reviews && car.reviews.length > 0 ? car.reviews : [
    { customerName: "Gonzalo V.", rating: 5, date: "Hace 3 días", comment: "Excelente entrega en Aeropuerto SCL. El auto estaba 10/10." }
  ];

  reviewsContainer.innerHTML = carReviews.map(r => `
    <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); padding: 12px; border-radius: var(--radius-sm);">
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <strong style="font-size: 13px;">${r.customerName}</strong>
        <span style="color: #fbbf24; font-size: 12px;">${'★'.repeat(r.rating || 5)}</span>
      </div>
      <p style="font-size: 13px; color: var(--text-secondary);">${r.comment}</p>
    </div>
  `).join('');
}

// Setup Event Listeners
function setupEventListeners() {
  document.getElementById('btnOpenComparatorModal')?.addEventListener('click', openComparatorModal);
  document.getElementById('btnCloseComparatorModal')?.addEventListener('click', () => {
    document.getElementById('comparatorModal').classList.remove('active');
  });

  const reviewForm = document.getElementById('reviewForm');
  if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!state.selectedCarForDetail) return;

      const customerName = document.getElementById('revName').value.trim();
      const rating = document.getElementById('revRating').value;
      const comment = document.getElementById('revComment').value.trim();

      try {
        const res = await fetch(`${API_BASE_URL}/bookings/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            carId: state.selectedCarForDetail.id,
            customerName,
            rating,
            comment
          })
        });

        const data = await res.json();
        if (data.success) {
          showToast('¡Gracias! Tu reseña ha sido publicada', 'fa-star');
          reviewForm.reset();
          state.selectedCarForDetail.reviews = state.selectedCarForDetail.reviews || [];
          state.selectedCarForDetail.reviews.unshift(data.data);
          renderCarReviewsList(state.selectedCarForDetail);
          fetchCars();
        }
      } catch (err) {
        showToast('Error al publicar la reseña', 'fa-circle-xmark', 'danger');
      }
    });
  }

  document.getElementById('btnCloseCarDetailModal')?.addEventListener('click', () => {
    document.getElementById('carDetailModal').classList.remove('active');
  });

  const currencySelect = document.getElementById('currencySelect');
  if (currencySelect) {
    currencySelect.value = state.activeCurrency;
    currencySelect.addEventListener('change', (e) => {
      state.activeCurrency = e.target.value;
      filterAndRenderCars();
      if (state.selectedCarForBooking) {
        calculateBookingSummary();
      }
      showToast(`Moneda cambiada a ${state.activeCurrency}`, 'fa-coins');
    });
  }

  const languageSelect = document.getElementById('languageSelect');
  if (languageSelect) {
    languageSelect.addEventListener('change', (e) => {
      state.activeLanguage = e.target.value;
      updateLanguageUI();
    });
  }

  const categoryTabs = document.getElementById('categoryTabs');
  if (categoryTabs) {
    categoryTabs.addEventListener('click', (e) => {
      if (e.target.classList.contains('tab-btn')) {
        document.querySelectorAll('#categoryTabs .tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        state.selectedCategory = e.target.getAttribute('data-category');
        filterAndRenderCars();
      }
    });
  }

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      filterAndRenderCars();
    });
  }

  const heroForm = document.getElementById('heroSearchForm');
  if (heroForm) {
    heroForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const cat = document.getElementById('searchCategory').value;
      const start = document.getElementById('searchStartDate').value;
      const end = document.getElementById('searchEndDate').value;
      const pickup = document.getElementById('searchPickupLoc').value;

      state.selectedCategory = cat;
      if (start) state.bookingForm.startDate = start;
      if (end) state.bookingForm.endDate = end;
      state.bookingForm.pickupLocation = pickup;

      document.querySelectorAll('#categoryTabs .tab-btn').forEach(b => {
        if (b.getAttribute('data-category') === cat) b.classList.add('active');
        else b.classList.remove('active');
      });

      fetchCars();
      document.getElementById('fleet').scrollIntoView({ behavior: 'smooth' });
    });
  }

  document.getElementById('btnCloseBookingModal')?.addEventListener('click', closeBookingModal);
  document.getElementById('btnNextStep1')?.addEventListener('click', () => switchBookingStep(2));
  document.getElementById('btnBackStep2')?.addEventListener('click', () => switchBookingStep(1));

  document.getElementById('btnNextStep2')?.addEventListener('click', () => {
    const name = document.getElementById('custName').value.trim();
    const rut = document.getElementById('custRut').value.trim();
    const email = document.getElementById('custEmail').value.trim();

    if (!name || !rut || !email) {
      alert('Por favor, completa tu Nombre, RUT / Cédula y Correo Electrónico para continuar.');
      return;
    }

    state.bookingForm.customerName = name;
    state.bookingForm.customerRut = rut;
    state.bookingForm.customerEmail = email;
    state.bookingForm.customerPhone = document.getElementById('custPhone').value.trim();
    state.bookingForm.pickupLocation = document.getElementById('custPickupLoc').value;

    switchBookingStep(3);
  });

  document.getElementById('btnBackStep3')?.addEventListener('click', () => switchBookingStep(2));
  document.getElementById('btnConfirmBooking')?.addEventListener('click', submitBooking);
  document.getElementById('btnCloseVoucher')?.addEventListener('click', closeBookingModal);

  document.querySelectorAll('.addon-checkbox').forEach(chk => {
    chk.addEventListener('change', () => {
      updateSelectedAddons();
      calculateBookingSummary();
    });
  });

  document.getElementById('btnApplyPromo')?.addEventListener('click', handleApplyPromoCode);

  document.getElementById('btnMyBookings')?.addEventListener('click', openMyBookingsModal);
  document.getElementById('btnCloseMyBookingsModal')?.addEventListener('click', () => {
    document.getElementById('myBookingsModal').classList.remove('active');
  });
  document.getElementById('btnLookupBooking')?.addEventListener('click', lookupUserBookings);

  // Modal 3: Master Admin CMS
  document.getElementById('btnAdminPortal')?.addEventListener('click', openAdminModal);
  document.getElementById('btnCloseAdminModal')?.addEventListener('click', () => {
    document.getElementById('adminModal').classList.remove('active');
  });

  // Admin 5 Tabs Navigation
  document.getElementById('btnTabAdminCars')?.addEventListener('click', () => setActiveAdminTab('cars'));
  document.getElementById('btnTabAdminBookings')?.addEventListener('click', () => {
    setActiveAdminTab('bookings');
    fetchAdminBookings();
  });
  document.getElementById('btnTabAdminPromos')?.addEventListener('click', () => {
    setActiveAdminTab('promos');
    fetchAdminPromos();
  });
  document.getElementById('btnTabAdminBranches')?.addEventListener('click', () => {
    setActiveAdminTab('branches');
    fetchAdminBranches();
  });
  document.getElementById('btnTabAdminSettings')?.addEventListener('click', () => {
    setActiveAdminTab('settings');
    loadAdminSettingsForm();
  });

  // Add Car Modal
  document.getElementById('btnAddNewCarModal')?.addEventListener('click', () => {
    document.getElementById('addCarModal').classList.add('active');
  });
  document.getElementById('btnCloseAddCarModal')?.addEventListener('click', () => {
    document.getElementById('addCarModal').classList.remove('active');
  });
  document.getElementById('addCarForm')?.addEventListener('submit', handleAddCarSubmit);

  // Edit Car Modal
  document.getElementById('btnCloseEditCarModal')?.addEventListener('click', () => {
    document.getElementById('editCarModal').classList.remove('active');
  });
  document.getElementById('editCarForm')?.addEventListener('submit', handleEditCarSubmit);

  // Admin Promos Add Button
  document.getElementById('btnAddPromoBtn')?.addEventListener('click', handleAddPromoSubmit);

  // Admin Branches Add Button
  document.getElementById('btnAddBranchBtn')?.addEventListener('click', handleAddBranchSubmit);

  // Admin CMS Settings Form Submit
  document.getElementById('adminSettingsForm')?.addEventListener('submit', handleSaveAdminSettings);
}

// Update Language Text in UI
function updateLanguageUI() {
  const dict = I18N[state.activeLanguage] || I18N.ES;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });
}

// Set Active Admin Tab
function setActiveAdminTab(tabName) {
  ['cars', 'bookings', 'promos', 'branches', 'settings'].forEach(t => {
    const btn = document.getElementById(`btnTabAdmin${t.charAt(0).toUpperCase() + t.slice(1)}`);
    const view = document.getElementById(`admin${t.charAt(0).toUpperCase() + t.slice(1)}View`);
    if (btn) {
      if (t === tabName) btn.classList.add('active');
      else btn.classList.remove('active');
    }
    if (view) {
      view.style.display = t === tabName ? 'block' : 'none';
    }
  });
}

// Open Booking Modal for specific car ID
function openBookingModal(carId) {
  const car = state.cars.find(c => c.id === carId);
  if (!car) return;

  state.selectedCarForBooking = car;
  state.appliedPromo = null;
  state.activeMainGalleryImage = car.image;

  document.getElementById('promoCodeInput').value = '';
  document.getElementById('promoFeedbackMsg').innerHTML = '';

  renderCarHeaderWithGallery(car);

  document.querySelectorAll('.addon-checkbox').forEach(c => {
    if (c.value.includes('TAG Autopistas')) c.checked = true;
    else c.checked = false;
  });
  updateSelectedAddons();
  calculateBookingSummary();

  switchBookingStep(1);
  document.getElementById('bookingModal').classList.add('active');
}

// Render Car Header with Multi-Angle Gallery
function renderCarHeaderWithGallery(car) {
  const headerBox = document.getElementById('selectedCarHeader');
  if (!headerBox) return;

  const gallery = car.gallery && car.gallery.length > 0 ? car.gallery : [car.image];

  headerBox.innerHTML = `
    <div style="display: flex; gap: 20px; align-items: center;">
      <img id="mainGalleryImage" src="${state.activeMainGalleryImage}" style="width: 170px; height: 110px; object-fit: cover; border-radius: var(--radius-md);" onerror="this.src='https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80'">
      <div>
        <span class="badge badge-warning" style="margin-bottom: 4px;">${car.category}</span>
        <h3 style="font-size: 20px;">${car.name}</h3>
        <p style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">
          <i class="fa-solid fa-microchip" style="color: var(--accent-gold);"></i> ${car.engineSpecs || `${car.hp} HP`}<br>
          <i class="fa-solid fa-gas-pump" style="color: var(--accent-cyan);"></i> ${car.fuelEconomy || '11.5 L/100km'} | <i class="fa-solid fa-users"></i> ${car.passengerCapacity || `${car.seats} Pasajeros`}
        </p>
        <p style="font-size: 16px; color: var(--accent-gold); font-weight: 800; margin-top: 6px;">${formatPrice(car.pricePerDay)} / día</p>
      </div>
    </div>

    ${gallery.length > 1 ? `
      <div>
        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;"><i class="fa-solid fa-camera"></i> Galería de Fotos del Vehículo:</div>
        <div class="gallery-thumbs">
          ${gallery.map((imgUrl, idx) => `
            <img src="${imgUrl}" class="thumb-img ${imgUrl === state.activeMainGalleryImage ? 'active' : ''}" data-url="${imgUrl}" alt="Foto ${idx+1}">
          `).join('')}
        </div>
      </div>
    ` : ''}
  `;

  headerBox.querySelectorAll('.thumb-img').forEach(thumb => {
    thumb.addEventListener('click', (e) => {
      const url = e.currentTarget.getAttribute('data-url');
      state.activeMainGalleryImage = url;
      document.getElementById('mainGalleryImage').src = url;
      headerBox.querySelectorAll('.thumb-img').forEach(t => t.classList.remove('active'));
      e.currentTarget.classList.add('active');
    });
  });
}

function closeBookingModal() {
  document.getElementById('bookingModal').classList.remove('active');
}

// Switch Stepper Steps in Booking Modal
function switchBookingStep(stepNum) {
  [1, 2, 3, 4].forEach(i => {
    const el = document.getElementById(`bookingStep${i}`);
    const ind = document.getElementById(`step${i}Indicator`);
    if (el) el.style.display = i === stepNum ? 'block' : 'none';
    if (ind) {
      if (i <= stepNum) ind.classList.add('active');
      else ind.classList.remove('active');
    }
  });
}

function updateSelectedAddons() {
  const selected = [];
  document.querySelectorAll('.addon-checkbox:checked').forEach(c => {
    selected.push(c.value);
  });
  state.bookingForm.selectedAddons = selected;
}

// Handle Apply Promo Code
async function handleApplyPromoCode() {
  const input = document.getElementById('promoCodeInput');
  const feedback = document.getElementById('promoFeedbackMsg');
  const code = input.value.trim();

  if (!code) {
    feedback.innerHTML = `<span style="color: #ef4444;">Por favor, ingresa un código promocional.</span>`;
    return;
  }

  feedback.innerHTML = `<span style="color: var(--text-secondary);"><i class="fa-solid fa-spinner fa-spin"></i> Validando código...</span>`;

  try {
    const res = await fetch(`${API_BASE_URL}/bookings/validate-promo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });

    const data = await res.json();

    if (data.success) {
      state.appliedPromo = data.data;
      feedback.innerHTML = `<span style="color: var(--accent-emerald); font-weight: 700;"><i class="fa-solid fa-circle-check"></i> ${data.data.description}</span>`;
      showToast('¡Cupón aplicado correctamente!', 'fa-ticket');
      calculateBookingSummary();
    } else {
      state.appliedPromo = null;
      feedback.innerHTML = `<span style="color: #ef4444;"><i class="fa-solid fa-circle-xmark"></i> ${data.message}</span>`;
      calculateBookingSummary();
    }
  } catch (err) {
    feedback.innerHTML = `<span style="color: #ef4444;">Error al validar el código.</span>`;
  }
}

// Calculate Booking Summary (Price, Days, Tax 19% IVA Chile, Total with Currency)
function calculateBookingSummary() {
  if (!state.selectedCarForBooking) return;

  const car = state.selectedCarForBooking;
  const start = new Date(state.bookingForm.startDate || Date.now());
  const end = new Date(state.bookingForm.endDate || Date.now());
  const diffTime = Math.abs(end - start);
  const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  let addonsPricePerDayUSD = 0;
  document.querySelectorAll('.addon-checkbox:checked').forEach(c => {
    addonsPricePerDayUSD += parseFloat(c.getAttribute('data-price') || 0);
  });

  const dailyRateUSD = car.pricePerDay;
  const grossSubtotalUSD = (dailyRateUSD + addonsPricePerDayUSD) * days;

  let discountUSD = 0;
  if (state.appliedPromo) {
    const p = state.appliedPromo;
    if (p.discountType === 'percentage') {
      discountUSD = Math.round((grossSubtotalUSD * p.discountValue) / 100);
    } else if (p.discountType === 'fixed') {
      discountUSD = Math.min(grossSubtotalUSD, p.discountValue);
    }
  }

  const netSubtotalUSD = Math.max(0, grossSubtotalUSD - discountUSD);
  const vatPercent = (state.siteSettings.vatRate || 19) / 100;
  const taxUSD = Math.round(netSubtotalUSD * vatPercent);
  const totalUSD = netSubtotalUSD + taxUSD;

  document.getElementById('summaryDailyRate').textContent = formatPrice(dailyRateUSD);
  document.getElementById('summaryDaysCount').textContent = `${days} día(s)`;
  document.getElementById('summaryAddonsPrice').textContent = formatPrice(addonsPricePerDayUSD * days);

  const discountRow = document.getElementById('summaryDiscountRow');
  if (discountUSD > 0) {
    discountRow.style.display = 'flex';
    document.getElementById('summaryDiscountPrice').textContent = `-${formatPrice(discountUSD)}`;
  } else {
    discountRow.style.display = 'none';
  }

  document.getElementById('summaryTaxPrice').textContent = formatPrice(taxUSD);
  document.getElementById('summaryTotalPrice').textContent = formatPrice(totalUSD);
}

// Submit Booking to Backend REST API
async function submitBooking() {
  if (!state.selectedCarForBooking) return;

  const btnConfirm = document.getElementById('btnConfirmBooking');
  btnConfirm.disabled = true;
  btnConfirm.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Procesando Reserva...`;

  const payload = {
    carId: state.selectedCarForBooking.id,
    customerName: state.bookingForm.customerName,
    customerRut: state.bookingForm.customerRut,
    customerEmail: state.bookingForm.customerEmail,
    customerPhone: state.bookingForm.customerPhone,
    pickupLocation: state.bookingForm.pickupLocation,
    dropoffLocation: state.bookingForm.pickupLocation,
    startDate: state.bookingForm.startDate,
    endDate: state.bookingForm.endDate,
    signatureData: state.signatureDataUrl,
    docName: state.uploadedDocName,
    addOns: state.bookingForm.selectedAddons,
    promoCode: state.appliedPromo ? state.appliedPromo.code : ''
  };

  try {
    const res = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.success) {
      const b = data.data;

      document.getElementById('contractDate').textContent = new Date().toLocaleDateString('es-CL');
      document.getElementById('voucherCode').textContent = b.id;
      document.getElementById('voucherCarName').textContent = b.carName;
      document.getElementById('voucherCustName').textContent = b.customerName;
      document.getElementById('voucherCustRut').textContent = b.customerRut || 'N/A';
      document.getElementById('voucherDates').textContent = `${b.startDate} al ${b.endDate} (${b.totalDays} días)`;
      document.getElementById('voucherLocation').textContent = b.pickupLocation;
      document.getElementById('voucherTotal').textContent = formatPrice(b.totalPrice);

      const sigImg = document.getElementById('voucherSignatureImg');
      if (b.signatureData) {
        sigImg.src = b.signatureData;
        sigImg.style.display = 'block';
      } else {
        sigImg.style.display = 'none';
      }

      showToast('¡Reserva creada exitosamente!', 'fa-circle-check');
      switchBookingStep(4);
    } else {
      alert(`Error al realizar la reserva: ${data.message}`);
    }
  } catch (err) {
    alert('Ocurrió un error al conectar con el servidor de reservas.');
  } finally {
    btnConfirm.disabled = false;
    btnConfirm.innerHTML = `<i class="fa-solid fa-check-circle"></i> Confirmar Reserva & Pagar`;
  }
}

// Open My Bookings Lookup Modal
function openMyBookingsModal() {
  document.getElementById('myBookingsModal').classList.add('active');
}

async function lookupUserBookings() {
  const query = document.getElementById('lookupCodeInput').value.trim();
  const container = document.getElementById('myBookingsResultList');

  if (!query) {
    container.innerHTML = `<p style="color: var(--text-secondary);">Por favor, ingresa tu código de reserva o correo.</p>`;
    return;
  }

  container.innerHTML = `<p><i class="fa-solid fa-spinner fa-spin"></i> Buscando...</p>`;

  try {
    let url = `${API_BASE_URL}/bookings?search=${encodeURIComponent(query)}`;
    if (query.includes('@')) {
      url = `${API_BASE_URL}/bookings?email=${encodeURIComponent(query)}`;
    }

    const res = await fetch(url);
    const data = await res.json();

    if (data.success && data.data.length > 0) {
      container.innerHTML = data.data.map(b => `
        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); padding: 18px; border-radius: var(--radius-md); margin-bottom: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-weight: 800; color: var(--accent-gold);">${b.id}</span>
            <span class="badge ${b.status === 'Confirmed' ? 'badge-success' : 'badge-warning'}">${b.status}</span>
          </div>
          <h4 style="font-size: 16px;">${b.carName}</h4>
          <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">
            Cliente: ${b.customerName} (${b.customerRut || 'N/A'})
          </p>
          <p style="font-size: 13px; color: var(--text-secondary);">
            Fechas: ${b.startDate} al ${b.endDate} (${b.totalDays} días)
          </p>
          <p style="font-size: 13px; color: var(--accent-cyan); font-weight: 700; margin-top: 4px;">
            Total (IVA 19%): ${formatPrice(b.totalPrice)}
          </p>
          ${b.status !== 'Cancelled' ? `
            <button class="btn btn-secondary btn-sm btn-cancel-booking" data-id="${b.id}" style="margin-top: 10px; color: #ef4444; border-color: rgba(239,68,68,0.3);">
              Cancelar Reserva
            </button>
          ` : ''}
        </div>
      `).join('');

      document.querySelectorAll('.btn-cancel-booking').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          if (confirm(`¿Seguro que deseas cancelar la reserva ${id}?`)) {
            await fetch(`${API_BASE_URL}/bookings/${id}`, { method: 'DELETE' });
            lookupUserBookings();
            showToast(`Reserva ${id} cancelada`, 'fa-trash');
          }
        });
      });

    } else {
      container.innerHTML = `<p style="color: var(--text-secondary);">No se encontraron reservas registradas con esa información.</p>`;
    }
  } catch (err) {
    container.innerHTML = `<p style="color: var(--text-muted);">Error al realizar la búsqueda.</p>`;
  }
}

// Open Admin Modal
async function openAdminModal() {
  document.getElementById('adminModal').classList.add('active');
  await fetchAdminStats();
  await renderAdminCarsTable();
}

// Fetch Admin Stats
async function fetchAdminStats() {
  try {
    const res = await fetch(`${API_BASE_URL}/stats`);
    const data = await res.json();

    if (data.success) {
      const s = data.data;
      document.getElementById('statRevenue').textContent = formatPrice(s.totalRevenue);
      document.getElementById('statTotalCars').textContent = s.totalCars;
      document.getElementById('statActiveBookings').textContent = s.activeBookings;
      document.getElementById('statOccupancy').textContent = `${s.occupancyRate}%`;

      const bar = document.getElementById('statOccupancyBar');
      if (bar) bar.style.width = `${s.occupancyRate}%`;
    }
  } catch (err) {
    console.error('Error fetching stats:', err);
  }
}

// TAB 1: Render Admin Flota Table with Edit & Delete Buttons
async function renderAdminCarsTable() {
  await fetchCars();
  const tbody = document.getElementById('adminCarsTableBody');
  if (!tbody) return;

  tbody.innerHTML = state.cars.map(c => `
    <tr>
      <td style="display: flex; align-items: center; gap: 10px;">
        <img src="${c.image}" style="width: 45px; height: 30px; object-fit: cover; border-radius: 4px;" onerror="this.src='https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=200&q=80'">
        <div>
          <strong>${c.name}</strong>
          <div style="font-size: 11px; color: var(--text-muted);">${c.brand}</div>
        </div>
      </td>
      <td>${c.category}</td>
      <td style="color: var(--accent-gold); font-weight: 700;">$${c.pricePerDay} USD</td>
      <td style="color: var(--accent-cyan); font-weight: 700;">$${c.pricePerDayCLP ? c.pricePerDayCLP.toLocaleString('de-DE') : (c.pricePerDay * 950).toLocaleString('de-DE')} CLP</td>
      <td>${c.hp} HP</td>
      <td>
        <span class="badge ${c.status === 'available' ? 'badge-success' : 'badge-warning'}">
          ${c.status === 'available' ? 'Disponible' : 'Rentado'}
        </span>
      </td>
      <td>
        <div style="display: flex; gap: 6px;">
          <button class="btn btn-secondary btn-sm btn-edit-car" data-id="${c.id}" title="Editar Parámetros">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="btn btn-secondary btn-sm btn-delete-car" data-id="${c.id}" style="color: #ef4444;" title="Eliminar">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  document.querySelectorAll('.btn-edit-car').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      openEditCarModal(id);
    });
  });

  document.querySelectorAll('.btn-delete-car').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      if (confirm('¿Eliminar vehículo de la flota?')) {
        await fetch(`${API_BASE_URL}/cars/${id}`, { method: 'DELETE' });
        showToast('Vehículo eliminado', 'fa-trash');
        openAdminModal();
      }
    });
  });
}

// Open Edit Car Modal
function openEditCarModal(carId) {
  const car = state.cars.find(c => c.id === carId);
  if (!car) return;

  document.getElementById('editCarId').value = car.id;
  document.getElementById('editCarName').value = car.name;
  document.getElementById('editCarBrand').value = car.brand;
  document.getElementById('editCarCategory').value = car.category;
  document.getElementById('editCarPrice').value = car.pricePerDay;
  document.getElementById('editCarPriceCLP').value = car.pricePerDayCLP || (car.pricePerDay * 950);
  document.getElementById('editCarHp').value = car.hp;
  document.getElementById('editCarStatus').value = car.status || 'available';
  document.getElementById('editCarEngineSpecs').value = car.engineSpecs || '';
  document.getElementById('editCarImage').value = car.image;

  document.getElementById('editCarModal').classList.add('active');
}

// Handle Edit Car Submit (PUT /api/admin/cars/:id)
async function handleEditCarSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('editCarId').value;
  const name = document.getElementById('editCarName').value.trim();
  const brand = document.getElementById('editCarBrand').value.trim();
  const category = document.getElementById('editCarCategory').value;
  const pricePerDay = parseFloat(document.getElementById('editCarPrice').value);
  const pricePerDayCLP = parseFloat(document.getElementById('editCarPriceCLP').value);
  const hp = parseInt(document.getElementById('editCarHp').value);
  const status = document.getElementById('editCarStatus').value;
  const engineSpecs = document.getElementById('editCarEngineSpecs').value.trim();
  const image = document.getElementById('editCarImage').value.trim();

  try {
    const res = await fetch(`${API_BASE_URL}/admin/cars/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, brand, category, pricePerDay, pricePerDayCLP, hp, status, engineSpecs, image
      })
    });

    const data = await res.json();
    if (data.success) {
      showToast(`¡${name} actualizado con éxito!`, 'fa-floppy-disk');
      document.getElementById('editCarModal').classList.remove('active');
      fetchCars();
      renderAdminCarsTable();
    } else {
      alert(`Error: ${data.message}`);
    }
  } catch (err) {
    alert('Error al actualizar el vehículo.');
  }
}

// TAB 2: Render Admin Bookings Table
async function fetchAdminBookings() {
  const tbody = document.getElementById('adminBookingsTableBody');
  if (!tbody) return;

  try {
    const res = await fetch(`${API_BASE_URL}/bookings`);
    const data = await res.json();

    if (data.success) {
      state.adminBookings = data.data;

      tbody.innerHTML = data.data.map(b => `
        <tr>
          <td style="font-weight: 800; color: var(--accent-gold);">${b.id}</td>
          <td>
            <strong>${b.customerName}</strong>
            <div style="font-size: 11px; color: var(--accent-cyan);">RUT: ${b.customerRut || 'N/A'}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${b.customerEmail}</div>
          </td>
          <td>${b.carName}</td>
          <td style="font-size: 12px;">${b.startDate} → ${b.endDate}</td>
          <td style="color: var(--accent-cyan); font-weight: 700;">${formatPrice(b.totalPrice)}</td>
          <td>
            <select class="form-control status-select" data-id="${b.id}" style="padding: 4px 8px; font-size: 12px; width: auto;">
              <option value="Confirmed" ${b.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
              <option value="In Progress" ${b.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
              <option value="Completed" ${b.status === 'Completed' ? 'selected' : ''}>Completed</option>
              <option value="Cancelled" ${b.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </td>
          <td>
            <button class="btn btn-secondary btn-sm btn-save-status" data-id="${b.id}">
              <i class="fa-solid fa-floppy-disk"></i>
            </button>
          </td>
        </tr>
      `).join('');

      document.querySelectorAll('.btn-save-status').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          const select = document.querySelector(`.status-select[data-id="${id}"]`);
          const newStatus = select.value;

          await fetch(`${API_BASE_URL}/bookings/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
          });

          showToast(`Estado de la reserva ${id} actualizado`, 'fa-floppy-disk');
          fetchAdminStats();
        });
      });
    }
  } catch (err) {
    console.error('Error loading admin bookings:', err);
  }
}

// TAB 3: Admin Promos Manager
async function fetchAdminPromos() {
  const tbody = document.getElementById('adminPromosTableBody');
  if (!tbody) return;

  try {
    const res = await fetch(`${API_BASE_URL}/admin/promos`);
    const data = await res.json();
    if (data.success) {
      state.promos = data.data;
      tbody.innerHTML = data.data.map(p => `
        <tr>
          <td><strong style="color: var(--accent-gold);">${p.code}</strong></td>
          <td>${p.discountType === 'percentage' ? 'Porcentaje (%)' : 'Fijo ($)'}</td>
          <td><strong>${p.discountValue}${p.discountType === 'percentage' ? '%' : ' USD'}</strong></td>
          <td style="font-size: 13px; color: var(--text-secondary);">${p.description}</td>
          <td>
            <button class="btn btn-secondary btn-sm btn-delete-promo" data-code="${p.code}" style="color: #ef4444;">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>
      `).join('');

      tbody.querySelectorAll('.btn-delete-promo').forEach(btn => {
        btn.onclick = async (e) => {
          const code = e.currentTarget.getAttribute('data-code');
          if (confirm(`¿Eliminar cupón ${code}?`)) {
            await fetch(`${API_BASE_URL}/admin/promos/${code}`, { method: 'DELETE' });
            showToast(`Cupón ${code} eliminado`, 'fa-trash');
            fetchAdminPromos();
          }
        };
      });
    }
  } catch (err) {
    console.error('Error fetching promos:', err);
  }
}

async function handleAddPromoSubmit() {
  const code = document.getElementById('newPromoCode').value.trim();
  const value = document.getElementById('newPromoValue').value;
  const desc = document.getElementById('newPromoDesc').value.trim();

  if (!code || !value) {
    alert('Ingresa el código y el valor del descuento');
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/admin/promos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, discountType: 'percentage', discountValue: value, description: desc })
    });

    const data = await res.json();
    if (data.success) {
      showToast(`¡Cupón ${code} creado!`, 'fa-ticket');
      document.getElementById('newPromoCode').value = '';
      document.getElementById('newPromoValue').value = '';
      document.getElementById('newPromoDesc').value = '';
      fetchAdminPromos();
    }
  } catch (err) {
    alert('Error al crear el cupón.');
  }
}

// TAB 4: Admin Branches Manager
async function fetchAdminBranches() {
  const tbody = document.getElementById('adminBranchesTableBody');
  if (!tbody) return;

  await fetchBranches();
  tbody.innerHTML = state.branches.map(b => `
    <tr>
      <td><strong>${b.name}</strong></td>
      <td>${b.city}</td>
      <td style="font-size: 12px;">${b.address}</td>
      <td style="font-size: 12px; color: var(--accent-cyan);">${b.phone}</td>
      <td style="font-size: 12px;">${b.hours}</td>
      <td>
        <button class="btn btn-secondary btn-sm btn-delete-branch" data-id="${b.id}" style="color: #ef4444;">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.btn-delete-branch').forEach(btn => {
    btn.onclick = async (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      if (confirm('¿Eliminar sucursal?')) {
        await fetch(`${API_BASE_URL}/admin/branches/${id}`, { method: 'DELETE' });
        showToast('Sucursal eliminada', 'fa-trash');
        fetchAdminBranches();
      }
    };
  });
}

async function handleAddBranchSubmit() {
  const name = document.getElementById('newBranchName').value.trim();
  const city = document.getElementById('newBranchCity').value.trim();
  const address = document.getElementById('newBranchAddress').value.trim();
  const phone = document.getElementById('newBranchPhone').value.trim();
  const hours = document.getElementById('newBranchHours').value.trim();

  if (!name || !address) {
    alert('Ingresa el nombre y la dirección de la sucursal');
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/admin/branches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, city, address, phone, hours })
    });

    const data = await res.json();
    if (data.success) {
      showToast('¡Sucursal agregada con éxito!', 'fa-building-circle-check');
      document.getElementById('newBranchName').value = '';
      document.getElementById('newBranchCity').value = '';
      document.getElementById('newBranchAddress').value = '';
      document.getElementById('newBranchPhone').value = '';
      document.getElementById('newBranchHours').value = '';
      fetchAdminBranches();
    }
  } catch (err) {
    alert('Error al agregar sucursal.');
  }
}

// TAB 5: Admin CMS Site Settings Form Handler
function loadAdminSettingsForm() {
  const s = state.siteSettings;
  if (s.companyPhone) document.getElementById('setCompanyPhone').value = s.companyPhone;
  if (s.companyEmail) document.getElementById('setCompanyEmail').value = s.companyEmail;
  if (s.whatsappNumber) document.getElementById('setWhatsappNumber').value = s.whatsappNumber;
  if (s.vatRate) document.getElementById('setVatRate').value = s.vatRate;
  if (s.companyAddress) document.getElementById('setCompanyAddress').value = s.companyAddress;
}

async function handleSaveAdminSettings(e) {
  e.preventDefault();

  const companyPhone = document.getElementById('setCompanyPhone').value.trim();
  const companyEmail = document.getElementById('setCompanyEmail').value.trim();
  const whatsappNumber = document.getElementById('setWhatsappNumber').value.trim();
  const vatRate = parseFloat(document.getElementById('setVatRate').value);
  const companyAddress = document.getElementById('setCompanyAddress').value.trim();

  try {
    const res = await fetch(`${API_BASE_URL}/admin/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyPhone, companyEmail, whatsappNumber, vatRate, companyAddress })
    });

    const data = await res.json();
    if (data.success) {
      state.siteSettings = data.data;
      updateCmsUI(data.data);
      showToast('Configuración CMS guardada correctamente', 'fa-floppy-disk');
    }
  } catch (err) {
    alert('Error al guardar la configuración del sitio.');
  }
}

// Handle Add Car Form Submit (Admin)
async function handleAddCarSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('newCarName').value.trim();
  const brand = document.getElementById('newCarBrand').value.trim();
  const category = document.getElementById('newCarCategory').value;
  const pricePerDay = document.getElementById('newCarPrice').value;
  const hp = document.getElementById('newCarHp').value;
  const image = document.getElementById('newCarImage').value.trim();

  try {
    const res = await fetch(`${API_BASE_URL}/cars`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, brand, category, pricePerDay, hp, image })
    });

    const data = await res.json();
    if (data.success) {
      showToast('¡Vehículo publicado con éxito!', 'fa-circle-check');
      document.getElementById('addCarModal').classList.remove('active');
      document.getElementById('addCarForm').reset();
      openAdminModal();
    } else {
      alert(`Error: ${data.message}`);
    }
  } catch (err) {
    alert('Error al guardar el nuevo vehículo.');
  }
}
