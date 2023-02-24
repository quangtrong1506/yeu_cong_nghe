const mongoose = require('mongoose');
const { getID } = require('../ult/string');

const Schema = mongoose.Schema;

const Order = new Schema(
    {
        id: { type: String, default: getID(8) },
        userId: { type: String },
        product: { type: Array, default: [] },
        userName: { type: String },
        phone: { type: String },
        email: { type: String },
        total: { type: Number, default: 0 },
        ship: { type: Number, default: 30000 },
        discount: { type: Number, default: 0 },
        note: { type: String },
        type: { type: String },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Order', Order);
