// ============================================
// MJ POS - Supabase Database Helper
// ============================================

const SUPABASE_URL = 'https://puzqsuqouuofbwdarrax.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1enFzdXFvdXVvZmJ3ZGFycmF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjU5ODUsImV4cCI6MjA5NTcwMTk4NX0.4OFyoKKP0J0tD4B28C9SCZc6IF_kViItOtOLqH2051w';

const { createClient } = supabase;
const _db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// AUTH (PIN-based — no Supabase Auth needed)
// ============================================
const LOGIN_PIN = "1965";

function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (!isLoggedIn && currentPage !== 'login.html') {
        window.location.href = 'login.html';
    } else if (isLoggedIn && currentPage === 'login.html') {
        window.location.href = 'index.html';
    }
}

function logout() {
    sessionStorage.removeItem('isLoggedIn');
    window.location.href = 'login.html';
}

function login(pin) {
    if (pin === LOGIN_PIN) {
        sessionStorage.setItem('isLoggedIn', 'true');
        return true;
    }
    return false;
}

// ============================================
// INVENTORY
// ============================================
async function getInventory() {
    const { data, error } = await _db.from('inventory').select('*').order('name');
    if (error) { console.error('getInventory:', error.message); return []; }
    return data || [];
}

async function addInventoryItem(item) {
    const { data, error } = await _db
        .from('inventory')
        .insert([{ name: item.name, price: item.price, stock: item.stock, category: item.category }])
        .select()
        .single();
    if (error) { console.error('addInventoryItem:', error.message); return null; }
    return data;
}

async function updateInventoryItem(item) {
    const { error } = await _db
        .from('inventory')
        .update({ name: item.name, price: item.price, stock: item.stock, category: item.category })
        .eq('id', item.id);
    if (error) console.error('updateInventoryItem:', error.message);
}

async function deleteInventoryItem(id) {
    const { error } = await _db.from('inventory').delete().eq('id', id);
    if (error) console.error('deleteInventoryItem:', error.message);
}

async function updateInventoryStock(id, newStock) {
    const { error } = await _db.from('inventory').update({ stock: newStock }).eq('id', id);
    if (error) console.error('updateInventoryStock:', error.message);
}

// ============================================
// CATEGORIES
// ============================================
async function getCategories() {
    const { data, error } = await _db.from('categories').select('name').order('name');
    if (error) { console.error('getCategories:', error.message); return []; }
    return (data || []).map(row => row.name);
}

async function addCategory(name) {
    const { error } = await _db.from('categories').insert([{ name }]);
    if (error) { console.error('addCategory:', error.message); return false; }
    return true;
}

async function deleteCategory(name) {
    const { error } = await _db.from('categories').delete().eq('name', name);
    if (error) { console.error('deleteCategory:', error.message); return false; }
    return true;
}

// ============================================
// TRANSACTIONS
// ============================================
async function getTransactions() {
    const { data, error } = await _db
        .from('transactions')
        .select('*')
        .order('timestamp', { ascending: false });
    if (error) { console.error('getTransactions:', error.message); return []; }
    // Map DB snake_case columns → camelCase used in UI
    return (data || []).map(row => ({
        id: row.id,
        timestamp: row.timestamp,
        type: row.type,
        cashier: row.cashier,
        items: row.items,
        subtotal: row.subtotal,
        discount: row.discount,
        tax: row.tax,
        total: row.total,
        cashReceived: row.cash_received,
        change: row.change,
        mobileNumber: row.mobile_number,
        gcashAmount: row.gcash_amount,
        serviceFee: row.service_fee,
        totalHandedOut: row.total_handed_out,
        referenceNumber: row.reference_number
    }));
}

async function addTransaction(txData) {
    const { error } = await _db.from('transactions').insert([{
        id: txData.id,
        timestamp: txData.timestamp,
        type: txData.type || 'sales',
        cashier: txData.cashier,
        items: txData.items || null,
        subtotal: txData.subtotal || null,
        discount: txData.discount || null,
        tax: txData.tax || null,
        total: txData.total,
        cash_received: txData.cashReceived || null,
        change: txData.change || null,
        mobile_number: txData.mobileNumber || null,
        gcash_amount: txData.gcashAmount || null,
        service_fee: txData.serviceFee || null,
        total_handed_out: txData.totalHandedOut || null,
        reference_number: txData.referenceNumber || null
    }]);
    if (error) console.error('addTransaction:', error.message);
}

// ============================================
// STORE CONFIG
// ============================================
async function getConfig(key) {
    const { data, error } = await _db
        .from('store_config')
        .select('value')
        .eq('key', key)
        .single();
    if (error) return null;
    return data ? data.value : null;
}

async function setConfig(key, value) {
    const { error } = await _db
        .from('store_config')
        .upsert([{ key, value: String(value) }], { onConflict: 'key' });
    if (error) console.error('setConfig:', error.message);
}

// ============================================
// GCASH & CASH DRAWER BALANCE HELPERS
// ============================================
async function getGcashBalance() {
    const val = await getConfig('gcash_balance');
    return val !== null ? parseFloat(val) : 10000.00;
}

async function saveGcashBalance(bal) {
    await setConfig('gcash_balance', bal.toFixed(2));
}

async function getCashDrawerBalance() {
    const val = await getConfig('cash_drawer');
    return val !== null ? parseFloat(val) : 5000.00;
}

async function saveCashDrawerBalance(bal) {
    await setConfig('cash_drawer', bal.toFixed(2));
}
