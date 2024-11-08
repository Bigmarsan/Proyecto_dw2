const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/verify-recaptcha', async (req, res) => {
    const recaptchaToken = req.body.recaptchaToken;  // Token que se recibe desde el frontend
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;  // Clave secreta en el .env

    if (!recaptchaToken) {
        return res.status(400).json({ message: 'reCAPTCHA token is missing' });
    }

    try {
        // Petición POST al servidor de Google para verificar el token
        const response = await axios.post(`https://www.google.com/recaptcha/api/siteverify`, null, {
            params: {
                secret: secretKey,
                response: recaptchaToken
            }
        });

        const { success } = response.data;

        if (success) {
            return res.status(200).json({ message: 'reCAPTCHA verification successful' });
        } else {
            return res.status(400).json({ message: 'Failed to verify reCAPTCHA' });
        }
    } catch (error) {
        console.error('Error during reCAPTCHA validation', error);
        return res.status(500).json({ message: 'Internal server error during reCAPTCHA validation' });
    }
});

module.exports = router;
