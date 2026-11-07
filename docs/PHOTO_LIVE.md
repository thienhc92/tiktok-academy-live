# Phật Tâm Live — ảnh chính thức và khách mô phỏng

## Ảnh gốc

Ảnh chủ sở hữu tải lên main trong commit `04aa81a` đã được chuyển, không chỉnh sửa,
từ `3821EC21-C34F-4B9D-9C8B-278D76987EC7.png` sang
`public/images/phat-tam-live-background-ipad.png`.

- PNG 1086×1448; 3.119.937 byte.
- Git blob: `1e49772a39e5297dc586820f2205f3ff5793fc4a`.
- SHA256: `c5d875bd5b01e2e5c9c99ccb0025aaa67604f1bdf19e1f5329ce58601a9947a9`.
- Mặc định chỉ render một ảnh này bằng `object-fit: contain`, căn giữa. Không
  cover, zoom, ghép sàn hoặc kéo giãn. Khác tỷ lệ màn hình dùng nền nâu trống.
- Không đọc ảnh IndexedDB cũ và không có ảnh thay thế khi lỗi. Không xóa dữ liệu
  IndexedDB/localStorage cũ. Thiếu ảnh chính thức sẽ hiện lỗi đường dẫn cụ thể.
- ☰ mở điều khiển: bật/tắt LIVE, khung 9:16 tùy chọn, fullscreen theo khả năng
  trình duyệt và ẩn điều khiển. Mặc định dùng toàn vùng ứng dụng, phù hợp iPad 3:4.

## Vị trí Phật tử

`liveModel.ts` lưu 24 điểm đệm được đo trực tiếp từ PNG gốc; đây là sức chứa của
roster hiện có, không phải toàn bộ số đệm trong ảnh. Mặc định giữ 20 khách và thêm
được 4 khách bằng mô phỏng. Chủ sở hữu không còn yêu cầu cố định 20 người.

Mỗi hàng gồm ba cặp trái/phải; x dưới đây là tâm đệm, y là điểm tiếp xúc chân:

| y (pixel gốc) | Cặp x trái/phải | Chiều cao nhân vật (pixel gốc) |
| --- | --- | --- |
| 909 | 435/654, 362/733, 287/809 | 56 |
| 974 | 405/687, 305/783, 209/880 | 62 |
| 1058 | 362/725, 250/837, 141/948 | 70 |
| 1122 | 345/752, 218/881, 86/1014 | 78 |

Chuẩn hóa x/1086 và y/1448. Với frame W×H, scale là
`min(W/1086,H/1448)`, offset là `((W-1086*scale)/2,(H-1448*scale)/2)`.
Điểm chân = offset + điểm gốc × scale; chiều cao cũng scale theo ảnh. Footer và
letterbox không tự di chuyển hàng người. Bảng tên nằm ngay dưới điểm chân; hình
nhân vật, sway animation, reduced motion và stable viewer ID được giữ nguyên.
Khu bàn thờ phía trên y=800 và thảm đỏ không có chỗ ngồi.

## Tương tác và dữ liệu

Chạm khách để chọn; dâng hương, dâng hoa, thả tim và gửi lời chúc tối đa 120 ký tự.
Có top 3 tương tác phiên, hai lời nhắn gần nhất, thông báo 3 giây và tối đa sáu
icon hiệu ứng. ☰ cho chọn/thêm khách, bật/tắt tự động (mặc định tắt, mỗi 6,5 giây,
dừng khi tab ẩn). Tắt LIVE/bật lại hoặc reload bắt đầu phiên mô phỏng mới.

Reducer giữ nguyên: action/ID/text hợp lệ, chống trùng trong 256 ID gần nhất,
≤3 bình luận trong state, bộ đếm ≤999999. Không nối TikTok, thanh toán, XP hay
backend; không đổi dữ liệu học viện. Các route 3D/LIVE/Academy cũ được giữ riêng.

## Kiểm chứng của lần thay ảnh chính thức

- 5 kiểm thử Photo LIVE và 3 kiểm thử tiếng Việt qua.
- `npm run build` qua toàn bộ TypeScript frontend/local/backend và Vite. Còn
  cảnh báo chunk >500 kB của route 3D lưu trữ; không tắt cảnh báo.
- Chromium 768×1024 và 1024×768: HTTP 200; SHA256 bytes phục vụ khớp PNG gốc;
  đúng một background contain, không canvas, không tràn ngang hoặc page error.
  Kiểm tọa độ chân của cả 24 khách khớp phép chiếu sau resize/letterboxing.
- Thử hương/hoa/tim/lời chúc, thêm đủ 24 khách, hết hạn thông báo; đều qua.
- Đã xem screenshot thực tế với chính ảnh gốc tại
  `docs/previews/phat-tam-live-ipad.png` và `phat-tam-live-landscape.png`.
- Không chạy lặp toàn bộ suite cục bộ cho thay đổi presentation này; CI bắt buộc
  tiếp tục chạy npm test, audit và build. Chưa kiểm Safari trên iPad vật lý.

PR #16 giữ nháp theo yêu cầu chờ duyệt hình ảnh; không merge production hoặc
triển khai backend. Không thay dependency, proxy, credentials hoặc Cloudflare Pages.
