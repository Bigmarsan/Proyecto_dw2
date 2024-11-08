// backend/models/image.js
const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    filename: String,
    contentType: String,
    imageUrl: String,
    description: String,
    isPublic: Boolean,
    publishedAt: Date,
    publishedBy: String,
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Almacena los IDs de usuarios que dieron like
    comments: [
        {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            text: String,
            createdAt: { type: Date, default: Date.now }
        }
    ]
});

module.exports = mongoose.model('Image', imageSchema);











