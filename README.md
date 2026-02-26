# Zalo Utility - Tiện ích Zalo

**Calculator, Currency Converter, News Aggregator, Quick Messages, Pomodoro Timer & Translator for Zalo Web.**

**Máy tính, Quy đổi tiền tệ, Tổng hợp tin tức, Tin nhắn mẫu, Pomodoro & Dịch nhanh cho Zalo Web.**

A Chrome extension that adds a floating utility panel directly inside Zalo Web (chat.zalo.me), providing essential productivity tools without leaving your chat window.

Một tiện ích mở rộng Chrome tích hợp bảng công cụ nổi trực tiếp trong Zalo Web (chat.zalo.me), cung cấp các công cụ hỗ trợ năng suất mà không cần rời khỏi cửa sổ chat.

---

## The Story | Câu chuyện

Zalo is the most popular messaging app in Vietnam with over 70 million users. Many people spend their entire workday on Zalo Web -- chatting with customers, coordinating with colleagues, handling orders. But every time you need to do a quick calculation, check an exchange rate, translate a message, or read the news, you have to switch tabs. That breaks your flow.

Zalo là ứng dụng nhắn tin phổ biến nhất Việt Nam với hơn 70 triệu người dùng. Rất nhiều người dành cả ngày làm việc trên Zalo Web -- trò chuyện với khách hàng, phối hợp với đồng nghiệp, xử lý đơn hàng. Nhưng mỗi khi cần tính toán nhanh, kiểm tra tỉ giá, dịch một tin nhắn, hay đọc tin tức, bạn đều phải chuyển tab. Điều đó phá vỡ dòng tập trung của bạn.

I built Zalo Utility because I kept losing focus. As someone who runs a laptop business on Zalo, I found myself constantly switching between the calculator app, Google Translate, currency converter websites, and news tabs -- all while trying to keep up with customer messages. Each context switch was small, but they added up to hours of lost productivity every week.

Tôi xây dựng Zalo Utility vì liên tục bị mất tập trung. Là người kinh doanh laptop trên Zalo, tôi thường xuyên phải chuyển qua chuyển lại giữa máy tính, Google Translate, trang web tỉ giá, và các tab tin tức -- tất cả trong khi cố gắng theo kịp tin nhắn khách hàng. Mỗi lần chuyển ngữ cảnh rất nhỏ, nhưng cộng dồn lại là hàng giờ mất năng suất mỗi tuần.

The idea was simple: what if all these micro-tools lived right inside Zalo? No new tabs. No alt-tabbing. No breaking the conversation flow. Just a small floating button in the corner that opens a panel with everything you need.

Ý tưởng rất đơn giản: nếu tất cả những công cụ nhỏ này nằm ngay trong Zalo thì sao? Không cần tab mới. Không cần alt-tab. Không phá vỡ cuộc trò chuyện. Chỉ một nút nhỏ góc màn hình, mở ra bảng công cụ với mọi thứ bạn cần.

What started as a personal calculator widget grew into a full toolkit after I realized my colleagues had the same problem. Quick message templates were added when I got tired of typing the same replies hundreds of times a day. The currency converter came when a customer asked about USD pricing and I had to fumble for the current rate. The Pomodoro timer was for those days when Zalo notifications never stop and you need structured focus time.

Từ một widget máy tính cá nhân, nó phát triển thành bộ công cụ hoàn chỉnh khi tôi nhận ra đồng nghiệp cũng gặp vấn đề tương tự. Tin nhắn mẫu được thêm khi tôi mệt mỏi vì phải gõ đi gõ lại cùng một câu trả lời hàng trăm lần mỗi ngày. Quy đổi tiền tệ ra đời khi khách hàng hỏi giá USD và tôi phải loay hoay tìm tỉ giá hiện tại. Đồng hồ Pomodoro dành cho những ngày mà thông báo Zalo không bao giờ dừng và bạn cần thời gian tập trung có cấu trúc.

Every feature in this extension exists because of a real moment of frustration turned into a solution.

Mọi tính năng trong tiện ích này đều xuất phát từ một khoảnh khắc bực bội thực sự, được biến thành giải pháp.

---

## Features | Tính năng

