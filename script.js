/* ============================================================
   EVERGREEN MARKET — script.js  (Enhanced Edition)
   ============================================================ */

/* ================================================================
   CART STATE
   ================================================================ */
let cart = []; // [{ name, price, emoji, qty }]

const cartCountEl      = document.getElementById('cartCount');
const cartDrawerCountEl= document.getElementById('cartDrawerCount');
const cartItemsEl      = document.getElementById('cartItems');
const cartEmptyEl      = document.getElementById('cartEmpty');
const cartFooterEl     = document.getElementById('cartFooter');
const cartSubtotalEl   = document.getElementById('cartSubtotal');
const toastEl          = document.getElementById('toast');
const toastMsgEl       = document.getElementById('toastMsg');
let toastTimer;

/* Get emoji from product card */
function getEmoji(card) {
  const imgEl = card.querySelector('.product-img, .deal-emoji');
  return imgEl ? imgEl.textContent.trim().slice(0, 2) : '🛒';
}

/* Add item to cart */
function addToCart(name, price, emoji) {
  const existing = cart.find(i => i.name === name);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ name, price: parseFloat(price), emoji, qty: 1 });
  }
  renderCart();
  showToast(`"${name}" added to cart`);
}

/* Remove item from cart */
function removeFromCart(name) {
  cart = cart.filter(i => i.name !== name);
  renderCart();
}

/* Change quantity */
function changeQty(name, delta) {
  const item = cart.find(i => i.name === name);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(name);
  else renderCart();
}

/* ================================================================
   PROMO CODE SYSTEM
   ================================================================ */
const PROMO_CODES = {
  'FRESH10':  { pct: 10, label: '10% off applied!' },
  'SPICE20':  { pct: 20, label: '20% off applied!' },
  'GRAIN15':  { pct: 15, label: '15% off applied!' },
};
let activePromo = null;

const promoInputEl  = document.getElementById('promoInput');
const promoApplyBtn = document.getElementById('promoApplyBtn');
const promoMsgEl    = document.getElementById('promoMsg');
const discountLine  = document.getElementById('discountLine');
const discountVal   = document.getElementById('discountVal');

if (promoApplyBtn) {
  promoApplyBtn.addEventListener('click', () => {
    const code = promoInputEl.value.trim().toUpperCase();
    if (PROMO_CODES[code]) {
      activePromo = PROMO_CODES[code];
      promoMsgEl.textContent = '✓ ' + activePromo.label;
      promoMsgEl.className = 'promo-msg success';
    } else {
      activePromo = null;
      promoMsgEl.textContent = '✗ Invalid promo code. Try FRESH10';
      promoMsgEl.className = 'promo-msg error';
    }
    renderCart();
  });
}

/* Render cart drawer */
function renderCart() {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = activePromo ? Math.round(subtotal * activePromo.pct / 100) : 0;
  const total = subtotal - discount;
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);

  // Badge
  if (totalQty > 0) {
    cartCountEl.textContent = totalQty;
    cartCountEl.classList.add('visible');
    cartDrawerCountEl.textContent = totalQty;
  } else {
    cartCountEl.classList.remove('visible');
    cartDrawerCountEl.textContent = '0';
  }

  // Items
  if (cart.length === 0) {
    cartEmptyEl.style.display = '';
    cartFooterEl.style.display = 'none';
    cartItemsEl.innerHTML = '';
    cartItemsEl.appendChild(cartEmptyEl);
    return;
  }

  cartEmptyEl.style.display = 'none';
  cartFooterEl.style.display = '';

  // Rebuild items
  const existingEmpty = cartItemsEl.querySelector('.cart-empty');
  cartItemsEl.innerHTML = '';
  if (existingEmpty) cartItemsEl.appendChild(existingEmpty);

  cart.forEach(item => {
    const el = document.createElement('div');
    el.className = 'cart-item';
    el.dataset.name = item.name;
    el.innerHTML = `
      <div class="cart-item-emoji">${item.emoji}</div>
      <div class="cart-item-details">
        <h4>${item.name}</h4>
        <span>₹${item.price.toFixed(0)} each</span>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn" data-action="dec" data-name="${item.name}">−</button>
        <span class="qty-val">${item.qty}</span>
        <button class="qty-btn" data-action="inc" data-name="${item.name}">+</button>
      </div>
      <div class="cart-item-price">₹${(item.price * item.qty).toFixed(0)}</div>
    `;
    cartItemsEl.appendChild(el);
  });

  cartSubtotalEl.textContent = `₹${subtotal.toFixed(0)}`;
  if (discount > 0 && discountLine && discountVal) {
    discountLine.style.display = 'flex';
    discountVal.textContent = `−₹${discount}`;
  } else if (discountLine) {
    discountLine.style.display = 'none';
  }
}

