import express from 'express';
import beersController from '../controllers/beers.controller.js';
import { authenticateToken, authorizeSelf } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', authenticateToken, beersController.getAllBeers);
router.get('/:id/custom', authenticateToken, authorizeSelf, beersController.getCustomUserBeers);
router.post('/:id/custom', authenticateToken, authorizeSelf, beersController.postCustomUserBeer);
router.post('/:id/add-beer', authenticateToken, authorizeSelf, beersController.addBeerToUser);


export default router;
