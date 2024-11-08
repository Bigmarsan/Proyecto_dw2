const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User'); // Asegúrate de que la ruta sea correcta

// Configuración de Passport para Google
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Buscar o crear el usuario en la base de datos
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
            // Generar un nombre de usuario único, puedes personalizar esta lógica
            const username = profile.displayName.replace(/\s+/g, '').toLowerCase(); // Eliminar espacios y convertir a minúsculas
            
            user = new User({
                googleId: profile.id,
                displayName: profile.displayName,
                email: profile.emails[0].value,
                username: username // Asigna el nombre de usuario
            });

            await user.save();
        }
        done(null, user);
    } catch (error) {
        console.error(error);
        done(error, null);
    }
}));

// Serializar el usuario
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserializar el usuario
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id); // Asegúrate de que esto coincide con tu modelo
        done(null, user);
    } catch (error) {
        console.error(error);
        done(error, null);
    }
});


