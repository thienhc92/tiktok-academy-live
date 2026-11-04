# TASK-020 — Chuẩn bị staging Workers Free từ iPad

**Trạng thái: chỉ chuẩn bị. Chưa có quyền triển khai hoặc mở backend công khai.**
Frontend hiện có: https://tiktok-academy-live.pages.dev. Không đổi Pages settings,
không nối TikTok, không tạo/đổi secret hoặc tài nguyên Cloudflare trong nhiệm vụ này.

## Tiêu chí chấp nhận

- Cấu hình staging độc lập dùng SQLite, đúng frontend origin; không workers.dev,
  preview, custom domain hoặc route công khai.
- Phân biệt khả năng của Workers Free trong tài liệu với hạn mức/quyền của account
  thực tế: chưa có quyền truy cập account để xác nhận account đang dùng Free.
- Quy trình Secrets không ghi giá trị vào GitHub, chat, frontend, file cấu hình hoặc
  log; không ghi đè khóa có sẵn. Hướng dẫn triển khai kín và mở endpoint có hai cổng phê duyệt riêng.
- Xác minh CORS, phân quyền, WebSocket và thiếu secret bằng runtime cục bộ; toàn bộ
  test/TypeScript/build qua. Giữ nguyên mã và chế độ mô phỏng frontend.

## Cấu hình và khả năng Free

Dùng **`backend/wrangler.staging.json`**, không dùng cấu hình Pages ở gốc hoặc
`backend/wrangler.toml` dành cho cấu hình backend gốc. Chỉ định `--config` rõ ràng;
không dựa vào thư mục làm việc hay môi trường kế thừa. File JSON là định dạng
Wrangler hỗ trợ và cho phép kiểm thử chính sách cấu hình mà không cài parser mới.

| Thuộc tính | Giá trị staging |
| --- | --- |
| Worker | `tiktok-academy-realtime-staging` |
| Entry / class | `worker.ts` / `School` |
| Binding | `SCHOOLS`, class trong cùng Worker; không trỏ `script_name` sang production |
| Migration | `v1`, `new_sqlite_classes = ["School"]`; không dùng `new_classes` KV |
| Origin duy nhất | `https://tiktok-academy-live.pages.dev` (không dấu `/` cuối) |
| Ingress | `workers_dev=false`, `preview_urls=false`, `routes=[]` |
| Restore | `RESTORE_ENABLED="false"` |

Tên Worker riêng tạo namespace riêng; DO có tên logic `academy` bên trong namespace
staging, không dùng chung dữ liệu với Worker khác. `routes=[]` bao gồm việc không
khai báo custom domain. Không thêm GitHub/Workers Builds deploy trigger; CI hiện
chỉ test/build. Không dùng nút **Deploy to Cloudflare**, Quick Edit Hello World
hoặc import repo tùy tiện: có thể mở URL và bỏ qua migration/config đã duyệt.

Cloudflare xác nhận Free hỗ trợ **SQLite-backed Durable Objects**; backend hiện dùng
`storage.sql`, `transactionSync`, WebSocket Hibernation API và SQLite migration đúng
loại. Legacy `migrations` vẫn được hỗ trợ; không đổi cơ chế migration ở nhiệm vụ này.
Không cần D1, KV, R2, Queues, Containers, Workers Paid hoặc dịch vụ connector.

Đối chiếu tài liệu chính thức ngày **04/11/2026**; quota dùng chung account và có thể thay đổi:

