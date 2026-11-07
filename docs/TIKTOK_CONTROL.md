# Admin TikTok và Web Broadcast — backend thử nghiệm riêng

## Kết quả kiểm tra repository cũ

Ngày 07/11/2026, đã đọc `thienhc92/phat-tam-live`, nhánh main và toàn bộ lịch sử
2 commit `69a6187`, `6c2a347`. Chỉ có shell Vite/React; không có Admin, Connect,
Web Broadcast, connector hoặc API server. `src/main.tsx` tham chiếu `./App`
nhưng file đó không được commit. Không có logic kết nối cũ để tái sử dụng hoặc
chứng minh đã từng kết nối thành công. Không thể khôi phục code chưa commit từ GitHub.

## Cập nhật thử nghiệm Node được chủ sở hữu duyệt

Đã bổ sung `trial-server/` với connector 2.5.0 thật, Socket.IO và SQLite riêng.
Xem [hướng dẫn chạy, đăng nhập, giấy phép và giới hạn](../trial-server/README.md).
Chưa có buổi LIVE đang phát để xác minh nhận event; phép thử tài khoản tham khảo
trả offline. Không triển khai production. Phần Access dưới đây là adapter cho host
sau này; backend thử nghiệm hiện dùng native owner login/HttpOnly riêng.

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

## Cổng phát hành production vẫn đóng

`UnconfiguredConnector` vẫn là default an toàn của adapter chưa cấu hình; tiến trình
Node thử nghiệm chọn `TikTokConnector` thật, không có đường phát events MOCK.
Không có Worker/route/Access app mới hoặc thay đổi Pages production. Phần thử nghiệm
được phép dùng connector theo phạm vi riêng đã duyệt, không cấp phép relay/SaaS
cho bên thứ ba. Không merge vì main đang gắn tự deploy Pages.

Trước production cần owner duyệt host chạy liên tục, quota/chi phí thực tế, auth và
HTTPS route, retention/backup, phép thử tài khoản đang LIVE và thẩm định lại giấy phép.
Không gửi event chùa vào DB học viện. Tài liệu cũ về provider chưa cấu hình được
thay bằng [README thử nghiệm](../trial-server/README.md); không coi fixtures là LIVE.
