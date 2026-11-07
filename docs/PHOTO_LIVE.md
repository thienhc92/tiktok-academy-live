# Chùa Online LIVE 2D trên ảnh đã chọn

Chủ sở hữu đã chọn ảnh chính điện trên iPad và yêu cầu tiếp tục theo giao diện
chùa trực tuyến trong ảnh TikTok tham khảo. Bản này dùng lại ảnh từ IndexedDB
`chua-online-photo-v1`, không đổi schema/blob và không upload ảnh. Không cần gửi
lại ảnh để dùng overlay trên cùng thiết bị và cùng URL preview.

## Bố cục và thao tác

- Mặc định khung 9:16: ảnh chính điện nguyên tỉ lệ trong vùng trên, phần sàn CSS
  màu gỗ mở rộng phía dưới. Ảnh không được chỉnh sửa nội dung. Tùy chọn phủ kín
  cũ vẫn là thao tác rõ ràng có cảnh báo cắt mép.
- 20 khách mô phỏng ban đầu, tối đa 24, dùng roster ID và sprite có sẵn từ mô phỏng
  cũ; bốn hàng tên cách nhau, không tràn ngang/đè hàng nút. Các sprite là artwork
  được tạo ở mốc trước, không phải người thật trong ảnh chủ sở hữu.
- Chạm nhân vật để chọn; dâng hương, dâng hoa, thả tim, gửi lời chúc tối đa 120 ký tự.
  Hiển thị số tương tác phiên, ba khách tương tác và hai lời nhắn gần nhất.
- Thông báo tham gia/hương/hoa/tim/lời chúc gọn, tự tắt sau 3 giây; tối đa sáu icon
  hiệu ứng. Không có banner lớn hoặc âm thanh tự phát.
- Nút ☰ phía trên mở điều khiển ảnh và bảng mô phỏng: chọn khách, thêm khách,
  chạy/dừng tương tác tự động. Tự động mặc định **tắt**, chu kỳ 6,5 giây khi bật,
  dừng timer khi tab ẩn. Chuyển động CSS tôn trọng reduced motion/hidden tab.
- Tắt **Giao diện chùa LIVE** để về ảnh tĩnh. Bật lại mở phiên mô phỏng mới.
  Reload cũng đặt lại số liệu mô phỏng; ảnh đã chọn vẫn giữ nguyên.

## Ranh giới mô phỏng

Tất cả khách/tim/hương/hoa/số liệu là giả lập và có nhãn rõ. Không có coin/giá tiền,
thanh toán, điểm công đức hoặc hứa hẹn tâm linh. Bảng hoạt động chỉ đếm tương tác
phiên, không đo lòng thành. Không nối TikTok hoặc các luồng XP/tiến trình học thuật.

`liveModel.ts` là reducer thuần, xác thực action/ID/text trước cập nhật. Dùng ID
ổn định từ roster, không dùng biệt danh làm khóa. Danh sách khách ≤24, lời nhắn ≤3
trong state (UI hiển thị ≤2), hiệu ứng ≤6, bộ nhớ ID gần nhất ≤256, bộ đếm ≤999999.
Chống trùng chỉ trong cửa sổ phiên gần nhất; không phải bảo đảm idempotency bền
vững của backend. Không tiếp nhận event mạng, không lưu số liệu vào game hoặc DB ảnh.

## Kiểm chứng

- 112 kiểm thử qua; `npm run build` qua TypeScript frontend/local/backend và Vite.
- Browser Chromium: mọi action, hết hạn notice/effect, bình luận có chuỗi HTML chỉ
  hiển thị chữ, 20→24 khách/cap, simulator/hidden-tab pause, đổi chế độ ảnh tĩnh.
- 768×1024, 390×844, 320×568, 1024×768, 1440×900: không cuộn ngang, các hộp tên
  không chồng nhau hoặc đè footer, khung đúng 9:16. Kiểm cả nguồn ảnh dọc/ngang.
- Reload giữ ảnh IndexedDB, không đổi sentinel localStorage cũ; không WebGL/GLB,
  request ngoài origin hoặc page error. Fixtures QA **không phải ảnh của chủ sở hữu**
  và không được đưa làm ảnh nền mặc định. Chưa đo FPS hoặc test Safari vật lý.
- Vite vẫn cảnh báo chunk 3D >500 kB ở các route cũ; không tắt cảnh báo.

PR #16 tiếp tục nháp, chưa merge production. Truy cập cùng alias preview để giữ
ảnh đã chọn trên iPad; mở host preview mới sẽ có storage riêng và cần chọn lại ảnh.
Các route `?experience=3d`, `?experience=live`, `?experience=academy` và dữ liệu cũ
được giữ. Không dependency/dịch vụ trả phí hoặc backend deployment mới.
