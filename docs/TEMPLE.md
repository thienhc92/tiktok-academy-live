# Chùa Online — bản giao diện mô phỏng

Bản đầu tiên theo ảnh tham khảo: chính điện vàng ấm, minh họa tượng Phật trên tòa sen,
chuông, hoa và sàn gỗ; 28 người tham gia mặc áo lam trong cảnh 3D, nhìn từ phía sau.
Minh họa SVG là tài sản gốc của dự án, không tải ảnh, font hoặc mô hình bên ngoài.
Không giả lập các nút Follow/thu tiền hay tài khoản TikTok thật trong ảnh tham khảo.

- Trang mặc định: Chùa Online, bố cục chính 9:16, màn hình rộng có bảng phụ hai bên.
- Chạm tên để chọn nhân vật; các nút thắp hương/dâng hoa/chuông cập nhật số minh họa
  và thông báo ngắn. Có hiệu ứng hoa; chuông tổng hợp chỉ phát sau khi chủ động bật âm thanh.
- Lời chúc tối đa 160 ký tự, hiển thị bằng văn bản React; chỉ giữ một danh sách ngắn trong bộ nhớ.
- Thẻ an lành là lời nhắc chiêm nghiệm miễn phí, không xem bói/dự đoán hoặc hứa kết quả tâm linh.
- Bảng điều khiển chọn người mẫu, bật/tắt tương tác tự động và âm thanh. Thông báo tồn tại 3 giây.
- Dùng Fullscreen API khi có; fallback giữ giao diện dọc. Chưa xác nhận ẩn thanh Safari trên thiết bị thật.
- Tối đa 30 fps, DPR 1, ít đa giác, không realtime shadows, dừng rendering khi thẻ bị ẩn,
  tắt chuyển động trang trí theo prefers-reduced-motion. Chưa đo FPS iPad vật lý.

Không đọc/ghi localStorage hoặc điểm/tiến trình Academy, không gửi API hay mở kết nối
TikTok/Cloudflare. Dữ liệu mới chỉ trong bộ nhớ và trở về mẫu ban đầu khi reload.
Mã trường học cũ ở `src/academy.tsx`, chỉ tải khi mở `?experience=academy`; backend,
config staging, engine và lịch sử Git được bảo toàn. Product Owner đã đổi hướng,
nên kế hoạch triển khai backend trường học tạm dừng.

Đây là thay đổi hướng sản phẩm lớn: chuẩn bị draft PR để xem giao diện trước, chưa
auto-merge vào production. Cần chủ sở hữu duyệt giao diện mới trước khi thay trang
mặc định đang công khai; không cần triển khai backend để xem thử bản frontend.

## Xác minh bản đầu

101 kiểm thử qua, TypeScript frontend/local/backend và production build qua.
Chromium kiểm tra 768×1024, 390×844, 320×568, 1024×768 và 1440×900: khung 9:16,
không cuộn ngang/chồng nhãn, đủ 28 nhân vật, gửi hoa/lời chúc/thẻ, chọn người, đóng
dialog bằng Escape và giữ nguyên bản lưu Academy có sẵn. Route Academy cũ vẫn mở
được. Đây không phải kiểm tra Safari vật lý; bundle 3D còn cảnh báo kích thước.

[Ảnh xem trước trên viewport iPad](previews/chua-online-ipad.png).