### Calculator | Máy tính
A full calculator with expression display, keyboard support, and one-click paste to chat. Supports addition, subtraction, multiplication, division, modulo, and parentheses. Results can be pasted directly into the active Zalo conversation.

Máy tính đầy đủ với hiển thị biểu thức, hỗ trợ bàn phím, và nút dán kết quả vào chat chỉ với một cú click. Hỗ trợ cộng, trừ, nhân, chia, chia lấy dư và ngoặc đơn. Kết quả có thể dán trực tiếp vào cuộc trò chuyện Zalo đang mở.

### Multi-Source News | Tổng hợp tin tức
Aggregates news from four major Vietnamese sources: VnExpress, Tuoi Tre, Thanh Nien, and Dan Tri. Articles are merged and sorted by time across seven categories (Trending, World, Business, Technology, Sports, Entertainment, Health). Infinite scroll automatically loads the next category when the current one is exhausted.

Tổng hợp tin tức từ bốn nguồn lớn: VnExpress, Tuổi Trẻ, Thanh Niên và Dân Trí. Các bài viết được gộp chung và sắp xếp theo thời gian qua bảy chuyên mục (Nổi bật, Thế giới, Kinh doanh, Công nghệ, Thể thao, Giải trí, Sức khỏe). Cuộn vô hạn tự động tải chuyên mục tiếp theo khi hết tin ở chuyên mục hiện tại.

### Currency & Market | Tỉ giá & Thị trường
Live exchange rates from Vietcombank (buy/sell spreads) and gold prices from GoldPrice.org. Built-in converter supports 12 currencies. Rates auto-refresh every 5 minutes.

Tỉ giá trực tiếp từ Vietcombank (giá mua/bán) và giá vàng từ GoldPrice.org. Bộ quy đổi tích hợp hỗ trợ 12 loại tiền tệ. Tỉ giá tự động làm mới mỗi 5 phút.

### Quick Messages | Tin nhắn mẫu
Pre-defined and custom message templates that expand inline. Type a shortcut like `/chao` followed by Space, and it expands to your full greeting message. Custom templates sync across sessions via Chrome Storage.

Các mẫu tin nhắn có sẵn và tùy chỉnh, mở rộng trực tiếp trong khung chat. Gõ phím tắt như `/chao` rồi nhấn Space, nó sẽ mở rộng thành câu chào đầy đủ. Mẫu tùy chỉnh đồng bộ qua các phiên làm việc nhờ Chrome Storage.

### Mini Translator | Dịch nhanh
Translate text between Vietnamese, English, Chinese, Japanese, and Korean using Google Translate. Supports auto-detect source language. Translated text can be pasted directly into the chat.

Dịch văn bản giữa tiếng Việt, Anh, Trung, Nhật và Hàn bằng Google Translate. Hỗ trợ tự động nhận diện ngôn ngữ nguồn. Bản dịch có thể dán trực tiếp vào khung chat.

### Pomodoro Timer | Đồng hồ Pomodoro
Work/break timer with circular progress ring, configurable durations, session counter, and Chrome notification when a session ends. Timer state persists across page reloads.

Đồng hồ làm việc/nghỉ ngơi với vòng tiến trình, thời lượng tùy chỉnh, đếm phiên, và thông báo Chrome khi kết thúc. Trạng thái bộ đếm được lưu qua các lần tải lại trang.

### Privacy Blur | Làm mờ riêng tư
Toggle chat content blur with Alt+B. Messages become unreadable until you hover over them. Useful in public spaces or shared screens.

Bật/tắt làm mờ nội dung chat bằng Alt+B. Tin nhắn trở nên không thể đọc cho đến khi bạn rê chuột qua. Hữu ích khi ở nơi công cộng hoặc dùng chung màn hình.

---

## Installation | Cài đặt

