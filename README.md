ĐỀ TÀI THỰC TẬP: XÂY DỰNG WEBSITE QUẢN LÝ BÁN SÁCH CHO NHÀ SÁCH HỖ TRỢ MUA HÀNG TRỰC TUYẾN VÀ TRỰC TIẾP CỦA CỬA HÀNG SỬ DỤNG .NET CORE WEB API, REACT VÀ POSTGRESQ 
Book Store Management System
- Giới thiệu về dự án: Website quản lý bán sách hỗ trợ nhà sách bán online và offline..
- Công nghệ sử dụng: 
    + Backend: .Net Core Web API (Ngôn ngữ C#), Entity Framework Core (DBContext,..), PostgreSQL, ,NET 8
    + Frontend: ReactJS, Fetch (gọi API), Bootstrap/CSS (Ngôn ngữ Javascript)
    + Database: PostgreSQL
    + Môi trường: VS Code
    + Công cụ: Github
    + i18n...
- Cấu trúc của dự án (folder):
- Cài đặt và chạy dự án:  
    + Backend: cd backend/ BookStore.Api, dotnet restore, dotnet run, API chạy lại localhost:5005
    + Frontend: cd frontend/ book-store-client, npm install, npm run dev  
- Tính năng nổi bật:
- Hướng phát triển:
- Kết quả đạt được:
- Giải thích chi tiết từng folder:
* BACKEND (.NET CORE)
    - Controller là nơi viết API nó có vai trò là nhận request -> gọi Service và trả về response.. 
    - Data là nơi để kết nối với database
    - Model là đại diện bảng trong database
    - DTOs là dữ liệu gửi qua API
    - Repository là viết query database có vai trò là tách logic database ra khỏi controller
    - Service là nơi xử lý nghiệp vụ và mapping DTO 
    - Middleware là xử lý request trước/sau API
    - Helper là hàm dùng chung
    - Migration là quản lý thay đổi database 
    - Properties là cấu hình chạy app (launchSettings.json)
    - Program.cs là nơi app bắt đầu chạy 
    - appsettings.json là nơi cấu hình (database, port, logging,...)
* FRONTEND (REACT)
    - Component: là UI nhỏ dùng lại (tái sử dụng nó)
    - pages là trang chính
    - layouts là khung giao diện
    - services là gọi API backend 
    - routes: quản lý đường dẫn
    - contexts là quản lý tình trạng toàn app
    - hooks: Custom React hooks
    - utils là hàm tiện ích
    - assets là nơi chứa ảnh, icon,css,...
    - app.jsx là thành phần gốc
    - main.jsx là điểm khởi đầu của react 
* DATABASE (POSTGRESQL)
    - schema: tạo bảng
    - seed: dữ liệu mẫu 
    - backup: backup database
- README.md là file mô tả dự án..
- .gitignore là file dùng cho git để chỉ định những file/folder 
- TÁC GIẢ: 
    + SINH VIÊN THỰC TẬP: NGUYỄN HOÀNG GIÁP
    + ĐƠN VỊ THỰC TẬP: CÔNG TY PHẦN MỀM QUANG TRUNG - TP. HỒ CHÍ MINH 
    + THỜI GIAN THỰC TẬP (DỰ KIẾN): 10 TUẦN.. 

- Note:
+ Thiếu chức năng yêu thích (quyền khách hàng)
+ Web còn đơn giản (chưa phong phú)
+ 