import { Router } from 'express';
import { getBoardgames } from '../controllers/boardgame.controller';

const router = Router();

router.get('/', getBoardgames);

export default router;
