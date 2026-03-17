# 📘 Social Chat - API Documentation

> **Base URL**: `http://localhost:3000`
> **Swagger UI**: `http://localhost:3000/api-docs`
> **Phiên bản**: 1.0.0

Tài liệu này mô tả toàn bộ API endpoints của **Social Chat Backend** để đội Frontend (React.js) tích hợp.

---

## 🔐 Xác thực (Authentication)

API sử dụng **JWT Bearer Token**. Sau khi đăng nhập/đăng ký thành công, server trả về `access_token`. Frontend cần gửi token này trong header cho các API yêu cầu xác thực:

```
Authorization: Bearer <access_token>
```

### Vai trò người dùng (Roles)

| Role    | Giá trị   | Quyền hạn                          |
| ------- | --------- | ----------------------------------- |
| User    | `user`    | Tạo, xem, xóa bài viết của mình    |
| Admin   | `admin`   | Có thể xóa bất kỳ bài viết nào     |

---

## 📦 Data Models

### User

```json
{
  "_id": "ObjectId",
  "email": "user@example.com",
  "fullName": "Nguyễn Văn A",
  "avatar": "https://example.com/avatar.png",
  "bio": "Tiểu sử cá nhân",
  "role": "user | admin",
  "createdAt": "2026-03-12T00:00:00.000Z",
  "updatedAt": "2026-03-12T00:00:00.000Z"
}
```

### Post

```json
{
  "_id": "ObjectId",
  "content": "Nội dung bài viết",
  "author": {
    "_id": "ObjectId",
    "fullName": "Nguyễn Văn A",
    "avatar": "https://example.com/avatar.png"
  },
  "images": ["https://example.com/image1.jpg"],
  "likes": ["userId1", "userId2"],
  "comments": [
    {
      "author": {
        "_id": "ObjectId",
        "fullName": "Nguyễn Văn B",
        "avatar": "https://example.com/avatar2.png"
      },
      "content": "Bình luận hay quá!",
      "createdAt": "2026-03-12T00:00:00.000Z"
    }
  ],
  "createdAt": "2026-03-12T00:00:00.000Z",
  "updatedAt": "2026-03-12T00:00:00.000Z"
}
```

### Notification

```json
{
  "_id": "ObjectId",
  "recipient": "userId (Người nhận thông báo)",
  "issuer": {
    "_id": "ObjectId",
    "fullName": "Người thực hiện hành động",
    "avatar": "URL ảnh"
  },
  "type": "like | comment | friend_request | friend_accept",
  "post": "postId (Nếu thông báo liên quan đến bài viết)",
  "isRead": false,
  "createdAt": "Timestamp"
}
```

---

## 🛡️ Authentication APIs

### 1. Đăng ký tài khoản

```
POST /auth/register
```

**Body:**

| Field      | Type     | Required | Mô tả                      |
| ---------- | -------- | -------- | --------------------------- |
| `email`    | `string` | ✅       | Email hợp lệ               |
| `password` | `string` | ✅       | Tối thiểu 6 ký tự          |
| `fullName` | `string` | ✅       | Họ và tên đầy đủ            |

**Request example:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "Nguyễn Văn A"
}
```

**Response `201`:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "65f...",
    "email": "user@example.com",
    "fullName": "Nguyễn Văn A",
    "role": "user",
    "createdAt": "2026-03-12T00:00:00.000Z"
  }
}
```

**Lỗi thường gặp:**
- `409 Conflict` — Email đã tồn tại.
- `400 Bad Request` — Dữ liệu không hợp lệ.

---

### 2. Đăng nhập

```
POST /auth/login
```

**Body:**

| Field      | Type     | Required | Mô tả           |
| ---------- | -------- | -------- | ---------------- |
| `email`    | `string` | ✅       | Email đã đăng ký |
| `password` | `string` | ✅       | Mật khẩu         |

**Request example:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response `200`:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "65f...",
    "email": "user@example.com",
    "fullName": "Nguyễn Văn A",
    "role": "user"
  }
}
```

**Lỗi thường gặp:**
- `401 Unauthorized` — Sai email hoặc mật khẩu.

---

### 3. Lấy thông tin người dùng hiện tại

```
GET /auth/me
```

🔒 **Yêu cầu xác thực** — Bearer Token

**Response `200`:**

```json
{
  "userId": "65f...",
  "email": "user@example.com",
  "role": "user"
}
```

---

### 4. Đăng nhập bằng Google

```
GET /auth/google
```

Chuyển hướng người dùng đến trang đăng nhập Google. Sau khi xác thực xong, Google sẽ redirect về callback.

### 5. Google Callback

```
GET /auth/google/callback
```

**Response `200`:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "65f...",
    "email": "user@gmail.com",
    "fullName": "Google User",
    "avatar": "https://lh3.googleusercontent.com/...",
    "role": "user"
  }
}
```

---

## 👤 User APIs

### 6. Cập nhật thông tin cá nhân

