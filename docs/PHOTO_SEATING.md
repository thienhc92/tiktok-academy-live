# Xếp chỗ theo đóng góp mô phỏng

## Bản đồ ảnh

Giữ nguyên PNG chính thức 1086×1448, SHA256
`c5d875bd5b01e2e5c9c99ccb0025aaa67604f1bdf19e1f5329ce58601a9947a9`.
`src/photo/seatMap.ts` ghi đủ **108 tâm đệm có thể đặt người**, 14 hàng: 12×8 và
2×6. Hai mảnh đệm ở mép của hàng áp chót có tâm nằm ngoài ảnh không được gán
người, tránh nhân vật bị cắt. Ảnh kiểm tọa độ: [các điểm đệm](previews/cushion-map-review.png).

Mỗi seat có id ổn định, x/y chuẩn hóa 0–1 (điểm chân), scale = chiều cao nhân vật
chia 1448, width chuẩn hóa, row, zone front/middle/rear + left/right và rankPriority.
Người ở xa nhỏ hơn. Map bất biến, không phụ thuộc viewport hoặc footer.

Phép chiếu: `scaleImage = min(W/1086,H/1448)`, offset căn giữa. Tọa độ và kích
thước nhân vật đi theo cùng phép contain với ảnh; không nén hàng, crop hoặc zoom.

## Điểm đóng góp

Cấu hình tập trung: `CONTRIBUTION_WEIGHTS` trong `liveModel.ts`.

| Hành động hợp lệ | Điểm |
| --- | --- |
| Dâng hương | +5 |
| Dâng hoa | +8 |
| Thả tim | +1 |
| Quà mô phỏng | số xu mô phỏng ×10 |
| Tham gia / lời chúc | 0 |

Không có bonus thời gian trong phiên bản này. Điểm tối đa 999999/người/phiên.
Quà chỉ nhận số nguyên từ 1 đến 1000000; không thanh toán, tiền hoặc TikTok thật.
Thêm ô xu và nút tặng quà trong bảng mô phỏng ☰; ba nút tương tác hiện có giữ nguyên.

Điểm dựa trên sự kiện đã xác thực ID/action; sự kiện trùng trong cửa sổ 256 ID
không được tính lại. Đây là chống trùng phiên hiện có, chưa phải bảo đảm bền vững
sau restart hoặc replay vượt cửa sổ. Mọi điểm bắt đầu từ 0, reset khi reload; không
đổi localStorage, IndexedDB hoặc XP học viện. Bảng top tương tác cũ vẫn đếm số
hành động như trước, không bị đổi thành điểm. Điểm mô phỏng không đo lòng thành.

## Phân chỗ và sức chứa

`assignSeats()` nhận danh sách `{id, contributionScore, ...}` tách khỏi roster/mock
và transport. Không dùng nickname làm khóa; ID trùng hoặc điểm không hợp lệ bị từ
chối. Có thể thay nguồn danh sách này bằng adapter đã xác thực trong tương lai.

- Người: điểm giảm dần, bằng điểm giữ thứ tự tham gia ban đầu.
- Chỗ: `(số hàng - row) ×1000 + round((1 - abs(x-.5)×2)×100)`.
  Hàng gần bàn thờ luôn ưu tiên trước; trong hàng ưu tiên gần trục giữa. Bằng ưu
  tiên dùng seat ID để kết quả ổn định. Không phân chỗ trên bàn thờ hoặc thảm.
- Ghép hai danh sách đã sắp xếp. Người vượt sức chứa vào hàng chờ; khi điểm cao
  hơn sẽ được vào, người điểm thấp nhất chuyển sang chờ. Không luân phiên tự động.
- Ít người hơn số đệm thì số còn lại để trống, không tự tạo người để lấp chỗ.

UI mẫu mặc định nạp đủ số người bằng số seat. Fixture tái sử dụng 52 ID/tên cũ,
bổ sung tên/ID giả lập và 15% dự phòng để thử hàng chờ; không giới hạn 20/24 nữa.
Số fixture không phải giới hạn của thuật toán; hiện reducer offline chỉ nhận ID
trong roster đã biết. Muốn thử ít người ở tầng engine, gọi `initialPhotoLive(ids)`.
Trong simulator có thể chọn cả người chờ và tặng điểm để kiểm tra thay chỗ.

## Tên và hiệu năng

Giữ sprite/animation cũ. Label có ellipsis và tooltip tên/điểm; chọn khách ưu tiên
hiện label của họ, sau đó hiện theo thứ tự đóng góp nếu không va hộp tên đã hiện.
Các label quá sát nhau được ẩn, nhân vật vẫn có mặt và chọn được; danh sách chọn
trong ☰ giữ đầy đủ tên. Không di chuyển người khỏi đệm để nhường chỗ cho label.
Một ảnh nền, sprite dùng chung URL, không thêm canvas/WebGL/dependency/network.

## Kiểm chứng

- 11 unit tests Photo LIVE + 3 tiếng Việt qua: điểm, gift validation, trùng sự kiện,
  sức chứa linh hoạt, ưu tiên, ổn định, chờ/thay chỗ, ID, phép chiếu và label.
- `npm run build` qua TypeScript frontend/local/backend và Vite; cảnh báo chunk
  >500 kB ở route 3D cũ vẫn còn, không ảnh hưởng tải default photo route.
- Chromium 768×1024 và 1024×768: 108 avatar khớp toàn bộ điểm chân của map, không
  label chồng nhau, không tràn ngang/page errors; PNG HTTP 200 và bytes đúng hash.
- Luồng thực tế: người cuối hàng nhận quà 2 xu + hương/hoa/tim =34 điểm, lên đầu;
  người mới ban đầu chờ, nhận quà 100 xu =1000 điểm, vào chỗ ưu tiên cao nhất.
  Số hiển thị vẫn 108, một người chuyển sang chờ; bình luận và notices vẫn chạy.
- Đã xem [screenshot iPad](previews/contribution-seating-ipad.png) và
  [landscape](previews/contribution-seating-landscape.png). Chưa kiểm iPad Safari
  vật lý/FPS. Full suite/audit/build tiếp tục do required GitHub CI chạy.
