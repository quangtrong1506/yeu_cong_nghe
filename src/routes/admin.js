const express = require('express');
const router = express.Router();

const adminController = require('../app/controllers/adminController');

var authenticate = function (req, res, next) {
    if (!req.session.admin) {
        res.redirect('/admin/dang-nhap');
    }
    next();
};
//? get methods
router.use('/admin/quan-ly-san-pham', authenticate, adminController.productManagementSite);
router.use('/admin/quan-ly-khach-hang', authenticate, adminController.userManagementSite);
router.use('/admin/quan-ly-don-hang', authenticate, adminController.oderManagementSite);
router.use('/admin/quan-ly-nha-cung-cap', authenticate, adminController.supplierManagementSite);
router.use('/admin/quan-ly-danh-muc', authenticate, adminController.categoriesManagementSite);
router.use('/admin/quan-ly-bai-viet', authenticate, adminController.newsManagementSite);
router.use('/admin/them-san-pham', authenticate, adminController.addProductSite);
router.use('/admin/them-bai-viet', authenticate, adminController.addNewsSite);
router.use('/admin/chinh-sua-san-pham', authenticate, adminController.editProductSite);
router.use('/admin/chinh-sua-bai-viet', authenticate, adminController.editNewsSite);
router.use('/admin/chi-tiet-don-hang', authenticate, adminController.viewOrders);
router.use('/admin/dang-nhap', adminController.loginSite);
router.use('/admin/quen-mat-khau', adminController.forgotSite);
router.use('/admin/logout', adminController.logout);

// post
router.use('/admin/login', adminController.login);
router.use('/admin/edit-order', adminController.editOrder);
router.use('/admin/add-news', adminController.addNews);
router.use('/admin/edit-news', adminController.editNews);
router.use('/admin/remove-news', adminController.removeNews);

// get

router.use('/admin/:slug', authenticate, adminController.errorSite);
router.use('/admin', authenticate, adminController.index);

module.exports = router;
