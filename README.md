# 🪖 Contractor – Labor Management System (MERN Stack)

A full-stack Labor Management System built with **MongoDB + Express + React + Node.js**.

---

## 📁 Project Structure

```
lms/
├── backend/          # Node.js + Express API
│   ├── models/       # Mongoose models (User, Labor, Attendance, Advance, Payment)
│   ├── routes/       # API routes
│   ├── middleware/   # JWT auth middleware
│   ├── uploads/      # Labor photos (auto-created)
│   ├── server.js     # Main server entry
│   ├── seed.js       # Database seed script
│   └── .env          # Environment variables
│
└── frontend/         # React app (Vite)
    └── src/
        ├── components/
        │   ├── layout/   # Sidebar + Layout
        │   └── pages/    # All page components
        ├── context/      # Auth context
        ├── utils/        # Axios API instance
        └── App.jsx       # Router
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB (local or MongoDB Atlas)
- npm or yarn

---

### 1️⃣ Clone / Extract the project

```bash
cd lms
```

---

### 2️⃣ Backend Setup

```bash
cd backend
npm install
```

**Configure `.env`:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/labor_management
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d
NODE_ENV=development
```

> **MongoDB Atlas** (cloud): Replace MONGODB_URI with your Atlas connection string:
> `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/labor_management`

**Seed the database with sample data:**
```bash
node seed.js
```
This creates:
- 👤 Admin user: `admin@contractor.com` / `admin123`
- 👷 8 labors with realistic data
- 📅 30 days of attendance records
- 💵 15 advance records
- 💳 8 payment records

**Start backend:**
```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Backend runs on: `http://localhost:5000`

---

### 3️⃣ Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:3000`

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint           | Description     |
|--------|--------------------|-----------------|
| POST   | /api/auth/register | Register user   |
| POST   | /api/auth/login    | Login & get JWT |
| GET    | /api/auth/me       | Get current user|

### Labors
| Method | Endpoint         | Description        |
|--------|------------------|--------------------|
| GET    | /api/labors      | List all labors    |
| GET    | /api/labors/:id  | Get single labor   |
| POST   | /api/labors      | Add labor + photo  |
| PUT    | /api/labors/:id  | Update labor       |
| DELETE | /api/labors/:id  | Soft delete labor  |

### Attendance
| Method | Endpoint                      | Description             |
|--------|-------------------------------|-------------------------|
| GET    | /api/attendance?date=         | Get attendance by date  |
| GET    | /api/attendance/calendar      | Monthly calendar data   |
| GET    | /api/attendance/labor/:id     | Labor's attendance      |
| POST   | /api/attendance/bulk          | Bulk save attendance    |

### Advances & Payments
| Method | Endpoint           | Description    |
|--------|--------------------|----------------|
| GET    | /api/advances      | List advances  |
| POST   | /api/advances      | Add advance    |
| PUT    | /api/advances/:id  | Edit advance   |
| DELETE | /api/advances/:id  | Delete advance |
| GET    | /api/payments      | List payments  |
| POST   | /api/payments      | Add payment    |
| PUT    | /api/payments/:id  | Edit payment   |
| DELETE | /api/payments/:id  | Delete payment |

### Dashboard
| Method | Endpoint                          | Description              |
|--------|-----------------------------------|--------------------------|
| GET    | /api/dashboard/stats              | All dashboard stats      |
| GET    | /api/dashboard/monthly-expense    | Monthly chart data       |
| GET    | /api/dashboard/today-attendance   | Today's attendance list  |
| GET    | /api/dashboard/labor-profile/:id  | Individual labor stats   |

---

## ✨ Features

- 🔐 JWT Authentication (login/register)
- 👷 Labor CRUD with photo upload
- 📅 Daily bulk attendance marking (Full/Half/Absent)
- 📆 Visual calendar with attendance dots
- 💵 Advance management with CRUD
- 💳 Payment tracking with cycles
- 📊 Dashboard with real-time charts
- 📋 Reports (Daily, Monthly, Individual, Payment)
- 👤 Labor Profile with complete history
- 🔍 Search & Pagination on all lists

---

## 🛠️ Tech Stack

| Layer    | Technology                      |
|----------|---------------------------------|
| Frontend | React 18, React Router, Chart.js|
| Styling  | Custom CSS (no framework)       |
| Backend  | Node.js, Express.js             |
| Database | MongoDB with Mongoose           |
| Auth     | JWT (jsonwebtoken + bcryptjs)   |
| Upload   | Multer (local storage)          |
| Build    | Vite                            |

---

## 📦 Production Deployment

```bash
# Build frontend
cd frontend && npm run build

# Serve frontend from backend
# Copy frontend/dist to backend/public
# Add to server.js:
# app.use(express.static('public'))
# app.get('*', (req,res) => res.sendFile(path.join(__dirname,'public','index.html')))
```

Set environment variables on your server and run `npm start` in the backend folder.
