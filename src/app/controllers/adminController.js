const { singleMongooseObject, mongooseToObject } = require('../../ult/mongoose');
const { removeToneVietNamese, getD, getID } = require('../../ult/string');
const fs = require('fs-extra');

const path = require('path');
const Supplier = require('../../models/supplier');
const ItemStatus = require('../../models/itemStatus');
const Categories = require('../../models/categories');
const Product = require('../../models/product');
const Admin = require('../../models/admin');
const User = require('../../models/users');

// [GET]: /category/:slug
class adminController {
    async index(req, res, next) {
        var prodCount = await Product.find({}).count();
        var sapHetHangCount = await Product.find({ quantity: { $lt: 10 } }).count();
        var userCount = await User.find({}).count();
        var newUser = await User.find({}).sort({ createdAt: -1 }).limit(5);
        res.render('admin/index', {
            layout: 'admin',
            title: 'Trang chủ',
            prodCount: prodCount,
            userCount: userCount,
            sapHetHangCount: sapHetHangCount,
            admin: req.session.adminInfo,
            newUser: mongooseToObject(newUser),
        });
    }
    async productManagementSite(req, res, next) {
        var prod = await Product.find({})
            .collation({ locale: 'vi', strength: 2 })
            .sort({ name: 1 });

        var cat = await Categories.find({});
        var st = await ItemStatus.find({});
        var sup = await Supplier.find({});
        prod = mongooseToObject(prod);

        for (let i = 0; i < prod.length; i++) {
            var element = prod[i];
            element.sale = element.priceSale > 0 ? true : false;
            element.img = element.images[0];
            element.statusCheck = {};
            if (element.status.toLowerCase() == 'Còn hàng'.toLowerCase())
                element.statusCheck.a = true;
            else if (element.status.toLowerCase() == 'Sắp hết hàng'.toLowerCase())
                element.statusCheck.b = true;
            else if (element.status.toLowerCase() == 'Hết hàng'.toLowerCase())
                element.statusCheck.c = true;
            if (element.quantity < 10 && element.quantity > 0) {
                element.statusCheck.a = false;
                element.statusCheck.b = true;
                element.status = 'Sắp hết hàng';
            }
            if (element.quantity == 0) {
                element.statusCheck.a = false;
                element.statusCheck.b = false;
                element.statusCheck.c = false;
                element.statusCheck.d = true;
                element.status = 'Hết hàng';
            }

            element.price = element.price.toLocaleString('vi-VN', {
                style: 'currency',
                currency: 'VND',
            });
        }
        res.render('admin/productManagement', {
            layout: 'admin',
            title: 'Quản lý sản phẩm',
            product: prod,
            categories: mongooseToObject(cat),
            status: mongooseToObject(st),
            supplier: mongooseToObject(sup),
            admin: req.session.adminInfo,
        });
    }
    oderManagementSite(req, res, next) {
        res.render('admin/oderManagement', {
            layout: 'admin',
            title: 'Quản lý đơn hàng',
            admin: req.session.adminInfo,
        });
    }
    //? get
    async addProductSite(req, res, next) {
        var listSupplier = await Supplier.find({});
        var listItemStatus = await ItemStatus.find({});
        var listCategories = await Categories.find({});

        res.render('admin/addProduct', {
            layout: 'admin',
            title: 'Thêm sản phẩm',
            listItemStatus: mongooseToObject(listItemStatus),
            listSupplier: mongooseToObject(listSupplier),
            listCategories: mongooseToObject(listCategories),
            admin: req.session.adminInfo,
        });
    }

    async editProductSite(req, res, next) {
        var id = req.query.id;
        var listSupplier = await Supplier.find({});
        var listItemStatus = await ItemStatus.find({});
        var listCategories = await Categories.find({});
        var product = await Product.findOne({ id: id });
        res.render('admin/editProduct', {
            layout: 'admin',
            title: 'Chỉnh sửa sản phẩm',
            listItemStatus: mongooseToObject(listItemStatus),
            listSupplier: mongooseToObject(listSupplier),
            listCategories: mongooseToObject(listCategories),
            product: singleMongooseObject(product),
            admin: req.session.adminInfo,
        });
    }
    async supplierManagementSite(req, res, next) {
        var listSupplier = await Supplier.find({});
        listSupplier = mongooseToObject(listSupplier);
        var product = await Product.find({});
        product = mongooseToObject(product);
        for (let i = 0; i < listSupplier.length; i++) {
            listSupplier[i].count = 0;
            for (let j = 0; j < product.length; j++) {
                if (listSupplier[i].name == product[j].supplier) listSupplier[i].count++;
            }
        }
        res.render('admin/supplierManagement', {
            layout: 'admin',
            title: 'Quản lý nhà cung cấp',
            listSupplier: listSupplier,
            admin: req.session.adminInfo,
        });
    }
    async categoriesManagementSite(req, res, next) {
        var categories = await Categories.find({});
        categories = mongooseToObject(categories);
        var product = await Product.find({});
        product = mongooseToObject(product);
        for (let i = 0; i < categories.length; i++) {
            categories[i].count = 0;
            for (let j = 0; j < product.length; j++) {
                if (categories[i].name == product[j].categories) categories[i].count++;
            }
        }
        res.render('admin/categoriesManagement', {
            layout: 'admin',
            title: 'Quản lý danh mục sản phẩm',
            categories: categories,
            admin: req.session.adminInfo,
        });
    }
    async loginSite(req, res, next) {
        console.log('login');
        res.render('admin/login', {
            layout: 'login',
            title: 'Đăng nhập quản trị',
        });
    }
    async errorSite(req, res, next) {
        res.render('admin/error', {
            layout: 'admin',
            title: 'Lỗi',
        });
    }
    async forgotSite(req, res, next) {
        console.log('login');
        res.render('admin/forgotPassword', {
            layout: 'login',
            title: 'Quên mật khẩu',
        });
    }
    async logout(req, res, next) {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        req.session.destroy();
        res.redirect('/admin/dang-nhap');
    }

    /////////////////////////
    //post
    async login(req, res, next) {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        var admin = req.body;
        if (!admin.username && !admin.password) {
            if (!adminDB) return res.json({ code: -1, message: 'Vui lòng nhập đầy đủ thông tin' });
        }
        var adminDB = await Admin.findOne({ phone: admin.username });
        if (!adminDB) adminDB = await Admin.findOne({ email: admin.username });
        if (!adminDB) return res.json({ code: -2, message: 'Không tìm thấy tài khoản' });
        else if (adminDB.password != admin.password) {
            return res.json({ code: -3, message: 'Mật khẩu không chính xác' });
        }

        var session = req.session;
        session.admin = true;
        session.adminInfo = adminDB;
        res.json({ code: 1, message: 'Đăng nhập thành công' });
    }
}

module.exports = new adminController();
