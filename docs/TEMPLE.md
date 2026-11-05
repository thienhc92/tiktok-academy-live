# Chùa Online — dựng lại bố cục ảnh tham khảo

Bản minh họa phẳng và nhân vật đơn giản đầu tiên đã bị chủ sở hữu từ chối. Bản hiện
nay tái hiện chính điện với chất liệu chi tiết, chữ thư pháp, thẻ cầu an lớn, đám đông
áo lam và các lớp LIVE trong ảnh. Không gọi bản này là giống 100%: tượng, nhân vật,
font và icon gốc chưa được cung cấp; tài sản mới là hình tái tạo, không phải asset
của ứng dụng gốc. Chưa có nguồn ảnh đính kèm dạng file để chạy pixel-diff tự động;
đối chiếu trực quan trong hội thoại và kiểm tra các mốc DOM không chứng minh đồng
nhất từng pixel. Đã hỏi đường dẫn ứng dụng/video gốc để đối chiếu thêm.

## Bố cục

| Thành phần | Mốc trong frame ảnh |
| --- | --- |
| Frame tham khảo | 888×1280, co vừa viewport, nền đen |
| Chính điện bên trong | 720×1280 (9:16), căn giữa |
| Thẻ cầu an | Trái 13%, trên 28,7%, rộng 74,5%, cao 12,25% |
| Người tham gia | 52 slot cố định, ba người phía trước, hàng giữa, cụm hai bên và một người tiền cảnh |
| Lớp LIVE | Header/follow, quà bên phải, bình luận/quà ở dưới, thanh thao tác và bảng số liệu mẫu |

Bỏ sidebar desktop của bản trước. Cảnh chính vẫn 9:16; toàn bộ khung capture rộng
hơn để chứa hai lề đen và lớp LIVE như ảnh. Khung được letterbox nếu màn hình có tỷ
lệ khác; không kéo giãn tượng/nhân vật để lấp đầy viewport.

## Tài sản và hiệu năng

- `public/temple/shrine-realistic.webp`: hình chính điện tái tạo bằng image generation.
- `devotee-realistic.webp`, `devotee-standing.webp`: hình nhân vật áo lam nền trong suốt,
  xếp lớp theo chiều sâu. Đây là sprite 2.5D, **không phải model 3D gốc** của mẫu.
- Hình được đổi định dạng/kích thước thành WebP cho web; không đưa PNG nguồn dung
  lượng lớn vào bundle. Các file nguồn sinh ra vẫn được giữ tại `/workspace/generated_images`.
- `fonts/Charm-Bold.ttf`: Charm của Cadson Demak, lấy từ Google Fonts, giấy phép
  SIL Open Font License đi kèm tại `fonts/OFL.txt`. Không phải font gốc đã xác nhận.
- Tất cả asset/font tải cùng app, không gọi CDN/ảnh đại diện người thật. Không thêm
  dependency. Cảnh Chùa không cần tải WebGL/Three; route Academy vẫn dùng renderer cũ.
- Chuyển động nhẹ bằng CSS, tắt khi reduced motion và dừng khi tab ẩn. Không tuyên bố
  FPS hay khả năng Safari fullscreen khi chưa kiểm trên iPad vật lý.

## Hành vi và dữ liệu

Các nhãn quẻ, biểu tượng “COIN”, số quà/likes, follow, người xem, chat, trạng thái pin
và giờ trong lớp LIVE đều là **đạo cụ mô phỏng của ảnh**. Có badge MÔ PHỎNG. Không phải
UI TikTok được nhúng, không có phiên TikTok LIVE, xác thực người xem, thanh toán hoặc
mua quà. Follow/like đổi state cục bộ; quà tạo thông báo, rút thẻ đổi nội dung mẫu.
Lời quẻ chỉ là nội dung giải trí/chiêm nghiệm, không dự đoán kết quả thật hoặc bán
điểm công đức. Các số ở bảng TẤM LÒNG THÀNH là số liệu mẫu.

Nút nhập mở form lời chúc, tối đa 160 ký tự; React hiển thị text, không HTML. Chỉ giữ
vài bản ghi trong bộ nhớ. Menu ⋯ chọn người mô phỏng, chạy/dừng mô phỏng, âm thanh,
chuông và fullscreen. Modal hỗ trợ Escape/focus. Thông báo tồn tại 3 giây; âm thanh
chỉ sau thao tác bật của người dùng. Không đọc/ghi localStorage của Academy, không
gửi API. Reload trả dữ liệu mới về mẫu ban đầu.

`?experience=academy`, engine, backend, cấu hình Cloudflare và lịch sử trước đây giữ
nguyên. Nhiệm vụ triển khai backend trường học tiếp tục tạm dừng. Cập nhật cùng draft
PR #16, chưa merge vào trang chính khi hình ảnh chưa được chủ sở hữu chấp nhận.

[Ảnh chụp trình duyệt theo tỷ lệ tham khảo](previews/chua-online-reference.png).

## Kiểm chứng lần dựng lại

102 kiểm thử qua; TypeScript frontend/local/backend và production build qua; audit
không có lỗ hổng. Chromium kiểm tra 888×1280, 768×1024, 390×844, 320×568, 1024×768
và 1440×900: đúng tỷ lệ frame/scene và mốc card, không cuộn ngang, đủ 52 người,
follow/like/gift/card/wish/settings/Escape, thông báo 3 giây, reduced motion/tab ẩn,
không request ra ngoài app và không sửa bản lưu Academy có sẵn. Route Academy cũ
vẫn mở được. Chưa kiểm Safari/iPad vật lý và chưa chứng nhận giống ảnh 100%.
