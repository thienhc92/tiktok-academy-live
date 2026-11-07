# Chùa Online — backend LIVE thử nghiệm riêng

Node Listener `tiktok-live-connector@2.5.0` → normalized events → engine/SQLite →
Socket.IO → Admin/Broadcast React của PR #26. Đây là mã chạy thật; không có nguồn
TikTok MOCK trong tiến trình này. Các fixtures chỉ nằm trong tests.

## Phạm vi và giấy phép

Audit dependency không có cảnh báo high/critical sau khi ghim `basic-ftp@6.2.6`
cho dependency gián tiếp của proxy-agent. Không dùng `audit fix --force`.

Chủ sở hữu đã duyệt dùng connector 2.5.0 cho thử nghiệm riêng. Phiên bản đã cài
được ghim trong `package-lock.json`; xem [giấy phép nguyên bản](licenses/tiktok-live-connector-2.5.0.txt).
Mục 18 nêu ngoại lệ tích hợp overlay/game; mục 19 loại trừ các dạng relay/SaaS/hosting
cung cấp cho bên thứ ba và nêu nghĩa vụ AGPL khi ngoại lệ không áp dụng. Giữ phạm vi
thử nghiệm riêng của chủ sở hữu, không cung cấp dịch vụ relay cho khách hàng hoặc
đóng gói thành SaaS. Cần kiểm tra lại nghĩa vụ giấy phép trước khi đổi phạm vi hoặc
phân phối. Tách package này khỏi frontend; không import SDK vào bundle Safari.
Đây không phải kết luận pháp lý cho mọi hình thức vận hành sau này.

Connector unofficial, không có cam kết uptime. Bản 2.5.0 dùng Euler Stream để ký
WebSocket, có hạn mức cộng đồng miễn phí theo README gói. Không bảo đảm hạn mức luôn
còn. Backend từ chối `SIGN_API_KEY` hoặc sign-server URL tùy chỉnh, không bật session
cookie/OAuth/authenticateWs, không gọi sendMessage hoặc trả tiền. Nếu SDK báo rate
limit/premium, hiển thị lỗi và ngừng retry; không tự chuyển gói/dịch vụ khác.

## Chạy thử từ thư mục gốc repository

Yêu cầu Node >=22.19, hai terminal. Giữ port 3002 riêng.

```bash
npm ci
npm ci --prefix trial-server --ignore-scripts
npm run check:trial
```

Terminal 1 — đặt mật khẩu riêng, không echo hoặc lưu vào source/history:

```bash
read -rsp 'Mật khẩu quản trị thử nghiệm (16 ký tự trở lên): ' TRIAL_ADMIN_PASSWORD
export TRIAL_ADMIN_PASSWORD
npm run trial:server
```

Terminal 2:

```bash
npm run dev:trial
```

Mở `http://127.0.0.1:3001/admin/tiktok`, chọn Đăng nhập, dùng mật khẩu trên, nhập
username và nhấn Kết nối. Chỉ khi SDK xác nhận WebSocket vào phòng thành công mới
hiện Đã kết nối và nút Web Broadcast. Broadcast:
`http://127.0.0.1:3001/broadcast/tiktok`. Connect chỉ đọc dữ liệu; phát hình vẫn là
chia sẻ màn hình iPad lên TikTok. Không có chức năng bắt đầu LIVE cho tài khoản.

Mật khẩu chỉ ở biến môi trường server; form đăng nhập native không đọc password
bằng JS. Cookie phiên opaque HttpOnly, SameSite Strict, Secure khi origin HTTPS,
hết hạn 2 giờ; giới hạn 5 lần đăng nhập sai/phút. Không nhập cookie/token TikTok.
Không có mật khẩu mặc định. Thiếu mật khẩu server vẫn chạy nhưng API đóng (503).

## iPad / Codespaces riêng

Nếu dùng Codespaces hoặc dev host riêng đã được chủ sở hữu quản lý:

1. Chỉ forward port 3001 ở chế độ **Private**, không đổi sang Public, không forward3002.
2. Lấy URL HTTPS riêng của port3001. Trong terminal 1 đặt `TRIAL_ORIGIN` bằng đúng
   origin URL đó (không slash cuối), rồi đặt mật khẩu và chạy server.
3. Trong terminal 2 đặt `TRIAL_PUBLIC_HOST` bằng hostname URL đó, chạy `npm run dev:trial`.
4. Safari đăng nhập GitHub cho private forwarded port, rồi đăng nhập quản trị thử nghiệm.
   Vite chỉ proxy `/api/temple` và `/socket.io` khi dùng `dev:trial`. Không sửa Pages.

