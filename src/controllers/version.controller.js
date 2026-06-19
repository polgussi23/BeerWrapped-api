// src/controllers/version.controller.js
const checkVersion = (req, res) => {
  res.json({
    latestVersion: process.env.VERSION,    // versió més nova disponible
    minVersion: process.env.MIN_VERSION,       // versió mínima permesa (si l'usuari té una inferior, és obligatòria)
  });
};

export default { checkVersion };