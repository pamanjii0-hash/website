
// State & LocalStorage Keys
const DB = {
    users: JSON.parse(localStorage.getItem('manjii_users')) || [],
    products: JSON.parse(localStorage.getItem('manjii_products')) || [
        { id: 1, name: 'FREE FIRE MAX - VIP', price: 50000 },
        { id: 2, name: 'AUTO HEADSHOT SCRIPT', price: 100000 },
        { id: 3, name: 'BYPASS VVIP ANTI-BAN', price: 150000 }
    ],
    orders: JSON.parse(localStorage.getItem('manjii_orders')) || [],
    settings: JSON.parse(localStorage.getItem('manjii_settings')) || {
        title: 'MANJII OFFICIAL',
        desc: 'V1.0 ULTIMATE E-COMMERCE',
        news: 'Selamat datang! Sistem otomatis siap melayani Anda 24/7.',
        accent: '#a855f7'
    },
    chats: JSON.parse(localStorage.getItem('manjii_chats')) || []
};

let currentUser = JSON.parse(localStorage.getItem('manjii_current_user')) || null;
let currentCheckoutProduct = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    // Create Default Admin if not exists
    if (!DB.users.find(u => u.username === 'admin')) {
        DB.users.push({ username: 'admin', password: '123', role: 'admin' });
        saveDB();
    }

    applySettings();
    updateAuthUI();
    renderProducts();
    
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.currentTarget.getAttribute('data-target');
            navigateTo(target);
        });
    });

    // Theme Color Picker
    document.getElementById('color-picker').addEventListener('change', (e) => {
        DB.settings.accent = e.target.value;
        saveDB();
        applySettings();
    });

    // Auth Tabs
    document.getElementById('tab-login').addEventListener('click', () => switchAuthTab('login'));
    document.getElementById('tab-register').addEventListener('click', () => switchAuthTab('register'));

    // Auth Forms
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('btn-logout').addEventListener('click', handleLogout);

    // Checkout Form
    document.getElementById('checkout-form').addEventListener('submit', handleCheckout);
    document.getElementById('btn-confirm-payment').addEventListener('click', confirmPayment);

    // Admin Forms
    document.getElementById('add-product-form').addEventListener('submit', handleAddProduct);
    document.getElementById('settings-form').addEventListener('submit', handleUpdateSettings);

    // Chat
    document.getElementById('chat-toggle').addEventListener('click', toggleChat);
    document.getElementById('btn-send-chat').addEventListener('click', sendChat);
});

// --- CORE FUNCTIONS ---

function saveDB() {
    localStorage.setItem('manjii_users', JSON.stringify(DB.users));
    localStorage.setItem('manjii_products', JSON.stringify(DB.products));
    localStorage.setItem('manjii_orders', JSON.stringify(DB.orders));
    localStorage.setItem('manjii_settings', JSON.stringify(DB.settings));
    localStorage.setItem('manjii_chats', JSON.stringify(DB.chats));
}

function showLoading(callback) {
    const loader = document.getElementById('loading-screen');
    loader.classList.remove('hidden');
    setTimeout(() => {
        callback();
        loader.classList.add('hidden');
    }, 600); // 600ms loading effect
}

function navigateTo(pageId) {
    showLoading(() => {
        // Update Nav Active State
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        const btn = document.querySelector(`.nav-btn[data-target="${pageId}"]`);
        if(btn) btn.classList.add('active');

        // Update Pages
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(`page-${pageId}`).classList.add('active');

        // Specific Page Data Loading
        if (pageId === 'orders') renderUserOrders();
        if (pageId === 'admin') renderAdminPanel();
    });
}

function applySettings() {
    document.documentElement.style.setProperty('--accent-color', DB.settings.accent);
    document.getElementById('color-picker').value = DB.settings.accent;
    document.getElementById('site-title').innerText = DB.settings.title;
    document.getElementById('site-desc').innerText = DB.settings.desc;
    document.getElementById('about-text').innerText = DB.settings.desc;
    document.getElementById('news-container').innerText = DB.settings.news;
    document.getElementById('user-count').innerText = DB.users.length;
}

// --- AUTHENTICATION ---

function switchAuthTab(tab) {
    if(tab === 'login') {
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('register-form').classList.add('hidden');
        document.getElementById('tab-login').classList.add('active');
        document.getElementById('tab-register').classList.remove('active');
    } else {
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('register-form').classList.remove('hidden');
        document.getElementById('tab-login').classList.remove('active');
        document.getElementById('tab-register').classList.add('active');
    }
}

