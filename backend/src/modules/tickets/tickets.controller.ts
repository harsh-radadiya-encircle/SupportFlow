import { Response, NextFunction } from 'express';
import { TicketCrudService } from './services/ticket-crud.service';
import { TicketAssignmentService } from './services/ticket-assignment.service';
import { sendResponse } from '../../common/responses/apiResponse';
import { AuthenticatedRequest } from '../../common/types';

const ticketCrudService = new TicketCrudService();
const ticketAssignmentService = new TicketAssignmentService();

export class TicketsController {
  static async createTicket(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const ticket = await ticketCrudService.createTicket(req.body, req.user!);
      sendResponse({
        res,
        statusCode: 201,
        message: 'Support ticket created successfully',
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTickets(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await ticketCrudService.getTickets(req.user!, req.query as any);
      sendResponse({
        res,
        statusCode: 200,
        message: 'Tickets retrieved successfully',
        data: result.tickets,
        meta: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTicketById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const ticketId = req.params.id as string;
      const ticket = await ticketCrudService.getTicketById(ticketId, req.user!);
      sendResponse({
        res,
        statusCode: 200,
        message: 'Ticket details retrieved successfully',
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const ticketId = req.params.id as string;
      const { status } = req.body;
      const ticket = await ticketAssignmentService.updateStatus(ticketId, status, req.user!);
      sendResponse({
        res,
        statusCode: 200,
        message: `Ticket status updated to ${status}`,
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  }

  static async assignAgent(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const ticketId = req.params.id as string;
      const { assignedAgentId } = req.body;
      const ticket = await ticketAssignmentService.assignAgent(ticketId, assignedAgentId, req.user!);
      sendResponse({
        res,
        statusCode: 200,
        message: 'Support agent assigned successfully',
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  }

  static async addInternalNote(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const ticketId = req.params.id as string;
      const { content } = req.body;
      const note = await ticketAssignmentService.addInternalNote(ticketId, content, req.user!);
      sendResponse({
        res,
        statusCode: 201,
        message: 'Internal note added successfully',
        data: note,
      });
    } catch (error) {
      next(error);
    }
  }

  static async submitCsat(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const ticketId = req.params.id as string;
      const { score, comment } = req.body;
      const ticket = await ticketCrudService.submitCsat(ticketId, score, comment, req.user!);
      sendResponse({
        res,
        statusCode: 200,
        message: 'Feedback submitted successfully',
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  }
}
