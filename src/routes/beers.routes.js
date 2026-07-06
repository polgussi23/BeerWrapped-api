import express from 'express';
import beersController from '../controllers/beers.controller.js';
import { authenticateToken, authorizeSelf } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', authenticateToken, beersController.getAllBeers);
router.get('/:id/last-3-days', authenticateToken, authorizeSelf, beersController.getUserBeersHistory); // To be removed
router.get('/:id/user-beers-history', authenticateToken, authorizeSelf, beersController.getUserBeersHistory);
router.post('/:id/delete-beer', authenticateToken, authorizeSelf, beersController.deleteUserBeer)
//router.post('/:id/custom', authenticateToken, authorizeSelf, beersController.postCustomUserBeer);
router.post('/:id/add-beer', authenticateToken, authorizeSelf, beersController.addBeerToUser);
router.put('/:id/update-datetime/:userBeerId', authenticateToken, authorizeSelf, beersController.updateBeerDateTime);


export default router;
