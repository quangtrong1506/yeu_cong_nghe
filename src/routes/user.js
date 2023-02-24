const express = require('express');
const router = express.Router();

const userController = require('../app/controllers/userController');

//? get methods
router.use('/user/dang-ky', userController.register);
router.use('/user/dang-nhap', userController.login);
router.use('/user/dang-xuat', userController.logout);
router.use('/user/thong-tin-ca-nhan', userController.info);
router.use('/user/thay-doi-thong-tin-ca-nhan', userController.changeInfo);
router.use('/user/mat-khau', userController.password);
router.use('/user/thay-doi-mat-khau', userController.changePassword);
router.use('/user/gio-hang', userController.viewCart);
router.use('/user/thanh-toan', userController.viewThanhToan);
router.use('/user/checkout', userController.checkout);

module.exports = router;
