# 🐭 Game Đập Chuột Online

## 📝 Mô tả
Game Đập Chuột Online là một trò chơi multiplayer thời gian thực cho phép 2 người chơi thi đấu với nhau. Người chơi sẽ đập chuột xuất hiện ngẫu nhiên trên bảng để ghi điểm. Người chơi có số điểm cao nhất khi kết thúc thời gian sẽ là người chiến thắng.

## 🎮 Tính năng chính
- Chơi online 2 người thông qua hệ thống phòng
- Tùy chỉnh số ô chơi (1-10 ô)
- Tùy chỉnh thời gian chơi (10-120 giây) 
- 4 cấp độ khó: Dễ, Trung bình, Khó, Cao thủ
- Hiển thị điểm số thời gian thực
- Thông báo kết quả cuối game
- Hệ thống thông báo popup

## 🛠 Công nghệ sử dụng
### Frontend
- HTML5
- CSS3 
- JavaScript (Vanilla JS)
- Socket.IO Client

### Backend
- Node.js
- Express.js
- Socket.IO Server

## 🔧 Cài đặt và chạy
1. Clone repository
2. Cài đặt dependencies: `npm install`
3. Chạy server: `npm start`
4. Truy cập game tại: `http://localhost:3673`

## 🎯 Hướng dẫn chơi
1. Nhập tên người chơi
2. Tạo phòng mới hoặc tham gia phòng có sẵn bằng mã phòng
3. Tùy chỉnh các thông số game (số ô, thời gian, độ khó)
4. Bắt đầu chơi khi có đủ 2 người
5. Đập chuột để ghi điểm
6. Người có điểm cao nhất khi hết giờ là người chiến thắng