| Tài nguyên | Workers Free | Ý nghĩa cho staging |
| --- | --- | --- |
| Worker requests | 100.000/ngày | OPTIONS, handshake và request bị từ chối cũng tiêu thụ tài nguyên biên |
| Worker CPU / memory | 10 ms/request / 128 MB | Chưa đo trên Cloudflare; không coi kết quả máy cục bộ là chứng minh đạt CPU |
| DO requests | 100.000/ngày | HTTP, alarm; incoming WS tính tỷ lệ 20:1 cho quota tính phí, metrics vẫn đếm thực tế |
| DO active duration | 13.000 GB-s/ngày | Hibernation giúp giảm thời gian hoạt động; alarm mỗi 5 giây vẫn có chi phí |
| SQLite rows read / written | 5 triệu / 100.000/ngày | Tính cả index/scan, xóa, heartbeat và alarm; không chỉ receipt phần thưởng |
| SQLite storage | 5 GB/account | Dùng trần 1 GB/DO bảo thủ theo mục SQLITE_FULL của tài liệu Free; bảng tổng quát còn ghi 10 GB. Xác minh mức account trước triển khai, staging dừng từ 100 MB |
| SQL string/BLOB/row | 2 MB | Snapshot chứa replay keys có thể chạm giới hạn trước 10.000 sự kiện |

Trên **Free thật sự**, vượt quota làm thao tác tương ứng lỗi, không mặc định mua
thêm dung lượng. Mục tiêu **0 USD chi phí Cloudflare tăng thêm**, không phải cam kết
không bao giờ gián đoạn. Account Paid có thể phát sinh tiền vượt quota: nếu dashboard
không ghi Free thì dừng, không tự đổi gói. Không bật paid add-on hay log drain.

## Chuẩn bị trên Safari iPad — chỉ đọc, chưa bấm Deploy

1. Mở GitHub, xem PR/CI và lưu commit được duyệt. Mở Cloudflare dashboard, chọn đúng
   account; kiểm tra Workers plan và Usage/Billing đang là Free. Không sửa Pages
   `tiktok-academy-live` hay cấu hình build/domain của nó.
2. Kiểm tra Workers & Pages xem tên `tiktok-academy-realtime-staging` đã tồn tại chưa.
   Nếu tồn tại: kiểm tra binding, Domains & Routes, version và **tên** secret; không
   tiết lộ/ghi đè giá trị. Nếu tên thuộc dự án khác hoặc không rõ nguồn, dừng.
3. Chuẩn bị nơi cất giữ riêng trong trình quản lý mật khẩu và người có quyền vận hành.
   **Chưa tạo giá trị secret ở TASK-020.** Không chụp màn hình, chia sẻ màn hình hoặc
   dùng ô chat/GitHub Issue để gửi khóa.
4. Runtime Codex hiện chưa có kết nối/credential Cloudflare. Sau phê duyệt, cần cấp
   quyền qua cơ chế credential bảo mật của runtime (không gửi token qua chat).
   Token vận hành là loại riêng, giới hạn đúng account/quyền Worker/SQLite migration;
   không cấp quyền Pages/DNS/route nếu không cần. Không tạo token ở nhiệm vụ này.

## Cổng A — triển khai kín, chỉ sau phê duyệt mới

Chủ sở hữu thao tác bằng Safari trong Codex/GitHub/Cloudflare; không cần cài CLI trên
máy iPad. Bước Wrangler chạy trong cloud runtime đã được xác thực, có bản ghi commit
và cấu hình được duyệt. Dashboard đơn thuần dán TypeScript không thay thế bundling và
migration SQLite; nếu runtime chưa có quyền thì dừng thay vì dùng cách triển khai khác.

Mẫu lệnh **chưa chạy, không phải quyền thực thi hiện tại**:

```sh
npx wrangler@<PHIEN_BAN_DA_KIEM_CHUNG> deploy --config backend/wrangler.staging.json
```

Trước đó phải chọn/kiểm chứng phiên bản Wrangler còn hỗ trợ `new_sqlite_classes`,
xác nhận account ID bằng dữ liệu không bí mật và khóa phạm vi account cho phiên chạy.
Chưa cài hoặc thử Wrangler/cloud deployment trong TASK-020. Nếu tên Worker đã có secret,
operator chỉ kiểm tra **tên** bằng dashboard; không xóa, xoay vòng hay chạy bulk secrets.
Nếu không thể bảo đảm giữ nguyên secret cũ hoặc route hiện hữu, dừng để chủ sở hữu quyết định.

