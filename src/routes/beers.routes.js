import express from 'express';
import beersController from '../controllers/beers.controller.js';
import { authenticateToken, authorizeSelf } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', authenticateToken, beersController.getAllBeers);
router.get('/:id/last-3-days', authenticateToken, authorizeSelf, beersController.getLast3DaysUserBeers);
router.post('/:id/delete-beer', authenticateToken, authorizeSelf, beersController.deleteUserBeer)
//router.post('/:id/custom', authenticateToken, authorizeSelf, beersController.postCustomUserBeer);
router.post('/:id/add-beer', authenticateToken, authorizeSelf, beersController.addBeerToUser);


export default router;
