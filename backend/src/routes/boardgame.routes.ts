import { Router } from 'express';
import { getBoardgames, getBoardgameById } from '../controllers/boardgame.controller';

const router = Router();

router.get('/', getBoardgames);
router.get('/:id', getBoardgameById);

export default router;
