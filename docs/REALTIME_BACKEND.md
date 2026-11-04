# TASK-019 — Máy chủ thời gian thực (chưa triển khai)

## Tiêu chí chấp nhận

- React/Vite/Cloudflare Pages vẫn chạy độc lập với mô phỏng và bản lưu cục bộ cũ.
- Worker xác thực và phân quyền trước khi chuyển yêu cầu tới một Durable Object SQLite `academy`.
- Batch, khóa chống trùng, phần thưởng, trạng thái/sequence và outbox được commit trong cùng giao dịch đồng bộ.
- WebSocket gửi snapshot/delta có phiên bản, epoch và sequence; reconnect/gap phải phục hồi được mà không thưởng lại.
- Kiểm thử SQLite, workerd thật cục bộ, xác thực, đồng bộ, bản sao lưu và hồi quy hiện có phải qua; không gọi TikTok hoặc triển khai backend.

## Các lớp và dữ liệu

`backend/store.ts`: repository máy chủ qua cổng `SqlPort` (`exec`, `transaction`).
Dùng lại `processEvent`, `eventKey`, quy tắc quiz/thăng cấp và kiểu receipt/reward của TASK-018C. Adapter Node `local/sqliteRepository.ts` vẫn độc lập và nguyên vẹn; không thể đưa `node:sqlite` vào Worker. Adapter Cloudflare ánh xạ cổng sang `storage.sql.exec` và `storage.transactionSync`; kiểm thử cũng dùng SQLite thật qua cổng này.

Các bảng: `meta` (schema/epoch), `snapshots`, `receipts` (receipt và các thay đổi XP/cống hiến), `outbox`, `tickets`, `budgets`. Schema không tương thích hoặc snapshot hỏng phải dừng, không tự xóa dữ liệu. Mỗi batch chỉ tạo một snapshot/outbox; sequence tăng cho mỗi sự kiện mới, kể cả quan sát không được thưởng. Giao dịch quản trị tăng một sequence. Duplicate trả receipt cũ, không tăng sequence.

Khóa sự kiện: JSON `[source, roomId, sessionId, kind, eventId]`. Nguồn trên backend chỉ nhận chữ/số/gạch nối/gạch dưới; ID người xem là chuỗi chuẩn, không dùng nickname làm danh tính. ID thiếu chỉ ghi nhận, không thưởng. Thiếu ID sự kiện ổn định không được tự tạo ID ngẫu nhiên mỗi lần thử: connector tương lai phải cách ly hoặc cấp một khóa bền vững ngay lúc nhận. Hai sự kiện thật khác nhau mang cùng ID không thể phân biệt: lần đầu thắng. Không suy đoán quà từ các cập nhật chưa kết thúc; like lũy kế thiết lập mốc rồi lấy phần tăng; bản cập nhật cũ không hạ mốc. Engine giữ cooldown, hạn mức, cửa sổ trễ 30 giây, quiz và kỳ thi như cũ. Worker ghi đè `receivedAt` bằng thời gian máy chủ; `occurredAt` vẫn được kiểm tra.

Không có endpoint chỉnh XP trực tiếp, thay cấu hình điểm hay nhập bản lưu trình duyệt. Hai nhóm trạng thái **không hợp nhất**: kết nối backend khóa các bộ chỉnh/simulator cục bộ; ngắt kết nối khôi phục bản lưu cục bộ nguyên vẹn. Nickname/rank của tối đa 20 người đầu hiển thị trong cảnh; bảng xếp hạng dùng toàn bộ danh sách.

## API v1 và quyền

Secret mờ, khác nhau, ít nhất 32 ký tự: `INGEST_TOKEN`, `ADMIN_TOKEN`, `VIEW_TOKEN`, `BACKUP_KEY`. Không có giá trị thật trong repo. Secret thiếu/trùng không mở API. Chỉ Worker gọi được DO; Worker loại Authorization và ghi đè header vai trò nội bộ. So sánh token bằng digest độ dài cố định. Các secret không đưa vào biến `VITE_*`, URL, bản lưu trình duyệt hoặc nhật ký.

