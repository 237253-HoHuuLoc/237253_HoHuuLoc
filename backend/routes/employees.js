const express = require('express');
const mongoose = require('mongoose');
const Employee = require('../models/Employee');

const router = express.Router();

// Kiểm tra dữ liệu đầu vào
function validateEmployee(body) {
  if (!body.employeeId?.trim() ||
      !body.fullName?.trim() ||
      !body.email?.trim()) {
    return 'Mã nhân viên, họ tên và email là bắt buộc.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return 'Email không hợp lệ.';
  }

  return null;
}

// Xử lý lỗi
function handleError(res, error) {
  if (error.code === 11000) {
    return res.status(409).json({
      message: 'Mã nhân viên đã tồn tại.'
    });
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      message: error.message
    });
  }

  console.error(error);

  return res.status(500).json({
    message: 'Lỗi máy chủ.'
  });
}

// Tránh ký tự đặc biệt gây lỗi tìm kiếm Regex
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 1. GET: Lấy danh sách và tìm kiếm nhân viên
router.get('/', async (req, res) => {
  try {
    const search = String(req.query.search || '').trim();

    const filter = search ? {
      $or: [
        {
          employeeId: {
            $regex: escapeRegex(search),
            $options: 'i'
          }
        },
        {
          fullName: {
            $regex: escapeRegex(search),
            $options: 'i'
          }
        }
      ]
    } : {};

    const employees = await Employee.find(filter)
      .sort({ createdAt: -1 });

    res.json(employees);
  } catch (error) {
    handleError(res, error);
  }
});

// 2. GET: Lấy chi tiết một nhân viên
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'ID không hợp lệ.'
      });
    }

    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        message: 'Không tìm thấy nhân viên.'
      });
    }

    res.json(employee);
  } catch (error) {
    handleError(res, error);
  }
});

// 3. POST: Thêm nhân viên
router.post('/', async (req, res) => {
  try {
    const error = validateEmployee(req.body);

    if (error) {
      return res.status(400).json({ message: error });
    }

    const employee = await Employee.create(req.body);

    res.status(201).json({
      message: 'Thêm nhân viên thành công.',
      employee
    });
  } catch (error) {
    handleError(res, error);
  }
});

// 4. PUT: Cập nhật nhân viên
router.put('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'ID không hợp lệ.'
      });
    }

    const error = validateEmployee(req.body);

    if (error) {
      return res.status(400).json({ message: error });
    }

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!employee) {
      return res.status(404).json({
        message: 'Không tìm thấy nhân viên.'
      });
    }

    res.json({
      message: 'Cập nhật thành công.',
      employee
    });
  } catch (error) {
    handleError(res, error);
  }
});

// 5. DELETE: Xóa nhân viên
router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'ID không hợp lệ.'
      });
    }

    const employee = await Employee.findByIdAndDelete(req.params.id);

    if (!employee) {
      return res.status(404).json({
        message: 'Không tìm thấy nhân viên.'
      });
    }

    res.json({
      message: 'Xóa nhân viên thành công.'
    });
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;