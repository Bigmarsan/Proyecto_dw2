// backend/controllers/imageController.js
const Image = require('../models/image'); // Modelo de Imagen

exports.uploadImage = async (req, res) => {
    try {
        const { description } = req.body;
        const isPublic = req.body.publish === 'true';

        if (!req.user || !req.user._id || !req.user.name) {
            throw new Error('El usuario no está autenticado o falta información del usuario');
        }

        if (!req.file) {
            throw new Error('No se ha proporcionado un archivo de imagen');
        }

        const newImage = new Image({
            userId: req.user._id,
            filename: req.file.originalname,
            contentType: req.file.mimetype,
            imageBase64: imageBase64,
            description,
            isPublic,
            isVisible: true,
            publishedBy: req.user.name,
            publishedAt: Date.now()
        });

        await newImage.save();
        res.redirect('/profile');
    } catch (error) {
        console.error('Error al subir la imagen:', error.message);
        res.status(501).send(`Error al subir la imagen: ${error.message}`);
    }
};





