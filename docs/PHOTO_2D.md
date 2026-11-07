# Chùa Online — ảnh 2D nguyên bản

Giao diện LIVE mới trên ảnh này được mô tả tại [PHOTO_LIVE.md](PHOTO_LIVE.md).
Ảnh và database bên dưới vẫn giữ nguyên.

Chủ sở hữu tạm dừng dựng 3D, muốn dùng nguyên ảnh chính điện đã chia sẻ và sẽ gửi
hướng dẫn tiếp. Trang mặc định chuyển sang viewer ảnh, không chạy canvas/WebGL,
không tải GLB hoặc dựng thêm hiệu ứng/nhân vật.

## Ảnh nguồn chưa có tệp

Ảnh chính điện nằm ngang nhìn thấy trong hội thoại, nhưng không có file đọc được
trong các attachment của workspace. Attachment hiện có là ảnh chụp TikTok cũ;
không dùng nó thay ảnh ngang, không dùng artwork sinh hoặc screenshot mô hình 3D.
Vì vậy bản này **chưa gắn sẵn đúng ảnh tham khảo**. Cần tệp JPEG/PNG/WebP nguyên gốc
để bổ sung asset mặc định cố định cho mọi thiết bị ở bước tiếp theo.

Đường dùng ngay trên iPad: mở trang, bấm **Chọn ảnh chính điện**, chọn đúng ảnh từ
Ảnh/Tệp. Mặc định `object-fit: contain` giữ toàn bộ ảnh và đúng tỉ lệ. **Phủ kín khung**
là tùy chọn rõ ràng, có cảnh báo sẽ cắt mép. Có khung 9:16, ẩn/hiện điều khiển và
fullscreen theo khả năng trình duyệt. Không khẳng định ẩn được chrome Safari thật.

Ảnh chọn lưu dạng Blob trong IndexedDB riêng `chua-online-photo-v1`, chỉ một ảnh
hiện tại. Không upload, không đưa ảnh vào Git/log, không dùng nickname/player ID.
Không truy cập các database hay localStorage game cũ. Reload cùng origin trên
thiết bị có thể mở lại; origin preview khác hoặc thiết bị khác phải chọn lại ảnh.
Nếu storage bị từ chối/hết dung lượng, ảnh vẫn xem trong phiên và có thông báo.

Chỉ nhận JPEG/PNG/WebP, tối đa 20 MiB và 32 triệu pixel. Kiểm MIME/header rồi decode
bằng trình duyệt; ảnh hỏng không thay thế ảnh hiện tại. Không nhận SVG/HTML/HEIC.
Object URL tạm và URL cũ được thu hồi. Ảnh chưa được chỉnh sửa nội dung hoặc resize.

## Bảo toàn

- `?experience=3d`: chính điện/tượng 3D v2 cũ, nguyên file và script.
- `?experience=live`: mô phỏng LIVE trước đó.
- `?experience=academy`: game trường học cũ.

Không deploy backend, nối TikTok, thêm dependency/dịch vụ trả phí hoặc thay production.
PR #16 vẫn nháp. Chủ sở hữu đã cho phép bổ sung mô phỏng LIVE 2D; xem tài liệu mới phía trên.

## Kiểm chứng

- 108 kiểm thử qua; `npm run build` qua TypeScript frontend/local/backend và Vite.
  Vẫn có cảnh báo chunk >500 kB từ các chế độ 3D được giữ riêng.
- Chromium: chọn ảnh, decode/ảnh hỏng, lưu/reload IndexedDB, contain/cover, 9:16,
  ẩn/hiện, 5 viewport, fullscreen fallback, storage-denied fallback và các route cũ.
- Không có canvas/GLB mặc định, request ngoài origin hoặc page errors; sentinel
  localStorage cũ giữ nguyên. Fixture QA là asset thử hiện có, **không phải ảnh ngang
  của chủ sở hữu** và không được đặt làm ảnh mặc định.
- Chưa thử trên iPad Safari vật lý; ảnh nguồn cố định vẫn là blocker nội dung.
