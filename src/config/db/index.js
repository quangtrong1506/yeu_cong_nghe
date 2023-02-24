const mongoose = require('mongoose');
async function connect() {
    await mongoose
        .connect('mongodb://127.0.0.1:27017/QLSP_do-cong-nghe')
        .then(() => {
            console.log('Kết nối csdl thành công');
        })
        .catch((err) => {
            console.error('Lỗi kết nối đến csdl\n' + err);
        });
}
module.exports = { connect };