function handleLogin(e) {
    e.preventDefault();
    const user = document.getElementById('login-username').value;
    const pass = document.getElementById('login-password').value;
    
    const foundUser = DB.users.find(u => u.username === user && u.password === pass);
    if (foundUser) {
        currentUser = foundUser;
        localStorage.setItem('manjii_current_user', JSON.stringify(currentUser));
        updateAuthUI();
        showLoading(() => alert('Login Berhasil!'));
    } else {
        alert('Username atau Password salah!');
    }
}

function handleRegister(e) {
    e.preventDefault();
    const user = document.getElementById('reg-username').value;
    const pass = document.getElementById('reg-password').value;

    if (DB.users.find(u => u.username === user)) {
        alert('Username sudah terdaftar!');
        return;
    }

    DB.users.push({ username: user, password: pass, role: 'user' });
    saveDB();
    applySettings(); // update user count
    alert('Pendaftaran berhasil, silakan login.');
    switchAuthTab('login');
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('manjii_current_user');
    updateAuthUI();
    navigateTo('home');
}

function updateAuthUI() {
    if (currentUser) {
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('register-form').classList.add('hidden');
        document.querySelector('.auth-tabs').classList.add('hidden');
        document.getElementById('auth-user-info').classList.remove('hidden');
        document.getElementById('current-username-display').innerText = currentUser.username;
        
        document.getElementById('nav-orders').style.display = 'block';
        if (currentUser.role === 'admin') {
            document.getElementById('nav-admin').style.display = 'block';
        } else {
            document.getElementById('nav-admin').style.display = 'none';
        }
    } else {
        document.getElementById('login-form').classList.remove('hidden');
        document.querySelector('.auth-tabs').classList.remove('hidden');
        document.getElementById('auth-user-info').classList.add('hidden');
        document.getElementById('nav-orders').style.display = 'none';
        document.getElementById('nav-admin').style.display = 'none';
    }
}

// --- PRODUCTS & CHECKOUT ---

function renderProducts() {
    const container = document.getElementById('products-container');
    container.innerHTML = '';
    DB.products.forEach(prod => {
        container.innerHTML += `
            <div class="product-card">
                <div>
                    <div class="product-title">${prod.name}</div>
                    <div class="product-price">Rp ${prod.price.toLocaleString('id-ID')}</div>
                </div>
                <button class="glass-btn primary" onclick="buyProduct(${prod.id})">
                    <i class="fas fa-play"></i> BELI SEKARANG
                </button>
            </div>
        `;
    });
}

function buyProduct(id) {
    if (!currentUser) {
        alert('Silakan login terlebih dahulu untuk membeli produk.');
        navigateTo('auth');
        return;
    }
    const prod = DB.products.find(p => p.id === id);
    if (prod) {
        currentCheckoutProduct = prod;
        document.getElementById('checkout-product-name').innerText = prod.name;
        document.getElementById('checkout-product-price').innerText = prod.price.toLocaleString('id-ID');
        navigateTo('checkout');
    }
}

function handleCheckout(e) {
    e.preventDefault();
    navigateTo('payment'); // Go to QRIS page
}

function confirmPayment() {
    const uname = document.getElementById('co-username').value;
    const wa = document.getElementById('co-whatsapp').value;
    const type = document.getElementById('co-type').value;

    const newOrder = {
        id: 'ORD-' + Math.floor(Math.random() * 100000),
        buyer: currentUser.username,
        targetUser: uname,
        whatsapp: wa,
        notes: type,
        product: currentCheckoutProduct.name,
        status: 'pending',
        date: new Date().toISOString()
    };

    DB.orders.push(newOrder);
    saveDB();
    alert('Pembayaran sedang diproses, silakan tunggu konfirmasi Admin.');
    navigateTo('orders');
}

function renderUserOrders() {
    const tbody = document.getElementById('user-orders-table');
    tbody.innerHTML = '';
    const myOrders = DB.orders.filter(o => o.buyer === currentUser.username);
    
    if(myOrders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4">Belum ada pesanan.</td></tr>`;
        return;
    }

    myOrders.forEach(o => {
        const statusClass = o.status === 'pending' ? 'status-pending' : 'status-done';
        tbody.innerHTML += `
            <tr>
                <td>${o.id}</td>
                <td>${o.product}</td>
                <td>${o.targetUser}</td>
                <td><span class="status-badge ${statusClass}">${o.status.toUpperCase()}</span></td>
            </tr>
        `;
    });
}

// --- ADMIN PANEL ---