Bản triển khai kín ban đầu có thể chưa có bốn khóa: API trả **503**, chỉ `/health`
trả tên/phiên bản. Đó là hành vi đóng an toàn, không phải thông báo sẵn sàng. Không mở
URL để chữa lỗi 503. Migration lần đầu tạo namespace; chưa có deployment trước đó để rollback.

### Cấu hình Cloudflare Secrets — sau cổng A, không trước

Trong Cloudflare **Workers & Pages → đúng Worker staging → Settings → Variables and Secrets**:

| Tên | Mục đích | Nơi dùng |
| --- | --- | --- |
| `INGEST_TOKEN` | Nguồn sự kiện mô phỏng đã xác thực | Chỉ hệ thống gửi sự kiện; không nhập vào frontend |
| `ADMIN_TOKEN` | Lệnh quản trị và backup | Chỉ chủ sở hữu, bộ nhớ thẻ Admin khi thử nghiệm |
| `VIEW_TOKEN` | Xem trạng thái, nhận vé WebSocket | Thẻ phát sóng; không có quyền thưởng/chỉnh XP |
| `BACKUP_KEY` | Ký/kiểm backup HMAC | Chỉ Worker và kho mật khẩu riêng; không nhập vào UI |

- Chọn **Type: Secret**, đúng tên chữ hoa. Mỗi giá trị ngẫu nhiên mật mã, khác nhau,
  ít nhất 32 ký tự (khuyến nghị 32 byte entropy trở lên); chỉ tạo sau khi có phép và
  cất giữ ngoài repo. Không tự đưa ví dụ giá trị có thể dùng thật vào tài liệu.
- Thêm **chỉ khóa còn thiếu**. Với khóa đã có nhưng không biết giá trị: dừng, không
  thay để thử. Không dùng giá trị production cho staging. Không đặt trong `vars`,
  `VITE_*`, GitHub Secrets, logs, `.env` được theo dõi hoặc URL.
- Dashboard có thể hiển thị **Deploy** để áp dụng Secrets: đây là deployment mới,
  nằm trong cổng A đã duyệt, phải kiểm tra workers.dev/preview/routes vẫn đóng trước
  và sau thao tác. `wrangler secret put/delete` cũng deploy ngay; **không chạy**.
  `versions secret put` vẫn sửa tài khoản/tạo version, không phải thao tác chỉ đọc.
- Mất `BACKUP_KEY` có thể làm backup không nhập được. Không xoay vòng trong nhiệm vụ
  này và không xoay sau này nếu chưa có kế hoạch giữ khóa/khả năng đọc backup cũ.
- `FRONTEND_ORIGIN` và `RESTORE_ENABLED` là biến thường, không phải secret; chỉ đặt
  đúng hai giá trị trong config. Không thay đổi origin production Pages.

Kiểm tra Domains & Routes không có workers.dev/custom domain/route và Preview URLs
đang tắt; kiểm tra `SCHOOLS → School` và SQLite. Không bật preview để dùng Dashboard
Test: nếu công cụ đó cần URL public thì giữ nguyên trạng thái kín. Test local không
chứng minh auth đã được kiểm tra qua mạng Cloudflare; kiểm tra mạng chờ cổng B.

## Cổng B — mở endpoint staging, phê duyệt riêng

Chưa có hostname/backend URL được cấp. Bản cấu hình hiện tại **không thể kết nối trực
tiếp từ Pages**, dù origin đã đúng. Chủ sở hữu phải duyệt hostname, cơ chế truy cập,
thời gian thử và ngân sách trước khi thay `workers_dev`, `preview_urls` hoặc routes.
Ưu tiên một staging URL và giữ Preview URLs tắt; không đổi DNS/custom domain/route Pages.
Worker endpoint được bảo vệ bằng token **vẫn là endpoint công khai về mặt mạng**.
CORS chỉ bảo vệ trình duyệt, không ngăn request ngoài trình duyệt hoặc DDoS.

