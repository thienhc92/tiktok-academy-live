# Chính điện 3D theo ảnh tham khảo

Trang mặc định hiện dựng bằng mesh 3D, không dùng ảnh chính điện làm phông nền.
Ảnh người dùng là tham khảo bố cục/vật liệu; đây là bản diễn giải dựng thủ công bằng
hình học và vật liệu, không phải mô hình quét hoặc bản sao nghệ thuật đã xác nhận.
Tượng/khuôn mặt, nếp áo và hoa văn còn đơn giản hơn ảnh tham khảo.

## Thành phần

- Tượng Phật ngồi, tay phải đặt trên đầu gối, tay trái ngửa trong lòng; hình đầu/mặt,
  tóc xoắn, thân/áo/tay/chân là hình học thực. Phần thân được voxel-remesh để nối mặt.
- Tòa sen nhiều tầng, hào quang có cánh/đường chạm nổi và normal map hoa văn.
- Cột gỗ có chân đế, xà/kèo/mái, lan can; hoa sen, bình sứ xanh trắng, bàn thờ, đĩa
  quả, đèn và lư hương có thân/chân/quai. Có cây hình học bên ngoài các khoảng mở.
- Sàn đá có phản chiếu trong viewer; bóng tiếp xúc tĩnh, nguồn sáng ấm, dải ánh nắng
  không phải mô phỏng thể tích vật lý. Khói là đường cong 3D tĩnh để tránh render liên tục.

## Xem và tải

- `/`: chính điện 3D. Kéo để xoay, cuộn/chụm để zoom. Preset Chính diện/Góc trái/Góc
  phải/Cận tượng, nút Chính diện đặt lại camera. Góc xoay được giới hạn để giữ nội thất.
- Menu tùy chọn: ánh nắng/khói, bóng và phản chiếu chi tiết, khung 9:16. Fullscreen
  dùng khả năng trình duyệt; chưa khẳng định Safari ẩn thanh công cụ trên iPad thật.
- Nút Tải mô hình 3D tải `public/temple3d/sanctuary.glb`. GLB có mesh/vật liệu/texture
  nhúng, không cần decoder hoặc file texture bên ngoài. Trong viewer, mesh sàn trong
  GLB được ẩn để dùng phản chiếu realtime; trình xem GLB khác vẫn có sàn thường.
- `?experience=live`: giữ bản LIVE 2.5D trước đó. `?experience=academy`: trường học cũ.
  Không chuyển đổi hoặc ghi vào tiến trình cũ.

## Nguồn và tái tạo

`tools/build_shrine.py` chứa hình học/vật liệu được tạo riêng cho dự án, dùng Blender
4.3.2 hiện có. Không tải model thương mại hoặc tích hợp dịch vụ tạo 3D trả phí.
Texture gỗ và hoa văn được sinh bằng công thức, đóng gói vào GLB. Tệp nguồn Blender
được giữ ở `/workspace/chua-online-3d.blend` để tải về/chỉnh sửa; không đưa file Blender
lớn vào bundle trình duyệt. Chạy lại (cần Blender ở máy tác giả, **không cần trên iPad
hoặc CI**):

```sh
blender -b --factory-startup --python tools/build_shrine.py -- \
  --output public/temple3d/sanctuary.glb \
  --blend /workspace/chua-online-3d.blend
```

Khi tái tạo cần kiểm tra log/GLB và chụp lại; Blender version khác có thể tạo topology
khác. Export không dùng Draco. Thư viện Draco không có trong Blender cài sẵn; thử
nén không tạo compressed extension nên viewer chủ động không tải decoder CDN.

## Giới hạn và kiểm chứng

GLB khoảng 9,4 MB, 47 nhóm mesh để giảm draw calls, khoảng 413 nghìn tam giác. Đây là
bản đầu có hình học chi tiết; dung lượng tải ban đầu vẫn đáng kể trên mạng chậm.
Default DPR 1, không shadow map động; reflection 256, contact shadow chụp một lần.
Chế độ chi tiết tăng DPR tối đa 1,5, reflection 512 và shadow map 1024. Canvas dùng
demand rendering, ngừng tick khi tab ẩn; không có animation timer trong phòng.
Không tuyên bố FPS iPad nếu chưa đo trên thiết bị thật.

Unit test kiểm camera, header/metadata GLB, nhóm sculpture/architecture/altar, ngân
sách hình học và không tham chiếu texture/buffer bên ngoài. Browser smoke cần kiểm
camera thật, tải GLB, 9:16/viewport, menu và hai route cũ. Không triển khai backend,
không tạo secret hoặc nối TikTok. PR hiện giữ draft để chủ sở hữu xem hình trước.

## Kết quả kiểm tra cục bộ

- `npm test`: 104 kiểm thử qua với quyền chạy runtime/socket cục bộ. Lần chạy
  sandbox hạn chế bị timeout khi Miniflare khởi tạo; không bỏ qua test đó.
- `npm run build`: qua toàn bộ TypeScript frontend/local/backend và Vite production.
  Vite vẫn cảnh báo chunk Three.js trên 500 kB; scene được tải lazy theo route.
- `npm audit --omit=dev --audit-level=high`: không phát hiện lỗ hổng.
- Ảnh chính diện và góc trái: `docs/previews/temple-3d-front.png`,
  `docs/previews/temple-3d-left.png`.
- Chromium (render phần mềm) xác minh 1440×900, 768×1024, 390×844, 320×568,
  1024×768: không cuộn ngang, thanh camera nằm trong viewport; xoay/preset/reset,
  tải GLB, bốn tùy chọn, canvas 9:16, hai route cũ và sentinel localStorage giữ nguyên.
  Không có page error hoặc request ngoài origin. Đây không phải phép đo FPS iPad.
- Ảnh khung dọc: `docs/previews/temple-3d-portrait.png`.

Commit triển khai `b2c17f6` đã push; GitHub **Test and build** và **Cloudflare Pages**
đều thành công. PR #16 tiếp tục là nháp, chưa merge main. Ảnh khung dọc dùng góc
chính diện, đóng menu để kiểm tra trọn tượng. Thiết bị Safari thật vẫn cần kiểm thử.
