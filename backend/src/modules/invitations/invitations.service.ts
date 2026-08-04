import crypto from "crypto";
import { Role } from "@prisma/client";
import { prisma } from "../../utils/prisma";
import { env } from "../../config/env";
import { ApiError } from "../../common/exceptions/apiError";
import { AuthenticatedUser } from "../../common/types";
import { EmailService } from "../../services/email.service";
import { getPlanAgentLimit } from "../subscriptions/plans.config";

export interface InviteAgentDto {
  email: string;
  role?: Role;
}

export interface AcceptInviteDto {
  token: string;
  firebaseUid: string;
  fullName: string;
  authProvider?: "EMAIL_PASSWORD" | "GOOGLE";
}

export class InvitationsService {
  /**
   * Business Admin invites a new Support Agent to their business team
   */
  static async inviteAgent(
    dto: InviteAgentDto,
    currentUser: AuthenticatedUser,
  ) {
    if (!currentUser.businessId) {
      throw ApiError.forbidden(
        "You must belong to an active business to invite support agents.",
      );
    }

    const business = await prisma.business.findUnique({
      where: { id: currentUser.businessId },
    });

    if (!business) {
      throw ApiError.notFound("Business account not found.");
    }

    if (business.isSuspended) {
      throw ApiError.forbidden(
        "Your business account is suspended. Please contact platform administration.",
      );
    }

    // 1. Enforce Subscription Plan Agent Limits (from centralized PLAN_CONFIG)
    const currentAgentCount = await prisma.user.count({
      where: {
        businessId: currentUser.businessId,
        role: Role.SUPPORT_AGENT,
        isActive: true,
      },
    });

    const maxAllowed = getPlanAgentLimit(business.plan);
    if (currentAgentCount >= maxAllowed) {
      throw ApiError.forbidden(
        `Your ${business.plan} subscription plan allows a maximum of ${maxAllowed} support agent(s). You currently have ${currentAgentCount}. Please upgrade your plan in billing to invite more agents.`,
      );
    }

    // 2. Check if user already exists in system database
    const existingUser = await prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      if (existingUser.businessId === currentUser.businessId) {
        throw ApiError.badRequest(
          "A user with this email address is already a member of your business team.",
        );
      }
      throw ApiError.badRequest(
        "An account with this email address already exists in SupportFlow.",
      );
    }

    // 3. Generate unique single-use 7-day token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Days

    // Delete any previous pending invitation for this email in this business
    await prisma.invitation.deleteMany({
      where: {
        email: dto.email,
        businessId: currentUser.businessId,
      },
    });

    const invitation = await prisma.invitation.create({
      data: {
        email: dto.email,
        token,
        role: dto.role || Role.SUPPORT_AGENT,
        businessId: currentUser.businessId,
        invitedById: currentUser.id,
        expiresAt,
      },
      include: {
        business: true,
        invitedBy: {
          select: { fullName: true, email: true },
        },
      },
    });

    const inviteUrl = `${env.FRONTEND_URL}/accept-invite?token=${token}`;

    // Dispatch Agent Invitation Email via Nodemailer SMTP (or log in dev mode)
    await EmailService.sendAgentInvitationEmail(
      dto.email,
      currentUser.fullName,
      business.name,
      inviteUrl,
    );

    return {
      invitation,
      inviteUrl,
    };
  }

  /**
   * Fetch pending invitations and team members for a business
   */
  static async getBusinessTeamAndInvitations(businessId?: string) {
    if (!businessId) {
      return {
        agents: [],
        invitations: [],
        plan: "FREE",
        activeAgentCount: 0,
        maxAgents: 1,
      };
    }

    const [agents, invitations, business] = await Promise.all([
      prisma.user.findMany({
        where: { businessId, role: Role.SUPPORT_AGENT },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          authProvider: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.invitation.findMany({
        where: { businessId, isAccepted: false },
        include: {
          invitedBy: {
            select: { fullName: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.business.findUnique({
        where: { id: businessId },
        select: { plan: true, name: true },
      }),
    ]);

    const activeAgentCount = agents.filter(
      (a) => a.role === Role.SUPPORT_AGENT && a.isActive,
    ).length;
    const maxAgents = getPlanAgentLimit(business?.plan || "FREE");

    return {
      agents,
      invitations,
      plan: business?.plan || "FREE",
      activeAgentCount,
      maxAgents,
      remainingSlots: Math.max(0, maxAgents - activeAgentCount),
    };
  }

  /**
   * Toggle Support Agent Active / Deactive status (Business Admin only)
   */
  static async toggleAgentActiveStatus(
    agentId: string,
    currentUser: AuthenticatedUser,
  ) {
    if (!currentUser.businessId) {
      throw ApiError.forbidden(
        "You must belong to an active business to manage support agents.",
      );
    }

    const agent = await prisma.user.findFirst({
      where: {
        id: agentId,
        businessId: currentUser.businessId,
      },
    });

    if (!agent) {
      throw ApiError.notFound("Support agent not found in your business team.");
    }

    if (agent.id === currentUser.id) {
      throw ApiError.badRequest(
        "You cannot deactivate your own business admin account.",
      );
    }

    const updated = await prisma.user.update({
      where: { id: agentId },
      data: {
        isActive: !agent.isActive,
      },
    });

    return updated;
  }

  /**
   * Revoke/Delete a pending invitation (Business Admin only)
   */
  static async deleteInvitation(
    invitationId: string,
    currentUser: AuthenticatedUser,
  ) {
    if (!currentUser.businessId) {
      throw ApiError.forbidden(
        "You must belong to an active business to manage invitations.",
      );
    }

    const invitation = await prisma.invitation.findFirst({
      where: {
        id: invitationId,
        businessId: currentUser.businessId,
      },
    });

    if (!invitation) {
      throw ApiError.notFound("Invitation not found.");
    }

    return prisma.invitation.delete({
      where: { id: invitationId },
    });
  }

  /**
   * Verify an invitation token before showing signup page
   */
  static async verifyInvitationToken(token: string) {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        business: { select: { id: true, name: true, logoUrl: true } },
        invitedBy: { select: { fullName: true, email: true } },
      },
    });

    if (!invitation) {
      throw ApiError.notFound(
        "Invalid invitation link. Please request a new invitation from your business admin.",
      );
    }

    if (invitation.isAccepted) {
      throw ApiError.badRequest(
        "This invitation has already been accepted. Please sign in to your account.",
      );
    }

    if (invitation.expiresAt < new Date()) {
      throw ApiError.badRequest(
        "This invitation link has expired. Please request a new invitation.",
      );
    }

    return invitation;
  }

  /**
   * Accept an invitation and provision new Support Agent user account
   */
  static async acceptInvitation(dto: AcceptInviteDto) {
    const invitation = await this.verifyInvitationToken(dto.token);

    // Create Support Agent User linked to the business
    const user = await prisma.user.create({
      data: {
        firebaseUid: dto.firebaseUid,
        email: invitation.email,
        fullName: dto.fullName,
        role: invitation.role,
        authProvider: dto.authProvider || "EMAIL_PASSWORD",
        businessId: invitation.businessId,
      },
      include: { business: true },
    });

    // Mark invitation as accepted
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { isAccepted: true },
    });

    return user;
  }
}
