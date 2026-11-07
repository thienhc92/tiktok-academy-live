# Nối website hiện có với Node Listener — chuẩn bị, chưa triển khai

## Audit ngày 07/11/2026

- Website `https://tiktok-academy-live.pages.dev` trả HTTP200 và header `cf-ray`.
  `wrangler.toml` khai báo Pages/output `dist`; checks GitHub mang tên Cloudflare
  Pages. Bằng chứng hiện có xác định **Cloudflare Pages**, không phải CloudFront.
- Chưa có bằng chứng CloudFront trong repo. Không có quyền Cloudflare/AWS hoặc
  outbound identity sẵn sàng trong runtime để kiểm kê tài nguyên tài khoản; không
  kết luận rằng tài khoản không có VPS/EC2/dịch vụ khác ngoài repo.
- `main` chưa có `/admin/tiktok` và `/broadcast/tiktok`; chúng đang ở PR #26 nháp.
  Vì vậy chỉ đưa backend lên host chưa đủ: frontend mới cũng cần được phát hành.
- GitHub Actions chạy install/audit/typecheck/tests/build; Pages Git integration
  xây preview và tự triển khai khi nhánh production thay đổi. Không có job deploy
  Node Listener. Không đổi Pages settings hoặc nhánh production trong nhiệm vụ này.
- Worker/DO trong `backend/` là backend học viện. Staging config tắt workers.dev,
  preview và routes; đây không phải host Node/Socket.IO chùa. Chưa xác minh deployment
  đang hoạt động trong account; không gửi event chùa vào DB học viện.
- PR #26 đã có connector2.5.0, gateway, SQLite và Admin/Broadcast; không viết lại.
  Chưa có URL HTTPS của backend thường trực được xác minh.

## Phương án ít thay đổi

```text
Safari → https://tiktok-academy-live.pages.dev/admin/tiktok
       → /api/temple/* và /socket.io (Pages Function proxy)
       → HTTPS backend Node riêng → TikTok public LIVE listener
       ← SQLite/engine → Socket.IO WSS cùng domain → /broadcast/tiktok
```

`public/_worker.js` là Pages advanced-mode proxy; `_routes.json` chỉ gọi Function
cho API/socket, các ảnh/JS/CSS vẫn là static CDN. Không có daemon Node trong Pages.
Backend URL và gateway key chỉ là runtime binding ở server; frontend không có URL
backend cấu hình bằng VITE_*, token hoặc cookie TikTok. Cùng origin giúp Safari
không cần cookie bên thứ ba/CORS wildcard và không cần localhost/Codespaces.

Proxy bắt buộc HTTPS backend, frontend origin chính xác và gateway secret>=32 ký
 tự; thiếu cấu hình trả503. Bỏ header giả, chỉ chuyển cookie `temple_trial`, tự thêm
`X-Temple-Gateway`, giữ native-login redirect/Set-Cookie và WebSocket101. Origin lạ
bị từ chối; response API không cache. Node kiểm tra gateway key **và** phiên owner;
backend URL bị truy cập trực tiếp không cho login/API/socket nếu thiếu gateway key.
`/healthz` chỉ báo process-up, không nói Connected hoặc lộ user/room/secret.

## Hosting và chi phí tham khảo

| Lựa chọn | Ước tính tăng thêm | Nhận xét |
|---|---|---|
| VPS/Node host24/7 đã có của chủ sở hữu | Có thể 0USD nếu đủ tài nguyên | Ưu tiên; chưa có host nào được xác minh trong phiên này. Cần persistent disk, Node24 hoặc Docker, HTTPS/WSS. |
| Render Free | 0USD trong hạn mức | Ngủ sau15 phút không có inbound traffic; 750 giờ miễn phí/workspace/tháng, không persistent disk. Không đáp ứng listener24/7 độc lập Safari. |
| Render paid compute mức $7 + disk1GB | Khoảng **7,25USD/tháng**, chưa thuế/egress/vượt quota | Cần chủ sở hữu duyệt trước tạo dịch vụ/volume. TLS/domain nền tảng có sẵn; chưa xác minh account, khu vực hoặc tải LIVE. Không tự mua/bật thanh toán. |