/* Qty button delegation */
cartItemsEl.addEventListener('click', e => {
  const btn = e.target.closest('.qty-btn');
  if (!btn) return;
  const name = btn.dataset.name;
  const action = btn.dataset.action;
  changeQty(name, action === 'inc' ? 1 : -1);
});

/* Clear cart */
document.getElementById('clearCartBtn').addEventListener('click', () => {
  cart = [];
  renderCart();
});

/* ================================================================
   CART DRAWER OPEN / CLOSE
   ================================================================ */
const cartDrawerEl = document.getElementById('cartDrawer');
const cartOverlayEl = document.getElementById('cartOverlay');
const cartCloseBtnEl = document.getElementById('cartCloseBtn');
const cartBtn = document.getElementById('cartBtn');

function openCart() {
  cartDrawerEl.classList.add('open');
  cartOverlayEl.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  cartDrawerEl.classList.remove('open');
  cartOverlayEl.classList.remove('active');
  document.body.style.overflow = '';
}

cartBtn.addEventListener('click', openCart);
cartCloseBtnEl.addEventListener('click', closeCart);
cartOverlayEl.addEventListener('click', closeCart);

/* ================================================================
   ADD-TO-CART BUTTONS (product cards)
   ================================================================ */
document.querySelectorAll('[data-add]').forEach(btn => {
  btn.addEventListener('click', () => {
    const card = btn.closest('[data-name]');
    if (!card) return;
    const name  = card.dataset.name;
    const price = card.dataset.price || '0';
    const emoji = getEmoji(card);

    // Button animation
    const orig = btn.textContent;
    btn.textContent = '✓';
    btn.style.background = 'var(--gold)';
    btn.style.color = 'var(--forest)';
    setTimeout(() => {
      btn.textContent = orig;
      btn.style.background = '';
      btn.style.color = '';
    }, 900);

    addToCart(name, price, emoji);
  });
});

/* ================================================================
   DEAL BUTTONS
   ================================================================ */
document.querySelectorAll('.deal-claim-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.deal-card');
    const name = card.querySelector('h3').textContent;
    const priceText = card.querySelector('.new').textContent.replace('₹', '').replace(',', '');
    const emoji = getEmoji(card);

    addToCart(name, priceText, emoji);

    btn.textContent = '✓ Claimed!';
    btn.style.background = 'var(--sage)';
    btn.style.color = 'var(--forest)';
    btn.disabled = true;
  });
});

/* ================================================================
   TOAST
   ================================================================ */
function showToast(msg) {
  toastMsgEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2800);
}

/* ================================================================
   DARK MODE TOGGLE
   ================================================================ */
const themeBtn = document.getElementById('themeBtn');
const html = document.documentElement;

// Load saved preference
const savedTheme = localStorage.getItem('eg-theme') || 'light';
html.setAttribute('data-theme', savedTheme);

themeBtn.addEventListener('click', () => {
  const isDark = html.getAttribute('data-theme') === 'dark';
  const next = isDark ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('eg-theme', next);
});

/* ================================================================
   SEARCH
   ================================================================ */
