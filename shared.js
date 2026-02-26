/* ============================================
   ZALO UTILITY - Shared Module
   Common utilities, constants, and helpers
   used by both popup.js and content.js
   ============================================ */

// ── HTML Sanitization ──
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ── Number Formatting ──
function formatCalcNumber(n) {
    if (typeof n === 'string') return n;
    if (isNaN(n) || !isFinite(n)) return 'Error';
    const str = parseFloat(n.toPrecision(10)).toString();
    return str.length > 14 ? n.toExponential(6) : str;
}

function formatCurrency(amount, currency) {
    try {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: currency === 'VND' ? 0 : 2,
            maximumFractionDigits: currency === 'VND' ? 0 : 4
        }).format(amount);
    } catch {
        return amount.toLocaleString('vi-VN') + ' ' + currency;
    }
}

// ── Clipboard ──
function copyToClipboard(text) {
    return navigator.clipboard.writeText(text).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
    });
}

// ── Currency API (unified endpoint) ──
const CURRENCY_API_BASE = 'https://open.er-api.com/v6/latest/';
const CURRENCY_CACHE_TTL = 3600000; // 1 hour

// ── Fetch with Timeout ──
function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { ...options, signal: controller.signal })
        .finally(() => clearTimeout(timer));
}

// Currency list with flags
const CURRENCY_LIST = [
    { code: 'USD', flag: '🇺🇸', name: 'USD' },
    { code: 'VND', flag: '🇻🇳', name: 'VND' },
    { code: 'EUR', flag: '🇪🇺', name: 'EUR' },
    { code: 'JPY', flag: '🇯🇵', name: 'JPY' },
    { code: 'KRW', flag: '🇰🇷', name: 'KRW' },
    { code: 'CNY', flag: '🇨🇳', name: 'CNY' },
    { code: 'GBP', flag: '🇬🇧', name: 'GBP' },
    { code: 'SGD', flag: '🇸🇬', name: 'SGD' },
    { code: 'THB', flag: '🇹🇭', name: 'THB' },
    { code: 'AUD', flag: '🇦🇺', name: 'AUD' },
    { code: 'CAD', flag: '🇨🇦', name: 'CAD' },
    { code: 'TWD', flag: '🇹🇼', name: 'TWD' },
];

// Default quick message templates
const DEFAULT_QM_TEMPLATES = {
    greeting: [
        { shortcut: '/chao', text: 'Xin chào! Mình có thể giúp gì cho bạn ạ?' },
        { shortcut: '/chaosang', text: 'Chào buổi sáng! Chúc bạn một ngày tốt lành!' },
        { shortcut: '/xinchao', text: 'Xin chào anh/chị! Rất vui được hỗ trợ ạ.' },
        { shortcut: '/hi', text: 'Hi bạn! Có gì mình giúp được không?' },
    ],
    business: [
        { shortcut: '/baogia', text: 'Dạ, em gửi anh/chị bảng báo giá chi tiết ạ. Anh/chị vui lòng xem và phản hồi giúp em nhé.' },
        { shortcut: '/henlich', text: 'Em xin hẹn lịch gặp mặt vào [ngày/giờ]. Anh/chị xác nhận giúp em ạ.' },
        { shortcut: '/xacnhan', text: 'Dạ, em xác nhận đã nhận được thông tin. Em sẽ xử lý và phản hồi sớm nhất ạ.' },
        { shortcut: '/donhang', text: 'Đơn hàng của anh/chị đã được xử lý. Mã đơn: [MÃ]. Dự kiến giao trong [X] ngày.' },
    ],
    support: [
        { shortcut: '/doixuly', text: 'Dạ, vấn đề của anh/chị đang được xử lý. Em sẽ cập nhật kết quả sớm nhất ạ.' },
        { shortcut: '/huongdan', text: 'Anh/chị vui lòng thực hiện theo các bước sau:\n1. \n2. \n3. \nNếu cần hỗ trợ thêm, anh/chị cứ nhắn em ạ.' },
        { shortcut: '/loi', text: 'Em rất xin lỗi về sự bất tiện này. Em sẽ kiểm tra và khắc phục ngay ạ.' },
        { shortcut: '/choxuly', text: 'Dạ, anh/chị vui lòng chờ em kiểm tra thông tin. Em sẽ phản hồi trong ít phút ạ.' },
    ],
    thanks: [
        { shortcut: '/camontl', text: 'Cảm ơn anh/chị đã liên hệ! Chúc anh/chị một ngày vui vẻ!' },
        { shortcut: '/camonmh', text: 'Cảm ơn anh/chị đã mua hàng! Nếu cần hỗ trợ gì thêm, anh/chị cứ nhắn em nhé.' },
        { shortcut: '/camondg', text: 'Cảm ơn anh/chị đã đánh giá! Phản hồi của anh/chị rất có giá trị với chúng em.' },
    ],
    custom: []
};

// Content script uses a flat list
const DEFAULT_QM_FLAT = [
    { shortcut: '/chao', text: 'Xin chào! Mình có thể giúp gì cho bạn ạ?' },
    { shortcut: '/cam on', text: 'Cảm ơn anh/chị đã liên hệ! Chúc anh/chị một ngày vui vẻ!' },
    { shortcut: '/xin loi', text: 'Em rất xin lỗi về sự bất tiện này. Em sẽ kiểm tra và khắc phục ngay ạ.' },
];

// ── Pomodoro State Management ──
const POMO_STORAGE_KEY = 'pomoState';
const POMO_SESSIONS_KEY = 'pomoSessions';

function savePomodoroState(state) {
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ [POMO_STORAGE_KEY]: state });
    }
}

function loadPomodoroState(callback) {
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get([POMO_STORAGE_KEY, POMO_SESSIONS_KEY], (r) => {
            callback(r[POMO_STORAGE_KEY] || null, r[POMO_SESSIONS_KEY] || 0);
        });
    } else {
        callback(null, 0);
    }
}

function savePomodoroSessions(count) {
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ [POMO_SESSIONS_KEY]: count });
    }
}

// ── Safe Math Parser (no eval — CSP-compliant) ──
function safeCalc(expr) {
    const tokens = expr.match(/(\d+\.?\d*|[+\-*/%()])/g);
    if (!tokens) return NaN;
    let pos = 0;
    function peek() { return tokens[pos]; }
    function next() { return tokens[pos++]; }
    function parseExpr() {
        let left = parseTerm();
        while (peek() === '+' || peek() === '-') {
            const op = next();
            const right = parseTerm();
            left = op === '+' ? left + right : left - right;
        }
        return left;
    }
    function parseTerm() {
        let left = parseFactor();
        while (peek() === '*' || peek() === '/' || peek() === '%') {
            const op = next();
            const right = parseFactor();
            if (op === '*') left *= right;
            else if (op === '/') { if (right === 0) return NaN; left /= right; }
            else left %= right;
        }
        return left;
    }
    function parseFactor() {
        if (peek() === '-') { next(); return -parseFactor(); }
        if (peek() === '(') { next(); const val = parseExpr(); next(); return val; }
        return parseFloat(next());
    }
    const result = parseExpr();
    return isNaN(result) || !isFinite(result) ? NaN : result;
}

// ── Donation Info (single source of truth) ──
const DONATE_INFO = {
    momo: '0976896621',
    bank: '0360126996868',
    holder: 'LE VAN AN',
    shopee: 'https://collshp.com/laptopleandotcom?view=storefront',
    author: 'Le Van An',
    brand: 'Vietnam IT',
    authorUrl: 'https://github.com/anlvdt'
};
