// script.js — full drop-in code (handles cart, storage, checkout redirect)
document.addEventListener('DOMContentLoaded', () => {
  const LOCAL_KEY = 'spiceaura_cart_v1';

  // Elements (robust lookups)
  const cartPopup = document.getElementById('cart-popup');
  const cartItemsContainer = document.getElementById('cart-items');
  const cartSubtotalEl = document.getElementById('cart-subtotal');
  const cartTotalEl = document.getElementById('cart-total');
  const cartCountEl = document.getElementById('cart-count');          // navbar count
  const cartItemCountEl = document.getElementById('cart-item-count'); // popup count
  const checkoutBtn = document.getElementById('checkout');           // popup Checkout button
  const viewCartBtn = document.getElementById('view-cart');          // optional
  const cartBtn = document.getElementById('cart-btn') || (cartCountEl ? cartCountEl.closest('button') : null);

  // All product buttons (class)
  const addButtons = document.querySelectorAll('.add-to-cart');

  // Load cart from localStorage (normalize keys)
  let cart = [];
  try {
    const saved = JSON.parse(localStorage.getItem(LOCAL_KEY));
    if (Array.isArray(saved)) {
      cart = saved.map(it => ({
        id: it.id ?? it.name ?? (Math.random().toString(36).slice(2)),
        name: it.name ?? it.productName ?? 'Product',
        price: Number(it.price ?? it.p ?? 0) || 0,
        image: it.image ?? it.imgSrc ?? '',
        qty: Number(it.qty ?? it.quantity ?? 1) || 1
      }));
    }
  } catch (err) {
    cart = [];
  }

  // Utility to parse price-like strings safely (not required if using data-price)
  function parsePrice(value) {
    if (value == null) return 0;
    const num = parseFloat(String(value).replace(/[^\d.]/g, ''));
    return Number.isFinite(num) ? num : 0;
  }

  // Add click listeners to Add-to-cart buttons
  addButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();

      const cardEl = btn.closest('.card');
      const id = btn.dataset.id || btn.dataset.name || (cardEl?.querySelector('.card-title')?.textContent?.trim()) || String(Date.now());
      const name = btn.dataset.name || cardEl?.querySelector('.card-title')?.textContent?.trim() || 'Product';
      const price = parsePrice(btn.dataset.price ?? cardEl?.querySelector('.card-price')?.textContent);
      const image = btn.dataset.image || cardEl?.querySelector('img')?.getAttribute('src') || '';

      const existing = cart.find(i => i.id === id);
      if (existing) existing.qty += 1;
      else cart.push({ id, name, price, image, qty: 1 });

      renderCart(); // updates UI and saves to localStorage
    });
  });

  // Save cart to localStorage
  function saveCartToStorage() {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(cart));
    } catch (err) {
      console.warn('Could not save cart', err);
    }
  }

  // Render cart inside popup
  function renderCart() {
    cartItemsContainer.innerHTML = '';
    let subtotal = 0, totalQty = 0;

    cart.forEach((item, index) => {
      subtotal += item.price * item.qty;
      totalQty += item.qty;

      const itemEl = document.createElement('div');
      itemEl.className = 'cart-item';
      itemEl.innerHTML = `
        <img src="${item.image}" alt="${escapeHtml(item.name)}" class="cart-img" onerror="this.style.display='none'"/>
        <div class="cart-info">
          <div class="cart-name">${escapeHtml(item.name)}</div>
          <div class="cart-price-small">₹${item.price.toFixed(2)} × ${item.qty}</div>
        </div>
        <div class="cart-right">
          <div class="cart-line-total">₹${(item.price * item.qty).toFixed(2)}</div>
          <div class="cart-controls">
            <button class="cart-decrease" data-index="${index}" aria-label="Decrease">−</button>
            <button class="cart-increase" data-index="${index}" aria-label="Increase">+</button>
            <button class="cart-remove" data-index="${index}" aria-label="Remove">✖</button>
          </div>
        </div>
      `;
      cartItemsContainer.appendChild(itemEl);
    });

    cartSubtotalEl.textContent = subtotal.toFixed(2);
    cartTotalEl.textContent = subtotal.toFixed(2);
    if (cartCountEl) cartCountEl.textContent = totalQty;
    if (cartItemCountEl) cartItemCountEl.textContent = `(${totalQty})`;

    // Controls (increase / decrease / remove)
    cartItemsContainer.querySelectorAll('.cart-increase').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.index);
        cart[idx].qty += 1;
        renderCart();
      });
    });
    cartItemsContainer.querySelectorAll('.cart-decrease').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.index);
        if (cart[idx].qty > 1) cart[idx].qty -= 1;
        else cart.splice(idx, 1);
        renderCart();
      });
    });
    cartItemsContainer.querySelectorAll('.cart-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.index);
        cart.splice(idx, 1);
        renderCart();
      });
    });

    saveCartToStorage();
  }

  // Toggle popup via cart button
  if (cartBtn) {
    cartBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      cartPopup.style.display = (cartPopup.style.display === 'block') ? 'none' : 'block';
    });
  }

  // Close popup when clicking outside
  document.addEventListener('click', (e) => {
    const clickedInside = cartPopup && cartPopup.contains(e.target);
    const clickedCartBtn = cartBtn && cartBtn.contains(e.target);
    if (!clickedInside && !clickedCartBtn) cartPopup.style.display = 'none';
  });

  // Checkout: save cart and redirect to checkout page
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (!cart.length) return alert('Your cart is empty.');
      saveCartToStorage();
      window.location.href = 'checkout.html';
    });
  }

  // Optional View Cart button - just opens the popup larger (or could redirect)
  if (viewCartBtn) {
    viewCartBtn.addEventListener('click', () => {
      cartPopup.style.display = 'block';
      // could also redirect to a full cart page if you create one
    });
  }

  // Small helper to escape HTML
  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  // initial render on page load
  renderCart();
});



