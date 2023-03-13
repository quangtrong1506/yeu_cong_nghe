const Product = require('../../models/product');
const Categories = require('../../models/categories');
const ItemStatus = require('../../models/itemStatus');
const Supplier = require('../../models/supplier');
const User = require('../../models/users');
const Cart = require('../../models/cart');
const Voucher = require('../../models/voucher');
const Order = require('../../models/order');

const bcrypt = require('bcrypt');

const fs = require('fs-extra');
const path = require('path');

const { mongooseToObject, singleMongooseObject } = require('../../ult/mongoose');

const { getID, removeToneVietNamese } = require('../../ult/string');
var salt = bcrypt.genSaltSync(10);

// Mail
const nodemailer = require('nodemailer');
const myEmail = 'sp.yeucongnghe@gmail.com';
const myPasswork = 'hjgrkdpeplraiuoa';
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: myEmail,
        pass: myPasswork,
    },
});

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
    async forgotPassword(req, res, next) {
        var email = req.body.email;
        var userDB = await User.findOne({ email: email });
        if (!email.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/g))
            return res.json({ code: 401, message: 'Địa chỉ email không hợp lệ' });
        if (!userDB) return res.json({ code: 401, message: 'Địa chỉ Email này chưa được đăng ký' });
        var newPassword = getID(8);
        var password = bcrypt.hashSync(newPassword, salt);
        await User.findOneAndUpdate(
            { email: email },
            {
                password: password,
            }
        );
        var mailOptions = {
            from: myEmail,
            to: email,
            subject: 'Lấy lại mật khẩu - Yêu Công Nghệ',
            html: `Mật khẩu mới của bạn là: <b>${newPassword}</b> 
                <br>Vui lòng đổi mật khẩu khi đăng nhập lại
                <br>
                <hr>
                Nếu bạn không thực hiện hành động này vui lòng bỏ qua tin nhắn
                <br>
                <a href="#">Yeucongnghe.vn</a>`,
        };
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
        res.json({
            message: 'Mật khẩu đã được chuyển về email của bạn',
        });
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
    // get
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
            if (!prod) {
                cartDB[i].price = 0;
                cartDB[i].name = 'Sản phẩm không còn tồn tại';
                cartDB[i].slug = '#';
                cartDB[i].total = 0;
                cartDB[i].image = '404.png';
                count += 1;
                continue;
            }
            if (prod.status == 'Ngừng kinh doanh') {
                cartDB[i].price = 0;
                cartDB[i].name = 'Cửa hàng đã ngừng kinh doanh sản phẩm này';
                cartDB[i].slug = '#';
                cartDB[i].total = 0;
                cartDB[i].image = '404.png';
                count += 1;
                continue;
            }
            sum += (prod.price - prod.priceSale) * cartDB[i].quantity;
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
        var ship = req.body.ship || 30000;
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
            sum += (prod.price - prod.priceSale) * cartDB[i].quantity;
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
        }).format(total2 + ship);
        var ship = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(ship);
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
            code: code,
        });
    }
    async checkout(req, res, next) {
        var code = req.body.code;
        var name = req.body.name,
            address = req.body.address,
            phone = req.body.phone,
            email = req.body.email,
            note = req.body.note;
        if (!req.session.login) return res.json({ code: 401, message: 'Vui lòng đăng nhập lại' });
        if (!name) return res.json({ code: 401, message: 'Vui lòng nhập họ & tên của bạn' });
        if (!address) return res.json({ code: 401, message: 'Vui lòng nhập địa chỉ nhận hàng' });
        if (!phone) return res.json({ code: 401, message: 'Vui lòng nhập số điện thoại của bạn' });
        if (!phone.match(/(84|0[3|5|7|8|9])+([0-9]{8})\b/im))
            return res.json({ code: 401, message: 'Số điện thoại không hợp lệ' });
        if (email.length > 0 && !email.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/im))
            return res.json({ code: 401, message: 'Email không hợp lệ' });
        var cartDB = await Cart.find({ userId: req.session.userInfo.id });
        cartDB = mongooseToObject(cartDB);
        if (cartDB.length == 0)
            return res.json({ code: 401, message: 'Bạn đã thanh toán những sản phẩm này' });
        var discount = await Voucher.findOne({ code: code });
        if (discount) {
            var tmp = singleMongooseObject(discount);
            var arr = tmp.userUsed;
            arr.push(req.session.userInfo.id);
            await Voucher.findOneAndUpdate(
                { code: code },
                { quantity: discount.quantity - 1, userUsed: arr }
            );
        }
        discount = discount
            ? singleMongooseObject(discount)
            : {
                  price: 0,
              };
        var sum = 0;
        var products = [];
        for (let i = 0; i < cartDB.length; i++) {
            var prod = await Product.findOne({ id: cartDB[i].productId });
            if (!prod) continue;
            await Product.findOneAndUpdate(
                { id: cartDB[i].productId },
                {
                    quantity: prod.quantity - cartDB[i].quantity,
                    sold: prod.sold + cartDB[i].quantity,
                }
            );
            sum += (prod.price - prod.priceSale) * cartDB[i].quantity;
            products.push({
                id: prod.id,
                name: prod.name,
                price: prod.price - prod.priceSale,
                total: (prod.price - prod.priceSale) * cartDB[i].quantity,
                quantity: cartDB[i].quantity,
            });
        }
        var total2 = sum - discount.price < 0 ? 0 : sum - discount.price;
        total2 = total2 + 30000;
        var sum = sum < 0 ? 0 : sum;
        sum = sum;

        var id = getID(8);
        var newOrder = new Order({
            id: id,
            userId: req.session.userInfo.id,
            products: products,
            total: total2,
            sum: sum,
            userName: name,
            address: address,
            phone: phone,
            email: email,
            discount: discount.price,
            note: note,
            status: 'Chờ xác nhận',
        });
        newOrder.save();
        var cartAll = await Cart.find({});
        cartAll = mongooseToObject(cartAll);
        for (let i = 0; i < cartAll.length; i++) {
            if (cartAll[i].userId == req.session.userInfo.id)
                await Cart.findByIdAndRemove(cartAll[i]._id);
        }
        res.json({ message: 'Bạn đã đặt hàng thành công', cartId: id });
    }
    async viewOrder(req, res, next) {
        var categories = await Categories.find({});
        if (!req.session.login)
            return res.render('user/orders', {
                title: 'Đơn hàng của bạn',
                layout: 'main',
                session: req.session,
                categories: mongooseToObject(categories),
            });
        var myOrders = await Order.find({
            userId: req.session.userInfo.id,
        }).sort({ createdAt: -1 });
        myOrders = mongooseToObject(myOrders);
        for (let i = 0; i < myOrders.length; i++) {
            const element = myOrders[i];
            if (
                element.status == 'Chờ xác nhận' ||
                element.status == 'Đã xác nhận' ||
                element.status == 'Người bán đang chuẩn bị đơn hàng của bạn'
            )
                element.canCancel = true;
            if (element.total > 0)
                element.total = new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                }).format(element.total);
            if (element.discount > 0)
                element.discount = new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                }).format(element.discount);
        }
        res.render('user/orders', {
            title: 'Đơn hàng của bạn',
            layout: 'main',
            session: req.session,
            categories: mongooseToObject(categories),
            count: myOrders.length,
            orders: myOrders,
        });
    }
    async orderDetails(req, res, next) {
        var categories = await Categories.find({});
        if (!req.session.login)
            return res.render('user/order-details', {
                title: 'Chi tiết đơn hàng',
                layout: 'main',
                session: req.session,
                categories: mongooseToObject(categories),
            });

        var id = req.query.id;
        var myOrder = await Order.findOne({
            id: id,
        });
        if (!myOrder)
            return res.render('user/order-details', {
                title: 'Đơn hàng không tồn tại',
                layout: 'main',
                session: req.session,
                categories: mongooseToObject(categories),
                count: 0,
            });
        myOrder = singleMongooseObject(myOrder);
        if (myOrder.ship > 0)
            myOrder.ship = new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
            }).format(myOrder.ship);
        if (myOrder.discount > 0)
            myOrder.discount = new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
            }).format(myOrder.discount);
        if (myOrder.total > 0)
            myOrder.total = new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
            }).format(myOrder.total);
        if (myOrder.sum > 0)
            myOrder.sum = new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
            }).format(myOrder.sum);

        for (let i = 0; i < myOrder.products.length; i++) {
            const element = myOrder.products[i];
            element.price = new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
            }).format(element.price);
            element.total = new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
            }).format(element.total);
        }
        var time = new Date(myOrder.createdAt);
        var date = time.getDate() < 10 ? '0' + time.getDate() : time.getDate();
        var month = time.getMonth() + 1 < 10 ? '0' + (time.getMonth() + 1) : time.getMonth() + 1;
        var minute =
            time.getMinutes() + 1 < 10 ? '0' + (time.getMinutes() + 1) : time.getMinutes() + 1;
        var hour = time.getHours() + 1 < 10 ? '0' + (time.getHours() + 1) : time.getHours() + 1;
        var dateTime = date + '/' + month + '/' + time.getFullYear() + ' ' + hour + ':' + minute;
        myOrder.createdAt = dateTime;
        if (
            myOrder.status == 'Chờ xác nhận' ||
            myOrder.status == 'Đã xác nhận' ||
            myOrder.status.match('Chuẩn bị')
        )
            myOrder.canCancel = true;
        res.render('user/order-details', {
            title: 'Chi tiết đơn hàng',
            layout: 'main',
            session: req.session,
            categories: mongooseToObject(categories),
            count: 1,
            order: myOrder,
        });
    }
    async cancelOrder(req, res, next) {
        if (!req.session.login) return res.json({ code: 401, message: 'Vui lòng đăng nhập lại' });
        var id = req.body.id;
        var myOrder = await Order.findOne({
            id: id,
        });
        if (!myOrder)
            return res.json({
                message: 'Đơn hàng không tồn tại',
                code: 401,
            });
        myOrder = singleMongooseObject(myOrder);
        if (
            myOrder.status == 'Chờ xác nhận' ||
            myOrder.status == 'Đã xác nhận' ||
            myOrder.status == 'Người bán đang chuẩn bị đơn hàng của bạn'
        ) {
            var myOrder = await Order.findOneAndUpdate(
                {
                    id: id,
                },
                { status: 'Đã hủy' }
            );
            res.json({ message: 'Bạn đã hủy đơn hàng thành công' });
            for (let i = 0; i < myOrder.products.length; i++) {
                var prod = await Product.findOne({ id: myOrder.products[i].id });
                await Product.findOneAndUpdate(
                    { id: myOrder.products[i].id },
                    {
                        quantity: prod.quantity + myOrder.products[i].quantity,
                        sold: prod.sold - myOrder.products[i].quantity,
                    }
                );
            }
        } else if (myOrder.status == 'Đã hủy')
            res.json({ code: 401, message: 'Đơn hàng này đã được hủy' });
        else res.json({ code: 401, message: 'Đơn hàng không thể hủy' });
    }
}

module.exports = new HomeController();