Nguồn đã đọc: [Render Free](https://render.com/docs/free),
[Render pricing](https://render.com/pricing). Giá/điều kiện có thể đổi; xác nhận ở
checkout trước phê duyệt. Không cam kết miễn phí24/7 khi chưa có máy chủ phù hợp.
Render Hobby hiện ghi 5GB bandwidth/tháng, sau đó0,15USD/GB; vì vậy **7,25USD không phải trần tổng chi phí**. Gateway hiện gửi snapshot toàn phần theo batch: ví dụ40KB ×5frame/s xấp xỉ0,72GB/giờ/màn hình, chưa overhead. Cần đo traffic thực tế và duyệt cả egress trước vận hành nhiều giờ; không tự nâng gói.

512MB chỉ là mức compute được báo giá, không phải cam kết đủ tải. Đề nghị dự phòng
RAM1GB nếu host đã có, đo lại trên LIVE thật trước tăng tài nguyên. Image kiểm thử
idle có RSS Node khoảng122MiB; không phải benchmark100 người/LIVE kéo dài.

Pages Function dùng quota Workers/Functions của account; chỉ API/socket đi qua
Function. Giữ gói hiện có, xác nhận quota/billing trong dashboard trước bật route.
Không tự bật Workers Paid, Containers, R2 hoặc dịch vụ mới. Ký Webcast vẫn theo
free-community limit của connector; rate-limit/premium làm dừng, không mua fallback.

## Artifact đã chuẩn bị

- `Dockerfile`: Node24, user node không phải root, cài package backend riêng,
  không secrets, health check, `/data` cho volume; không phục vụ frontend từ container.
- `Dockerfile.dockerignore`: bỏ Git/node_modules/.env/DB và dữ liệu riêng khỏi context.
- `Caddyfile`: tùy chọn cho VPS đã có, TLS reverse proxy127.0.0.1:3002. Không chạy
  hoặc xin certificate khi chưa có host/domain được duyệt. Nếu host cung cấp TLS
  sẵn thì không cần Caddy hoặc mua domain mới.

Build cục bộ (không đẩy registry/deploy):

```bash
docker build -f deploy/live/Dockerfile -t chua-live-backend .
```

Nếu môi trường build có managed CA/proxy, cấp CA bằng BuildKit secret `proxy_ca`,
không COPY CA vào image hoặc tắt TLS. Trong Codex đã build với CA được cấp và proxy
hiện có. Backend runtime vẫn tôn trọng proxy/NO_PROXY; không sửa network security.

## Các bước sau khi chủ sở hữu duyệt

**Gate A — host/staging, chưa đổi website production:**

1. Chọn host sẵn có, hoặc duyệt rõ provider/gói/ngân sách/volume. Không tạo tài
   nguyên trả phí trước quyết định này. Lấy backend origin HTTPS với certificate hợp lệ.
2. Đặt bí mật bằng dashboard/secret manager, không chat/Git/log. Không ghi đè bí mật
   hoặc DB có sẵn. Không bake secrets vào image hoặc dùng tên `VITE_*`.

| Runtime Node | Giá trị cấu hình |
|---|---|
| `TRIAL_ORIGIN` | Origin Pages preview đã chọn khi staging; domain website thật khi phát hành |
| `LIVE_GATEWAY_KEY` | Secret ngẫu nhiên>=32 ký tự, cùng giá trị với Pages; khác mật khẩu owner |
| `TRIAL_ADMIN_PASSWORD` | Mật khẩu owner mạnh>=16 ký tự, chỉ ở Node |
| `LIVE_BIND_HOST` | Docker/host-managed port:0.0.0.0; VPS sau Caddy:127.0.0.1 |
| `PORT` | Port host cung cấp; mặc định3002 |
| `TRIAL_DATA_DIR` | `/data`, gắn persistent volume; giữ SQLite/WAL; không dùng filesystem ephemeral |

Binding0.0.0.0 bị từ chối khi thiếu HTTPS origin/secrets. Container có thể bind0.0.0.0
bên trong nhưng origin host phải giữ TLS và secret guard; không public port3001.

3. Triển khai image/Node sau duyệt, không cấu hình auto-deploy backend vào production
   chỉ vì có PR. Health200 chỉ kiểm process. Chưa Connect khi chưa có username LIVE
   được chọn. Lưu lại version/image digest và backup DB nhất quán ngoài container.
4. Ở **Pages Preview environment** đặt `FRONTEND_ORIGIN` đúng URL preview nhánh đã
   chọn, `LIVE_BACKEND_ORIGIN` đúng HTTPS backend, và secret `LIVE_GATEWAY_KEY`.
   Chỉ một origin mỗi Node instance; không dùng wildcard hoặc trộn preview/production.
   PR có advanced-mode proxy nên không cần đổi domain website hoặc VITE_API_URL.
5. Kiểm tra certificate/HTTPS, login HttpOnly Secure, API không xác thực401/403,
   Origin lạ bị chặn, backend trực tiếp thiếu gateway key bị chặn, Socket.IO WSS101,
   reload/reconnect giữ điểm. Từ chối cấu hình HTTP backend hoặc thiếu secret.
6. Chỉ khi tài khoản thực sự đang LIVE: Connect phải có statusconnected/roomId,
   nhận comment/like/gift thật và quan sát Broadcast; kiểm streak/replay/disconnect.
   OFFLINE khác lỗi mạng. Phép thử cũ `anhxinloi616` báo offline không chứng minh lỗi
   backend; không lặp lại khi chưa biết tài khoản đang phát.

**Gate B — phát hành website thật:**

Sau kiểm thử staging, cần phê duyệt merge/deploy PR #26 và cấu hình production.
Đặt Pages **Production** bindings tương ứng website thật và đổi Node origin khớp.
Không trỏ hai origin vào một instance. Không tự chuyển dữ liệu thử nghiệm vào MOCK,
xóa dữ liệu, rotate secrets hoặc đổi Pages settings. Chỉ sau deploy được duyệt, URL:

- `https://tiktok-academy-live.pages.dev/admin/tiktok`
- `https://tiktok-academy-live.pages.dev/broadcast/tiktok`

Hiện đây là **URL đích**, chưa phải xác nhận tính năng LIVE đã phát hành.
Rollback về Pages deployment đã duyệt trước và version backend cũ, giữ nguyên volume,
kiểm tương thích schema trước mở DB; không reset receipts hoặc force-push.

## Kiểm chứng và giới hạn

- 178 tests qua: proxy HTTPS-only/Origin/cookie/shared key/101 và Node auth/socket,
  SQLite/streak/replay/engine regressions. Backend typecheck và Pages worker JS được kiểm kiểu.
- Docker image build thành công; startup bằng user node, health process-up; thiếu
  gateway key403, có gateway nhưng thiếu phiên401. Không publish port hoặc gọi TikTok.
  Có sửa lỗi ownership COPY sau lần smoke đầu phát hiện non-root không đọc được file.
- Không thay UI/PNG/108 seats/điểm; không cần vòng screenshot mới cho thay đổi này.
- Chưa có backend public, chưa kiểm certificate/HTTPS/WSS end-to-end trên Cloudflare
  và host thật; test101 là kiểm giao thức cục bộ, không phải bằng chứng deploy.
- Chưa kiểm LIVE đang phát/Safari vật lý. Không deploy/merge trong nhiệm vụ này.
- Ledger thử nghiệm còn trần10000 receipt/1000 profile mỗi phòng, chưa có lịch backup
  ngoài host; cần chốt retention/backup trước dùng dài hạn. Sau Node process restart,
  tiến trình chờ owner đăng nhập/Connect lại; điểm/receipts được khôi phục từ SQLite.
  Retry mạng khi process còn sống không phụ thuộc Safari. Không hứa production24/7
  hoàn chỉnh khi các điều kiện trên chưa được kiểm chứng.
