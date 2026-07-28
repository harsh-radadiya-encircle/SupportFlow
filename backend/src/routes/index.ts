import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';

const router = Router();

router.use('/auth', authRoutes);

router.get('/', (req, res) => {
  res.json({ message: 'SupportFlow API V1 Operational' });
});

export default router;
