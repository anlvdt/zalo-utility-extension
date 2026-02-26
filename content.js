/* ============================================
   ZALO UTILITY - Content Script for chat.zalo.me
   Inline floating panel with quick tools
   ============================================ */

(function () {
    'use strict';

    // escapeHtml, safeCalc, formatCalcNumber, copyToClipboard,
    // CURRENCY_API_BASE, DONATE_INFO, etc. provided by shared.js

    // ── Listen for paste commands from popup/background ──
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'PASTE_TEXT') {
                try {
                    const success = pasteToZaloInput(message.text);
                    sendResponse({ success });
                } catch (err) {
                    sendResponse({ success: false, error: err.message });
                }
            }
        });
    }

    function pasteToZaloInput(text) {
        const selectors = [
            '#input_text',
            '[id*="richInput"]',
            '.chat-input [contenteditable="true"]',
            '.input-container [contenteditable="true"]',
            'div[data-contents="true"]',
            '[contenteditable="true"][role="textbox"]',
            '.DraftEditor-root [contenteditable="true"]',
            '[contenteditable="true"]',
        ];
        let input = null;
        for (const sel of selectors) {
            const els = document.querySelectorAll(sel);
            for (const el of els) {
                // Pick the visible one in the chat area (not hidden or in our panel)
                if (el.offsetParent && !el.closest('#zu-fab-root')) {
                    input = el;
                    break;
                }
            }
            if (input) break;
        }
        if (!input) return false;
        input.focus();

        // Method 1: execCommand (legacy but still works in some browsers)
        const inserted = document.execCommand('insertText', false, text);
        if (inserted) return true;

        // Method 2: InputEvent (modern approach for contenteditable)
        try {
            const ev = new InputEvent('beforeinput', {
                inputType: 'insertText',
                data: text,
                bubbles: true,
                cancelable: true,
            });
            input.dispatchEvent(ev);
            // Manually insert if contentEditable
            if (input.isContentEditable) {
                const sel = window.getSelection();
                if (sel.rangeCount) {
                    const range = sel.getRangeAt(0);
                    range.deleteContents();
                    range.insertNode(document.createTextNode(text));
                    range.collapse(false);
                }
            } else {
                input.value += text;
            }
            input.dispatchEvent(new Event('input', { bubbles: true }));
            return true;
        } catch (e) { }

        return false;
    }

    // ══════════════════════════════════════
    //  FLOATING ACTION BUTTON + INLINE PANEL
    // ══════════════════════════════════════

    // Quick message defaults — use shared constant (single source of truth)
    const defaultTemplates = typeof DEFAULT_QM_FLAT !== 'undefined' ? DEFAULT_QM_FLAT : [];
    let customTemplates = [];
    function getAllTemplates() { return [...defaultTemplates, ...customTemplates]; }

    function createFAB() {
        if (document.getElementById('zu-fab-root')) return;

        // ── Create container ──
        const root = document.createElement('div');
        root.id = 'zu-fab-root';

        // ── Theme Detection: auto dark/light matching Zalo ──
        function detectZaloTheme() {
            const body = document.body;
            const html = document.documentElement;
            // Check Zalo's own dark mode class indicators
            const hasDarkClass =
                body.classList.contains('dark') ||
                body.classList.contains('dark-mode') ||
                body.classList.contains('theme-dark') ||
                html.classList.contains('dark') ||
                html.getAttribute('data-theme') === 'dark' ||
                body.getAttribute('data-theme') === 'dark';
            // Check actual background luminance — walk up if transparent
            let hasDarkBg = false;
            for (const el of [body, html]) {
                const bg = getComputedStyle(el).backgroundColor;
                const m = bg.match(/[\d.]+/g);
                if (m && m.length >= 3) {
                    // Skip transparent backgrounds (alpha = 0)
                    if (m.length >= 4 && parseFloat(m[3]) === 0) continue;
                    // Skip rgb(0,0,0) which is browser default for unset
                    if (+m[0] === 0 && +m[1] === 0 && +m[2] === 0 && m.length === 3) continue;
                    const lum = (0.299 * +m[0] + 0.587 * +m[1] + 0.114 * +m[2]) / 255;
                    hasDarkBg = lum < 0.4;
                    break;
                }
            }
            root.classList.toggle('zu-dark', hasDarkClass || hasDarkBg);
        }
        detectZaloTheme();

        // Re-detect when Zalo changes theme
        const themeObserver = new MutationObserver(detectZaloTheme);
        themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] });
        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', detectZaloTheme);

        // SVG icon definitions (reusable)
        const icons = {
            zap: '<svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
            close: '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
            message: '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
            hash: '<svg viewBox="0 0 24 24"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>',
            globe: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
            search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
            clipboard: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
            swap: '<svg viewBox="0 0 24 24"><path d="M7 16l-4-4 4-4"/><path d="M17 8l4 4-4 4"/><line x1="3" y1="12" x2="21" y2="12"/></svg>',
            backspace: '<svg viewBox="0 0 24 24"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/></svg>',
            timer: '<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3l2 2"/><path d="M19 3l-2 2"/><line x1="12" y1="2" x2="12" y2="5"/></svg>',
            play: '<svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
            pause: '<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>',
            reset: '<svg viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>',
            heart: '<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
            eye: '<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
            eyeOff: '<svg viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>',
            currency: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M16 8h-4a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4H8"/><line x1="12" y1="6" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="18"/></svg>',
            news: '<svg viewBox="0 0 24 24"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9h4"/><line x1="10" y1="6" x2="18" y2="6"/><line x1="10" y1="10" x2="18" y2="10"/><line x1="10" y1="14" x2="14" y2="14"/></svg>',
        };

        root.innerHTML = `
      <!-- FAB Button -->
      <div id="zu-fab" title="Zalo Utility - Nhấn để mở tiện ích">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2"/>
          <line x1="8" y1="6" x2="16" y2="6"/>
          <circle cx="9" cy="10" r="1" fill="white"/>
          <circle cx="15" cy="10" r="1" fill="white"/>
          <circle cx="9" cy="14" r="1" fill="white"/>
          <circle cx="15" cy="14" r="1" fill="white"/>
          <line x1="8" y1="18" x2="16" y2="18"/>
        </svg>
        <span class="zu-fab-badge zu-hidden" id="zu-fab-badge"></span>
      </div>

      <!-- Inline Panel -->
      <div id="zu-panel" class="zu-hidden">
        <div class="zu-panel-header">
          <span class="zu-panel-title">${icons.zap} Zalo Utility</span>
          <div class="zu-header-actions">
            <button class="zu-blur-toggle" id="zu-shortcuts-btn" aria-label="Phím tắt" title="Phím tắt" style="font-size:14px;font-weight:700">?</button>
            <button class="zu-blur-toggle" id="zu-blur-toggle" aria-label="Privacy Blur (Alt+B)" title="Chế độ ẩn chat (Alt+B)">${icons.eye}</button>
            <button class="zu-panel-close" id="zu-close" aria-label="Đóng">${icons.close}</button>
          </div>
        </div>

        <!-- Mini Tab Bar -->
        <div class="zu-tabs-wrap">
          <div class="zu-tabs" id="zu-tabs">
            <button class="zu-tab active" data-panel="qm">${icons.message} Tin nhắn nhanh</button>
            <button class="zu-tab" data-panel="news">${icons.news} Tin tức</button>
            <button class="zu-tab" data-panel="currency">${icons.currency} Thị trường</button>
            <button class="zu-tab" data-panel="calc">${icons.hash} Máy tính</button>
            <button class="zu-tab" data-panel="trans">${icons.globe} Dịch</button>
            <button class="zu-tab" data-panel="pomo">${icons.timer} Pomodoro</button>
            <button class="zu-tab" data-panel="donate">${icons.heart} Ủng hộ</button>
          </div>
          <button class="zu-tabs-scroll-hint" id="zu-tabs-hint" title="Cuộn để xem thêm">›</button>
        </div>

        <!-- Quick Messages Panel -->
        <div class="zu-panel-body active" id="zu-body-qm">
          <div class="zu-search-wrap">
            ${icons.search}
            <input type="text" class="zu-search" id="zu-qm-search" placeholder="Tìm hoặc gõ /shortcut...">
          </div>
          <div class="zu-qm-list" id="zu-qm-list"></div>
          <button class="zu-qm-add-btn" id="zu-qm-add-btn">+ Thêm tin nhắn mẫu</button>
          <div class="zu-qm-add-form zu-hidden" id="zu-qm-add-form">
            <input type="text" class="zu-qm-input" id="zu-qm-new-sc" placeholder="Shortcut (vd: /hello)">
            <textarea class="zu-qm-input" id="zu-qm-new-tx" placeholder="Nội dung tin nhắn..." rows="2"></textarea>
            <button class="zu-qm-save" id="zu-qm-save">Lưu</button>
          </div>
        </div>

        <!-- News Panel -->
        <div class="zu-panel-body" id="zu-body-news">
          <div class="zu-news-header">
            <select id="zu-news-cat" class="zu-news-cat-sel">
              <option value="tin-noi-bat">Nổi bật</option>
              <option value="the-gioi">Thế giới</option>
              <option value="kinh-doanh">Kinh doanh</option>
              <option value="khoa-hoc-cong-nghe">Công nghệ</option>
              <option value="the-thao">Thể thao</option>
              <option value="giai-tri">Giải trí</option>
              <option value="suc-khoe">Sức khỏe</option>
            </select>
            <button class="zu-news-refresh" id="zu-news-refresh" title="Làm mới">${icons.reset}</button>
          </div>
          <div class="zu-news-list" id="zu-news-list">
            <div class="zu-news-loading">Đang tải tin...</div>
          </div>
          <div class="zu-news-footer">VnExpress · Tuổi Trẻ · Thanh Niên · Dân Trí</div>
        </div>

        <!-- Calculator Panel -->
        <div class="zu-panel-body" id="zu-body-calc">
          <div class="zu-calc-expr" id="zu-calc-expr"></div>
          <div class="zu-calc-display" id="zu-calc-display">0</div>
          <div class="zu-calc-grid">
            <button class="zu-calc-btn fn" data-a="C">C</button>
            <button class="zu-calc-btn fn" data-a="back">&#9003;</button>
            <button class="zu-calc-btn fn" data-a="%">%</button>
            <button class="zu-calc-btn op" data-a="/">÷</button>
            <button class="zu-calc-btn" data-a="7">7</button>
            <button class="zu-calc-btn" data-a="8">8</button>
            <button class="zu-calc-btn" data-a="9">9</button>
            <button class="zu-calc-btn op" data-a="*">×</button>
            <button class="zu-calc-btn" data-a="4">4</button>
            <button class="zu-calc-btn" data-a="5">5</button>
            <button class="zu-calc-btn" data-a="6">6</button>
            <button class="zu-calc-btn op" data-a="-">−</button>
            <button class="zu-calc-btn" data-a="1">1</button>
            <button class="zu-calc-btn" data-a="2">2</button>
            <button class="zu-calc-btn" data-a="3">3</button>
            <button class="zu-calc-btn op" data-a="+">+</button>
            <button class="zu-calc-btn" data-a="0" style="grid-column:span 2">0</button>
            <button class="zu-calc-btn" data-a=".">.</button>
            <button class="zu-calc-btn eq" data-a="=">=</button>
          </div>
          <button class="zu-calc-paste" id="zu-calc-paste">${icons.clipboard} Copy phép tính vào chat</button>
        </div>

        <!-- Currency Panel -->
        <div class="zu-panel-body" id="zu-body-currency">
          <div class="zu-currency-rates-label">
            Tỉ giá Vietcombank (Mua CK / Bán)
            <button class="zu-rates-refresh" id="zu-rates-refresh" title="Làm mới">${icons.reset}</button>
          </div>
          <div class="zu-currency-rates" id="zu-currency-rates">
            <div class="zu-currency-loading">Đang tải...</div>
          </div>
          <div class="zu-rates-updated" id="zu-rates-updated"></div>
          <div class="zu-currency-rates-label">Vàng & Hàng hóa</div>
          <div class="zu-currency-rates" id="zu-gold-prices">
            <div class="zu-currency-loading">Đang tải...</div>
          </div>
          <button class="zu-collapse-toggle" id="zu-converter-toggle">▶ Quy đổi tiền tệ</button>
          <div class="zu-collapse-body zu-hidden" id="zu-converter-body">
            <div class="zu-currency-card">
              <label class="zu-currency-label">Số tiền</label>
              <input type="number" id="zu-currency-amount" class="zu-currency-input" value="1" min="0" step="any">
            </div>
            <div class="zu-currency-pair">
              <div class="zu-currency-sel-wrap">
                <label class="zu-currency-label">Từ</label>
                <select id="zu-currency-from" class="zu-currency-sel">
                  <option value="USD">USD</option>
                  <option value="VND">VND</option>
                  <option value="EUR">EUR</option>
                  <option value="JPY">JPY</option>
                  <option value="KRW">KRW</option>
                  <option value="CNY">CNY</option>
                  <option value="GBP">GBP</option>
                  <option value="SGD">SGD</option>
                  <option value="THB">THB</option>
                </select>
              </div>
              <button class="zu-currency-swap" id="zu-currency-swap">${icons.swap}</button>
              <div class="zu-currency-sel-wrap">
                <label class="zu-currency-label">Sang</label>
                <select id="zu-currency-to" class="zu-currency-sel">
                  <option value="VND">VND</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="JPY">JPY</option>
                  <option value="KRW">KRW</option>
                  <option value="CNY">CNY</option>
                  <option value="GBP">GBP</option>
                  <option value="SGD">SGD</option>
                  <option value="THB">THB</option>
                </select>
              </div>
            </div>
            <div class="zu-currency-result" id="zu-currency-result">
              <div class="zu-currency-result-amount" id="zu-currency-result-amount">—</div>
              <div class="zu-currency-rate-info" id="zu-currency-rate-info"></div>
            </div>
            <div class="zu-currency-status" id="zu-currency-status"></div>
          </div>
          <div class="zu-news-footer">Nguồn: Vietcombank · Vàng: GoldPrice.org</div>
        </div>

        <!-- Translate Panel -->
        <div class="zu-panel-body" id="zu-body-trans">
          <div class="zu-trans-langs">
            <select id="zu-trans-from" class="zu-trans-sel">
              <option value="auto">Tự nhận diện</option>
              <option value="vi">VI - Tiếng Việt</option>
              <option value="en">EN - English</option>
              <option value="zh">ZH - 中文</option>
              <option value="ja">JA - 日本語</option>
              <option value="ko">KO - 한국어</option>
            </select>
            <button class="zu-trans-swap" id="zu-trans-swap" aria-label="Hoán đổi">${icons.swap}</button>
            <select id="zu-trans-to" class="zu-trans-sel">
              <option value="en">EN - English</option>
              <option value="vi">VI - Tiếng Việt</option>
              <option value="zh">ZH - 中文</option>
              <option value="ja">JA - 日本語</option>
              <option value="ko">KO - 한국어</option>
            </select>
          </div>
          <textarea id="zu-trans-input" class="zu-trans-input" placeholder="Nhập text cần dịch..." rows="2"></textarea>
          <button class="zu-trans-btn" id="zu-trans-go">Dịch</button>
          <div class="zu-trans-result zu-hidden" id="zu-trans-result"></div>
          <button class="zu-trans-paste zu-hidden" id="zu-trans-paste">${icons.clipboard} Paste bản dịch vào chat</button>
        </div>

        <!-- Pomodoro Panel -->
        <div class="zu-panel-body" id="zu-body-pomo">
          <div class="zu-pomo-timer">
            <svg class="zu-pomo-ring" viewBox="0 0 120 120">
              <circle class="zu-pomo-ring-bg" cx="60" cy="60" r="52"/>
              <circle class="zu-pomo-ring-progress" id="zu-pomo-progress" cx="60" cy="60" r="52"/>
            </svg>
            <div class="zu-pomo-time" id="zu-pomo-time">25:00</div>
            <div class="zu-pomo-label" id="zu-pomo-label">Làm việc</div>
          </div>
          <div class="zu-pomo-controls">
            <button class="zu-pomo-btn zu-pomo-start" id="zu-pomo-start" aria-label="Bắt đầu">${icons.play}</button>
            <button class="zu-pomo-btn zu-pomo-reset" id="zu-pomo-reset" aria-label="Reset">${icons.reset}</button>
          </div>
          <div class="zu-pomo-settings">
            <div class="zu-pomo-setting">
              <label>Làm việc</label>
              <select id="zu-pomo-work" class="zu-pomo-sel">
                <option value="25">25 phút</option>
                <option value="30">30 phút</option>
                <option value="45">45 phút</option>
                <option value="50">50 phút</option>
              </select>
            </div>
            <div class="zu-pomo-setting">
              <label>Nghỉ</label>
              <select id="zu-pomo-break" class="zu-pomo-sel">
                <option value="5">5 phút</option>
                <option value="10">10 phút</option>
                <option value="15">15 phút</option>
              </select>
            </div>
          </div>
          <div class="zu-pomo-sessions" id="zu-pomo-sessions">Hoàn thành: 0 phiên</div>
        </div>

        <!-- Donate Panel -->
        <div class="zu-panel-body" id="zu-body-donate">
          <div class="zu-donate-header">Ủng hộ tác giả</div>
          <p class="zu-donate-desc">Nếu bạn thấy tiện ích này hữu ích, hãy cân nhắc ủng hộ tác giả!</p>
          <div class="zu-donate-methods">
            <div class="zu-donate-method">
              <span class="zu-donate-label">Momo:</span>
              <span class="zu-donate-value" id="zu-donate-momo">0976896621</span>
              <button class="zu-donate-copy" data-copy="0976896621">Copy</button>
            </div>
            <div class="zu-donate-method">
              <span class="zu-donate-label">MB Bank:</span>
              <span class="zu-donate-value" id="zu-donate-bank">0360126996868</span>
              <button class="zu-donate-copy" data-copy="0360126996868">Copy</button>
            </div>
            <div class="zu-donate-holder">LE VAN AN</div>
          </div>
          <div class="zu-donate-links">
            <a href="https://collshp.com/laptopleandotcom?view=storefront" target="_blank" rel="noopener" class="zu-donate-link zu-donate-shopee">Shopee Affiliate</a>
          </div>
          <div class="zu-donate-footer">by Le Van An (Vietnam IT)</div>
        </div>
      </div>
    `;

        document.body.appendChild(root);

        // ── State ──
        let panelOpen = false;

        // ── Toggle panel ──
        const fab = document.getElementById('zu-fab');
        const panel = document.getElementById('zu-panel');
        const closeBtn = document.getElementById('zu-close');

        fab.addEventListener('click', () => {
            panelOpen = !panelOpen;
            panel.classList.toggle('zu-hidden', !panelOpen);
            fab.classList.toggle('zu-active', panelOpen);
        });

        // Q2: Escape to close panel
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && panelOpen) {
                panelOpen = false;
                panel.classList.add('zu-hidden');
                fab.classList.remove('zu-active');
            }
        });

        closeBtn.addEventListener('click', () => {
            panelOpen = false;
            panel.classList.add('zu-hidden');
            fab.classList.remove('zu-active');
        });

        // ══════════════════════
        //  PRIVACY BLUR (Alt+B)
        // ══════════════════════
        let blurActive = false;
        const blurToggleBtn = document.getElementById('zu-blur-toggle');
        const blurStyleId = 'zu-privacy-blur-style';

        const blurCSS = `
            /* Privacy Blur — hide chat content */
            .chat-message .chat-content-wrapper,
            .chat-message .msg-content,
            .chat-message .chat-image,
            .chat-message .chat-video,
            .chat-message .file-card,
            .conv-chat-content,
            [class*="message-"] [class*="content"],
            [class*="msg-"] [class*="text"],
            [class*="chat-content"],
            .message-view__content,
            .chat-item__content,
            .message-in .bubble,
            .message-out .bubble,
            .bubble-content,
            .message__content {
                filter: blur(6px) !important;
                transition: filter 200ms ease !important;
                cursor: pointer !important;
            }
            .chat-message .chat-content-wrapper:hover,
            .chat-message .msg-content:hover,
            .chat-message .chat-image:hover,
            .chat-message .chat-video:hover,
            .chat-message .file-card:hover,
            .conv-chat-content:hover,
            [class*="message-"] [class*="content"]:hover,
            [class*="msg-"] [class*="text"]:hover,
            [class*="chat-content"]:hover,
            .message-view__content:hover,
            .chat-item__content:hover,
            .message-in .bubble:hover,
            .message-out .bubble:hover,
            .bubble-content:hover,
            .message__content:hover {
                filter: blur(0) !important;
            }
            /* Also blur contact/group names in sidebar */
            .conv-item .conv-item__content .truncate,
            .conv-item .conv-last-msg,
            [class*="conv-"] [class*="name"],
            [class*="conv-"] [class*="msg"] {
                filter: blur(4px) !important;
                transition: filter 200ms ease !important;
            }
            [class*="conv-"] [class*="name"]:hover,
            [class*="conv-"] [class*="msg"]:hover,
            .conv-item .conv-item__content .truncate:hover,
            .conv-item .conv-last-msg:hover {
                filter: blur(0) !important;
            }
        `;

        function toggleBlur(forceState) {
            blurActive = forceState !== undefined ? forceState : !blurActive;
            let styleEl = document.getElementById(blurStyleId);

            if (blurActive) {
                if (!styleEl) {
                    styleEl = document.createElement('style');
                    styleEl.id = blurStyleId;
                    styleEl.textContent = blurCSS;
                    document.head.appendChild(styleEl);
                }
                blurToggleBtn.innerHTML = icons.eyeOff;
                blurToggleBtn.classList.add('zu-blur-on');
                fab.style.background = '#FF3B30';
                showZuToast('Privacy Blur: ON — hover để xem');
            } else {
                if (styleEl) styleEl.remove();
                blurToggleBtn.innerHTML = icons.eye;
                blurToggleBtn.classList.remove('zu-blur-on');
                fab.style.background = '#0068FF';
                showZuToast('Privacy Blur: OFF');
            }

            // Persist
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.local.set({ zuBlurActive: blurActive });
            }
        }

        blurToggleBtn.addEventListener('click', () => toggleBlur());

        // Alt+B shortcut (works even when panel is closed)
        document.addEventListener('keydown', (e) => {
            if (e.altKey && (e.key === 'b' || e.key === 'B')) {
                e.preventDefault();
                toggleBlur();
            }
        });

        // Restore blur state from storage
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get('zuBlurActive', (r) => {
                if (r.zuBlurActive) toggleBlur(true);
            });
        }

        // ══════════════════════
        //  SHORTCUTS PANEL (?)
        // ══════════════════════
        const shortcutsBtn = document.getElementById('zu-shortcuts-btn');
        if (shortcutsBtn) {
            let shortcutsVisible = false;
            let savedActiveBody = null;

            shortcutsBtn.addEventListener('click', () => {
                shortcutsVisible = !shortcutsVisible;
                const panelEl = document.getElementById('zu-panel');
                if (!panelEl) return;

                if (shortcutsVisible) {
                    // Hide current active tab body
                    savedActiveBody = panelEl.querySelector('.zu-panel-body.active');
                    if (savedActiveBody) savedActiveBody.classList.remove('active');

                    // Create shortcuts body if needed
                    let sp = panelEl.querySelector('#zu-shortcuts-panel');
                    if (!sp) {
                        sp = document.createElement('div');
                        sp.id = 'zu-shortcuts-panel';
                        sp.className = 'zu-panel-body';
                        sp.style.padding = '12px';
                        sp.innerHTML = `
                            <div class="zu-shortcut-row"><kbd>Alt</kbd>+<kbd>B</kbd><span>Ẩn/hiện nội dung chat</span></div>
                            <div class="zu-shortcut-row"><kbd>Ctrl</kbd>+<kbd>Enter</kbd><span>Dịch văn bản đang nhập</span></div>
                            <div class="zu-shortcut-row"><kbd>/lệnh</kbd>+<kbd>Space</kbd><span>Chèn tin nhắn mẫu</span></div>
                            <div class="zu-shortcut-row"><kbd>Esc</kbd><span>Đóng panel</span></div>
                            <div style="border-top:1px solid rgba(255,255,255,0.06);margin:6px 0"></div>
                            <div class="zu-shortcut-row"><kbd>0</kbd>–<kbd>9</kbd> <kbd>.</kbd><span>Nhập số</span></div>
                            <div class="zu-shortcut-row"><kbd>+</kbd> <kbd>-</kbd> <kbd>*</kbd> <kbd>/</kbd><span>Phép tính</span></div>
                            <div class="zu-shortcut-row"><kbd>Enter</kbd><span>Tính kết quả</span></div>
                            <div class="zu-shortcut-row"><kbd>Backspace</kbd><span>Xóa ký tự cuối</span></div>
                        `;
                        panelEl.appendChild(sp);
                    }
                    sp.classList.add('active');
                    shortcutsBtn.classList.add('zu-blur-on');
                } else {
                    const sp = panelEl.querySelector('#zu-shortcuts-panel');
                    if (sp) sp.classList.remove('active');
                    if (savedActiveBody) savedActiveBody.classList.add('active');
                    shortcutsBtn.classList.remove('zu-blur-on');
                }
            });
        }

        // ── Proxy fetch via background.js (bypasses CORS) ──
        function bgFetch(url) {
            return new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({ type: 'FETCH_URL', url }, (res) => {
                    if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
                    if (!res || !res.ok) return reject(new Error(res?.error || 'Fetch failed'));
                    resolve(res);
                });
            });
        }

        // ── Tab switching ──
        let newsLoaded = false;
        let ratesLoaded = false;
        document.querySelectorAll('.zu-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.zu-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.zu-panel-body').forEach(b => b.classList.remove('active'));
                tab.classList.add('active');
                // Scroll active tab into view (centered)
                tab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                document.getElementById('zu-body-' + tab.dataset.panel).classList.add('active');
                // Lazy-load news on first visit
                if (tab.dataset.panel === 'news' && !newsLoaded) {
                    newsLoaded = true;
                    loadNews();
                }
                // Lazy-load rates on first visit
                if (tab.dataset.panel === 'currency' && !ratesLoaded) {
                    ratesLoaded = true;
                    loadRatesOverview();
                }
            });
        });

        // ── Tab scroll hint ──
        const tabsEl = document.getElementById('zu-tabs');
        const tabsHint = document.getElementById('zu-tabs-hint');
        if (tabsEl && tabsHint) {
            function updateScrollHint() {
                const atEnd = tabsEl.scrollLeft + tabsEl.clientWidth >= tabsEl.scrollWidth - 8;
                tabsHint.style.display = atEnd ? 'none' : 'flex';
            }
            tabsEl.addEventListener('scroll', updateScrollHint);
            tabsHint.addEventListener('click', () => {
                tabsEl.scrollBy({ left: 120, behavior: 'smooth' });
            });
            setTimeout(updateScrollHint, 100);
        }

        // ── Converter collapse toggle ──
        document.getElementById('zu-converter-toggle').addEventListener('click', function () {
            const body = document.getElementById('zu-converter-body');
            const isHidden = body.classList.toggle('zu-hidden');
            this.textContent = isHidden ? '▶ Quy đổi tiền tệ' : '▼ Quy đổi tiền tệ';
        });

        // ══════════════════════
        //  QUICK MESSAGES
        // ══════════════════════
        const qmList = document.getElementById('zu-qm-list');
        const qmSearch = document.getElementById('zu-qm-search');

        function saveCustomTemplates() {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.sync.set({ quickMessages: customTemplates });
            }
        }

        function renderQM(filter = '') {
            const all = getAllTemplates();
            const filtered = all.filter(t =>
                t.text.toLowerCase().includes(filter.toLowerCase()) ||
                t.shortcut.toLowerCase().includes(filter.toLowerCase())
            );
            const defaultCount = defaultTemplates.length;
            qmList.innerHTML = filtered.map((t, i) => {
                const globalIdx = all.indexOf(t);
                const isCustom = globalIdx >= defaultCount;
                return `
            <div class="zu-qm-item" data-idx="${i}">
              <span class="zu-qm-shortcut">${escapeHtml(t.shortcut)}</span>
              <span class="zu-qm-text">${escapeHtml(t.text.length > 50 ? t.text.slice(0, 50) + '...' : t.text)}</span>
              ${isCustom ? '<button class="zu-qm-del" data-delidx="' + (globalIdx - defaultCount) + '" aria-label="Xóa">&times;</button>' : ''}
            </div>
          `;
            }).join('') || '<div class="zu-qm-empty">Không tìm thấy</div>';

            // Click to paste
            qmList.querySelectorAll('.zu-qm-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    if (e.target.closest('.zu-qm-del')) return;
                    const idx = parseInt(item.dataset.idx);
                    const text = filtered[idx].text;
                    const pasted = pasteToZaloInput(text);
                    if (pasted) {
                        showZuToast('Đã paste vào chat');
                    } else {
                        navigator.clipboard.writeText(text);
                        showZuToast('Đã copy (Ctrl+V để paste)');
                    }
                });
            });

            // Delete custom message
            qmList.querySelectorAll('.zu-qm-del').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const delIdx = parseInt(btn.dataset.delidx);
                    customTemplates.splice(delIdx, 1);
                    saveCustomTemplates();
                    renderQM(qmSearch.value);
                    showZuToast('Xóa tin nhắn mẫu');
                });
            });
        }

        qmSearch.addEventListener('input', () => renderQM(qmSearch.value));

        // Add custom message handler
        document.getElementById('zu-qm-add-btn').addEventListener('click', () => {
            const form = document.getElementById('zu-qm-add-form');
            form.classList.toggle('zu-hidden');
        });

        document.getElementById('zu-qm-save').addEventListener('click', () => {
            const sc = document.getElementById('zu-qm-new-sc').value.trim();
            const tx = document.getElementById('zu-qm-new-tx').value.trim();
            if (!sc || !tx) { showZuToast('Nhập shortcut và nội dung'); return; }
            customTemplates.push({ shortcut: sc.startsWith('/') ? sc : '/' + sc, text: tx });
            saveCustomTemplates();
            document.getElementById('zu-qm-new-sc').value = '';
            document.getElementById('zu-qm-new-tx').value = '';
            document.getElementById('zu-qm-add-form').classList.add('zu-hidden');
            renderQM();
            showZuToast('Đã thêm tin nhắn mẫu');
        });

        // Load custom templates from storage
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.sync.get('quickMessages', (result) => {
                if (result.quickMessages && result.quickMessages.length) {
                    customTemplates = result.quickMessages;
                }
                renderQM();
            });
        } else {
            renderQM();
        }

        // ── Live-sync: reload when popup saves new templates ──
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
            chrome.storage.onChanged.addListener((changes, area) => {
                if (area === 'sync' && changes.quickMessages) {
                    customTemplates = changes.quickMessages.newValue || [];
                    renderQM(qmSearch.value);
                }
            });
        }

        // ── Text Expander: detect /shortcut + Space in Zalo input ──
        function setupTextExpander() {
            const observer = new MutationObserver(() => {
                const editables = document.querySelectorAll('[contenteditable="true"]');
                editables.forEach(el => {
                    if (el.dataset.zuExpander) return;
                    el.dataset.zuExpander = 'true';
                    el.addEventListener('keydown', (e) => {
                        // Skip IME composition (Vietnamese diacritics)
                        if (e.isComposing || e.keyCode === 229) return;
                        if (e.key !== ' ' && e.key !== 'Enter') return;
                        const text = (el.textContent || el.innerText).trimEnd();
                        const allTemplates = getAllTemplates();
                        for (const t of allTemplates) {
                            if (!t.shortcut) continue;
                            // Check if text ends with the shortcut
                            if (text === t.shortcut || text.endsWith(' ' + t.shortcut)) {
                                e.preventDefault();
                                const before = text.slice(0, text.length - t.shortcut.length);
                                el.textContent = before + t.text;
                                // Move cursor to end
                                const range = document.createRange();
                                range.selectNodeContents(el);
                                range.collapse(false);
                                const sel = window.getSelection();
                                sel.removeAllRanges();
                                sel.addRange(range);
                                // Trigger React update
                                el.dispatchEvent(new Event('input', { bubbles: true }));
                                showZuToast('Mở rộng: ' + t.shortcut);
                                break;
                            }
                        }
                    });
                });
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }
        setupTextExpander();

        // ══════════════════════
        //  MINI CALCULATOR
        // ══════════════════════
        // safeCalc() provided by shared.js (CSP-compliant, no eval)

        const calcDisplay = document.getElementById('zu-calc-display');
        const calcExprEl = document.getElementById('zu-calc-expr');
        let calcExpr = '';
        let calcResult = '0';
        let calcLastFullExpr = ''; // tracks "123+456" before pressing =

        function formatCalcExpr(expr) {
            return expr.replace(/\*/g, '×').replace(/\//g, '÷');
        }

        document.querySelectorAll('.zu-calc-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const a = btn.dataset.a;
                if (a === 'C') { calcExpr = ''; calcResult = '0'; calcLastFullExpr = ''; calcExprEl.textContent = ''; }
                else if (a === 'back') { calcExpr = calcExpr.slice(0, -1); }
                else if (a === '=') {
                    try {
                        const exprBefore = calcExpr;
                        const r = safeCalc(calcExpr);
                        calcResult = isNaN(r) ? 'Error' : String(parseFloat(r.toFixed(10)));
                        if (calcResult !== 'Error') {
                            calcLastFullExpr = formatCalcExpr(exprBefore) + ' = ' + calcResult;
                            calcExprEl.textContent = formatCalcExpr(exprBefore) + ' =';
                        }
                        calcExpr = calcResult === 'Error' ? '' : calcResult;
                    } catch (e) { calcResult = 'Error'; calcExpr = ''; }
                }
                else if (a === '%') {
                    try {
                        const r = safeCalc(calcExpr);
                        calcResult = isNaN(r) ? 'Error' : String(parseFloat((r / 100).toFixed(10)));
                        calcExpr = calcResult === 'Error' ? '' : calcResult;
                    } catch (e) { calcResult = 'Error'; }
                }
                else {
                    // If user starts typing after getting a result, clear expression display
                    if (calcLastFullExpr && !/[+\-*/%.]/.test(a)) {
                        calcLastFullExpr = '';
                        calcExprEl.textContent = '';
                    }
                    calcExpr += a;
                }
                calcDisplay.textContent = calcExpr || calcResult;
            });
        });

        document.getElementById('zu-calc-paste').addEventListener('click', () => {
            const fullExpr = calcLastFullExpr || calcDisplay.textContent;
            if (fullExpr && fullExpr !== 'Error') {
                const pasted = pasteToZaloInput(fullExpr);
                if (pasted) showZuToast('Đã paste: ' + fullExpr);
                else { navigator.clipboard.writeText(fullExpr); showZuToast('Đã copy: ' + fullExpr); }
            }
        });

        // Click on display to copy
        calcDisplay.addEventListener('click', () => {
            const fullExpr = calcLastFullExpr || calcDisplay.textContent;
            if (fullExpr && fullExpr !== 'Error' && fullExpr !== '0') {
                navigator.clipboard.writeText(fullExpr);
                showZuToast('Đã copy: ' + fullExpr);
            }
        });

        // E1: Keyboard support for calculator
        // IMPORTANT: Must not interfere with Vietnamese IME input
        document.addEventListener('keydown', (e) => {
            // Skip if IME is composing (Vietnamese diacritics)
            if (e.isComposing || e.keyCode === 229) return;

            const calcPanel = document.getElementById('zu-body-calc');
            if (!calcPanel || !calcPanel.classList.contains('active')) return;

            // Don't intercept if user is typing in any text input/contenteditable
            const active = document.activeElement;
            if (active && (
                active.tagName === 'INPUT' ||
                active.tagName === 'TEXTAREA' ||
                active.isContentEditable
            ) && !active.closest('#zu-body-calc')) return;

            const keyMap = { 'Enter': '=', 'Escape': 'C', 'Backspace': 'back', 'Delete': 'C' };
            const key = keyMap[e.key] || (/^[0-9+\-*/.%]$/.test(e.key) ? e.key : null);
            if (!key) return;
            e.preventDefault();
            const btn = document.querySelector(`.zu-calc-btn[data-a="${key}"]`);
            if (btn) btn.click();
        });

        // ══════════════════════
        //  CURRENCY CONVERTER
        // ══════════════════════
        const currAmount = document.getElementById('zu-currency-amount');
        const currFrom = document.getElementById('zu-currency-from');
        const currTo = document.getElementById('zu-currency-to');
        const currResultAmt = document.getElementById('zu-currency-result-amount');
        const currRateInfo = document.getElementById('zu-currency-rate-info');
        const currStatus = document.getElementById('zu-currency-status');
        let currRateCache = {};

        async function convertCurrency() {
            const amount = parseFloat(currAmount.value);
            const from = currFrom.value;
            const to = currTo.value;
            if (!amount || isNaN(amount)) { currResultAmt.textContent = '—'; currRateInfo.textContent = ''; return; }
            if (from === to) { currResultAmt.textContent = amount.toLocaleString(); currRateInfo.textContent = '1:1'; return; }

            currStatus.textContent = 'Đang tải tỉ giá...';
            currStatus.className = 'zu-currency-status';
            try {
                let rates = currRateCache[from];
                if (!rates) {
                    const res = await bgFetch(`${CURRENCY_API_BASE}${from}`);
                    rates = res.json.rates;
                    currRateCache[from] = rates;
                }
                const rate = rates[to];
                if (!rate) throw new Error('Rate not found');
                const result = amount * rate;
                currResultAmt.textContent = result.toLocaleString('en-US', { maximumFractionDigits: 2 });
                currRateInfo.textContent = `1 ${from} = ${rate.toLocaleString('en-US', { maximumFractionDigits: 4 })} ${to}`;
                currStatus.textContent = '';
            } catch (e) {
                currResultAmt.textContent = 'Lỗi';
                currStatus.textContent = 'Không thể tải tỉ giá';
                currStatus.className = 'zu-currency-status error';
            }
        }

        currAmount.addEventListener('input', convertCurrency);
        currFrom.addEventListener('change', () => { currRateCache = {}; convertCurrency(); });
        currTo.addEventListener('change', convertCurrency);
        document.getElementById('zu-currency-swap').addEventListener('click', () => {
            const tmp = currFrom.value;
            currFrom.value = currTo.value;
            currTo.value = tmp;
            currRateCache = {};
            convertCurrency();
        });

        // ── Currency Rates Overview (Vietcombank official) ──
        const ratesContainer = document.getElementById('zu-currency-rates');
        const ratesUpdatedEl = document.getElementById('zu-rates-updated');
        async function loadRatesOverview() {
            ratesContainer.innerHTML = '<div class="zu-currency-loading">Đang tải...</div>';
            try {
                const res = await bgFetch('https://www.vietcombank.com.vn/api/exchangerates?date=');
                const vcbData = res.json?.Data;
                if (!vcbData) throw new Error('No data');

                const show = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'KRW', 'SGD', 'THB'];
                // SVG circle flags (no emojis per design rule)
                const flagSvg = (color) => `<svg width="14" height="14" viewBox="0 0 14 14" style="vertical-align:middle;margin-right:2px;flex-shrink:0"><circle cx="7" cy="7" r="6" fill="${color}" stroke="${color}" stroke-width="1" opacity="0.85"/></svg>`;
                const flags = {
                    USD: flagSvg('#3C8B3F'),
                    EUR: flagSvg('#003399'),
                    GBP: flagSvg('#CF142B'),
                    JPY: flagSvg('#BC002D'),
                    CNY: flagSvg('#DE2910'),
                    KRW: flagSvg('#003478'),
                    SGD: flagSvg('#ED2939'),
                    THB: flagSvg('#2D2A9C')
                };
                const filtered = vcbData.filter(c => show.includes(c.currencyCode));
                ratesContainer.innerHTML = `<div class="zu-currency-rate-item zu-rate-header">
                    <span class="zu-currency-rate-code">Tiền tệ</span>
                    <span class="zu-currency-rate-val">Mua / Bán</span>
                </div>` + filtered.map(c => {
                    const buy = parseFloat(c.transfer).toLocaleString('vi-VN');
                    const sell = parseFloat(c.sell).toLocaleString('vi-VN');
                    return `<div class="zu-currency-rate-item">
                        <span class="zu-currency-rate-code">${flags[c.currencyCode] || ''} ${c.currencyCode}</span>
                        <span class="zu-currency-rate-val">${buy} / ${sell}</span>
                    </div>`;
                }).join('');

                // Update timestamp
                const now = new Date();
                ratesUpdatedEl.textContent = `Cập nhật: ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

                // Gold & Commodities
                const goldContainer = document.getElementById('zu-gold-prices');
                const usdSell = parseFloat(vcbData.find(c => c.currencyCode === 'USD')?.sell || 0);
                if (goldContainer) {
                    try {
                        const goldRes = await bgFetch('https://data-asg.goldprice.org/dbXRates/USD');
                        const gd = goldRes.json;
                        const goldUsd = gd?.items?.[0]?.xauPrice || gd?.xauPrice;
                        const silverUsd = gd?.items?.[0]?.xagPrice || gd?.xagPrice;
                        let items = '';
                        const goldIcon = '<svg width="14" height="14" viewBox="0 0 14 14" style="vertical-align:middle;margin-right:2px;flex-shrink:0"><circle cx="7" cy="7" r="6" fill="#FFD700" stroke="#DAA520" stroke-width="1"/></svg>';
                        const silverIcon = '<svg width="14" height="14" viewBox="0 0 14 14" style="vertical-align:middle;margin-right:2px;flex-shrink:0"><circle cx="7" cy="7" r="6" fill="#C0C0C0" stroke="#A9A9A9" stroke-width="1"/></svg>';
                        if (goldUsd) {
                            const goldVndLuong = goldUsd * 1.20556 * usdSell;
                            items += `<div class="zu-currency-rate-item"><span class="zu-currency-rate-code">${goldIcon} Vàng (oz)</span><span class="zu-currency-rate-val">$${Math.round(goldUsd).toLocaleString('vi-VN')}</span></div>`;
                            items += `<div class="zu-currency-rate-item"><span class="zu-currency-rate-code">~VND/lượng</span><span class="zu-currency-rate-val">${formatCurrency(goldVndLuong, 'VND')}</span></div>`;
                        }
                        if (silverUsd) {
                            items += `<div class="zu-currency-rate-item"><span class="zu-currency-rate-code">${silverIcon} Bạc (oz)</span><span class="zu-currency-rate-val">$${silverUsd.toFixed(2)}</span></div>`;
                        }
                        goldContainer.innerHTML = items || '<div class="zu-currency-loading">Không có dữ liệu</div>';
                    } catch (e) {
                        goldContainer.innerHTML = '<div class="zu-currency-loading">Không tải được giá vàng</div>';
                    }
                }
            } catch (e) {
                ratesContainer.innerHTML = '<div class="zu-currency-loading">Không thể tải</div>';
            }
        }
        // Lazy-load + refresh handler + auto-refresh
        document.getElementById('zu-rates-refresh').addEventListener('click', loadRatesOverview);
        setInterval(() => {
            const currTab = document.querySelector('.zu-tab.active');
            if (currTab && currTab.dataset.panel === 'currency') loadRatesOverview();
        }, 5 * 60 * 1000); // Auto-refresh every 5 min

        // ══════════════════════
        //  NEWS (Multi-source RSS)
        // ══════════════════════
        const newsList = document.getElementById('zu-news-list');
        const newsCat = document.getElementById('zu-news-cat');

        function timeAgo(dateStr) {
            const diff = Date.now() - new Date(dateStr).getTime();
            const mins = Math.floor(diff / 60000);
            if (mins < 1) return 'Vừa xong';
            if (mins < 60) return `${mins} phút trước`;
            const hrs = Math.floor(mins / 60);
            if (hrs < 24) return `${hrs} giờ trước`;
            return `${Math.floor(hrs / 24)} ngày trước`;
        }

        const NEWS_FEEDS = {
            'tin-noi-bat': [
                { url: 'https://vnexpress.net/rss/tin-noi-bat.rss', src: 'VnExpress' },
                { url: 'https://tuoitre.vn/rss/tin-moi-nhat.rss', src: 'Tuổi Trẻ' },
                { url: 'https://thanhnien.vn/rss/home.rss', src: 'Thanh Niên' },
                { url: 'https://dantri.com.vn/rss/home.rss', src: 'Dân Trí' },
            ],
            'the-gioi': [
                { url: 'https://vnexpress.net/rss/the-gioi.rss', src: 'VnExpress' },
                { url: 'https://tuoitre.vn/rss/the-gioi.rss', src: 'Tuổi Trẻ' },
                { url: 'https://thanhnien.vn/rss/the-gioi.rss', src: 'Thanh Niên' },
                { url: 'https://dantri.com.vn/rss/the-gioi.rss', src: 'Dân Trí' },
            ],
            'kinh-doanh': [
                { url: 'https://vnexpress.net/rss/kinh-doanh.rss', src: 'VnExpress' },
                { url: 'https://tuoitre.vn/rss/kinh-doanh.rss', src: 'Tuổi Trẻ' },
                { url: 'https://thanhnien.vn/rss/tai-chinh-kinh-doanh.rss', src: 'Thanh Niên' },
                { url: 'https://dantri.com.vn/rss/kinh-doanh.rss', src: 'Dân Trí' },
            ],
            'khoa-hoc-cong-nghe': [
                { url: 'https://vnexpress.net/rss/khoa-hoc-cong-nghe.rss', src: 'VnExpress' },
                { url: 'https://tuoitre.vn/rss/khoa-hoc.rss', src: 'Tuổi Trẻ' },
                { url: 'https://thanhnien.vn/rss/cong-nghe.rss', src: 'Thanh Niên' },
                { url: 'https://dantri.com.vn/rss/suc-manh-so.rss', src: 'Dân Trí' },
            ],
            'the-thao': [
                { url: 'https://vnexpress.net/rss/the-thao.rss', src: 'VnExpress' },
                { url: 'https://tuoitre.vn/rss/the-thao.rss', src: 'Tuổi Trẻ' },
                { url: 'https://thanhnien.vn/rss/the-thao.rss', src: 'Thanh Niên' },
                { url: 'https://dantri.com.vn/rss/the-thao.rss', src: 'Dân Trí' },
            ],
            'giai-tri': [
                { url: 'https://vnexpress.net/rss/giai-tri.rss', src: 'VnExpress' },
                { url: 'https://tuoitre.vn/rss/giai-tri.rss', src: 'Tuổi Trẻ' },
                { url: 'https://thanhnien.vn/rss/giai-tri.rss', src: 'Thanh Niên' },
                { url: 'https://dantri.com.vn/rss/giai-tri.rss', src: 'Dân Trí' },
            ],
            'suc-khoe': [
                { url: 'https://vnexpress.net/rss/suc-khoe.rss', src: 'VnExpress' },
                { url: 'https://tuoitre.vn/rss/suc-khoe.rss', src: 'Tuổi Trẻ' },
                { url: 'https://thanhnien.vn/rss/suc-khoe.rss', src: 'Thanh Niên' },
                { url: 'https://dantri.com.vn/rss/suc-khoe.rss', src: 'Dân Trí' },
            ],
        };

        const newsCache = {};
        const NEWS_CACHE_TTL = 5 * 60 * 1000;
        const NEWS_PER_PAGE = 10;
        let allArticles = [];
        let newsPage = 0;
        let newsLoading = false;

        function skeletonHtml(count) {
            return Array.from({ length: count }, () => `
                <div class="zu-news-item zu-skeleton-item">
                    <div class="zu-news-content">
                        <div class="zu-skeleton" style="width:90%;height:14px;margin-bottom:6px"></div>
                        <div class="zu-skeleton" style="width:70%;height:11px;margin-bottom:4px"></div>
                        <div class="zu-skeleton" style="width:40%;height:10px"></div>
                    </div>
                    <div class="zu-skeleton" style="width:72px;height:72px;border-radius:6px;flex-shrink:0"></div>
                </div>
            `).join('');
        }

        function parseRss(text, src) {
            const out = [];
            try {
                const xml = new DOMParser().parseFromString(text, 'text/xml');
                xml.querySelectorAll('item').forEach(item => {
                    const title = item.querySelector('title')?.textContent || '';
                    const link = item.querySelector('link')?.textContent || '#';
                    const pubDate = item.querySelector('pubDate')?.textContent || '';
                    const descRaw = item.querySelector('description')?.textContent || '';
                    const d = document.createElement('div');
                    d.innerHTML = descRaw;
                    const img = d.querySelector('img');
                    out.push({
                        title, link, pubDate, src,
                        desc: d.textContent.trim(),
                        thumb: img ? img.getAttribute('src') : '',
                        ts: pubDate ? new Date(pubDate).getTime() : 0
                    });
                });
            } catch (e) { }
            return out;
        }

        function renderArticle(a) {
            return `<a class="zu-news-item" href="${escapeHtml(a.link)}" target="_blank" rel="noopener">
                <div class="zu-news-content">
                    <div class="zu-news-title">${escapeHtml(a.title)}</div>
                    ${a.desc ? `<div class="zu-news-desc">${escapeHtml(a.desc)}</div>` : ''}
                    <div class="zu-news-time">${a.pubDate ? timeAgo(a.pubDate) : ''} · <b>${a.src}</b></div>
                </div>
                ${a.thumb ? `<img class="zu-news-thumb" src="${escapeHtml(a.thumb)}" alt="" loading="lazy">` : ''}
            </a>`;
        }

        function appendPage() {
            const start = newsPage * NEWS_PER_PAGE;
            const page = allArticles.slice(start, start + NEWS_PER_PAGE);
            if (!page.length) {
                // Current category exhausted → auto-load next
                loadNextCategory();
                return;
            }
            const loader = newsList.querySelector('.zu-news-load-more');
            if (loader) loader.remove();
            newsList.insertAdjacentHTML('beforeend', page.map(renderArticle).join(''));
            newsPage++;
            // Show "loading more" indicator
            newsList.insertAdjacentHTML('beforeend',
                '<div class="zu-news-load-more zu-news-loading">Đang tải thêm...</div>');
        }

        const CAT_ORDER = ['tin-noi-bat', 'the-gioi', 'kinh-doanh', 'khoa-hoc-cong-nghe', 'the-thao', 'giai-tri', 'suc-khoe'];
        const CAT_NAMES = { 'tin-noi-bat': 'Nổi bật', 'the-gioi': 'Thế giới', 'kinh-doanh': 'Kinh doanh', 'khoa-hoc-cong-nghe': 'Công nghệ', 'the-thao': 'Thể thao', 'giai-tri': 'Giải trí', 'suc-khoe': 'Sức khỏe' };
        let currentCatIdx = 0;
        let autoLoading = false;

        async function loadNextCategory() {
            if (autoLoading) return;
            currentCatIdx++;
            if (currentCatIdx >= CAT_ORDER.length) {
                // All categories loaded
                const loader = newsList.querySelector('.zu-news-load-more');
                if (loader) loader.innerHTML = 'Đã tải hết tin 📰';
                return;
            }
            autoLoading = true;
            const cat = CAT_ORDER[currentCatIdx];
            // Show category divider
            const loader = newsList.querySelector('.zu-news-load-more');
            if (loader) loader.innerHTML = `Đang tải ${CAT_NAMES[cat]}...`;
            try {
                const feeds = NEWS_FEEDS[cat] || NEWS_FEEDS['tin-noi-bat'];
                const results = await Promise.allSettled(
                    feeds.map(f => bgFetch(f.url).then(r => parseRss(r.text, f.src)))
                );
                const merged = results.filter(r => r.status === 'fulfilled').flatMap(r => r.value);
                merged.sort((a, b) => b.ts - a.ts);
                // Deduplicate against already-shown titles
                const existingTitles = new Set(allArticles.map(a => a.title.toLowerCase().replace(/\s+/g, '').slice(0, 40)));
                const newArticles = merged.filter(a => {
                    const k = a.title.toLowerCase().replace(/\s+/g, '').slice(0, 40);
                    if (existingTitles.has(k)) return false;
                    existingTitles.add(k);
                    return true;
                });
                if (newArticles.length > 0) {
                    allArticles = allArticles.concat(newArticles);
                    newsCache[cat] = { articles: newArticles, time: Date.now() };
                    // Add category header
                    if (loader) loader.remove();
                    newsList.insertAdjacentHTML('beforeend',
                        `<div class="zu-news-cat-divider">${CAT_NAMES[cat]}</div>`);
                    // Render first page of new category
                    const firstPage = newArticles.slice(0, NEWS_PER_PAGE);
                    newsList.insertAdjacentHTML('beforeend', firstPage.map(renderArticle).join(''));
                    newsPage = Math.ceil(allArticles.length / NEWS_PER_PAGE);
                    newsList.insertAdjacentHTML('beforeend',
                        '<div class="zu-news-load-more zu-news-loading">Đang tải thêm...</div>');
                } else {
                    // No new articles in this category, skip to next
                    autoLoading = false;
                    loadNextCategory();
                    return;
                }
            } catch (e) {
                // Skip failed category
                autoLoading = false;
                loadNextCategory();
                return;
            }
            autoLoading = false;
        }

        async function loadNews(forceRefresh = false) {
            if (newsLoading) return;
            const cat = newsCat.value;
            currentCatIdx = CAT_ORDER.indexOf(cat);
            if (currentCatIdx < 0) currentCatIdx = 0;

            if (!forceRefresh && newsCache[cat] && (Date.now() - newsCache[cat].time) < NEWS_CACHE_TTL) {
                allArticles = newsCache[cat].articles;
                newsPage = 0;
                newsList.innerHTML = '';
                appendPage();
                return;
            }
            newsLoading = true;
            newsList.innerHTML = skeletonHtml(5);
            try {
                const feeds = NEWS_FEEDS[cat] || NEWS_FEEDS['tin-noi-bat'];
                const results = await Promise.allSettled(
                    feeds.map(f => bgFetch(f.url).then(r => parseRss(r.text, f.src)))
                );
                const merged = results.filter(r => r.status === 'fulfilled').flatMap(r => r.value);
                merged.sort((a, b) => b.ts - a.ts);
                const seen = new Set();
                allArticles = merged.filter(a => {
                    const k = a.title.toLowerCase().replace(/\s+/g, '').slice(0, 40);
                    if (seen.has(k)) return false;
                    seen.add(k);
                    return true;
                });
                newsPage = 0;
                newsList.innerHTML = '';
                appendPage();
                newsCache[cat] = { articles: allArticles, time: Date.now() };
            } catch (e) {
                newsList.innerHTML = '<div class="zu-news-loading">Không thể tải tin</div>';
            } finally { newsLoading = false; }
        }

        // Infinite scroll — listen on panel body (the actual scroll container)
        const newsBody = document.getElementById('zu-body-news');
        if (newsBody) {
            newsBody.addEventListener('scroll', () => {
                if (newsBody.scrollTop + newsBody.clientHeight >= newsBody.scrollHeight - 100) {
                    appendPage();
                }
            });
        }

        newsCat.addEventListener('change', () => loadNews(true));
        document.getElementById('zu-news-refresh').addEventListener('click', () => loadNews(true));

        // ══════════════════════
        //  MINI TRANSLATE
        // ══════════════════════
        const transFrom = document.getElementById('zu-trans-from');
        const transTo = document.getElementById('zu-trans-to');
        const transInput = document.getElementById('zu-trans-input');
        const transResult = document.getElementById('zu-trans-result');
        const transPaste = document.getElementById('zu-trans-paste');

        document.getElementById('zu-trans-swap').addEventListener('click', () => {
            const tmp = transFrom.value;
            transFrom.value = transTo.value;
            transTo.value = tmp;
        });

        document.getElementById('zu-trans-go').addEventListener('click', async () => {
            const text = transInput.value.trim();
            if (!text) return;
            const btn = document.getElementById('zu-trans-go');
            btn.textContent = 'Đang dịch...';
            btn.disabled = true;
            try {
                const sl = transFrom.value;
                const tl = transTo.value;
                const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
                const res = await bgFetch(url);
                const data = res.json;
                const translated = data[0].map(s => s[0]).join('');
                transResult.textContent = translated;
                transResult.classList.remove('zu-hidden');
                transPaste.classList.remove('zu-hidden');
            } catch (err) {
                transResult.textContent = 'Lỗi mạng: ' + err.message;
                transResult.classList.remove('zu-hidden');
            }
            btn.textContent = 'Dịch';
            btn.disabled = false;
        });

        transPaste.addEventListener('click', () => {
            const text = transResult.textContent;
            if (text) {
                const pasted = pasteToZaloInput(text);
                if (pasted) showZuToast('Đã paste bản dịch');
                else { navigator.clipboard.writeText(text); showZuToast('Đã copy'); }
            }
        });

        // Ctrl+Enter to translate
        transInput.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                document.getElementById('zu-trans-go').click();
            }
        });

        // ══════════════════════
        //  DONATE COPY BUTTONS
        // ══════════════════════
        document.querySelectorAll('.zu-donate-copy').forEach(btn => {
            btn.addEventListener('click', () => {
                navigator.clipboard.writeText(btn.dataset.copy);
                showZuToast('Đã copy: ' + btn.dataset.copy);
            });
        });

        // ══════════════════════
        //  POMODORO TIMER (synced with popup via chrome.storage)
        // ══════════════════════
        let pomoInterval = null;
        let pomoRunning = false;
        let pomoSeconds = 25 * 60;
        let pomoTotalSeconds = 25 * 60;
        let pomoIsBreak = false;
        let pomoSessions = 0;

        const pomoTime = document.getElementById('zu-pomo-time');
        const pomoLabel = document.getElementById('zu-pomo-label');
        const pomoProgress = document.getElementById('zu-pomo-progress');
        const pomoStartBtn = document.getElementById('zu-pomo-start');
        const pomoResetBtn = document.getElementById('zu-pomo-reset');
        const pomoSessionsEl = document.getElementById('zu-pomo-sessions');
        const pomoWorkSel = document.getElementById('zu-pomo-work');
        const pomoBreakSel = document.getElementById('zu-pomo-break');

        // Ring circumference for SVG progress
        const pomoCircumference = 2 * Math.PI * 52;
        if (pomoProgress) {
            pomoProgress.style.strokeDasharray = pomoCircumference;
            pomoProgress.style.strokeDashoffset = '0';
        }

        function persistPomoState() {
            savePomodoroState({
                isRunning: pomoRunning,
                isBreak: pomoIsBreak,
                timeLeft: pomoSeconds,
                totalTime: pomoTotalSeconds,
                endTime: pomoRunning ? Date.now() + pomoSeconds * 1000 : null,
            });
        }

        function updatePomoDisplay() {
            const m = Math.floor(pomoSeconds / 60).toString().padStart(2, '0');
            const s = (pomoSeconds % 60).toString().padStart(2, '0');
            pomoTime.textContent = `${m}:${s}`;
            // Update ring
            const fraction = 1 - (pomoSeconds / pomoTotalSeconds);
            const offset = fraction * pomoCircumference;
            pomoProgress.style.strokeDashoffset = offset;
            // Update label
            pomoLabel.textContent = pomoIsBreak ? 'Nghỉ ngơi' : 'Làm việc';
            // Update FAB badge
            const fabBadge = document.getElementById('zu-fab-badge');
            if (fabBadge) {
                if (pomoRunning) {
                    const mins = Math.ceil(pomoSeconds / 60);
                    fabBadge.textContent = `${mins}m`;
                    fabBadge.classList.remove('zu-hidden');
                } else {
                    fabBadge.classList.add('zu-hidden');
                }
            }
        }

        function applyPomoState(state, savedSessions) {
            pomoSessions = savedSessions;
            pomoSessionsEl.textContent = `Hoàn thành: ${pomoSessions} phiên`;

            if (state) {
                pomoIsBreak = state.isBreak || false;
                pomoTotalSeconds = state.totalTime || 25 * 60;

                if (state.isRunning && state.endTime) {
                    const remaining = Math.max(0, Math.floor((state.endTime - Date.now()) / 1000));
                    if (remaining > 0) {
                        pomoSeconds = remaining;
                        pomoRunning = true;
                        pomoStartBtn.innerHTML = icons.pause;
                        if (!pomoInterval) {
                            pomoInterval = setInterval(pomoTick, 1000);
                        }
                    } else {
                        // Timer expired while away
                        pomoSeconds = 0;
                        pomoRunning = false;
                        pomoStartBtn.innerHTML = icons.play;
                    }
                } else {
                    pomoSeconds = state.timeLeft || pomoTotalSeconds;
                    pomoRunning = false;
                    pomoStartBtn.innerHTML = icons.play;
                    if (pomoInterval) {
                        clearInterval(pomoInterval);
                        pomoInterval = null;
                    }
                }
            }
            updatePomoDisplay();
        }

        function pomoTick() {
            if (pomoSeconds <= 0) {
                clearInterval(pomoInterval);
                pomoInterval = null;
                pomoRunning = false;
                pomoStartBtn.innerHTML = icons.play;

                if (!pomoIsBreak) {
                    pomoSessions++;
                    pomoSessionsEl.textContent = `Hoàn thành: ${pomoSessions} phiên`;
                    savePomodoroSessions(pomoSessions);
                    showZuToast('Hết giờ làm việc! Nghỉ ngơi thôi.');
                    pomoIsBreak = true;
                    pomoSeconds = parseInt(pomoBreakSel.value, 10) * 60;
                    pomoTotalSeconds = pomoSeconds;
                } else {
                    showZuToast('Hết giờ nghỉ! Tiếp tục làm việc.');
                    pomoIsBreak = false;
                    pomoSeconds = parseInt(pomoWorkSel.value, 10) * 60;
                    pomoTotalSeconds = pomoSeconds;
                }
                persistPomoState();
                updatePomoDisplay();
                // Try notification
                if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                    new Notification('Zalo Utility - Pomodoro', {
                        body: pomoIsBreak ? 'Nghỉ ngơi thôi!' : 'Tiếp tục làm việc!',
                    });
                }
                return;
            }
            pomoSeconds--;
            updatePomoDisplay();
        }

        // Load initial state
        loadPomodoroState((state, savedSessions) => {
            applyPomoState(state, savedSessions);
        });

        // Listen for storage changes from popup
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
            chrome.storage.onChanged.addListener((changes, area) => {
                if (area === 'local') {
                    if (changes[POMO_STORAGE_KEY] || changes[POMO_SESSIONS_KEY]) {
                        // Reload full state from storage
                        clearInterval(pomoInterval);
                        pomoInterval = null;
                        loadPomodoroState((state, savedSessions) => {
                            applyPomoState(state, savedSessions);
                        });
                    }
                }
            });
        }

        pomoStartBtn.addEventListener('click', () => {
            if (pomoRunning) {
                clearInterval(pomoInterval);
                pomoInterval = null;
                pomoRunning = false;
                pomoStartBtn.innerHTML = icons.play;
            } else {
                pomoInterval = setInterval(pomoTick, 1000);
                pomoRunning = true;
                pomoStartBtn.innerHTML = icons.pause;
            }
            persistPomoState();
        });

        pomoResetBtn.addEventListener('click', () => {
            clearInterval(pomoInterval);
            pomoInterval = null;
            pomoRunning = false;
            pomoIsBreak = false;
            pomoSeconds = parseInt(pomoWorkSel.value, 10) * 60;
            pomoTotalSeconds = pomoSeconds;
            pomoStartBtn.innerHTML = icons.play;
            persistPomoState();
            updatePomoDisplay();
        });

        pomoWorkSel.addEventListener('change', () => {
            if (!pomoRunning && !pomoIsBreak) {
                pomoSeconds = parseInt(pomoWorkSel.value, 10) * 60;
                pomoTotalSeconds = pomoSeconds;
                persistPomoState();
                updatePomoDisplay();
            }
        });

        pomoBreakSel.addEventListener('change', () => {
            if (!pomoRunning && pomoIsBreak) {
                pomoSeconds = parseInt(pomoBreakSel.value, 10) * 60;
                pomoTotalSeconds = pomoSeconds;
                persistPomoState();
                updatePomoDisplay();
            }
        });
    }

    // ── Toast notification ──
    function showZuToast(msg) {
        let toast = document.getElementById('zu-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'zu-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.classList.add('zu-show');
        setTimeout(() => toast.classList.remove('zu-show'), 2200);
    }

    // ── Initialize ──
    if (document.readyState === 'complete') {
        createFAB();
    } else {
        window.addEventListener('load', createFAB);
    }
})();
