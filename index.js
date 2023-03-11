const express = require('express');
const { engine } = require('express-handlebars');
const Handlebars = require('handlebars');
const fileUpload = require('express-fileupload');
const session = require('express-session');
const cors = require('cors');

const path = require('path');
const app = express();

app.use(express.urlencoded());
app.use(express.json());
app.use(fileUpload());
app.use(cors());
app.options('*', cors());

//Connection Database
const db = require('./src/config/db');
db.connect();

//set view engine
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(path.dirname(__dirname), './public_html/views'));

// set public directory
app.use(express.static(path.join(path.dirname(__dirname), './public_html/public')));

//router
const route = require('./src/routes');

app.use(
    session({
        secret: 'dang nhap',
        resave: true,
        saveUninitialized: true,
        cookie: { maxAge: 3 * 24 * 60 * 60 * 1000 },
    })
);

route(app);

//sever

var port = 3000;
app.listen(port, () => {
    console.log(`Đã chạy sever thành công (http://localhost:${port})`);
});

// Helper function to handle
Handlebars.registerHelper('inc', function (value, options) {
    return parseInt(value) + 1;
});
