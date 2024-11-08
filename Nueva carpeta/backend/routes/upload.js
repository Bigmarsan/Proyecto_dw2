const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const Image = require('../models/image'); // Modelo de imagen

const router = express.Router(); // Definición de `router`

// Configuración de AWS S3
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Configuración de multer para almacenar en memoria
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 }, // Limitar tamaño a 15MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido'), false);
        }
    }
});

// Middleware para verificar si el usuario está autenticado
const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
};

// Ruta para subir una imagen
router.post('/', ensureAuthenticated, upload.single('image'), async (req, res) => {
    console.log("Ruta /upload fue llamada");
    try {
        if (!req.file) {
            throw new Error('No se ha proporcionado una imagen');
        }

        // Parámetros para subir la imagen a S3
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: Date.now() + '-' + req.file.originalname,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
            ACL: 'public-read'
        };

        // Subir imagen a S3 usando `PutObjectCommand`
        const command = new PutObjectCommand(params);
        const s3Data = await s3.send(command);

        // Generar URL de la imagen en S3
        const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;

        // Guardar URL en la base de datos
        const newImage = new Image({
            userId: req.user._id,
            filename: req.file.originalname,
            contentType: req.file.mimetype,
            imageUrl, // URL pública de S3
            description: req.body.description,
            isPublic: req.body.publish === 'true',
            isVisible: true,
            publishedBy: req.user.displayName,
            publishedAt: Date.now()
        });

        await newImage.save();
        res.redirect('/profile');
    } catch (error) {
        console.error('Error al subir la imagen:', error.message);
        res.status(502).send(`Error al subir la imagen: ${error.message}`);
    }
});

// Ruta para dar "like" a una imagen
router.post('/:id/like', async (req, res) => {
    try {
        const image = await Image.findById(req.params.id);

        // Verifica si el usuario ya ha dado like
        if (!image.likes.includes(req.user._id)) {
            image.likes.push(req.user._id); // Agrega el ID del usuario al array de likes
        }

        await image.save();
        res.json({ likesCount: image.likes.length });
    } catch (error) {
        console.error('Error al dar like:', error);
        res.status(500).json({ error: 'Error al dar like' });
    }
});


// Ruta para agregar un comentario a una imagen
router.post('/:id/comment', async (req, res) => {
    try {
        const image = await Image.findById(req.params.id);

        // Agrega el comentario al array de comentarios
        image.comments.push({
            userId: req.user._id,
            text: req.body.text
        });

        await image.save();

        // Devuelve los comentarios actualizados
        const populatedImage = await Image.findById(req.params.id).populate('comments.userId', 'displayName');
        res.json({ comments: populatedImage.comments });
    } catch (error) {
        console.error('Error al agregar comentario:', error);
        res.status(500).json({ error: 'Error al agregar comentario' });
    }
});


module.exports = router;






