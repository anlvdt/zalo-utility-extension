/* ============================================
   ZALO UTILITY EXTENSION - Popup Logic
   Uses shared.js for common utilities
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  const inits = [
    initTabs, initCalculator, initCurrency, initQuickMessages,
    initPomodoro, initTranslate, initDonate, initShortcuts, initExportImport,
    initVersionBadge, initAccessibility
  ];
  inits.forEach(fn => {
    try { fn(); } catch (e) { console.error(`[ZaloUtility] ${fn.name} failed:`, e); }
  });
});

// ── Toast Notification ──
function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

// ══════════════════════════
//  TAB NAVIGATION
// ══════════════════════════
function initTabs() {
  const btns = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');

  function switchTab(tabName) {
    btns.forEach(b => b.classList.remove('active'));
    contents.forEach(c => c.classList.remove('active'));
    const target = [...btns].find(b => b.dataset.tab === tabName);
    if (target) {
      target.classList.add('active');
      document.getElementById('tab-' + tabName).classList.add('active');
      // Remember last tab
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ lastTab: tabName });
      }
    }
  }

  btns.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Restore last active tab
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get('lastTab', (r) => {
      if (r.lastTab) switchTab(r.lastTab);
    });
  }
}

// ══════════════════════════
//  TAB 1: CALCULATOR
// ══════════════════════════
function initCalculator() {
  const display = document.getElementById('calc-result');
  const expression = document.getElementById('calc-expression');
  const historyList = document.getElementById('calc-history-list');
  const historyClear = document.getElementById('calc-history-clear');

  let current = '0';
  let previous = '';
  let operator = '';
  let shouldReset = false;
  let memory = 0;
  let history = [];

  function updateDisplay() {
    display.textContent = current;
    expression.textContent = previous + (operator ? ' ' + operator : '');
  }

  function addToHistory(expr, result) {
    history.unshift(expr + ' = ' + result);
    if (history.length > 10) history.pop();
    renderHistory();
  }

  function renderHistory() {
    historyList.innerHTML = history.map((h, i) =>
      `<div class="history-item" data-hidx="${i}" title="Click để dùng lại kết quả">${escapeHtml(h)}</div>`
    ).join('');

    // Click history item to reuse result
    historyList.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.dataset.hidx, 10);
        const parts = history[idx].split(' = ');
        if (parts.length === 2) {
          current = parts[1];
          shouldReset = true;
          updateDisplay();
          showToast('Đã tải kết quả');
        }
      });
    });
  }

  function calculate(a, op, b) {
    const na = parseFloat(a);
    const nb = parseFloat(b);
    switch (op) {
      case '+': return na + nb;
      case '−': return na - nb;
      case '×': return na * nb;
      case '÷': return nb !== 0 ? na / nb : NaN;
      default: return nb;
    }
  }

  // Calculator button handlers
  document.querySelectorAll('.calc-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;

      // Numbers
      if (/^[0-9]$/.test(action)) {
        if (current === '0' || shouldReset) {
          current = action;
          shouldReset = false;
        } else {
          if (current.length < 15) current += action;
        }
        updateDisplay();
        return;
      }

      switch (action) {
        case 'decimal':
          if (shouldReset) { current = '0.'; shouldReset = false; }
          else if (!current.includes('.')) current += '.';
          break;

        case 'clear':
          current = '0'; previous = ''; operator = '';
          break;

        case 'backspace':
          current = current.length > 1 ? current.slice(0, -1) : '0';
          break;

        case 'negate':
          if (current !== '0') {
            current = current.startsWith('-') ? current.slice(1) : '-' + current;
          }
          break;

        case 'percent':
          current = formatCalcNumber(parseFloat(current) / 100);
          break;

        case 'sqrt':
          const sqrtVal = parseFloat(current);
          if (sqrtVal < 0) { current = 'Error'; }
          else {
            const sqrtResult = Math.sqrt(sqrtVal);
            addToHistory('√' + current, formatCalcNumber(sqrtResult));
            current = formatCalcNumber(sqrtResult);
          }
          break;

        case 'square':
          const sqVal = parseFloat(current);
          const sqResult = sqVal * sqVal;
          addToHistory(current + '²', formatCalcNumber(sqResult));
          current = formatCalcNumber(sqResult);
          break;

        case 'add': case 'subtract': case 'multiply': case 'divide':
          const ops = { add: '+', subtract: '−', multiply: '×', divide: '÷' };
          if (operator && !shouldReset) {
            const result = calculate(previous, operator, current);
            current = formatCalcNumber(result);
          }
          previous = current;
          operator = ops[action];
          shouldReset = true;
          break;

        case 'equals':
          if (operator) {
            const expr = previous + ' ' + operator + ' ' + current;
            const result = calculate(previous, operator, current);
            current = formatCalcNumber(result);
            addToHistory(expr, current);
            previous = '';
            operator = '';
            shouldReset = true;
          }
          break;

        case 'copy-result':
          copyToClipboard(current).then(() => showToast('Đã copy!'));
          return;
      }
      updateDisplay();
    });
  });

  // Memory buttons
  document.querySelectorAll('.calc-mem-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switch (btn.dataset.action) {
        case 'mc': memory = 0; showToast('Đã xóa bộ nhớ'); break;
        case 'mr': current = formatCalcNumber(memory); shouldReset = true; break;
        case 'mplus': memory += parseFloat(current) || 0; showToast('Đã cộng vào bộ nhớ'); break;
        case 'mminus': memory -= parseFloat(current) || 0; showToast('Đã trừ khỏi bộ nhớ'); break;
      }
      updateDisplay();
    });
  });

  historyClear.addEventListener('click', () => {
    history = [];
    renderHistory();
  });

  // Keyboard support
  document.addEventListener('keydown', (e) => {
    const tab = document.querySelector('.tab-btn.active');
    if (tab.dataset.tab !== 'calculator') return;

    const keyMap = {
      '0': '0', '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
      '.': 'decimal',
      '+': 'add', '-': 'subtract', '*': 'multiply', '/': 'divide',
      'Enter': 'equals', '=': 'equals',
      'Backspace': 'backspace', 'Escape': 'clear', 'Delete': 'clear',
      '%': 'percent'
    };

    if (keyMap[e.key]) {
      e.preventDefault();
      const btn = document.querySelector(`[data-action="${keyMap[e.key]}"]`);
      if (btn) btn.click();
    }
  });

  updateDisplay();
}

// ══════════════════════════
//  TAB 2: CURRENCY CONVERTER
// ══════════════════════════
function initCurrency() {
  const amountInput = document.getElementById('currency-amount');
  const fromSelect = document.getElementById('currency-from');
  const toSelect = document.getElementById('currency-to');
  const swapBtn = document.getElementById('currency-swap');
  const resultEl = document.getElementById('currency-result');
  const rateInfo = document.getElementById('currency-rate-info');
  const statusEl = document.getElementById('currency-status');

  let ratesCache = {};
  let cacheTimes = {};

  async function fetchRates(base) {
    const now = Date.now();
    if (ratesCache[base] && (now - (cacheTimes[base] || 0)) < CURRENCY_CACHE_TTL) {
      return ratesCache[base];
    }

    statusEl.textContent = 'Đang tải tỉ giá...';
    statusEl.className = 'currency-status loading';

    try {
      const resp = await fetchWithTimeout(`${CURRENCY_API_BASE}${base}`);
      if (!resp.ok) throw new Error('API error');
      const data = await resp.json();
      if (data.result !== 'success') throw new Error('API returned error');
      ratesCache[base] = data.rates;
      cacheTimes[base] = now;

      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ currencyCache: { rates: ratesCache, times: cacheTimes } });
      }

      const updateDate = data.time_last_update_utc ? data.time_last_update_utc.split(' 00:')[0] : 'N/A';
      statusEl.textContent = `Cập nhật: ${updateDate}`;
      statusEl.className = 'currency-status';
      return data.rates;
    } catch (err) {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        return new Promise((resolve) => {
          chrome.storage.local.get('currencyCache', (result) => {
            if (result.currencyCache) {
              ratesCache = result.currencyCache.rates;
              cacheTimes = result.currencyCache.times || {};
              statusEl.textContent = 'Sử dụng tỉ giá đã lưu';
              statusEl.className = 'currency-status';
              resolve(ratesCache[base] || null);
            } else {
              statusEl.textContent = 'Không thể tải tỉ giá. Kiểm tra mạng.';
              statusEl.className = 'currency-status error';
              resolve(null);
            }
          });
        });
      }
      statusEl.textContent = 'Không thể tải tỉ giá. Kiểm tra mạng.';
      statusEl.className = 'currency-status error';
      return null;
    }
  }

  async function convert() {
    const amount = parseFloat(amountInput.value);
    if (isNaN(amount) || amount < 0) {
      resultEl.textContent = '—';
      rateInfo.textContent = '';
      return;
    }

    const from = fromSelect.value;
    const to = toSelect.value;

    if (from === to) {
      resultEl.textContent = formatCurrency(amount, to);
      rateInfo.textContent = '1:1';
      return;
    }

    const rates = await fetchRates(from);
    if (!rates || !rates[to]) {
      resultEl.textContent = 'N/A';
      return;
    }

    const rate = rates[to];
    const result = amount * rate;
    resultEl.textContent = formatCurrency(result, to);
    rateInfo.textContent = `1 ${from} = ${rate.toLocaleString('vi-VN', { maximumFractionDigits: 4 })} ${to}`;
  }

  // Event listeners
  let debounceTimer;
  amountInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(convert, 300);
  });
  fromSelect.addEventListener('change', convert);
  toSelect.addEventListener('change', convert);

  swapBtn.addEventListener('click', () => {
    const temp = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = temp;
    convert();
  });

  convert();
}

// ══════════════════════════
//  TAB 3: QUICK MESSAGES
// ══════════════════════════
function initQuickMessages() {
  const listEl = document.getElementById('qm-list');
  const addSection = document.getElementById('qm-add-section');
  const addBtn = document.getElementById('qm-add-btn');
  const saveBtn = document.getElementById('qm-save-btn');
  const cancelBtn = document.getElementById('qm-cancel-btn');
  const shortcutInput = document.getElementById('qm-new-shortcut');
  const textInput = document.getElementById('qm-new-text');

  let templates = JSON.parse(JSON.stringify(DEFAULT_QM_TEMPLATES));
  let currentCat = 'greeting';

  function loadTemplates() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.get('quickMessages', (result) => {
        if (result.quickMessages) {
          templates.custom = result.quickMessages;
        }
        renderList();
      });
    } else {
      const saved = localStorage.getItem('quickMessages');
      if (saved) templates.custom = JSON.parse(saved);
      renderList();
    }
  }

  function saveCustomTemplates() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.set({ quickMessages: templates.custom });
    } else {
      localStorage.setItem('quickMessages', JSON.stringify(templates.custom));
    }
  }

  function renderList() {
    const items = templates[currentCat] || [];
    const isCustom = currentCat === 'custom';

    if (items.length === 0) {
      listEl.innerHTML = `<div style="text-align:center;color:var(--text-muted);padding:20px;font-size:12px;">
        ${isCustom ? 'Chưa có tin nhanh tùy chỉnh. Nhấn "Thêm" để tạo!' : 'Không có mẫu tin.'}
      </div>`;
      return;
    }

    listEl.innerHTML = items.map((item, idx) => `
      <div class="qm-item" data-idx="${idx}">
        ${item.shortcut ? `<span class="qm-item-shortcut">${escapeHtml(item.shortcut)}</span>` : ''}
        <span class="qm-item-text">${escapeHtml(item.text)}</span>
        <div class="qm-item-actions">
          <button class="qm-item-btn copy-btn" data-copy="${idx}" title="Copy">📋</button>
          <button class="qm-item-btn paste-btn" data-paste="${idx}" title="Paste vào chat Zalo">💬</button>
          ${isCustom ? `<button class="qm-item-btn delete-btn" data-del="${idx}" title="Xóa">🗑</button>` : ''}
        </div>
      </div>
    `).join('');

    // Copy handlers
    listEl.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.copy, 10);
        copyToClipboard(items[idx].text).then(() => showToast('Đã copy!'));
      });
    });

    // Delete handlers
    listEl.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.del, 10);
        templates.custom.splice(idx, 1);
        saveCustomTemplates();
        renderList();
        showToast('Đã xóa!');
      });
    });

    // Paste to chat handlers
    listEl.querySelectorAll('.paste-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.paste, 10);
        const text = items[idx].text;
        if (typeof chrome !== 'undefined' && chrome.runtime) {
          chrome.runtime.sendMessage({ type: 'PASTE_TO_ZALO', text }, (response) => {
            if (response && response.ok) {
              showToast('Đã paste vào chat!');
            } else {
              copyToClipboard(text).then(() => showToast('Đã copy! Ctrl+V để paste'));
            }
          });
        } else {
          copyToClipboard(text).then(() => showToast('Đã copy! Ctrl+V để paste'));
        }
      });
    });

    // Click to copy
    listEl.querySelectorAll('.qm-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.dataset.idx, 10);
        copyToClipboard(items[idx].text).then(() => showToast('Đã copy!'));
      });
    });
  }

  // Category switching
  document.querySelectorAll('.qm-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.qm-cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCat = btn.dataset.cat;
      addBtn.style.display = currentCat === 'custom' ? 'block' : 'none';
      renderList();
    });
  });

  // Add new template
  addBtn.addEventListener('click', () => {
    addSection.style.display = 'block';
    addBtn.style.display = 'none';
    shortcutInput.focus();
  });

  cancelBtn.addEventListener('click', () => {
    addSection.style.display = 'none';
    addBtn.style.display = 'block';
    shortcutInput.value = '';
    textInput.value = '';
  });

  saveBtn.addEventListener('click', () => {
    const text = textInput.value.trim();
    if (!text) {
      showToast('Vui lòng nhập nội dung!');
      return;
    }
    const shortcut = shortcutInput.value.trim();
    templates.custom.push({ shortcut: shortcut || '', text });
    saveCustomTemplates();
    renderList();
    shortcutInput.value = '';
    textInput.value = '';
    addSection.style.display = 'none';
    addBtn.style.display = 'block';
    showToast('Đã thêm tin nhanh!');
  });

  addBtn.style.display = 'none';
  loadTemplates();
}

// ══════════════════════════
//  TAB 4: POMODORO TIMER
// ══════════════════════════
function initPomodoro() {
  const timeDisplay = document.getElementById('pomo-time');
  const labelDisplay = document.getElementById('pomo-label');
  const startBtn = document.getElementById('pomo-start');
  const resetBtn = document.getElementById('pomo-reset');
  const workInput = document.getElementById('pomo-work');
  const breakInput = document.getElementById('pomo-break');
  const sessionsDisplay = document.getElementById('pomo-sessions');
  const progressCircle = document.getElementById('pomo-progress');

  const circumference = 2 * Math.PI * 90;
  progressCircle.style.strokeDasharray = circumference;

  let isRunning = false;
  let isBreak = false;
  let timeLeft = 25 * 60;
  let totalTime = 25 * 60;
  let sessions = 0;
  let intervalId = null;

  // Restore state from storage
  loadPomodoroState((state, savedSessions) => {
    sessions = savedSessions;
    sessionsDisplay.textContent = sessions;

    if (state) {
      isBreak = state.isBreak || false;
      const elapsed = state.endTime ? Math.max(0, Math.floor((state.endTime - Date.now()) / 1000)) : 0;
      if (state.isRunning && elapsed > 0) {
        timeLeft = elapsed;
        totalTime = state.totalTime || timeLeft;
        isRunning = true;
        startBtn.textContent = '⏸ Tạm dừng';
        startBtn.classList.add('running');
        intervalId = setInterval(tick, 1000);
      } else if (state.timeLeft) {
        timeLeft = state.timeLeft;
        totalTime = state.totalTime || timeLeft;
      }
      updateDisplay();
    }
  });

  function persistState() {
    savePomodoroState({
      isRunning,
      isBreak,
      timeLeft,
      totalTime,
      endTime: isRunning ? Date.now() + timeLeft * 1000 : null,
    });
  }

  function updateDisplay() {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    timeDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    const progress = 1 - (timeLeft / totalTime);
    const offset = circumference * (1 - progress);
    progressCircle.style.strokeDashoffset = offset;

    progressCircle.style.stroke = isBreak ? '#3fb950' : '#0068FF';
    labelDisplay.textContent = isBreak ? 'Nghỉ ngơi' : 'Làm việc';
    labelDisplay.className = 'pomo-label' + (isBreak ? ' break' : '');
  }

  function tick() {
    if (timeLeft <= 0) {
      clearInterval(intervalId);
      isRunning = false;
      startBtn.textContent = '▶ Bắt đầu';
      startBtn.classList.remove('running');

      if (!isBreak) {
        sessions++;
        sessionsDisplay.textContent = sessions;
        savePomodoroSessions(sessions);

        if (typeof chrome !== 'undefined' && chrome.notifications) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'Pomodoro hoàn thành!',
            message: `Phiên làm việc #${sessions} kết thúc. Nghỉ ngơi ${breakInput.value} phút nhé!`
          });
        }
        showToast('Hoàn thành! Nghỉ ngơi thôi!');
        isBreak = true;
        timeLeft = parseInt(breakInput.value, 10) * 60;
        totalTime = timeLeft;
      } else {
        showToast('Hết giờ nghỉ! Sẵn sàng làm việc!');
        isBreak = false;
        timeLeft = parseInt(workInput.value, 10) * 60;
        totalTime = timeLeft;
      }
      persistState();
      updateDisplay();
      return;
    }
    timeLeft--;
    updateDisplay();
  }

  startBtn.addEventListener('click', () => {
    if (isRunning) {
      clearInterval(intervalId);
      isRunning = false;
      startBtn.textContent = '▶ Tiếp tục';
      startBtn.classList.remove('running');
    } else {
      isRunning = true;
      startBtn.textContent = '⏸ Tạm dừng';
      startBtn.classList.add('running');
      intervalId = setInterval(tick, 1000);
    }
    persistState();
  });

  resetBtn.addEventListener('click', () => {
    clearInterval(intervalId);
    isRunning = false;
    isBreak = false;
    timeLeft = parseInt(workInput.value, 10) * 60;
    totalTime = timeLeft;
    startBtn.textContent = '▶ Bắt đầu';
    startBtn.classList.remove('running');
    persistState();
    updateDisplay();
  });

  workInput.addEventListener('change', () => {
    if (!isRunning && !isBreak) {
      timeLeft = parseInt(workInput.value, 10) * 60;
      totalTime = timeLeft;
      persistState();
      updateDisplay();
    }
  });

  breakInput.addEventListener('change', () => {
    if (!isRunning && isBreak) {
      timeLeft = parseInt(breakInput.value, 10) * 60;
      totalTime = timeLeft;
      persistState();
      updateDisplay();
    }
  });

  updateDisplay();
}

// ══════════════════════════
//  TAB 5: QUICK TRANSLATE
// ══════════════════════════
function initTranslate() {
  const fromSelect = document.getElementById('trans-from');
  const toSelect = document.getElementById('trans-to');
  const swapBtn = document.getElementById('trans-swap');
  const inputEl = document.getElementById('trans-input');
  const translateBtn = document.getElementById('trans-btn');
  const resultCard = document.getElementById('trans-result-card');
  const resultText = document.getElementById('trans-result');
  const copyBtn = document.getElementById('trans-copy');
  const statusEl = document.getElementById('trans-status');

  const charcountEl = document.getElementById('trans-charcount');
  const historyContainer = document.getElementById('trans-history');
  const historyListEl = document.getElementById('trans-history-list');
  const historyClearBtn = document.getElementById('trans-history-clear');

  let transHistory = [];

  // Load translate history
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get('transHistory', (r) => {
      if (r.transHistory) {
        transHistory = r.transHistory;
        renderTransHistory();
      }
    });
  }

  function saveTransHistory() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ transHistory });
    }
  }

  function renderTransHistory() {
    if (transHistory.length === 0) {
      historyContainer.style.display = 'none';
      return;
    }
    historyContainer.style.display = 'block';
    historyListEl.innerHTML = transHistory.map((h, i) =>
      `<div class="trans-history-item" data-tidx="${i}" title="Click để dùng lại">
        <div class="trans-history-src">${escapeHtml(h.src.length > 40 ? h.src.slice(0, 40) + '...' : h.src)}</div>
        <div class="trans-history-dst">${escapeHtml(h.dst.length > 40 ? h.dst.slice(0, 40) + '...' : h.dst)}</div>
      </div>`
    ).join('');

    historyListEl.querySelectorAll('.trans-history-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.dataset.tidx, 10);
        const h = transHistory[idx];
        inputEl.value = h.src;
        resultText.textContent = h.dst;
        resultCard.style.display = 'block';
        charcountEl.textContent = `${h.src.length} / 5.000`;
      });
    });
  }

  historyClearBtn.addEventListener('click', () => {
    transHistory = [];
    saveTransHistory();
    renderTransHistory();
    showToast('Đã xóa lịch sử!');
  });

  // Character counter
  inputEl.addEventListener('input', () => {
    const len = inputEl.value.length;
    charcountEl.textContent = `${len.toLocaleString('vi-VN')} / 5.000`;
    charcountEl.classList.toggle('warning', len > 4500);
  });

  swapBtn.addEventListener('click', () => {
    const from = fromSelect.value;
    const to = toSelect.value;
    if (from === 'auto') {
      showToast('Không thể đặt "Tự nhận diện" làm ngôn ngữ đích');
      return;
    }
    fromSelect.value = to;
    toSelect.value = from;
  });

  translateBtn.addEventListener('click', async () => {
    const text = inputEl.value.trim();
    if (!text) {
      showToast('Vui lòng nhập văn bản!');
      return;
    }

    const from = fromSelect.value;
    const to = toSelect.value;

    if (from === to) {
      resultText.textContent = text;
      resultCard.style.display = 'block';
      return;
    }

    translateBtn.disabled = true;
    translateBtn.textContent = 'Đang dịch...';
    statusEl.textContent = '';

    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
      const resp = await fetchWithTimeout(url);
      if (!resp.ok) throw new Error('API Error');
      const data = await resp.json();
      const translated = data[0].map(s => s[0]).join('');
      resultText.textContent = translated;
      resultCard.style.display = 'block';

      // Save to history
      transHistory.unshift({ src: text, dst: translated, from, to, time: Date.now() });
      if (transHistory.length > 20) transHistory.pop();
      saveTransHistory();
      renderTransHistory();
    } catch (err) {
      statusEl.textContent = 'Lỗi: ' + err.message;
      resultCard.style.display = 'none';
    }

    translateBtn.disabled = false;
    translateBtn.textContent = 'Dịch';
  });

  copyBtn.addEventListener('click', () => {
    copyToClipboard(resultText.textContent).then(() => showToast('Đã copy!'));
  });

  inputEl.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      translateBtn.click();
    }
  });
}

// ══════════════════════════
//  TAB 6: DONATE
// ══════════════════════════
function initDonate() {
  document.querySelectorAll('.donate-copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      copyToClipboard(btn.dataset.copy).then(() => showToast('Đã copy!'));
    });
  });
}

// ══════════════════════════
//  KEYBOARD SHORTCUTS PANEL
// ══════════════════════════
function initShortcuts() {
  const panel = document.getElementById('shortcuts-panel');
  const toggleBtn = document.getElementById('shortcuts-toggle');
  if (!panel || !toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    toggleBtn.classList.toggle('active', !panel.hidden);
  });
}

// ══════════════════════════
//  EXPORT / IMPORT SETTINGS
// ══════════════════════════
function initExportImport() {
  const exportBtn = document.getElementById('export-settings');
  const importBtn = document.getElementById('import-settings');
  const importFile = document.getElementById('import-file');
  if (!exportBtn || !importBtn || !importFile) return;

  exportBtn.addEventListener('click', () => {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      showToast('Không khả dụng ngoài extension');
      return;
    }
    chrome.storage.sync.get(null, (syncData) => {
      chrome.storage.local.get(null, (localData) => {
        const exportObj = {
          _version: '1.0.0',
          _exportedAt: new Date().toISOString(),
          sync: syncData,
          local: localData
        };
        const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zalo-utility-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Đã xuất cài đặt');
      });
    });
  });

  importBtn.addEventListener('click', () => importFile.click());

  importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data._version || !data.sync || !data.local) {
          showToast('File không hợp lệ');
          return;
        }
        if (typeof chrome === 'undefined' || !chrome.storage) {
          showToast('Không khả dụng ngoài extension');
          return;
        }
        chrome.storage.sync.set(data.sync, () => {
          chrome.storage.local.set(data.local, () => {
            showToast('Đã nhập cài đặt — đang tải lại...');
            setTimeout(() => location.reload(), 800);
          });
        });
      } catch (err) {
        showToast('Lỗi đọc file: ' + err.message);
      }
    };
    reader.readAsText(file);
    importFile.value = '';
  });
}

// ══════════════════════════
//  AUTO VERSION BADGE
// ══════════════════════════
function initVersionBadge() {
  const badge = document.querySelector('.version-badge');
  if (!badge) return;
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
    badge.textContent = 'v' + chrome.runtime.getManifest().version;
  }
}

// ══════════════════════════
//  ACCESSIBILITY
// ══════════════════════════
function initAccessibility() {
  // Modal
  const modal = document.getElementById('shortcuts-overlay');
  if (modal) {
    const card = modal.querySelector('.modal-card');
    if (card) {
      card.setAttribute('role', 'dialog');
      card.setAttribute('aria-modal', 'true');
      card.setAttribute('aria-label', 'Phím tắt');
    }
  }

  // Tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    if (!btn.getAttribute('aria-label')) {
      btn.setAttribute('aria-label', btn.textContent.trim() || btn.title);
    }
  });

  // Header icon buttons
  document.querySelectorAll('.header-icon-btn').forEach(btn => {
    if (!btn.getAttribute('aria-label')) {
      btn.setAttribute('aria-label', btn.title || 'Phím tắt');
    }
  });

  // Footer buttons
  document.querySelectorAll('.footer-btn').forEach(btn => {
    if (!btn.getAttribute('aria-label')) {
      btn.setAttribute('aria-label', btn.title || btn.textContent.trim());
    }
  });
}
