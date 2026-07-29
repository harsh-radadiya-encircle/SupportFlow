import { Router } from 'express';
import { TicketsController } from './tickets.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import {
  createTicketSchema,
  updateTicketStatusSchema,
  assignTicketSchema,
  addInternalNoteSchema,
} from './tickets.schema';

const router = Router();

// All ticket endpoints require authentication
router.use(authenticate);

router.post('/', validate(createTicketSchema), TicketsController.createTicket);
router.get('/', TicketsController.getTickets);
router.get('/:id', TicketsController.getTicketById);

// Status updates & assignments (Agents & Admins)
router.patch(
  '/:id/status',
  authorize(['SUPPORT_AGENT', 'BUSINESS_ADMIN', 'PLATFORM_ADMIN']),
  validate(updateTicketStatusSchema),
  TicketsController.updateStatus
);

router.patch(
  '/:id/assign',
  authorize(['BUSINESS_ADMIN', 'SUPPORT_AGENT', 'PLATFORM_ADMIN']),
  validate(assignTicketSchema),
  TicketsController.assignAgent
);

// Agent Internal Notes (Agents & Admins ONLY - Customer Forbidden)
router.post(
  '/:id/notes',
  authorize(['SUPPORT_AGENT', 'BUSINESS_ADMIN', 'PLATFORM_ADMIN']),
  validate(addInternalNoteSchema),
  TicketsController.addInternalNote
);

export default router;
