require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const MongoStore = require('connect-mongo');
const axios = require('axios');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3'); // Importa el S3Client del SDK v3
const path = require('path');
const Image = require('./models/image');
const uploadRoutes = require('./routes/upload'); // Archivo de rutas si tienes otras funciones para `/upload`

// Configuración de Passport
require('./config/passport');

const app = express();

// Configuración de EJS y layout
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Conectado a MongoDB'))
    .catch((err) => console.error('Error al conectar a MongoDB', err));

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
}));
app.use(passport.initialize());
app.use(passport.session());

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de AWS S3 con SDK v3
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Configuración de multer para la subida de imágenes directamente a S3
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_BUCKET_NAME,
        acl: 'public-read',
        key: function (req, file, cb) {
            const uniqueName = Date.now() + '-' + path.basename(file.originalname);
            cb(null, uniqueName);
        }
    }),
    limits: { fileSize: 15 * 1024 * 1024 }, // Límite de 15 MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        allowedTypes.includes(file.mimetype) ? cb(null, true) : cb(new Error('Tipo de archivo no permitido'));
    }
});

// Rutas de autenticación de Google
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => res.redirect('/profile')
);

// Verificación de reCAPTCHA
app.post('/verify-captcha', async (req, res) => {
    const { token } = req.body;
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    try {
        const response = await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`);
        res.json({ success: response.data.success });
    } catch (error) {
        res.status(500).json({ error: 'Error al verificar captcha' });
    }
});

// Ruta para perfil del usuario
app.get('/profile', async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const images = await Image.find({ userId: req.user._id });
            const userProfile = {
                name: req.user.displayName,
                email: req.user.email,
            };
            res.render('profile', { title: 'Perfil', userProfile, images });
        } catch (error) {
            console.error('Error al cargar el perfil:', error);
            res.status(500).send('Error al cargar el perfil.');
        }
    } else {
        res.redirect('/');
    }
});

// Página de subida de imágenes (GET)
app.get('/upload', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('upload', { title: 'Subir Imagen' });
    } else {
        res.redirect('/');
    }
});

// Ruta de subida de imágenes (POST) que guarda la URL en la base de datos
app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        const { description } = req.body;
        const isPublic = req.body.publish === 'true';

        // Guardar la URL pública de la imagen en la base de datos
        const newImage = new Image({
            userId: req.user._id,
            filename: req.file.originalname,
            contentType: req.file.mimetype,
            imageUrl: req.file.location, // URL de S3
            description,
            isPublic,
            publishedAt: Date.now(),
            publishedBy: req.user.displayName
        });

        await newImage.save();
        res.redirect('/profile');
    } catch (error) {
        console.error('Error al subir la imagen:', error.message);
        res.status(500).send(`Error al subir la imagen: ${error.message}`);
    }
});

// Página de la comunidad de imágenes
app.get('/community', async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const images = await Image.find({ isPublic: true }).populate('userId', 'displayName');
            res.render('community', { title: 'Comunidad', images });
        } catch (error) {
            console.error('Error al cargar la comunidad:', error);
            res.status(500).send('Error al cargar la comunidad.');
        }
    } else {
        res.redirect('/');
    }
});

// Cerrar sesión
app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect('/');
    });
});

// Ruta principal
app.get('/', (req, res) => {
    res.redirect('http://localhost:3000');
});

// Manejo de errores global
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(500).send(err.message);
    } else if (err) {
        return res.status(500).send(err.message);
    }
    next();
});

// Iniciar el servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor ejecutándose en el puerto ${PORT}`));




