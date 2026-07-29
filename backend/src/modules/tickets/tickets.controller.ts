import { Response, NextFunction } from 'express';
import { TicketsService } from './tickets.service';
import { sendResponse } from '../../common/responses/apiResponse';
import { AuthenticatedRequest } from '../../common/types';

export class TicketsController {
  static async createTicket(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticket = await TicketsService.createTicket(req.body, req.user!);
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

  static async getTickets(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await TicketsService.getTickets(req.user!, req.query as any);
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

  static async getTicketById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticketId = req.params.id as string;
      const ticket = await TicketsService.getTicketById(ticketId, req.user!);
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

  static async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticketId = req.params.id as string;
      const { status } = req.body;
      const ticket = await TicketsService.updateStatus(ticketId, status, req.user!);
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

  static async assignAgent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticketId = req.params.id as string;
      const { assignedAgentId } = req.body;
      const ticket = await TicketsService.assignAgent(ticketId, assignedAgentId, req.user!);
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

  static async addInternalNote(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticketId = req.params.id as string;
      const { content } = req.body;
      const note = await TicketsService.addInternalNote(ticketId, content, req.user!);
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
}
