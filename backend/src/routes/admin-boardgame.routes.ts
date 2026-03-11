import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import {
  adminGetBoardgames,
  createBoardgame,
  updateBoardgame,
  deleteBoardgame,
  permanentDeleteBoardgame,
} from '../controllers/boardgame.controller';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', adminGetBoardgames);
router.post('/', createBoardgame);
router.put('/:id', updateBoardgame);
router.delete('/:id', deleteBoardgame);
router.delete('/:id/permanent', permanentDeleteBoardgame);

export default router;
