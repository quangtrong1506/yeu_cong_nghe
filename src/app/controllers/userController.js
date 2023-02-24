const Product = require('../../models/product');
const Categories = require('../../models/categories');
const ItemStatus = require('../../models/itemStatus');
const Supplier = require('../../models/supplier');
const User = require('../../models/users');
const Cart = require('../../models/cart');
const Voucher = require('../../models/voucher');

const { Schema } = require('mongoose');
const bcrypt = require('bcrypt');

const fs = require('fs-extra');
const path = require('path');

const { mongooseToObject, singleMongooseObject } = require('../../ult/mongoose');
const { getD, getID, removeToneVietNamese } = require('../../ult/string');
var salt = bcrypt.genSaltSync(10);

function removeFile(path) {
    try {
        fs.unlinkSync(path);
    } catch (err) {
        console.error(err);
    }
}

class HomeController {
    // post
    async register(req, res, next) {
        var user = req.body;
        var username = user.username || '',
            password = user.password || '',
            confirmPassword = user.confirm || '';
        var message = 'Đăng ký tài khoản thành công';
        if (!username) message = 'Vui lòng nhập số điện thoại hoặc Email';
        else if (!password) message = 'Vui lòng nhập mật khẩu';
        else if (password != confirmPassword) message = 'Xác nhận mật khẩu không chính xác';
        else if (username.match('@') && !username.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g)) {
            return res.json({
                code: 401,
                message: 'Địa chỉ email không hợp lệ',
            });
        } else if (!username.match('@') && username.match(/[^0-9]/g)) {
            message = 'Số điện thoại không hợp lệ';
        } else {
            var user = await User.findOne({ phone: username });
            if (user)
                return res.json({
                    code: 401,
                    message: 'Số điện thoại hoặc Email này đã được đăng ký',
                });
            user = await User.findOne({ email: username });
            if (user)
                return res.json({
                    code: 401,
                    message: 'Số điện thoại hoặc Email này đã được đăng ký',
                });
            var count = await User.find({}).count();
            var newUser = new User({
                name: 'User_0' + (count + 1),
                password: bcrypt.hashSync(password, salt),
            });
            username.match('@') ? (newUser.email = username) : (newUser.phone = username);
            newUser.save();
        }
        res.json({
            message: message,
        });
    }
    async login(req, res, next) {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        var user = req.body;
        var userP = await User.findOne({ phone: user.username });
        if (!userP) userP = await User.findOne({ email: user.username });
        if (!userP)
            return res.json({ code: 401, message: 'Số điện thoại hoặc email chưa được đăng ký' });
        var kq = bcrypt.compareSync(user.password, userP.password);
        if (!kq) return res.json({ code: 401, message: 'Mật khẩu không chính xác' });
        //
        var session = req.session;
        session.login = true;
        session.userInfo = userP;
        res.json({ code: 1, message: 'Đăng nhập thành công' });
    }
    async logout(req, res, next) {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        var session = req.session;
        session.destroy();
        // session.login = false;
        // session.userInfo = {};
        res.redirect('/');
    }
    async info(req, res, next) {
        var categories = await Categories.find({});
        res.render('user/info', {
            layout: 'main',
            title: 'Thông tin cá nhân',
            session: req.session,
            categories: mongooseToObject(categories),
        });
    }
    // post
    async changeInfo(req, res, next) {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        if (!req.session.login) return res.json({ code: 401, message: 'Vui lòng đăng nhập lại' });
        var name = req.body.name,
            phone = req.body.phone,
            email = req.body.email,
            address = req.body.address;
        if (!name) return res.json({ code: 401, message: 'Vui lòng nhập tên' });
        if (!email) return res.json({ code: 401, message: 'Vui lòng nhập địa chỉ Email' });
        if (!phone) return res.json({ code: 401, message: 'Vui lòng nhập số điện thoại' });
        if (!address) return res.json({ code: 401, message: 'Vui lòng nhập địa chỉ' });
        if (!phone.match(/(84|0[3|5|7|8|9])+([0-9]{8})\b/im))
            return res.json({ code: 401, message: 'Số điện thoại không hợp lệ' });
        if (!email.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/im))
            return res.json({ code: 401, message: 'Email không hợp lệ' });
        var userDB = await User.findOne({ id: req.session.userInfo.id });
        if (phone != userDB.phone) {
            var userTmp = await User.findOne({ phone: phone });
            if (userTmp)
                return res.json({ code: 401, message: 'Số điện thoại đã được đăng ký sử dụng' });
        }
        if (email != userDB.email) {
            var userTmp = await User.findOne({ email: email });
            if (userTmp) return res.json({ code: 401, message: 'Email đã được đăng ký sử dụng' });
        }
        let uploadPath;
        var a = req.files.avatar.name.split('.');
        var b = req.files.avatar.mimetype.split('/');
        var iName = a[1] ? a[1] : b[1];
        var newFile = removeToneVietNamese(name.replace(/ /g, '-')) + '_' + getID(12) + '.' + iName;
        var newPath = path.dirname(__dirname).replace('src\\app', 'public\\images\\user\\');
        uploadPath = newPath + newFile;
        if (iName != 'plain') {
            req.files.avatar.mv(uploadPath, function (err) {
                if (err) {
                    console.log('Không thể lưu file:' + newFile);
                }
            });
        }
        if (req.session.userInfo.avatar != 'default.png')
            removeFile('public\\images\\user\\' + req.files.avatar);

        var user = await User.findOneAndUpdate(
            { id: req.session.userInfo.id },
            {
                name: name,
                phone: phone,
                email: email,
                address: address,
                avatar: newFile,
            }
        );
        if (req.session.userInfo.avatar != 'default.png')
            removeFile('public\\images\\user\\' + user.avatar);
        user.save();
        var newUser = await User.findOne({ id: req.session.userInfo.id });
        req.session.userInfo = newUser;
        res.json({
            message: 'Bạn đã thay đổi thông tin thành công',
        });
    }
    async password(req, res, next) {
        var categories = await Categories.find({});
        res.render('user/password', {
            layout: 'main',
            title: 'Thay đổi mật khẩu',
            session: req.session,
            categories: mongooseToObject(categories),
        });
    }
    // post
    async changePassword(req, res, next) {
        if (!req.session.login) return res.json({ code: 401, message: 'Vui lòng đăng nhập lại' });
        var oldPassword = req.body.oldPassword,
            newPassword = req.body.newPassword,
            confirmPassword = req.body.confirmPassword;
        if (!oldPassword) return res.json({ code: 401, message: 'Vui lòng nhập mật khẩu cũ' });
        if (!newPassword) return res.json({ code: 401, message: 'Vui lòng nhập mật khẩu mới' });
        if (!confirmPassword)
            return res.json({ code: 401, message: 'Vui lòng xác nhận mật khẩu mới' });
        var userDB = await User.findOne({ id: req.session.userInfo.id });
        var kq = bcrypt.compareSync(oldPassword, userDB.password);
        if (!kq) return res.json({ code: 401, message: 'Mật khẩu cũ không chính xác' });
        var user = await User.findOneAndUpdate(
            { id: req.session.userInfo.id },
            {
                password: bcrypt.hashSync(newPassword, salt),
            }
        );
        user.save();
        res.json({
            message: 'Bạn đã thay đổi thông tin thành công',
        });
    }
    async viewCart(req, res, next) {
        var categories = await Categories.find({});
        if (!req.session.login)
            return res.render('user/cart', {
                title: 'Giỏ hàng',
                layout: 'main',
                session: req.session,
                categories: mongooseToObject(categories),
            });
        var cartDB = await Cart.find({ userId: req.session.userInfo.id });
        cartDB = mongooseToObject(cartDB);
        var sum = 0;
        var count = 0;
        for (let i = 0; i < cartDB.length; i++) {
            var prod = await Product.findOne({ id: cartDB[i].productId });
            sum += prod.price * cartDB[i].quantity;
            cartDB[i].price = new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
            }).format(prod.price - prod.priceSale);
            cartDB[i].total = new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
            }).format((prod.price - prod.priceSale) * cartDB[i].quantity);
            cartDB[i].name = prod.name;
            cartDB[i].slug = prod.slug;
            cartDB[i].image = prod.images[0];
            count += cartDB[i].quantity;
        }
        var sumText = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(sum);

        res.render('user/cart', {
            title: 'Giỏ hàng',
            layout: 'main',
            session: req.session,
            categories: mongooseToObject(categories),
            sum: sum,
            sumText: sumText,
            cart: cartDB,
            count: count,
        });
    }
    async viewThanhToan(req, res, next) {
        var categories = await Categories.find({});
        var code = req.body.code;

        if (!req.session.login)
            return res.render('user/checkout', {
                title: 'Thanh toán',
                layout: 'main',
                session: req.session,
                categories: mongooseToObject(categories),
            });
        var discount = await Voucher.findOne({ code: code });
        discount = discount
            ? singleMongooseObject(discount)
            : {
                  price: 0,
              };
        var cartDB = await Cart.find({ userId: req.session.userInfo.id });
        cartDB = mongooseToObject(cartDB);
        var sum = 0;
        var count = 0;
        for (let i = 0; i < cartDB.length; i++) {
            var prod = await Product.findOne({ id: cartDB[i].productId });
            sum += prod.price * cartDB[i].quantity;
            cartDB[i].price = new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
            }).format(prod.price - prod.priceSale);
            cartDB[i].total = new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
            }).format((prod.price - prod.priceSale) * cartDB[i].quantity);
            cartDB[i].name = prod.name;
            count += cartDB[i].quantity;
        }
        var total = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(sum);
        var total2 = sum - discount.price < 0 ? 0 : sum - discount.price;
        var pay = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(total2 + 30000);
        var ship = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(30000);
        var discountPrice = total2 == 0 ? sum : discount.price;
        var discountText = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(discountPrice);
        res.render('user/checkout', {
            title: 'Thanh toán',
            layout: 'main',
            session: req.session,
            categories: mongooseToObject(categories),
            total: total,
            cart: cartDB,
            count: count,
            ship: ship,
            pay: pay,
            discount: discountText,
        });
    }
    async checkout(req, res, next) {
        var code = req.body.code;
        if (!req.session.login) return res.json({ code: 401, message: 'Vui lòng đăng nhập lại' });
        var discount = await Voucher.findOne({ code: code });
        discount = discount
            ? singleMongooseObject(discount)
            : {
                  price: 0,
              };
        var cartDB = await Cart.find({ userId: req.session.userInfo.id });
        cartDB = mongooseToObject(cartDB);
        var sum = 0;
        var count = 0;
        for (let i = 0; i < cartDB.length; i++) {
            var prod = await Product.findOne({ id: cartDB[i].productId });
            sum += prod.price * cartDB[i].quantity;
            cartDB[i].price = new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
            }).format(prod.price - prod.priceSale);
            cartDB[i].total = new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
            }).format((prod.price - prod.priceSale) * cartDB[i].quantity);
            cartDB[i].name = prod.name;
            count += cartDB[i].quantity;
        }
        var total = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(sum);
        var total2 = sum - discount.price < 0 ? 0 : sum - discount.price;
        var pay = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(total2 + 30000);
        var ship = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(30000);
        var discountPrice = total2 == 0 ? sum : discount.price;
        var discountText = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(discountPrice);
        res.render('user/checkout', {
            title: 'Thanh toán',
            layout: 'main',
            session: req.session,
            categories: mongooseToObject(categories),
            total: total,
            cart: cartDB,
            count: count,
            ship: ship,
            pay: pay,
            discount: discountText,
        });
    }
}

module.exports = new HomeController();