const searchToggleBtn   = document.getElementById('searchToggleBtn');
const searchBarWrap     = document.getElementById('searchBarWrap');
const searchInput       = document.getElementById('searchInput');
const searchClearBtn    = document.getElementById('searchClearBtn');
const searchResultsPanel= document.getElementById('searchResultsPanel');
const searchResultsGrid = document.getElementById('searchResultsGrid');
const searchNoResults   = document.getElementById('searchNoResults');

// Build search index from all product cards
const allProducts = [];
document.querySelectorAll('[data-name][data-price]').forEach(card => {
  allProducts.push({
    name:  card.dataset.name,
    price: card.dataset.price,
    emoji: getEmoji(card),
    category: card.dataset.category || '',
  });
});

function openSearch() {
  searchBarWrap.classList.add('open');
  searchInput.focus();
}
function closeSearch() {
  searchBarWrap.classList.remove('open');
  searchResultsPanel.classList.remove('open');
  searchInput.value = '';
  searchClearBtn.classList.remove('visible');
}

searchToggleBtn.addEventListener('click', () => {
  const isOpen = searchBarWrap.classList.contains('open');
  isOpen ? closeSearch() : openSearch();
});

searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim().toLowerCase();
  searchClearBtn.classList.toggle('visible', q.length > 0);

  if (!q) {
    searchResultsPanel.classList.remove('open');
    return;
  }

  const results = allProducts.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q)
  );

  searchResultsGrid.innerHTML = '';
  if (results.length === 0) {
    searchNoResults.style.display = '';
    searchResultsGrid.style.display = 'none';
  } else {
    searchNoResults.style.display = 'none';
    searchResultsGrid.style.display = '';
    results.forEach(p => {
      const el = document.createElement('div');
      el.className = 'search-result-card';
      el.innerHTML = `
        <div class="search-result-emoji">${p.emoji}</div>
        <div class="search-result-info">
          <h4>${p.name}</h4>
          <span>$${parseFloat(p.price).toFixed(2)}</span>
        </div>
      `;
      el.addEventListener('click', () => {
        addToCart(p.name, p.price, p.emoji);
        closeSearch();
        openCart();
      });
      searchResultsGrid.appendChild(el);
    });
  }
  searchResultsPanel.classList.add('open');
});

searchClearBtn.addEventListener('click', () => {
  searchInput.value = '';
  searchClearBtn.classList.remove('visible');
  searchResultsPanel.classList.remove('open');
  searchInput.focus();
});

// Close search on outside click
document.addEventListener('click', e => {
  if (!searchBarWrap.contains(e.target) &&
      !searchToggleBtn.contains(e.target) &&
      !searchResultsPanel.contains(e.target)) {
    closeSearch();
  }
});

// Close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeSearch();
});

/* ================================================================
   PRODUCT FILTER
   ================================================================ */
const filterBtns = document.querySelectorAll('.filter-btn');
const productCards = document.querySelectorAll('#productsGrid .product-card');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.dataset.filter;
    productCards.forEach(card => {
      if (filter === 'all' || card.dataset.category === filter) {
        card.classList.remove('hidden');
        // Re-trigger reveal animation
        card.classList.remove('visible');
        setTimeout(() => card.classList.add('visible'), 20);
      } else {
        card.classList.add('hidden');
      }
    });
  });
});

/* Category card click → filter */
document.querySelectorAll('.cat-card[data-filter]').forEach(card => {
  card.addEventListener('click', () => {
    const filter = card.dataset.filter;
    document.getElementById('best-sellers').scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
      filterBtns.forEach(b => b.classList.remove('active'));
      const matchBtn = document.querySelector(`.filter-btn[data-filter="${filter}"]`);
      if (matchBtn) matchBtn.classList.add('active');
      productCards.forEach(c => {
        if (c.dataset.category === filter) {
          c.classList.remove('hidden');
          c.classList.remove('visible');
          setTimeout(() => c.classList.add('visible'), 20);
        } else {
          c.classList.add('hidden');
        }
      });
    }, 600);
  });
});

