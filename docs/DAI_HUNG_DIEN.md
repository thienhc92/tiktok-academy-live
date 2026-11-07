# Đại Hùng Điện — bản chờ duyệt

## Đúng tệp ảnh chủ sở hữu

- Main lúc bắt đầu: `1849a59d7ac7eae392cf3a83f130b9dc8e383dbe`.
- Tệp: `public/images/476F2A78-424C-424C-8954-C43DFEC82BC7.png`.
- PNG 1086×1448, 3.426.476 byte; đã kiểm tra giải mã thành công.
- Git blob: `7218e527452a2bb25f398c93463b90b799bb2afa`.
- SHA256: `506c28ae8e3f516b366484d9bbbdeb087e756005b9b54b99f0126966f5b9ca97`.

Không di chuyển, nén lại hoặc sửa PNG. Mặc định dùng đúng đường dẫn trên; ảnh cũ
được giữ trong repository cho lịch sử nhưng không render trong giao diện hiện tại.
Không đọc Blob cũ làm fallback. `SEAT_IMAGE` tập trung đường dẫn/kích thước; lỗi ảnh
hiển thị đúng đường dẫn mới. Vẫn là centered object-fit:contain toàn vùng ứng dụng,
không crop/zoom/stretch/inset. Tỷ lệ khác 3:4 có phần trống màu nền.

## Đếm và căn lại đệm

Ảnh mới thực sự có **108 đệm đỏ dát vàng hợp lệ**: 10 hàng ×10 và hàng cuối ×8.
Mỗi đệm chỉ có một seat; không có vị trí thêm ngoài ảnh hoặc trên thảm đỏ. Không
áp dụng số lượng/điểm ngồi của ảnh cũ. Xem [108 điểm đã đối chiếu](previews/dai-hung-dien-seat-map.png).

`seatMap.ts` ghi tâm hoa sen trên các mặt đệm bằng pixel gốc rồi chuẩn hóa x/1086,
y/1448. Các hàng y: 842, 864, 888, 912, 940, 976, 1015, 1058, 1108, 1164, 1224.
Scale tăng dần theo phối cảnh. Điểm chân nhân vật = điểm gốc × contain scale +
offset căn giữa. Không nén hàng hoặc di chuyển người để nhường UI. Hai góc dưới
đều đủ chỗ hiển thị thân người; không cần tạo đệm hoặc kéo camera ra ngoài ảnh.

Các tượng Phật nằm phía trên vùng người ngồi; bàn thờ và lư hương trung tâm không
có seat. Lối thảm đỏ giữa hai nhóm giữ trống. Giữ sprite và animation hiện có.

## Mọi người đều có tên

Bỏ cơ chế ẩn label khi trùng. Tên nằm trong lớp riêng trên sprite để không bị
nhân vật hàng sau che. Xếp theo hàng và hai bên, điều chỉnh bề rộng/ellipsis và
khoảng cách, giữ toàn bộ hộp tên trong viewport. Font 9px ở iPad dọc; khi ảnh hiển
thị hẹp do letterbox dùng 8px/label thấp hơn. Tên không bị ẩn vì nhân vật nhỏ.

Đo hộp bình luận và footer hiện có để label né chúng, kể cả sau bình luận dài hoặc
resize. Nếu cần dịch tên nhẹ so với điểm chân, có nét chỉ dẫn mảnh. Chỉ dịch label,
không đổi seat/body. Tên được chọn vẫn có viền nổi bật; nội dung tên đầy đủ giữ
trong title và danh sách simulator. Không dời comment box hay các nút.

## Cơ chế giữ nguyên

`liveModel.ts` không thay đổi. Điểm hương 5 / hoa 8 / tim 1 / xu mô phỏng ×10,
cap/validation/duplicate receipts vẫn như trước, tách biệt XP. `assignSeats()` giữ
nguyên cách sort điểm, hòa điểm theo thứ tự tham gia; chỗ sort hàng gần bàn thờ
rồi gần trục giữa. Sức chứa vẫn 108, người dư chờ, ít người để trống đệm.

Không đổi likes, bình luận, bảng tương tác, thao tác quà mô phỏng hoặc các mode cũ.
Không TikTok thật, thanh toán, backend, dependency, proxy hay thiết lập Pages mới.

## Kiểm chứng

- 13 Photo LIVE + 3 tiếng Việt tests qua. Có kiểm tra từng landmark, số hàng,
  ưu tiên/điểm, phép chiếu, 20/108 tên, chống overlap, chat/footer và resize.
- `npm run build` qua TypeScript frontend/local/backend và Vite. Còn warning
  chunk >500 kB ở route 3D cũ; không tắt warning.
- Browser Chromium tại 768×1024: 20 người qua fixture dùng chính component,
  108 người qua production preview. Kiểm HTTP 200 và bytes PNG khớp Git blob,
  một ảnh contain, toàn bộ điểm chân khớp từng seat, đủ 20/108 tên, không tràn
  ngang, không hộp tên chồng nhau/đè chat/footer hoặc bị cắt ở góc.
- Full occupancy kiểm thêm 1024×768. Thử hương/hoa/tim =14 điểm, gửi lời chúc,
  hai bình luận dài và đổi viewport; không page errors hoặc label bị chat che.
- Đã xem [20 người — iPad](previews/dai-hung-dien-20-ipad.png),
  [108 người — iPad](previews/dai-hung-dien-108-ipad.png) và
  [108 người — landscape](previews/dai-hung-dien-108-landscape.png).
- Chưa kiểm Safari/FPS trên iPad vật lý. Full npm test/audit/build chạy trong CI;
  kết quả CI/PR báo ở handoff, không nhầm với các kiểm tra cục bộ ở trên.

Fixture không nằm trong production build: chạy `npm run dev`, mở
`/tests/fixtures/photoSeating.html?count=20` (hoặc `count=108`). Prop initialVisitors
chỉ cung cấp dữ liệu khởi tạo component; trang chính vẫn mặc định đủ sức chứa.

**Tạo PR nháp để chủ sở hữu duyệt; không bật auto-merge hoặc merge bản này.**
