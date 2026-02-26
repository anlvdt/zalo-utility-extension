# Zalo Utility - Tien ich Zalo

**Calculator, Currency Converter, News Aggregator, Quick Messages, Pomodoro Timer & Translator for Zalo Web.**

A Chrome extension that adds a floating utility panel directly inside Zalo Web (chat.zalo.me), providing essential productivity tools without leaving your chat window.

---

## The Story | Cau chuyen

Zalo is the most popular messaging app in Vietnam with over 70 million users. Many people spend their entire workday on Zalo Web -- chatting with customers, coordinating with colleagues, handling orders. But every time you need to do a quick calculation, check an exchange rate, translate a message, or read the news, you have to switch tabs. That breaks your flow.

I built Zalo Utility because I kept losing focus. As someone who runs a laptop business on Zalo, I found myself constantly switching between the calculator app, Google Translate, currency converter websites, and news tabs -- all while trying to keep up with customer messages. Each context switch was small, but they added up to hours of lost productivity every week.

The idea was simple: what if all these micro-tools lived right inside Zalo? No new tabs. No alt-tabbing. No breaking the conversation flow. Just a small floating button in the corner that opens a panel with everything you need.

What started as a personal calculator widget grew into a full toolkit after I realized my colleagues had the same problem. Quick message templates were added when I got tired of typing "Da, em xac nhan da nhan duoc thong tin" for the hundredth time. The currency converter came when a customer asked about USD pricing and I had to fumble for the current rate. The Pomodoro timer was for those days when Zalo notifications never stop and you need structured focus time.

Every feature in this extension exists because of a real moment of frustration turned into a solution.

---

## Features | Tinh nang

### Calculator
A full calculator with expression display, keyboard support, and one-click paste to chat. Supports addition, subtraction, multiplication, division, modulo, and parentheses. Results can be pasted directly into the active Zalo conversation.

### Multi-Source News Aggregator
Aggregates news from four major Vietnamese sources: VnExpress, Tuoi Tre, Thanh Nien, and Dan Tri. Articles are merged and sorted by time across seven categories (Trending, World, Business, Technology, Sports, Entertainment, Health). Infinite scroll automatically loads the next category when the current one is exhausted.

### Currency Converter & Market Rates
Live exchange rates from Vietcombank (buy/sell spreads) and gold prices from GoldPrice.org. Built-in converter supports 12 currencies (VND, USD, EUR, JPY, KRW, CNY, GBP, SGD, THB, AUD, CAD, TWD). Rates auto-refresh every 5 minutes.

### Quick Messages
Pre-defined and custom message templates that expand inline. Type a shortcut like `/chao` followed by Space, and it expands to your full greeting message. Includes built-in templates for greetings, business, support, and thank-you messages. Custom templates sync across sessions via Chrome Storage.

### Mini Translator
Translate text between Vietnamese, English, Chinese, Japanese, and Korean using Google Translate. Supports auto-detect source language. Translated text can be pasted directly into the chat.

### Pomodoro Timer
Work/break timer with circular progress ring, configurable durations (25/30/45/50 minute work, 5/10/15 minute break), session counter, and Chrome notification when a session ends. Timer state persists across page reloads.

### Privacy Blur
Toggle chat content blur with Alt+B. Messages become unreadable until you hover over them. Useful in public spaces or shared screens.

---

## Installation | Cai dat

### From Source (Developer)
1. Clone this repository
2. Open `chrome://extensions/` in Chrome
3. Enable "Developer mode" (top right)
4. Click "Load unpacked" and select the project folder
5. Open [Zalo Web](https://chat.zalo.me) -- the floating button appears at the bottom right

### From Chrome Web Store
Coming soon.

---

## Keyboard Shortcuts | Phim tat

| Shortcut | Action |
|----------|--------|
| `Alt + B` | Toggle Privacy Blur |
| `Ctrl + Enter` | Translate input text |
| `/command + Space` | Expand quick message template |
| `Esc` | Close the utility panel |
| `0-9`, `.`, `+-*/` | Calculator input (when Calculator tab is active) |
| `Enter` | Calculate result |
| `Backspace` | Delete last character |

---

## Technical Details | Chi tiet ky thuat

- **Manifest V3** (Chrome Extension standard)
- **Content Security Policy compliant** -- no eval(), no inline scripts
- **Vietnamese IME safe** -- all keyboard handlers check `isComposing` to prevent conflicts with Telex/VNI input
- **Zero dependencies** -- pure vanilla JavaScript, no frameworks, no build step
- **Lightweight** -- total extension size under 80KB
- **Dark/Light mode** -- auto-detects Zalo's theme and matches

### Architecture
```
manifest.json        Extension configuration (MV3)
shared.js            Shared utilities, constants, math parser
content.js           FAB panel injected into Zalo Web
content.css          Panel styling with CSS variables
popup.html/css/js    Extension popup (standalone tools)
background.js        Service worker (alarms, CORS proxy, message routing)
```

### Permissions
| Permission | Purpose |
|------------|---------|
| `storage` | Save templates, timer state, preferences |
| `alarms` | Pomodoro timer background countdown |
| `notifications` | Pomodoro completion alert |
| `activeTab` | Paste results into active Zalo tab |

All network requests are limited to specific APIs (translate, exchange rates, news RSS feeds, gold prices). No user data is collected or transmitted.

---

## Author | Tac gia

**Le Van An** (Vietnam IT)

[![GitHub](https://img.shields.io/badge/GitHub-@anlvdt-181717?style=for-the-badge&logo=github)](https://github.com/anlvdt)
[![Facebook](https://img.shields.io/badge/Facebook-Laptop%20Le%20An-1877F2?style=for-the-badge&logo=facebook&logoColor=white)](https://www.facebook.com/laptopleandotcom)

---

## Support the Developer | Ung ho tac gia

If you find this extension useful, consider supporting its development:

| Method | Account | Name |
|--------|---------|------|
| **MB Bank** | `0360126996868` | LE VAN AN |
| **Momo** | `0976896621` | LE VAN AN |

### Support via Shopee Affiliate

> You can support by just clicking the link -- no purchase required.
>
> Ban co the ho tro chi bang cach click link -- khong can mua hang.

[![Shopee](https://img.shields.io/badge/Shopee-Laptop%20Le%20An-EE4D2D?style=for-the-badge&logo=shopee&logoColor=white)](https://collshp.com/laptopleandotcom?view=storefront)

---

## License | Giay phep

MIT License. See [LICENSE](LICENSE) for details.