Xem [phương án nối domain website hiện có](../deploy/live/README.md) cho HTTPS/WSS qua Pages proxy và cấu hình host sau khi được duyệt. Không cần Codespaces để vận hành website thật.

Node thử nghiệm mặc định bind 127.0.0.1:3002. `TRIAL_ORIGIN` chỉ cho HTTPS hoặc HTTP loopback;
Origin của POST và Socket.IO phải khớp. Tất cả state/Connect/Disconnect/socket cần
phiên hợp lệ. Socket chỉ gửi snapshot, không nhận event/điểm từ browser.
Codespaces có thể ngủ/dừng: không cam kết chạy liên tục, không mua máy chủ.
Chưa triển khai host/Access/route production. Trang Pages hiện có không tự chạy
Node listener; URL production không kết nối được backend này nếu chưa duyệt triển khai.

## Dữ liệu, định danh và sự kiện

- JOIN/member, COMMENT/chat, LIKE, FOLLOW, SHARE, GIFT: dùng `WebcastEvent` chính
  thức của **SDK unofficial**, không gọi đây là API TikTok chính thức.
- Payload chuẩn v3: `common.msgId`, `common.roomId`, `user.id`, `gift.type`,
  `gift.diamondCount`, `groupId`, `repeatEnd`, `repeatCount`. Không suy từ nickname,
  không sửa userId 64-bit đã bị làm tròn. Thiếu event ID ổn định/giá quà/streak ID
  bắt buộc thì bỏ và báo `payload-skipped`, không tạo UUID để thưởng lại.
- Không dùng room total likes làm điểm cá nhân. LIKE dùng count của viewer có ID.
  FOLLOW/SHARE ghi nhật ký và presence, không thêm điểm mới. Không suy diễn leave
  khi người im lặng; SDK không hứa feed rời đầy đủ.
- Gifts dùng giá unit từ payload server nhận, intermediate không thưởng; final trả
  unit × repeat ×10 đúng một lần, cùng transaction với receipts. Giữ mọi quy tắc
  contribution/merit/cap/thăng cấp/ghế của engine. Comment niệm Phật gọi cue cũ.
- `processInitialData:false` tránh phát lại lịch sử SDK. Session ổn định theo roomId;
  SQLite riêng lưu từng phòng tại `trial-server/data/live.sqlite` (ignored by Git).
  Có thể đặt `TRIAL_DATA_DIR` ngoài repo. Không mở DB MOCK hoặc học viện; DB lạ bị từ chối.
- WAL + synchronous FULL, giao dịch cập nhật state/receipts/counters atomically.
  Restart rồi Connect lại cùng phòng giữ điểm; đổi phòng dùng bản lưu riêng.
- Vẫn có giới hạn 10000 receipt/1000 profile và cửa sổ trễ30s của engine. Chạm giới
  hạn dừng nhận thay vì xóa receipts. Cần thiết kế lưu giữ/backup trước dùng dài hạn.
- Server retry mạng tối đa5 lần, handshake30s; room offline/not-found/rate-limit
  không retry tự động. Callback cũ không mở lại phiên sau Disconnect.
- Socket gửi state tối đa5 lần/giây, epoch/sequence phục hồi sau reconnect; tối đa6
  effect/20 dòng log. Nhật ký không chứa raw payload, credential hoặc cookie.

## Kiểm chứng và giới hạn

Tests dùng fixtures cấu trúc SDK, không được trình bày như sự kiện LIVE đã nhận.
Đã kiểm tra sáu loại payload, quà streak/replay, SQLite restart, đăng nhập/CSRF/HttpOnly
và socket từ chối không xác thực. Browser768×1024 kiểm tra Node+Vite proxy+Socket.IO,
form đăng nhập và nút Connect; Broadcast không tạo người giả, MOCK108 còn nguyên.

Một lần đọc thử `anhxinloi616` (username tham khảo chủ sở hữu gửi) trả `offline` từ
SDK. Không báo Connected và chưa xác minh nhận sự kiện của một tài khoản đang LIVE.
Cần username đang LIVE để kiểm thử đầu-cuối thực tế; không tạo sự kiện giả để thay thế.
Không gửi chat, quà hoặc đăng nhập TikTok trong phép thử.

Không merge/deploy production trong nhiệm vụ này. Giữ PR #26 để review bản thử nghiệm.