function renderAdminPanel() {
    // Orders
    const ordersTbody = document.getElementById('admin-orders-table');
    ordersTbody.innerHTML = '';
    DB.orders.forEach(o => {
        const statusClass = o.status === 'pending' ? 'status-pending' : 'status-done';
        const actionBtn = o.status === 'pending' 
            ? `<button class="glass-btn btn-sm primary" onclick="accOrder('${o.id}')">ACC (Done)</button>`
            : `<button class="glass-btn btn-sm" disabled>Selesai</button>`;
            
        ordersTbody.innerHTML += `
            <tr>
                <td>${o.buyer}</td>
                <td>${o.whatsapp}</td>
                <td>${o.product}</td>
                <td><span class="status-badge ${statusClass}">${o.status}</span></td>
                <td>${actionBtn}</td>
            </tr>
        `;
    });

    // Products
    const prodList = document.getElementById('admin-product-list');
    prodList.innerHTML = '';
    DB.products.forEach(p => {
        prodList.innerHTML += `
            <li>
                <span>${p.name} - Rp${p.price}</span>
                <button class="glass-btn btn-sm red" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
            </li>
        `;
    });

    // Settings Form
    document.getElementById('set-title').value = DB.settings.title;
    document.getElementById('set-desc').value = DB.settings.desc;
    document.getElementById('set-news').value = DB.settings.news;

    // Users
    const userList = document.getElementById('admin-user-list');
    userList.innerHTML = '';
    DB.users.forEach(u => {
        userList.innerHTML += `<li>${u.username} <span style="font-size:10px; color:gray;">[${u.role}]</span></li>`;
    });
}

function accOrder(id) {
    const order = DB.orders.find(o => o.id === id);
    if(order) {
        order.status = 'done';
        saveDB();
        renderAdminPanel();
    }
}

function handleAddProduct(e) {
    e.preventDefault();
    const name = document.getElementById('add-prod-name').value;
    const price = parseInt(document.getElementById('add-prod-price').value);
    
    DB.products.push({
        id: Date.now(),
        name: name,
        price: price
    });
    saveDB();
    renderProducts();
    renderAdminPanel();
    e.target.reset();
}

function deleteProduct(id) {
    DB.products = DB.products.filter(p => p.id !== id);
    saveDB();
    renderProducts();
    renderAdminPanel();
}

function handleUpdateSettings(e) {
    e.preventDefault();
    DB.settings.title = document.getElementById('set-title').value;
    DB.settings.desc = document.getElementById('set-desc').value;
    DB.settings.news = document.getElementById('set-news').value;
    saveDB();
    applySettings();
    alert('Pengaturan Website Berhasil Diupdate!');
}

// --- LIVE CHAT (MOCK) ---
function toggleChat() {
    const body = document.getElementById('chat-body');
    const icon = document.getElementById('chat-icon');
    body.classList.toggle('hidden');
    icon.className = body.classList.contains('hidden') ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
    if(!body.classList.contains('hidden')) renderChats();
}

function renderChats() {
    const container = document.getElementById('chat-messages');
    container.innerHTML = '<div class="msg bot">Halo! Ada yang bisa kami bantu?</div>';
    
    // Filter chats based on user context
    const visibleChats = DB.chats.filter(c => {
        if (!currentUser) return false;
        if (currentUser.role === 'admin') return true; // Admin sees all (simplified for demo)
        return c.sender === currentUser.username || c.to === currentUser.username;
    });

    visibleChats.forEach(c => {
        const isMe = currentUser && c.sender === currentUser.username;
        const msgClass = isMe ? 'user' : 'bot';
        const prefix = currentUser.role === 'admin' ? `[${c.sender}]: ` : '';
        container.innerHTML += `<div class="msg ${msgClass}">${prefix}${c.text}</div>`;
    });
    container.scrollTop = container.scrollHeight;
}

function sendChat() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if(!text) return;
    
    if(!currentUser) {
        alert('Silakan login untuk menggunakan live chat');
        return;
    }

    const newChat = {
        sender: currentUser.username,
        text: text,
        time: new Date().toISOString()
    };
    
    DB.chats.push(newChat);
    saveDB();
    input.value = '';
    renderChats();

    // Auto-reply mock if user sends message
    if(currentUser.role !== 'admin') {
        setTimeout(() => {
            DB.chats.push({
                sender: 'admin',
                to: currentUser.username,
                text: 'Terima kasih, pesan Anda telah diterima CS kami.',
                time: new Date().toISOString()
            });
            saveDB();
            renderChats();
        }, 1500);
    }
}
