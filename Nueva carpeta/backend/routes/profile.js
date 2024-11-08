// backend/routes/profile.js
const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const auth = require('../middleware/auth');
const Image = require('./models/Image'); // Importa el modelo de imagen si aún no lo has hecho

router.get('/profile', auth, async (req, res) => {
    try {
        const userImages = await Image.find({ userId: req.user._id });
        res.render('profile', { title: 'Perfil', userProfile: req.user, images: userImages });
    } catch (error) {
        console.error('Error al cargar el perfil:', error);
        res.status(500).send('Error al cargar el perfil');
    }
});

router.get('/community', auth, async (req, res) => {
    try {
        const publicImages = await Image.find({ isPublic: true }).populate('userId', 'displayName');
        res.render('community', { title: 'Comunidad', images: publicImages });
    } catch (error) {
        console.error('Error al cargar la comunidad:', error);
        res.status(500).send('Error al cargar la comunidad');
    }
});

module.exports = router;







