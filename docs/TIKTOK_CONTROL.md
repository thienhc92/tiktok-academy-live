# Admin TikTok và Web Broadcast — bản chuẩn bị, chưa kết nối thật

## Kết quả kiểm tra repository cũ

Ngày 07/11/2026, đã đọc `thienhc92/phat-tam-live`, nhánh main và toàn bộ lịch sử
2 commit `69a6187`, `6c2a347`. Chỉ có shell Vite/React; không có Admin, Connect,
Web Broadcast, connector hoặc API server. `src/main.tsx` tham chiếu `./App`
nhưng file đó không được commit. Không có logic kết nối cũ để tái sử dụng hoặc
chứng minh đã từng kết nối thành công. Không thể khôi phục code chưa commit từ GitHub.

## Phần đã chuẩn bị trong PR

- `/admin/tiktok`: nhập/lưu username (chỉ username trong localStorage), trạng thái,
  Connect/Disconnect và mở `/broadcast/tiktok` khi server xác nhận kết nối.
- Broadcast tái sử dụng ảnh, 108 seat, tên, Top 10, nghi thức và điểm của Chùa Online;
  chỉ có người nhận từ server, không tạo 108 người giả trong LIVE. Không có simulator,
  nút quản trị, nhập bình luận hay thao tác gửi quà MOCK trên trang này.
- `/` vẫn là MOCK với bản lưu riêng. Broadcast không mở/ghi DB MOCK hoặc phát event
  để tự cộng điểm. Câu niệm hợp lệ từ comment LIVE dùng lại cooldown/animation lạy.
- `src/templeLive/service.ts`: bộ điều khiển server dùng Web Request/Response và
  `TempleRepository` có sẵn; nhận normalized events từ `ServerConnector`, xử lý
  reward/receipt trong transaction; giữ nguyên like cumulative/gift streak/ID chuỗi.
  Không có endpoint cho browser nộp sự kiện hoặc sửa điểm.
- Retry phía server tối đa 5 lần, handshake timeout 8 giây, dừng retry khi Disconnect;
  callback của kết nối cũ không thể mở lại phiên. Offline/not-found không retry mạng.
  Kết nối không phụ thuộc vòng đời Safari. Host phải giữ service sống độc lập UI.
- Snapshot có epoch/sequence; client chỉ đọc cùng origin, timeout/retry hữu hạn,
  bỏ trạng thái cũ, lấy snapshot mới khi đổi epoch, không replay effect từ snapshot
  đầu. Mất mạng giữ hình gần nhất kèm cảnh báo, không chuyển sang điểm MOCK.

## Xác thực và API

`AccessVerifier` kiểm JWT **phía server**: chữ ký RS256/JWKS, issuer/audience, expiry,
iat/nbf và kid; cache JWKS 60 giây. Chỉ chấp nhận issuer HTTPS thuộc
`*.cloudflareaccess.com`. Không tin header giả hoặc thuật toán `none`. Thiếu cấu hình
trả 503; thiếu xác thực trả 401. Không có secret/cookie/token trong application JS,
URL hoặc localStorage. JWT do Cloudflare Access chuyển đến server; cookie SSO do
Access quản lý. Không có cơ chế đăng nhập giả trong mã production.

Host tương lai phải bảo vệ **cả HTML Admin, Broadcast lẫn `/api/temple/*`** bằng
Access và HTTPS; phải dùng cùng origin hoặc BFF, không mở CORS wildcard.
Frontend shell riêng lẻ không thay thế xác thực. API chỉ dành cho cùng chủ sở hữu
đã được duyệt Access audience; chưa thiết kế link xem công khai/phân quyền khán giả.

| Đường dẫn | Phương thức | Quyền |
|---|---|---|
| `/api/temple/login` | GET | Access; chuyển về Admin sau đăng nhập |
| `/api/temple/state` | GET | Access; snapshot không có receipts/counters/quota |
| `/api/temple/connect` | POST JSON `{username}` | Access + Origin chính xác |
| `/api/temple/disconnect` | POST JSON `{}` | Access + Origin chính xác |

POST khác bị từ chối, payload Connect tối đa 1 KiB. Không nhận token hoặc TikTok
cookie từ frontend. Không tồn tại API login/password tự chế. Trang chưa cấu hình
backend (hoặc Pages trả HTML thay vì API) báo rõ chưa cấu hình, không báo Connected.

## Chặn phát hành LIVE thật

**Đây chưa là connector TikTok chạy được.** `UnconfiguredConnector` luôn trả lỗi;
không cài SDK, mã AGPL, dịch vụ ký hoặc gọi TikTok. Nguồn SIMULATION chỉ được inject
trong kiểm thử và luôn có nhãn rõ. Chưa tạo Worker, route, host Node, Access app,
secrets hoặc thay cấu hình Pages/production. Chưa nối service vào backend đang chạy.
Bộ điều khiển này không gửi event chùa vào repository/XP học viện.

Cần duyệt trước các phần sau:

1. Nguồn sự kiện/provider cụ thể, quyền sử dụng và giấy phép. Chưa xác minh có API
   LIVE công khai cho join/comment/like/gift; xem nghiên cứu trong
   [TEMPLE_LIVE_FOUNDATION.md](TEMPLE_LIVE_FOUNDATION.md). Không mặc định một SDK
   unofficial là được phép hoặc miễn phí. Cần fixtures chứng minh ID/message ID,
   giá quà đáng tin, final/streak, likes scope; không suy diễn user rời từ im lặng.
2. Nếu dùng Node connector liên tục: duyệt host, chi phí và khả năng chạy nền.
   Pages không chạy Node daemon; không hứa Workers Free chạy SDK Node Webcast.
   Nếu dùng provider webhook/stream: cần tài liệu control/auth/handshake cụ thể.
3. Cấp adapter lưu trữ chùa bền vững cho `TempleRepository`, kiểm thử crash/restart
   trên host đã duyệt; hiện test controller dùng Memory repository. Không dùng nó
   làm DB production. Ledger/snapshot phải tách MOCK và học viện, backup/retention
   phải được duyệt. Trần hiện có 10000 receipt/1000 profile: dừng nhận khi chạm trần.
   Phòng/phiên mới khác bản lưu bị từ chối, không tự reset điểm.
4. Duyệt Access app/audience, route HTTPS cùng origin và triển khai staging trước.
   Issuer/audience là cấu hình server; mọi secret/provider credential chỉ nhập qua
   công cụ quản lý bí mật server, không chat/Git/frontend. Không đổi account/gói phí.
5. Sau đó mới tích hợp adapter thật, kiểm thử staging với tài khoản được chủ sở hữu
   duyệt rõ; hiện chưa kích hoạt tài khoản nào và chưa xác minh LIVE thật.

Do các cổng hạ tầng/provider chưa được duyệt, PR giữ nháp; không auto-merge hoặc
triển khai production. Các URL mới chỉ là đường dẫn trong bản PR cho tới khi phát hành.
