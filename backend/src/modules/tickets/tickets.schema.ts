import { z } from 'zod';

export const createTicketSchema = z.object({
  title: z.string().min(3, 'Ticket title must be at least 3 characters'),
  description: z.string().min(10, 'Ticket description must be at least 10 characters'),
  category: z
    .enum(['GENERAL_INQUIRY', 'TECHNICAL_ISSUE', 'BILLING', 'FEATURE_REQUEST', 'BUG_REPORT'])
    .optional()
    .default('GENERAL_INQUIRY'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('MEDIUM'),
  businessId: z.string().optional(),
});

export const updateTicketStatusSchema = z.object({
  status: z.enum(['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'RESOLVED', 'CLOSED']),
});

export const assignTicketSchema = z.object({
  assignedAgentId: z.string().min(1, 'Agent ID is required'),
});

export const addInternalNoteSchema = z.object({
  content: z.string().min(2, 'Internal note cannot be empty'),
});
