# 会员积分商城

一个基于 Vue.js + Node.js + MongoDB 的会员积分商城系统。

## 功能特性

### 用户角色

**管理员**
- 商品管理：添加、编辑、删除商品，设置积分价格和库存
- 用户管理：创建、编辑、删除普通用户，设置初始密码和积分
- 订单管理：查看所有订单，更新订单状态（待发货/已发货/已完成）
- 通知设置：配置订单通知邮箱

**普通用户（会员）**
- 浏览商品：查看商品列表、积分价格、库存
- 购物车：添加商品、修改数量、删除商品
- 下单：使用积分购买商品（积分足够且库存充足时可下单）
- 个人中心：查看积分、修改密码、设置收件信息、查看历史订单

### 系统功能
- JWT 身份认证
- 下单后自动扣减积分和库存
- 新订单邮件通知管理员
- 商品图片上传（本地存储）

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Composition API + Vite |
| UI 组件 | Element Plus |
| 状态管理 | Pinia |
| 路由 | Vue Router 4 |
| HTTP 客户端 | Axios |
| 后端 | Node.js + Express |
| 数据库 | MongoDB + Mongoose |
| 认证 | JWT (jsonwebtoken) |
| 密码加密 | bcryptjs |
| 文件上传 | Multer |
| 邮件发送 | Nodemailer |

## 项目结构

```
fans-shop/
├── client/                     # 前端项目
│   ├── src/
│   │   ├── api/               # API 请求封装
│   │   ├── router/            # 路由配置
│   │   ├── stores/            # Pinia 状态管理
│   │   ├── views/             # 页面组件
│   │   │   ├── admin/         # 管理员页面
│   │   │   ├── Login.vue      # 登录页
│   │   │   ├── Products.vue   # 商品页
│   │   │   ├── Cart.vue       # 购物车页
│   │   │   └── Profile.vue    # 个人中心
│   │   └── main.js
│   ├── Dockerfile
│   └── nginx.conf
│
├── server/                     # 后端项目
│   ├── config/                # 配置文件
│   ├── middleware/            # 中间件
│   ├── models/                # 数据模型
│   ├── routes/                # API 路由
│   ├── uploads/               # 图片存储
│   ├── utils/                 # 工具脚本
│   ├── app.js                 # 入口文件
│   └── Dockerfile
│
├── docker-compose.yml          # Docker 编排
└── README.md
```

## 部署方式

### 方式一：本地开发部署

#### 环境要求
- Node.js 18+
- MongoDB 6+
- npm 或 yarn

#### 1. 克隆项目
```bash
git clone <repository-url>
cd fans-shop
```

#### 2. 安装依赖
```bash
# 安装后端依赖
cd server
npm install

# 安装前端依赖
cd ../client
npm install
```

#### 3. 配置环境变量
```bash
cd server
cp .env.example .env
```

编辑 `server/.env` 文件：
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/fans-shop
JWT_SECRET=your-secret-key
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-email-password
ADMIN_EMAIL=admin@example.com
```

#### 4. 初始化管理员账户
```bash
cd server
node utils/initAdmin.js
```

默认管理员账户：`admin` / `admin123`

#### 5. 启动服务

**启动后端**（端口 3000）
```bash
cd server
npm run dev
```

**启动前端**（端口 5173）
```bash
cd client
npm run dev
```

#### 6. 访问
- 前端：http://localhost:5173
- API：http://localhost:3000

---

### 方式二：Docker 部署

#### 环境要求
- Docker 20+
- Docker Compose 2+

#### 1. 配置环境变量
```bash
cp .env.docker .env
```

编辑 `.env` 文件配置 SMTP 等信息：
```env
JWT_SECRET=your-secret-key
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-email-password
ADMIN_EMAIL=admin@example.com
```

#### 2. 构建并启动
```bash
docker-compose up -d --build
```

#### 3. 初始化管理员账户
```bash
# 等待服务启动后执行
./scripts/docker-init.sh

# 或手动执行
docker exec fans-shop-server node utils/initAdmin.js
```

#### 4. 访问
- 网站：http://localhost
- 管理员账户：`admin` / `admin123`

#### Docker 常用命令
```bash
# 查看日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f server

# 停止服务
docker-compose down

# 停止服务并删除数据卷
docker-compose down -v

# 重新构建
docker-compose up -d --build
```

#### Docker 服务说明
| 服务 | 容器名 | 端口 | 说明 |
|------|--------|------|------|
| client | fans-shop-client | 80 | 前端 (Nginx) |
| server | fans-shop-server | 3000 (内部) | 后端 API |
| mongodb | fans-shop-mongodb | 27017 (内部) | 数据库 |

## 默认账户

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |

> 首次登录后建议修改密码

## API 接口

### 认证
- `POST /api/auth/login` - 登录
- `PUT /api/auth/password` - 修改密码

### 用户
- `GET /api/users/me` - 获取当前用户信息
- `PUT /api/users/me` - 更新用户信息
- `GET /api/users` - 获取用户列表（管理员）
- `POST /api/users` - 创建用户（管理员）
- `PUT /api/users/:id` - 更新用户（管理员）
- `DELETE /api/users/:id` - 删除用户（管理员）

### 商品
- `GET /api/products` - 获取商品列表
- `GET /api/products/:id` - 获取商品详情
- `POST /api/products` - 创建商品（管理员）
- `PUT /api/products/:id` - 更新商品（管理员）
- `DELETE /api/products/:id` - 删除商品（管理员）

### 购物车
- `GET /api/cart` - 获取购物车
- `POST /api/cart` - 添加商品到购物车
- `PUT /api/cart` - 更新商品数量
- `DELETE /api/cart/:productId` - 删除商品

### 订单
- `GET /api/orders` - 获取用户订单
- `POST /api/orders` - 创建订单
- `GET /api/orders/all` - 获取所有订单（管理员）
- `PUT /api/orders/:id/status` - 更新订单状态（管理员）

## License

MIT