Sau cổng B mới được xác minh HTTPS/WSS thực tế: `/state` không token 401; token sai
403; Origin lạ 403; preflight đúng origin 204; view không ghi; ingest không đọc hoặc
quản trị; vé WS một lần; thiếu khóa API 503 (chỉ thử thiếu khóa bằng local, **không xóa
secret trên cloud để test**). Không có API chỉnh XP tùy ý. Secret hợp lệ không được
phản chiếu trong response/log. `/health` 200 không chứng minh auth hay database sẵn sàng.
Sau đó nhập URL + **view** token vào thẻ phát sóng; admin dùng thẻ riêng, nhập lại sau
reload; không lưu khóa vào URL/localStorage, không đưa ingest/backup key vào frontend.

## Rollback/sự cố trên iPad — không xóa dữ liệu

1. Ngừng nguồn mô phỏng, ngắt các client; frontend trở lại mô phỏng cục bộ. Ghi version,
   commit và sequence gần nhất; giữ backup có chữ ký trong nơi riêng tư.
2. Nếu đã mở endpoint theo cổng B, yêu cầu operator đóng đúng ingress đã duyệt trong
   Domains & Routes (không chạm Pages) và ngắt client trước khi sửa; đóng route không
   chắc chấm dứt socket/alarm đang tồn tại. Phiên WS hiện hết hạn sau tối đa 15 phút.
3. **Workers & Pages → staging Worker → Deployments → version ổn định → ⋯ → Rollback.**
   Chỉ dùng bản có schema/binding tương thích và quyền cổng A còn hiệu lực. Nếu chưa
   có bản cũ, hoặc Cloudflare chặn rollback do đổi lifecycle/migration, dừng và sửa
   tiến về trước; không xóa Worker/DO/namespace hoặc sửa migration đã áp dụng.
4. Rollback code **không rollback SQLite hay khôi phục dữ liệu**. Không đổi secret để
   làm bản cũ chạy được; version/secret không tương thích cần quyết định riêng.
   Không restore backup vào kho đang hoạt động. Restore chỉ vào kho trống, cùng
   `BACKUP_KEY`, bật `RESTORE_ENABLED` có phê duyệt riêng rồi tắt lại.
5. Giữ nguyên public ingress đóng khi kiểm tra lại. Không tự mở lại sau rollback.
   Không chạy SQL DELETE/reset player hoặc xóa khóa chống trùng để giảm quota.

## Checklist giám sát miễn phí

Các mục sau là kiểm tra thủ công, **chưa cài alert/dịch vụ/telemetry mới**. Dashboard
labels có thể thay đổi; dùng Request Desktop Website trên Safari nếu bảng bị ẩn.

- [ ] Trước/sau mỗi lượt: Billing/Usage vẫn Free, xem quota **toàn account**, không chỉ
  Worker này. Ghi giờ UTC; quota ngày reset 00:00 UTC (07:00 Việt Nam).
- [ ] Bắt đầu 1–2 client, tối đa 15 phút/lượt, tối đa 1.000 sự kiện giả lập/ngày.
  20–100 học sinh là bản ghi người chơi, **không cần 20–100 socket** khi chia sẻ một iPad.
- [ ] Worker Metrics: request, CPU/exceeded resources, error 4xx/5xx/1102. DO Metrics:
  duration, WS/reconnect, alarm; Storage: rows read/written và dung lượng.
- [ ] `resume` mỗi 15 giây ghi bảng budget: 100 socket = 400 resume/phút, khoảng
  **ít nhất khoảng 800 row write/phút cho INSERT OR REPLACE** (ước tính xóa + chèn, chưa tính index), gần 48.000/giờ trước
  ingest/alarm. Hai socket khoảng 960/giờ trở lên cho mục này. Đây là ước tính SQL,
  chưa phải số đo account; kiểm tra dashboard, không suy từ số XP/số message nhận.
