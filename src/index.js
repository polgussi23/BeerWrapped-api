// src/index.js
import express from 'express';
import authRoutes from './routes/auth.routes.js';

const app = express();
const PORT = process.env.PORT || 3100;

// Middleware per parsejar el body de les peticions en format JSON
app.use(express.json());

// Usa les rutes d'autenticació
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('API està funcionant!');
});

app.listen(PORT, () => {
  console.log(`Servidor escoltant al port ${PORT}`);
});