```
PATCH /users/profile
```

🔒 **Yêu cầu xác thực** — Bearer Token

**Body:** (Tất cả đều optional)

| Field      | Type     | Required | Mô tả             |
| ---------- | -------- | -------- | ------------------ |
| `fullName` | `string` | ❌       | Tên mới            |
| `bio`      | `string` | ❌       | Tiểu sử mới       |
| `avatar`   | `string` | ❌       | URL ảnh đại diện   |

**Request example:**

```json
{
  "fullName": "Nguyễn Văn B",
  "bio": "Yêu lập trình và chia sẻ kiến thức",
  "avatar": "https://example.com/new-avatar.png"
}
```

**Response `200`:** Trả về thông tin User đã cập nhật.

---

## 📝 Post APIs

### 7. Tạo bài viết mới

```
POST /posts
```

🔒 **Yêu cầu xác thực** — Bearer Token

**Body:**

| Field     | Type       | Required | Mô tả                        |
| --------- | ---------- | -------- | ----------------------------- |
| `content` | `string`   | ✅       | Nội dung bài viết             |
| `images`  | `string[]` | ❌       | Danh sách URL hình ảnh        |

**Request example:**

```json
{
  "content": "Hôm nay trời đẹp quá!",
  "images": ["https://example.com/photo1.jpg"]
}
```

**Response `201`:** Trả về object Post đã tạo (kèm thông tin author).

---

### 8. Lấy danh sách bài viết

```
GET /posts
```

🔒 **Yêu cầu xác thực** — Bearer Token

**Response `200`:** Trả về mảng Post, sắp xếp mới nhất lên trước.

```json
[
  {
    "_id": "65f...",
    "content": "Bài viết mới nhất",
    "author": {
      "_id": "65f...",
      "fullName": "Nguyễn Văn A",
      "avatar": "https://..."
    },
    "images": [],
    "likes": ["userId1"],
    "comments": [],
    "createdAt": "2026-03-12T10:00:00.000Z"
  }
]
```

---

### 9. Lấy chi tiết bài viết

```
GET /posts/:id
```

🔒 **Yêu cầu xác thực** — Bearer Token

**Params:**

| Param | Mô tả         |
| ----- | -------------- |
| `id`  | ID bài viết    |

**Response `200`:** Trả về object Post.

**Lỗi:**
- `404 Not Found` — Không tìm thấy bài viết.

---

### 10. Xóa bài viết

```
DELETE /posts/:id
```

🔒 **Yêu cầu xác thực** — Bearer Token

> ⚠️ Chỉ **chủ sở hữu bài viết** hoặc **ADMIN** mới có quyền xóa.

**Params:**

| Param | Mô tả         |
| ----- | -------------- |
| `id`  | ID bài viết    |

**Response `200`:** Xóa thành công.

**Lỗi:**
- `403 Forbidden` — Bạn không có quyền xóa bài viết này.
- `404 Not Found` — Không tìm thấy bài viết.

---

### 11. Like / Unlike bài viết

```
POST /posts/:id/like
```

🔒 **Yêu cầu xác thực** — Bearer Token

> Nếu chưa like → **like**. Nếu đã like → **unlike** (toggle).

**Params:**

| Param | Mô tả         |
| ----- | -------------- |
| `id`  | ID bài viết    |

**Response `200`:** Trả về object Post đã cập nhật (mảng `likes` thay đổi).

---

### 12. Thêm bình luận

```
POST /posts/:id/comment
```

🔒 **Yêu cầu xác thực** — Bearer Token

**Params:**

| Param | Mô tả         |
| ----- | -------------- |
| `id`  | ID bài viết    |

**Body:**

| Field     | Type     | Required | Mô tả               |
| --------- | -------- | -------- | -------------------- |
| `content` | `string` | ✅       | Nội dung bình luận   |

**Request example:**

```json
{
  "content": "Bài viết rất hay!"
}
```

**Response `200`:** Trả về object Post đã cập nhật (mảng `comments` có thêm comment mới, kèm populate thông tin author).

---

## 🔔 Notifications APIs

### 13. Lấy danh sách thông báo
```
GET /notifications
```
🔒 **Yêu cầu xác thực** — Bearer Token

**Query Params:**
- `limit`: Số lượng thông báo (mặc định 20)
- `offset`: Vị trí bắt đầu (mặc định 0)

**Response `200`:** Trả về mảng các thông báo.

---

### 14. Lấy số lượng thông báo chưa đọc
```
GET /notifications/unread-count
```
🔒 **Yêu cầu xác thực** — Bearer Token

**Response `200`:**
```json
{ "unreadCount": 5 }
```

---

### 15. Đánh dấu một thông báo là đã đọc
```
PATCH /notifications/:id/read
```
🔒 **Yêu cầu xác thực** — Bearer Token

---

### 16. Đánh dấu tất cả thông báo là đã đọc
```
PATCH /notifications/read-all
```
🔒 **Yêu cầu xác thực** — Bearer Token