- [ ] Alarm mỗi 5 giây khi có socket: khoảng 720 invocation/giờ và các lần setAlarm
  cũng ghi row. Snapshot/outbox retention xóa row; receipt scan và pending outbox
  có thể tăng rows read. Hibernation không làm những thao tác này miễn quota.
- [ ] Nếu quota ngày đạt 50%: dừng lượt staging, điều tra nguyên nhân; 80%: không mở
  lượt mới. Dừng ngay khi có lỗi quota, CPU, replay, tăng XP lặp hoặc reconnect liên tục.
  Không mua gói mới, không vô hiệu kiểm tra bảo mật để tiếp tục.
- [ ] Theo dõi sequence và backup trước lượt lớn; dừng để đánh giá từ sequence 5.000
  (mốc bảo thủ), game JSON 500 KB, SQL snapshot row 1 MB hoặc storage 100 MB. Giới hạn
  engine thực tế vẫn 10.000 event ID/1.000 lệnh/game 1 MB; toàn bộ replay envelope
  có thể chạm SQL row 2 MB sớm hơn. TASK-020 không giải quyết compaction hoặc tải LIVE dài.
- [ ] Không ghi Authorization, ticket, backup payload hoặc giá trị Secret vào Logs/Tail,
  ảnh hoặc Issue. Dùng chỉ số tổng hợp; backup là dữ liệu riêng, HMAC không mã hóa nó.

## Xác minh mã trước PR

99 kiểm thử đã qua, gồm 22 kiểm thử realtime/staging: cấu hình không public/không
secret, CORS chính xác, role/header/method/route protection, vé và Origin WebSocket,
từng secret thiếu, khóa ngắn/trùng và origin thiếu. `npm run build` qua TypeScript
frontend/local/backend và Vite; `npm audit --audit-level=high` không có lỗ hổng.
Bundle 3D còn cảnh báo kích thước hiện có. Không sửa mã ứng dụng, package hoặc Pages
config; không cài dependency. Đây là xác minh runtime **cục bộ**, không phải kết quả
triển khai Cloudflare hay xác minh Safari vật lý.

## Phê duyệt cuối cần có

**Cổng A — chưa được cấp:**
> Tôi phê duyệt triển khai kín Worker `tiktok-academy-realtime-staging` từ commit đã
> có CI đạt, theo `backend/wrangler.staging.json`, trên account Workers Free đã xác
> minh. Cho phép cấp credential vận hành qua kênh bảo mật và tạo chỉ các Cloudflare
> Secrets staging còn thiếu. Giữ workers.dev và preview tắt, routes rỗng; không ghi
> đè secret/dữ liệu cũ, không đổi Pages và không mở endpoint công khai.

**Cổng B — cần yêu cầu riêng sau cổng A:**
> Tôi phê duyệt mở endpoint staging tại [hostname cụ thể], trong [thời hạn thử], cho
> [người dùng/quyền truy cập cụ thể], với giới hạn Free và phương án đóng endpoint.

Không coi merge PR, dashboard login, bật public Internet trong Codex hoặc lời duyệt
**chuẩn bị** là phê duyệt A/B.

## Nguồn chính thức

- [DO pricing: Free, SQLite, quotas và WebSocket](https://developers.cloudflare.com/durable-objects/platform/pricing/)
- [DO limits: storage, SQL row và SQLITE_FULL](https://developers.cloudflare.com/durable-objects/platform/limits/)
- [Workers limits: requests, CPU và memory](https://developers.cloudflare.com/workers/platform/limits/)
- [Wrangler config: routes, URL và migration](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [Secrets: Dashboard/CLI và deployment side effect](https://developers.cloudflare.com/workers/configuration/secrets/)
- [DO class lifecycle: legacy migrations còn được hỗ trợ](https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/)
- [Rollback và giới hạn migration/data](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/)
