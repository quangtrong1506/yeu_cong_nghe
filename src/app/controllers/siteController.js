const Product = require('../../models/product');
const Categories = require('../../models/categories');
const ItemStatus = require('../../models/itemStatus');
const Supplier = require('../../models/supplier');

const { mongooseToObject, singleMongooseObject } = require('../../ult/mongoose');
const { getD, getID, removeToneVietNamese } = require('../../ult/string');

class HomeController {
    async index(req, res, next) {
        var prodNB = await Product.find({}).limit(24);
        var prodNew = await Product.find({}).sort({ updatedAt: -1 }).limit(6);
        var categoriesLimit = await Categories.find({}).limit(5);
        var categories = await Categories.find({});
        var prod = await Product.find({});

        prodNB = mongooseToObject(prodNB);
        prodNew = mongooseToObject(prodNew);
        categories = mongooseToObject(categories);
        prod = mongooseToObject(prod);
        for (let i = 0; i < categories.length; i++) {
            for (let j = 0; j < prod.length; j++) {
                if (prod[j].categories == categories[i].name)
                    categories[i].image = prod[i].images[0];
            }
        }

        for (let i = 0; i < prodNB.length; i++) {
            if (prodNB[i].priceSale > 0) {
                var priceTmp = prodNB[i].price;
                prodNB[i].price = priceTmp - prodNB[i].priceSale;
                prodNB[i].present = Math.round((prodNB[i].priceSale / priceTmp) * 100);
                prodNB[i].priceOld = new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                }).format(priceTmp);
                prodNB[i].sale = true;
            }
            if (prodNB[i].status == 'Ngừng kinh doanh') prodNB[i].stop = true;
            prodNB[i].price = prodNB[i].price.toLocaleString('vi-VN', {
                style: 'currency',
                currency: 'VND',
            });
            prodNB[i].categories = removeToneVietNamese(
                prodNB[i].categories.trim().replace(/ /g, '-')
            );
        }
        var prodNewTmp = [];
        var tmp = [];
        for (let i = 0; i < prodNew.length; i++) {
            if (prodNew[i].priceSale > 0)
                prodNew[i].price = prodNew[i].price - prodNew[i].priceSale;
            prodNew[i].price = prodNew[i].price.toLocaleString('vi-VN', {
                style: 'currency',
                currency: 'VND',
            });
            prodNew[i].categories = removeToneVietNamese(
                prodNew[i].categories.trim().replace(/ /g, '-')
            );
            tmp.push(prodNew[i]);
            if ((i + 1) % 3 == 0) {
                prodNewTmp.push(tmp);
                tmp = [];
            }
        }
        res.render('site/home', {
            layout: 'main',
            title: 'Trang chủ',
            prodNB: prodNB,
            prodNew: prodNewTmp,
            categories: categories,
            categoriesLimit: mongooseToObject(categoriesLimit),
            session: req.session,
        });
    }
    async product(req, res, next) {
        var categories = await Categories.find({});
        res.render('site/product', {
            layout: 'main',
            title: 'Sản phẩm',
            session: req.session,
            categories: mongooseToObject(categories),
        });
    }

    async news(req, res, next) {
        var categories = await Categories.find({});
        res.render('site/news', {
            layout: 'main',
            title: 'Tin tức',
            session: req.session,
            categories: mongooseToObject(categories),
        });
    }

    async contact(req, res, next) {
        var categories = await Categories.find({});
        res.render('site/contact', {
            layout: 'main',
            title: 'Liên hệ',
            session: req.session,
            categories: mongooseToObject(categories),
        });
    }
    async productDetails(req, res, next) {
        var slug = req.params.slug;
        var prod = await Product.findOne({ slug: slug });
        if (!prod)
            return res.render('site/error', {
                layout: 'main',
                session: req.session,
            });
        var prod2 = await Product.find({ categories: prod.categories });
        var tmp = [];
        for (let i = 0; i < prod2.length; i++) {
            if (prod.slug != prod2[i].slug) tmp.push(prod2[i]);
        }
        prod = singleMongooseObject(prod);
        tmp = mongooseToObject(tmp);
        if (prod.priceSale > 0) {
            var priceTmp = prod.price;
            prod.price = priceTmp - prod.priceSale;
            prod.presentSale = Math.round((prod.priceSale / priceTmp) * 100);
            prod.priceOld = new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
            }).format(priceTmp);
            prod.sale = true;
        }
        prod.price = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(prod.price);
        for (let i = 0; i < tmp.length; i++) {
            tmp[i].price = new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
            }).format(tmp[i].price);
        }
        var categories = await Categories.find({});

        res.render('products/details', {
            layout: 'main',
            title: prod.name,
            product: prod,
            prod2: tmp,
            session: req.session,
            categories: mongooseToObject(categories),
        });
    }
    error(req, res, next) {
        res.render('site/error', {
            layout: 'main',
            session: req.session,
        });
    }
}

module.exports = new HomeController();
