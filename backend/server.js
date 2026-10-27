require('dotenv').config();
const dns = require('node:dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const employeeRoutes = require('./routes/employees');

const app = express();

const PORT = Number(process.env.PORT) || 5000;
const DB_NAME = process.env.DB_NAME || '237253_HoHuuLoc';

// Cho phép Frontend truy cập API
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || true
}));

// Cho phép Backend đọc dữ liệu JSON
app.use(express.json());

// Route trang chủ API
app.get('/', (req, res) => {
  res.json({
    message: 'HR Management API',
    endpoints: ['/health', '/api/employees']
  });
});

// Kiểm tra Backend và MongoDB
app.get('/health', (req, res) => {
  const ready = mongoose.connection.readyState === 1;

  res.status(ready ? 200 : 503).json({
    status: ready ? 'ok' : 'database disconnected'
  });
});

// Đăng ký các API nhân viên
app.use('/api/employees', employeeRoutes);

// Kiểm tra biến môi trường
if (!process.env.MONGODB_URI) {
  console.error('Thiếu biến môi trường MONGODB_URI.');
  process.exit(1);
}

// Kết nối MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI, {
  dbName: DB_NAME
})
.then(() => {
  console.log(
    'Kết nối MongoDB Atlas thành công! Database:',
    DB_NAME
  );

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend chạy ở port ${PORT}`);
  });
})
.catch(error => {
  console.error('Lỗi kết nối MongoDB:', error.message);
  process.exit(1);
});