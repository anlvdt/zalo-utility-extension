/* ============================================
   ZALO UTILITY - Background Service Worker
   ============================================ */

// Handle Pomodoro alarm
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'pomodoro-end') {
        chrome.notifications.create('pomo-done', {
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'Pomodoro hoàn thành!',
            message: 'Phiên làm việc kết thúc. Nghỉ ngơi thôi!'
        });
    }
});

// Handle notification click
chrome.notifications.onClicked.addListener((notificationId) => {
    chrome.notifications.clear(notificationId);
});

// Listen for messages from popup or content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'PASTE_TO_ZALO') {
        // Forward to content script on active tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].url && tabs[0].url.includes('chat.zalo.me')) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    type: 'PASTE_TEXT',
                    text: message.text
                }, (response) => {
                    // Must check lastError to prevent "Unchecked runtime.lastError"
                    if (chrome.runtime.lastError) {
                        sendResponse({ success: false, error: chrome.runtime.lastError.message });
                        return;
                    }
                    sendResponse(response || { success: false });
                });
            } else {
                sendResponse({ success: false, error: 'Zalo Web chưa mở' });
            }
        });
        return true;
    }

    // Proxy fetch for content scripts (bypasses CORS)
    if (message.type === 'FETCH_URL') {
        fetch(message.url)
            .then(res => res.text())
            .then(text => {
                let json = null;
                try { json = JSON.parse(text); } catch (e) { /* not JSON */ }
                sendResponse({ ok: true, text, json });
            })
            .catch(err => sendResponse({ ok: false, error: err.message }));
        return true; // async
    }
});
