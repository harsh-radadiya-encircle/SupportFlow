import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import usersRoutes from '../modules/users/users.routes';
import invitationsRoutes from '../modules/invitations/invitations.routes';
import ticketsRoutes from '../modules/tickets/tickets.routes';
import notificationsRoutes from '../modules/notifications/notifications.routes';
import subscriptionsRoutes from '../modules/subscriptions/subscriptions.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/invitations', invitationsRoutes);
router.use('/tickets', ticketsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/subscriptions', subscriptionsRoutes);

router.get('/', (req, res) => {
  res.json({ message: 'SupportFlow API V1 Operational' });
});

export default router;