/* ================================================================
   MOBILE MENU
   ================================================================ */
const menuBtn    = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');

menuBtn.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.contains('open');
  mobileMenu.classList.toggle('open', !isOpen);
  menuBtn.classList.toggle('open', !isOpen);
  menuBtn.setAttribute('aria-expanded', String(!isOpen));
});

mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    menuBtn.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
  });
});

/* ================================================================
   STICKY HEADER
   ================================================================ */
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

/* ================================================================
   SCROLL REVEAL
   ================================================================ */
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

revealEls.forEach(el => revealObserver.observe(el));

/* ================================================================
   COUNTDOWN TIMER
   ================================================================ */
function updateCountdown() {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const diff = end - now;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const pad = n => String(n).padStart(2, '0');
  const el = document.getElementById('countdown');
  if (el) el.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
}
updateCountdown();
setInterval(updateCountdown, 1000);

/* ================================================================
   CATEGORY CARD RIPPLE
   ================================================================ */
document.querySelectorAll('.cat-card').forEach(card => {
  card.addEventListener('click', e => {
    const ripple = document.createElement('span');
    const rect = card.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.8;
    ripple.style.cssText = `
      position:absolute;width:${size}px;height:${size}px;
      top:${e.clientY - rect.top - size / 2}px;
      left:${e.clientX - rect.left - size / 2}px;
      background:rgba(82,183,136,.18);border-radius:50%;
      transform:scale(0);animation:ripple .55s ease-out forwards;
      pointer-events:none;`;
    card.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
});

/* ================================================================
   PARALLAX BLOBS
   ================================================================ */
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  const b1 = document.querySelector('.blob-1');
  const b2 = document.querySelector('.blob-2');
  if (b1) b1.style.transform = `translateY(${y * 0.08}px)`;
  if (b2) b2.style.transform = `translateY(${-y * 0.06}px)`;
}, { passive: true });

/* ================================================================
   HERO TILT (desktop)
   ================================================================ */
const heroVisual = document.querySelector('.hero-visual');
if (heroVisual && window.innerWidth > 768) {
  document.addEventListener('mousemove', e => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const dx = (e.clientX - cx) / cx;
    const dy = (e.clientY - cy) / cy;
    heroVisual.style.transform = `perspective(900px) rotateY(${dx * 4}deg) rotateX(${-dy * 3}deg)`;
  });
}

/* ================================================================
   NEWSLETTER FORM
   ================================================================ */
document.getElementById('nlSubmitBtn').addEventListener('click', () => {
  const name  = document.getElementById('nlName').value.trim();
  const email = document.getElementById('nlEmail').value.trim();

  if (!name || !email || !email.includes('@')) {
    // Simple shake feedback
    const form = document.getElementById('newsletterForm');
    form.style.animation = 'none';
    form.offsetHeight; // reflow
    form.style.animation = 'shake .4s ease';
    return;
  }

  document.getElementById('newsletterForm').style.display = 'none';
  document.getElementById('nlSuccess').style.display = '';
  document.querySelector('.nl-disclaimer').style.display = 'none';
});

// Inject shake keyframe
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%       { transform: translateX(-8px); }
    40%       { transform: translateX(8px); }
    60%       { transform: translateX(-5px); }
    80%       { transform: translateX(5px); }
  }
`;
document.head.appendChild(shakeStyle);

/* ================================================================
   ORDER TRACKING
   ================================================================ */
const trackBtn = document.getElementById('trackBtn');
const trackResult = document.getElementById('trackResult');
if (trackBtn) {
  trackBtn.addEventListener('click', () => {
    const id = document.getElementById('trackInput').value.trim();
    if (id) {
      trackResult.style.display = 'block';
      trackResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
}

/* ================================================================
   INITIAL CART RENDER
   ================================================================ */
renderCart();