| Đường dẫn | Phương thức | Quyền | Nội dung |
|---|---|---|---|
| `/health` | GET | Không cần | Tên dịch vụ/phiên bản, không xác nhận DB hoặc secret hợp lệ |
| `/events` | POST | ingest | Mảng 1–25 normalized event; tối đa 64 KiB; receipt sau commit |
| `/state` | GET | view/admin | Snapshot đã bỏ khóa chống trùng và lịch sử văn bản bình luận |
| `/ticket` | POST | view/admin | Vé WebSocket ngẫu nhiên, dùng một lần, hết hạn sau 30 giây |
| `/ws` | GET Upgrade | Vé + Origin | Subprotocol `academy-v1, ticket-…`; không token trong query string |
| `/commands` | POST | admin | `{id,command}`; id ổn định khi retry; quiz.open/session.start/promote/office.appoint qua bộ kiểm tra hiện có |
| `/backup` | GET/POST | admin | `{payload,signature}`; payload JSON, chữ ký HMAC-SHA256 |
| `/restore` | POST | admin | Chỉ bật khi `RESTORE_ENABLED=true` và repository trống; kiểm chữ ký, tạo epoch mới |

Lệnh ví dụ: `{type:'quiz.open',question:'q1',seconds:30}`; `{type:'session.start'}`; `{type:'promote',playerId:'fixture:123',target:1}`. Không thể bỏ qua điều kiện XP/kỳ thi. Không nhận lệnh qua WebSocket. UI hỗ trợ quiz, lịch sử/thăng cấp, bổ nhiệm chức vụ theo bộ kiểm tra hiện có, phiên mô phỏng mới và tải backup. Bổ nhiệm dùng `{type:'office.appoint',office:'class-leader'}`; không dùng quà hay điểm cống hiến làm điều kiện. Nếu mất xác nhận lệnh, kiểm tra snapshot trước khi thao tác lại; client không tự gửi lại lệnh với ID mới. Bên tích hợp phải giữ cùng ID yêu cầu cho retry.

`FRONTEND_ORIGIN` là **một** origin tin cậy chính xác. CORS và handshake kiểm tra Origin; không dùng wildcard. Ingest server có thể không gửi Origin, nhưng phải có bearer token. CORS không thay thế xác thực. Khóa trong Admin chỉ nằm trong bộ nhớ thẻ; phải nhập lại sau reload. Dùng view token cho thiết bị chỉ phát sóng. Không có tài khoản/SSO hoặc phân quyền nhiều trường ở mốc này.

## Đồng bộ, outbox và phục hồi

Snapshot: `{v:1,type:'snapshot',epoch,sequence,game}`.
Delta: `{v:1,type:'delta',epoch,from,sequence,players,academy?,live?}`. `players` chỉ gồm bản ghi thay đổi; academy/live gửi nguyên phần thay đổi (đã loại lịch sử văn bản/ID nhận). Delta có thể vượt nhiều sequence vì batch; phải khớp `from`, không giả định sequence tăng đúng một. Hỗ trợ 25 sự kiện/batch, tối đa 100 socket; client không thực hiện fetch từng avatar.

DO dùng WebSocket hibernation API, lưu thời hạn phiên trong attachment. Sau commit mới gửi outbox; alarm phục hồi các bản ghi chưa gửi. Đánh dấu gửi không phải xác nhận client đã nhận. Ngữ nghĩa truyền **ít nhất một lần**, client bỏ delta cũ; phần thưởng đúng một lần trong phạm vi khóa sự kiện đã lưu. Khi crash sau gửi trước đánh dấu, delta có thể lặp. Khi không còn delta cũ, trả snapshot. Sau crash trước gửi, client resume vẫn đọc được outbox/snapshot. Không hứa exactly-once trên mạng.