### From Source | Từ mã nguồn
1. Clone this repository | Clone kho mã nguồn này
2. Open `chrome://extensions/` in Chrome | Mở `chrome://extensions/` trên Chrome
3. Enable "Developer mode" (top right) | Bật "Chế độ nhà phát triển" (góc phải trên)
4. Click "Load unpacked" and select the project folder | Nhấn "Tải tiện ích đã giải nén" và chọn thư mục dự án
5. Open [Zalo Web](https://chat.zalo.me) -- the floating button appears at the bottom right | Mở [Zalo Web](https://chat.zalo.me) -- nút nổi xuất hiện ở góc dưới bên phải

### From Chrome Web Store | Từ Chrome Web Store
Coming soon. | Sắp có.

---

## Keyboard Shortcuts | Phím tắt

| Shortcut | Action | Hành động |
|----------|--------|-----------|
| `Alt + B` | Toggle Privacy Blur | Bật/tắt làm mờ riêng tư |
| `Ctrl + Enter` | Translate input text | Dịch văn bản đã nhập |
| `/command + Space` | Expand quick message | Mở rộng tin nhắn mẫu |
| `Esc` | Close the panel | Đóng bảng công cụ |
| `0-9`, `.`, `+-*/` | Calculator input | Nhập máy tính |
| `Enter` | Calculate result | Tính kết quả |
| `Backspace` | Delete last character | Xóa ký tự cuối |

---

## Technical Details | Chi tiết kỹ thuật

- **Manifest V3** -- Chrome Extension standard | Tiêu chuẩn tiện ích Chrome
- **CSP compliant** -- no eval(), no inline scripts | Không dùng eval(), không inline script
- **Vietnamese IME safe** -- all keyboard handlers check `isComposing` | Tương thích bộ gõ tiếng Việt
- **Zero dependencies** -- pure vanilla JavaScript | Không phụ thuộc thư viện bên ngoài
- **Lightweight** -- total size under 80KB | Dung lượng dưới 80KB
- **Auto theme** -- matches Zalo's dark/light mode | Tự động khớp giao diện sáng/tối

### Architecture | Kiến trúc
```
manifest.json        Extension config | Cấu hình tiện ích
shared.js            Shared utilities & constants | Hàm dùng chung & hằng số
content.js           FAB panel on Zalo Web | Bảng công cụ trên Zalo Web
content.css          Panel styling | Giao diện bảng công cụ
popup.html/css/js    Extension popup | Popup tiện ích
background.js        Service worker | Worker nền
```

### Permissions | Quyền truy cập
| Permission | Purpose | Mục đích |
|------------|---------|----------|
| `storage` | Save templates, timer, preferences | Lưu mẫu tin, bộ đếm, tùy chọn |
| `alarms` | Pomodoro background countdown | Đếm ngược Pomodoro nền |
| `notifications` | Pomodoro completion alert | Thông báo hoàn thành Pomodoro |
| `activeTab` | Paste results into Zalo | Dán kết quả vào Zalo |

All network requests are limited to specific APIs. No user data is collected or transmitted.

Mọi yêu cầu mạng chỉ giới hạn ở các API cụ thể. Không thu thập hay truyền dữ liệu người dùng.

---

## Author | Tác giả

**Le Van An** (Vietnam IT)

[![GitHub](https://img.shields.io/badge/GitHub-@anlvdt-181717?style=for-the-badge&logo=github)](https://github.com/anlvdt)
[![Facebook](https://img.shields.io/badge/Facebook-Laptop%20Le%20An-1877F2?style=for-the-badge&logo=facebook&logoColor=white)](https://www.facebook.com/laptopleandotcom)

---

## Support the Developer | Ủng hộ tác giả

If you find this extension useful, consider supporting its development.

Nếu bạn thấy tiện ích này hữu ích, hãy cân nhắc ủng hộ tác giả.

| Method | Account | Name |
|--------|---------|------|
| **MB Bank** | `0360126996868` | LE VAN AN |
| **Momo** | `0976896621` | LE VAN AN |

### Shopee Affiliate

> You can support by just clicking the link -- no purchase required.
>
> Bạn có thể hỗ trợ chỉ bằng cách nhấn vào liên kết -- không cần mua hàng.

[![Shopee](https://img.shields.io/badge/Shopee-Laptop%20Le%20An-EE4D2D?style=for-the-badge&logo=shopee&logoColor=white)](https://collshp.com/laptopleandotcom?view=storefront)

---

## License | Giấy phép

MIT License. See [LICENSE](LICENSE) for details.

Giấy phép MIT. Xem [LICENSE](LICENSE) để biết chi tiết.
