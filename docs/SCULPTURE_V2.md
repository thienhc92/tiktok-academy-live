# Tượng Phật dựng lại — nghiên cứu hình khối theo ảnh

Đây là bản dựng số gốc bằng Blender/Python dựa trên ảnh do chủ sở hữu cung cấp.
Không phải model tải từ bên ngoài, ảnh phẳng, photogrammetry hoặc lời xác nhận
đạt chất lượng điêu khắc/chân thực tương đương ảnh tham khảo. Mật độ lưới cao hơn
không tự chứng minh độ giống hay chất lượng nghệ thuật.

## Phạm vi thay đổi

`tools/sculpt_buddha.py` thay phần thân tượng cũ trong `tools/build_shrine.py`:

- Đầu là một bề mặt liên tục, có sống/chóp mũi, gò má, hốc mắt, gờ môi và cằm.
  Mí mắt, đường chân mày, tai và tóc được dựng riêng theo bề mặt đầu.
- Thân/ngực/cổ có profile nội suy mềm; cổ ngắn, loe vào vai thay cho hình trụ.
- Chi tay thuôn dần, ngón có khớp cong, lòng bàn tay và móng tay riêng.
- Hai đầu gối và ống chân bắt chéo được union **cục bộ**, làm mượt và giới hạn lưới.
  Không voxel-remesh/decimate toàn bộ khuôn mặt, bàn tay và áo như bản cũ.
- Áo có bề mặt UV riêng nằm ngoài thân, nếp gấp liên tục và phần vai theo cánh tay.
  Bản web dùng mép áo có độ dày, bỏ lớp mặt sau bị thân che; nguồn chi tiết giữ vỏ áo.
- Các mặt tuần hoàn dùng đỉnh chung tại đường nối để normal không tạo đường gãy.

Không sửa game engine, camera/UI, backend, các route LIVE/Academy hay storage.
Giảm mật độ vài chi tiết lặp nhỏ ở chân cột/hoa để dành ngân sách cho tượng.

## Hai mức hình học

- Web: `public/temple3d/sanctuary.glb`, 11.876.860 byte (~11,3 MiB), 56 nhóm,
  461.600 tam giác cho **toàn cảnh**. Vẫn trong ngân sách <12 triệu byte/<500k tam giác.
- Nguồn: `/workspace/chua-online-sculpt-v2.blend`, khoảng 68 MiB. Collection
  `Sculpt source - high resolution - unhide to edit` chứa bản lấy mẫu chất lượng 2,
  khoảng 733.216 tam giác nền trước modifier. Collection này ẩn mặc định để không
  hiển thị chồng với bản web. Ẩn các mesh `SCULPT__` rồi bật collection nguồn để sửa.
- Bản nguồn được tạo **sau** khi export GLB, không bị đưa nhầm vào browser bundle.
- Bản trước được giữ trong Git và các file Blender trước đó; không reset/xóa lịch sử.

Tái tạo bằng Blender 4.3.2:

```sh
blender -b --factory-startup --python tools/build_shrine.py -- \
  --output public/temple3d/sanctuary.glb \
  --blend /workspace/chua-online-sculpt-v2.blend
```

CI và iPad không cần Blender. Hai file Python và GLB đều được version hóa; không
thêm package, tài khoản, dịch vụ trả phí hoặc asset thương mại. Backend không deploy.

## Kiểm chứng và giới hạn

Test GLB kiểm metadata từng vùng (`sculpt_revision=2`, `source_quality=1`), mặt có
hình khối trên cả ba trục, đủ mật độ và normal hợp lệ; UV của các vùng và không có
mesh `MASTER__` trong file web. Các kiểm camera, PBR pixels và ngân sách vẫn giữ.

Ảnh toàn cảnh/cận/dọc phải được xem cùng ảnh gốc để đánh giá nghệ thuật. Mô hình
hiện vẫn có nét giản lược: hoa văn/hào quang/kiến trúc cũ, vải và khuôn mặt chưa
mang chất lượng sculpt chuyên nghiệp. Chưa có normal bake từ scan/artist high-poly
hoặc texture chạm khắc tinh xảo. Không ghi “giống 100%”, “photorealistic” hay FPS
Safari nếu chưa có bằng chứng. Kiểm thử trên iPad thật và đánh giá của chủ sở hữu
vẫn là cổng chấp nhận trước khi merge PR nháp #16.

## Kết quả kiểm chứng bản v2

- `npm test`: 107 kiểm thử qua, gồm hồi quy game/Worker SQLite và kiểm hình học v2.
- `npm run build`: TypeScript frontend/local/backend và Vite qua. Cảnh báo chunk
  Three.js >500 kB vẫn còn; không tắt hoặc nâng ngưỡng cảnh báo.
- `npm audit --audit-level=high`: không phát hiện lỗ hổng.
- Chromium: chính diện/cận, 5 viewport (1440×900, 768×1024, 390×844, 320×568,
  1024×768), camera/preset/manual state, GLB download, đổi chất lượng/9:16,
  route/storage cũ đều qua; không page error hoặc request ngoài origin.
- Ảnh v2: `docs/previews/temple-3d-front.png`, `temple-3d-left.png`,
  `temple-3d-portrait.png`, `sculpture-v2-close.png`.
- Mở lại Blender source để kiểm collection nguồn: 507 mesh object, 733.216 tam giác
  nền, toàn bộ `source_quality=2`; collection ẩn cả viewport và render đúng dự kiến.
- SHA-256 GLB trong `public` và `dist` trùng nhau.

PR #16 tiếp tục dùng nhánh hiện có; CI/preview sau push được báo trong PR và báo
cáo bàn giao. Không auto-merge thay đổi thị giác này khi chưa được chủ sở hữu chấp nhận.