Client gửi `{type:'resume',epoch,sequence}` khi mở socket, phát hiện gap và mỗi 15 giây để bắt cả gói cuối bị mất. Retry 1–30 giây; mỗi kết nối lấy vé mới; request/handshake có timeout 10 giây. Giữ hình ảnh gần nhất khi mất mạng, hiển thị cảnh báo tiếng Việt, không tự chuyển sang chỉnh XP cục bộ. Phiên socket tối đa 15 phút (đổi vé khi đóng); alarm kiểm tra mỗi 5 giây khi có socket/outbox. Không có dữ liệu phòng/người xem thật.

## Lưu giữ, backup và phục hồi

- Giữ 20 snapshot toàn phần và 200 delta gần nhất; fallback snapshot khi client quá cũ.
- Không tự xóa receipt, mốc like hay quà đã đóng. Giới hạn kế thừa engine: 10.000 khóa sự kiện, 1.000 lệnh quản trị, game JSON tối đa 1 MB. Đạt giới hạn thì từ chối batch nguyên vẹn. Đây là cổng an toàn **chưa đủ cho buổi LIVE dài**; cần thiết kế compaction/retention có tombstone ở mốc hardening tiếp theo trước live.
- Ngân sách 1.000 đơn vị/phút theo vai trò (ingest tính thêm số sự kiện), 1.000 thông điệp resume/phút toàn trường; request không xác thực không mở DO. Cần rate limiting ở biên và giới hạn payload/quota theo account trước công khai.
- Trước thay schema và định kỳ trong thử nghiệm: quản trị tải backup có chữ ký, cất giữ riêng. Đề xuất 7 bản ngày + 4 bản tuần ngoài backend; **chưa có nơi lưu hay job backup ngoài hệ thống**. Bản export gồm snapshot mới nhất và toàn bộ receipt, không gồm secret/vé. Chữ ký đảm bảo toàn vẹn, **không mã hóa** dữ liệu. Giới hạn cả export và import là 16 MiB; file vượt giới hạn bị từ chối thay vì xuất file không thể nhập. Cần compaction trước khi dùng lâu dài. Không commit backup vào repo.
- Phục hồi thử trên DO trống, cùng `BACKUP_KEY`; chỉ tạm bật restore khi đã được phê duyệt. Không ghi đè DB đang hoạt động. Kiểm tra signature, replay một event cũ, xác nhận sequence/XP, rồi tắt restore. Nếu thất lạc signing key thì không phục hồi file qua endpoint. Epoch mới buộc mọi client nhận snapshot.
- Cloudflare có công cụ phục hồi SQLite theo gói tài khoản; cần xác minh giới hạn hiện hành, không thay thế bản export độc lập. Không thêm R2 hoặc dịch vụ trả phí.

## Chuẩn bị staging TASK-020

Xem [hướng dẫn Workers Free/iPad](CLOUDFLARE_STAGING.md) cho cấu hình riêng
`backend/wrangler.staging.json`, đúng origin `https://tiktok-academy-live.pages.dev`,
quy trình Secrets không ghi đè và hai cổng phê duyệt triển khai kín/mở endpoint.
Cấu hình gốc `backend/wrangler.toml` giữ nguyên, không dùng để triển khai staging.
Tài liệu xác nhận tính tương thích Free, không xác nhận plan/quyền của account thực tế.

## Chạy và triển khai sau khi được phê duyệt

