const mongoose = require('mongoose');

const products = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    imageUrl: { type: String, required: true },
    isNew: { type: Boolean, required: true },
    rating: { type: Number, required: true },
    reviewCount: { type: Number, required: true }
});

module.exports = mongoose.model('Urunler', products);