---

### 17. Xóa một thông báo
```
DELETE /notifications/:id
```
🔒 **Yêu cầu xác thực** — Bearer Token

---

## 🌐 WebSocket (Real-time Notifications)

**URL:** `ws://localhost:3000` (Socket.io)

**Xác thực (Authentication):**
Client cần truyền JWT Token khi kết nối. Server hỗ trợ các cách sau:
1.  **Auth Object (Khuyên dùng):**
    ```javascript
    const socket = io("http://localhost:3000", {
      auth: { token: "Bearer <YOUR_JWT_TOKEN>" }
    });
    ```
2.  **Headers:**
    ```javascript
    const socket = io("http://localhost:3000", {
      extraHeaders: { Authorization: "Bearer <YOUR_JWT_TOKEN>" }
    });
    ```

**Sự kiện lắng nghe (Client Listen):**
- `new_notification`: Nhận dữ liệu thông báo mới nhất.
    - Dữ liệu trả về: `Notification Object` (giống Data Model ở trên).

---

## ⚠️ Error Format

Tất cả lỗi trả về đều có format thống nhất:

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**Validation Error (`400`):**

```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 6 characters"
  ],
  "error": "Bad Request"
}
```

---

---

## 💬 Chat APIs

### 18. Tạo cuộc hội thoại mới
```
POST /chat/conversations
```
🔒 **Yêu cầu xác thực** — Bearer Token

**Body:**
```json
{
  "memberIds": ["userId1", "userId2"],
  "type": "private | group",
  "name": "Tên nhóm (nếu là group)"
}
```
> **Lưu ý:** 
> - Với `private`: `memberIds` chỉ được có 1 ID và phải là bạn bè.
> - Với `group`: Những người được thêm phải là bạn bè của người tạo.

---

### 19. Lấy danh sách hội thoại
```
GET /chat/conversations
```
🔒 **Yêu cầu xác thực** — Bearer Token

---

### 20. Lấy danh sách tin nhắn
```
GET /chat/conversations/:id/messages
```
🔒 **Yêu cầu xác thực** — Bearer Token

**Query Params:**
- `limit`: Mặc định 50.
- `offset`: Mặc định 0.

---

### 21. Gửi tin nhắn
```
POST /chat/conversations/:id/messages
```
🔒 **Yêu cầu xác thực** — Bearer Token

**Body:**
```json
{
  "content": "Nội dung tin nhắn",
  "type": "text | image | file"
}
```

---

### 22. Bảo mật tin nhắn (Message Encryption)

Nội dung tin nhắn (`content`) được Backend bảo vệ bằng thuật toán mã hóa **AES-256-CBC**.

- **Lưu trữ:** Dữ liệu trong Database được lưu dưới dạng chuỗi Hex đã mã hóa để đảm bảo an toàn.
- **Truy xuất:** Backend tự động giải mã tin nhắn trước khi trả về qua API (`GET /chat/conversations/:id/messages`) và WebSocket (`new_message`).
- **Frontend:** Không cần thực hiện thêm bước giải mã nào, dữ liệu nhận được luôn là văn bản thuần túy (Plain Text).

---

## 🌐 WebSocket Chat

**URL:** `ws://localhost:3000` (Cùng port với Notifications)

**Sự kiện:**
1.  **Client Emit:** `join_conversation`
    - Gửi `conversationId` để tham gia phòng chat.
2.  **Server Emit:** `new_message`
    - Nhận tin nhắn mới real-time.

---

## 🚀 Hướng dẫn tích hợp cho Frontend (React.js)

### 1. Cài đặt Axios

```bash
npm install axios
```

### 2. Tạo API Client

```javascript
// src/api/client.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
});

// Auto attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept 401 to redirect login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 3. Ví dụ sử dụng

```javascript
// Auth
const { data } = await api.post('/auth/login', { email, password });
localStorage.setItem('access_token', data.access_token);

// Get posts
const { data: posts } = await api.get('/posts');

// Create post
await api.post('/posts', { content: 'Hello World!' });

// Toggle like
await api.post(`/posts/${postId}/like`);

// Add comment
await api.post(`/posts/${postId}/comment`, { content: 'Nice!' });
```

---

## 📌 Lưu ý quan trọng

1. **CORS**: Backend cần bật CORS nếu Frontend chạy trên port khác (ví dụ `:5173`).
2. **Token expiration**: Hiện chưa có refresh token, cần xử lý khi token hết hạn.
3. **Image upload**: Hiện tại chỉ nhận URL ảnh, chưa hỗ trợ upload file trực tiếp.
4. **Pagination**: API `/posts` hiện trả về tất cả bài viết, chưa hỗ trợ phân trang.
5. **Swagger UI**: Truy cập `http://localhost:3000/api-docs` để test API trực tiếp trên trình duyệt.

---

*Cập nhật lần cuối: 16/03/2026*