Yêu cầu Node theo `.node-version` (22.19 trở lên do công cụ kiểm thử); `npm ci`, `npm test`, `npm run build`.
`npm test` biên dịch Worker bằng esbuild rồi chạy Miniflare/workerd với SQLite và WebSocket thật cục bộ. Runtime cần cổng loopback; trong Codex dùng quyền nâng cao nếu sandbox chặn. Không cần tài khoản Cloudflare hoặc credentials. Miniflare hiện ghim dependency dev cũ; override Undici 8.12.3/Sharp 0.35.5 để vá cảnh báo mức cao, được kiểm chứng bằng toàn bộ bài kiểm thử workerd. Cần kiểm tra lại override khi nâng Miniflare; không dùng `npm audit fix --force` để hạ runtime. Wrangler config ở `backend/wrangler.toml`; Pages config hiện tại giữ nguyên, đầu ra frontend vẫn `dist`. Ngày compatibility được cố định tương thích runtime kiểm thử.

Chỉ sau khi chủ sở hữu phê duyệt:
1. Kiểm tra account có SQLite Durable Object trong hạn mức miễn phí, xác nhận ngân sách và giới hạn. Không bật gói trả phí.
2. Dùng Wrangler CLI tương thích, cấu hình bốn Worker secret và một frontend origin. Không gửi secret vào chat hay file theo dõi bởi Git. Máy iPad có thể dùng trình quản lý Cloudflare sau khi chốt phương án cấp secret an toàn.
3. Với staging, triển khai bằng `--config backend/wrangler.staging.json` cùng migration `new_sqlite_classes`; cấu hình hiện tại tắt workers.dev và preview, không có route công khai. Việc mở route/URL cần phê duyệt riêng; không có workflow deploy backend.
4. Kiểm tra auth/Origin, quyền view/ingest/admin, giới hạn và backup/restore trên môi trường staging được phê duyệt trước khi kết nối frontend. Không tự kết nối khi mở demo Pages.
5. Nhập URL + view/admin token trong màn hình quản trị; không thêm token vào cấu hình build của Pages.

## Giới hạn phát hành và hardening tiếp theo

Đây là nền tảng chạy/kiểm thử cục bộ, chưa được xác nhận sẵn sàng vận hành công khai. Chưa có tải thực tế Cloudflare, thiết bị iPad Safari vật lý, autoscaled multi-school, secret rotation/SSO, lịch backup ngoài hệ thống hoặc SLA. 100 người được kiểm thử theo batch và trạng thái nhất quán, không phải tuyên bố đạt FPS/độ trễ mạng ở 100 thiết bị. Bundle 3D còn cảnh báo kích thước như hiện có. Ngân hàng câu hỏi mẫu vẫn trong frontend; cần tách đáp án khỏi bundle trước thi có giá trị thật.

Backlog sau chuẩn bị staging: compact receipt/counter có tombstone và thời hạn replay rõ ràng; quota/giám sát và thử tải 100 client; kiểm thử mạng chập chờn trên iPad vật lý; quản lý/luân chuyển quyền và backup ngoài hệ thống được phê duyệt; tách đáp án quiz. Chỉ sau những cổng này mới xem xét adapter TikTok hợp lệ ở nhiệm vụ riêng.

## Xác minh mốc triển khai mã

95 kiểm thử qua: 77 hồi quy và 18 kiểm thử realtime (bao gồm subtest). Kiểm thử mới xác nhận rollback reward/dedup/outbox, mất xác nhận sau commit, SQLite restart, sự kiện đồng thời, like lũy kế/quà streak, 100 người theo 4 batch, retention/gap, phân quyền/Origin/vé một lần, restore có chữ ký và client retry/resume. `npm run build` kiểm tra TypeScript frontend/local/backend và build Vite thành công. `npm audit --audit-level=high` không có lỗ hổng. CI bổ sung audit vào job test/build hiện có.

Smoke Chromium với Worker cục bộ đã qua kết nối, nickname, quiz, tải backup, 9:16 tại 768×1024, 820×1180 và 390×844, ẩn Admin trong Broadcast, đồng bộ khi phát và khôi phục bản lưu cục bộ không thay đổi. Đây không phải kiểm thử Safari vật lý; không tuyên bố fullscreen ẩn thanh trình duyệt. Backend chưa triển khai.
