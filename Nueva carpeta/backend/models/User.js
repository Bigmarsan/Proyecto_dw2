const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    googleId: {
        type: String,
        required: true,
        unique: true, // Asegúrate de que sea único
    },
    displayName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true, // Asegúrate de que el email también sea único
    },
    username: {
        type: String,
        required: true,
        unique: true, // Asegúrate de que sea único
    },
});

module.exports = mongoose.model('User', userSchema);


