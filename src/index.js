import express from 'express';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import beersRoutes from './routes/beers.routes.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3100;

app.use(express.json());

// Path absolut a la carpeta images (un nivell per sobre de src/)
app.use('/images', express.static(join(__dirname, '..', 'images')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/beers', beersRoutes);

app.get('/', (req, res) => {
  res.send('API està funcionant!');
});

app.listen(PORT, () => {
  console.log(`Servidor escoltant al port ${PORT}`);
});