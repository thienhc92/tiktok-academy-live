# Nghi thức và công đức MOCK — bản chờ duyệt

Base: main `4a92bcb`. Giữ nguyên PNG Đại Hùng Điện, map 108 đệm, sprite, profile ID,
nhãn tên và luồng TikTok thật đang khóa. Không dependency, dịch vụ trả phí hoặc
triển khai backend/production. PR và Pages preview để chủ sở hữu kiểm tra trước merge.

## Các module nhỏ

- `live/merit.ts`: quy tắc công đức, hạn mức tim/lạy, nhận diện câu niệm, mốc hoạt
  động và các mức quà MOCK 1/5/10/30 xu.
- `live/processor.ts`: tái sử dụng pipeline receipt/transaction; chỉ sự kiện hợp lệ
  mới cộng điểm và phát cue. Comment niệm Phật vẫn lưu như bình luận bình thường.
- `live/repository.ts`: snapshot v2 và migration v1 giữ toàn bộ đóng góp, hồ sơ,
  receipts/high-water. Không cộng công đức hồi tố cho lịch sử chưa có quy tắc này.
- `live/rituals.ts`, `RitualEffects.tsx`, `rituals.css`: cue có TTL, tối đa 6 nhóm
  nghi thức đồng thời; transform CSS trên đúng sprite và hiệu ứng môi trường nhỏ.
- `live/seating.ts`: cập nhật theo đóng góp khi thay đổi đáng kể; không dùng công
  đức để đổi ghế. Chờ cue đang chạy kết thúc để không dời người giữa động tác.

## Quy tắc điểm

| Hoạt động MOCK hợp lệ | meritScore | contributionScore xếp ghế |
| --- | --- | --- |
| Lạy Phật / bình luận đúng câu niệm | +2 | 0 |
| Dâng hương | +5 | +5 (giữ quy tắc cũ) |
| Dâng hoa | +10 | +8 (giữ quy tắc cũ) |
| Thả tim trong hạn mức | +1 | +1 |
| Quà mô phỏng | 0 | xu ×10 (giữ quy tắc cũ) |

Công đức là **điểm hoạt động mô phỏng**, không phải tiền hoặc thước đo tâm linh.
Quà không mua công đức. Các mức xu chỉ là cấu trúc/selector MOCK, không thanh toán.
Giữ tương thích payload quà cũ, không đổi cách tính lại đóng góp đã lưu.

Tim được thưởng tối đa 1 lần/giây và 30 lần/60 giây/người. Bộ đếm tim hiển thị các
lượt được chấp nhận. Batch nhiều tim vẫn chịu cùng hạn mức; high-water gốc được
nhớ để không xin lại phần đã giới hạn. Lạy/câu niệm có cooldown 2200ms/người.
Bình luận lặp quá nhanh vẫn có thể hiển thị nhưng không được thêm công đức/cue.
Receipt của thao tác bị giới hạn vẫn được ghi: đổi thời điểm rồi replay không trả điểm.
Hạn mức được lưu cùng điểm nên refresh không reset cooldown hoặc tránh chống trùng.

Câu niệm nhận diện toàn câu, không phân biệt dấu/chữ hoa; cho phép khoảng trắng và
ký hiệu trang trí như 🙏. Không dò substring hoặc tính hai lần cho comment + cue.
Mỗi khoản điểm cap 999999. `rank` là mốc hoạt động mô phỏng: Khách ghé chùa (0),
Bạn đồng hành (50), Thường ghé chùa (200), Gắn bó (1000), tính từ meritScore.
Projection user có userId, nickname, meritScore, contributionScore, rank và seatId;
seatId lấy từ plan đang hiển thị, null nếu đang chờ. Không lưu seatId/rank trùng lặp
như nguồn điểm có thẩm quyền. Avatar và dữ liệu học viện giữ riêng như trước.

## Hiệu ứng 2D và hiệu năng

- Lạy: sprite hiện có cúi rồi trở lại bằng transform 2200ms, gốc neo ở chân; có
  biểu tượng chắp tay. Đây là diễn hoạt trên ảnh sprite 2D, không phải rig xương
  hoặc model tay mới. File ngoại hình nhân vật không bị thay thế.
- Hương: tư thế cầu nguyện 2800ms; một nhóm nhang tại vị trí lư hương trong ảnh,
  tối đa hai puff khói nhỏ. Thông báo tên gọn ở góc, tránh vùng mặt ba tượng Phật.
- Hoa: tối đa sáu hoa sen 18px, bay 2400ms từ chỗ người dâng tới hai vùng lễ vật
  thấp của bàn thờ. Đích/path ổn định, không bay qua mặt ba tượng Phật.
