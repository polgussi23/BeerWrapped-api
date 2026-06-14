import express from 'express';
import { authenticateToken, authorizeSelf } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('', (req, res) => {
  const { code } = req.query;
  const playStoreUrl = 'https://play.google.com/store/apps/details?id=cat.polgussi.birrawrapped';
  
  // Redirigeix al Play Store
  // L'app interceptarà la URL abans d'arribar aquí si està instal·lada
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>BirraWrapped</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: sans-serif; text-align: center; padding: 40px; background: #2d4a3e; color: white; }
          .btn { display: inline-block; margin-top: 24px; padding: 14px 28px;
                 background: #B5884C; color: white; border-radius: 8px;
                 text-decoration: none; font-size: 16px; }
        </style>
      </head>
      <body>
        <h2>🍺 T'han convidat a un grup de BirraWrapped!</h2>
        <p>Necessites l'app per unir-te al grup amb codi <strong>${code}</strong></p>
        <a class="btn" href="${playStoreUrl}">Descarrega BirraWrapped</a>
        <script>
          // Intent d'obrir l'app si està instal·lada
          window.location = 'intent://birrawrapped.polgussi.cat/join?code=${code}#Intent;scheme=https;package=cat.polgussi.birrawrapped;end';
        </script>
      </body>
    </html>
  `);
});

export default router;