- Bỏ cue dư khi đủ giới hạn, không tạo hàng chờ hiệu ứng; điểm hợp lệ vẫn được xử
  lý. Coalesce cùng người/cùng động tác để không reset animation đang chạy.
- Chỉ sprite đang thực hiện nghi thức có will-change/animation riêng; không dùng
  canvas, WebGL hoặc React render từng frame. Timer dọn theo TTL gần nhất; tab ẩn
  xóa cue. Reload không phát lại hiệu ứng/notification cũ; reduced motion được tôn trọng.

Nút Lạy Phật dùng cùng hàng tương tác hiện có, không thêm vùng màn hình hay đổi
ảnh/đệm. Điểm công đức người được chọn có ở ô thống kê gọn và bảng mô phỏng ☰;
rank/seatId/đóng góp được trình bày trong simulator. Bình luận/bảng tương tác giữ lại.

## Xếp ghế ổn định

Comparator ưu tiên đóng góp → hàng gần bàn thờ → gần trục giữa giữ nguyên.
Chỗ trống lấp ngay; đủ ghế tiếp tục hàng chờ. Chỉ rebalance sau ít nhất 5 giây nếu
đóng góp thay đổi ≥10 hoặc hạng đổi ≥3 vị trí. Thay đổi nhỏ chờ tối đa 30 giây khi
không có nghi thức; đang có cue thì đợi kết thúc, rồi mới chuyển bằng transition.
Công đức tăng đơn thuần không làm ghế đổi. Luồng nghi thức liên tục có thể trì hoãn
rebalance: ưu tiên giữ chân người trên đệm đến khi hiệu ứng kết thúc.

## Lưu trữ và phục hồi

Giữ DB IndexedDB hiện có và object store, đổi format snapshot từ 1 lên 2. Migration
xác thực trước khi ghi, giữ điểm đóng góp/counter/receipts/profile/presence; thêm
merit và quota rỗng. Bản ghi không hợp lệ/khác version không bị xóa hoặc ghi đè.
Điểm, quota và receipt commit cùng transaction; cue không được lưu để replay.
Rollback bản ứng dụng cũ không đọc được v2 sẽ fail closed/memory warning, không
được tự hạ version hay reset dữ liệu. Chưa merge nên dữ liệu production chưa bị migrate.

Giữ giới hạn 1000 hồ sơ/10000 receipts và cảnh báo memory fallback hiện có.
IndexedDB là dữ liệu MOCK trên thiết bị, vẫn có thể mất do browser eviction hoặc
bị sửa bằng DevTools; chưa là dữ liệu LIVE có thẩm quyền. Không động tới DB ảnh/XP.

## Kiểm chứng

- Full `npm test`: **143 pass, 0 fail**; final TypeScript/Vite build qua. Còn warning
  chunk 3D cũ >500 kB; không tắt warning hoặc bỏ test.
- Unit: đơn lẻ/108 sự kiện đồng thời, công đức tách đóng góp, gift không mua công
  đức, câu niệm, duplicate, spam/cumulative, refresh quotas, v1 migration/corrupt,
  xếp ghế nhỏ/lớn và giữ neo trong nghi thức.
- Mô phỏng 2000 sự kiện trong hơn 66 phút theo đồng hồ kiểm thử: state hợp lệ,
  quota/điểm phục hồi được và cue luôn bounded. Đây không phải đo FPS iPad kéo dài.
- Chromium 768×1024: chỉ người được chọn cúi/chắp tay, chân và seatId giữ nguyên
  trong nghi thức; hương có hai puff, hoa bay dưới vùng mặt, tự dọn; 20 tim nhanh
  chỉ được một điểm; refresh giữ điểm, không replay hiệu ứng; 108 tên, không tràn ngang.
- Browser IndexedDB thật: v1 giữ đóng góp 50 và receipt, migration v2 không tạo merit
  hồi tố; abort rollback, 108 người xử lý đồng thời được 1080 merit hoa, replay sau
  mở lại không trả lại điểm. LIVE vẫn giữ MOCK, không request bên thứ ba.
- Kiểm thêm reduced motion/TTL, dọn khi tab ẩn và tên thông báo 80 ký tự không che mặt hoặc vượt mép: qua.
- Ảnh đã xem: [lạy](previews/mock-ritual-bow-ipad.png),
  [hương](previews/mock-ritual-incense-ipad.png),
  [hoa](previews/mock-ritual-flower-ipad.png),
  [burst](previews/mock-ritual-burst-ipad.png). Chưa kiểm iPad Safari vật lý/FPS.

Không auto-merge hoặc deploy production. Cần chủ sở hữu duyệt preview trước bước tiếp theo.
