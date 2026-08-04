-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('EMAIL_PASSWORD', 'GOOGLE', 'MULTI_PROVIDER');

-- DropIndex
DROP INDEX "BillingHistory_stripeInvoiceId_key";

-- DropIndex
DROP INDEX "Business_stripeCustomerId_key";

-- DropIndex
DROP INDEX "Business_stripeSubscriptionId_key";

-- DropIndex
DROP INDEX "InternalNote_ticketId_idx";

-- DropIndex
DROP INDEX "Ticket_assignedAgentId_idx";

-- DropIndex
DROP INDEX "Ticket_customerId_idx";

-- AlterTable
ALTER TABLE "BillingHistory" DROP COLUMN "stripeInvoiceId",
ADD COLUMN     "billingCycle" TEXT,
ADD COLUMN     "invoiceNumber" TEXT,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "planAtPayment" "SubscriptionPlan",
ADD COLUMN     "razorpayOrderId" TEXT,
ADD COLUMN     "razorpayPaymentId" TEXT NOT NULL,
ALTER COLUMN "currency" SET DEFAULT 'INR';

-- AlterTable
ALTER TABLE "Business" DROP COLUMN "stripeCustomerId",
DROP COLUMN "stripeSubscriptionId",
ADD COLUMN     "billingCycle" TEXT,
ADD COLUMN     "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastPaymentAt" TIMESTAMP(3),
ADD COLUMN     "nextBillingDate" TIMESTAMP(3),
ADD COLUMN     "pendingDowngradePlan" "SubscriptionPlan",
ADD COLUMN     "razorpayCustomerId" TEXT,
ADD COLUMN     "razorpayOrderId" TEXT,
ADD COLUMN     "razorpaySubscriptionId" TEXT;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "csatComment" TEXT,
ADD COLUMN     "csatScore" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "authProvider" "AuthProvider" NOT NULL DEFAULT 'EMAIL_PASSWORD',
ADD COLUMN     "phoneNumber" TEXT;

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "businessId" TEXT,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_eventId_key" ON "WebhookEvent"("eventId");

-- CreateIndex
CREATE INDEX "WebhookEvent_eventId_idx" ON "WebhookEvent"("eventId");

-- CreateIndex
CREATE INDEX "WebhookEvent_businessId_idx" ON "WebhookEvent"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingHistory_razorpayPaymentId_key" ON "BillingHistory"("razorpayPaymentId");

-- CreateIndex
CREATE INDEX "BillingHistory_businessId_createdAt_idx" ON "BillingHistory"("businessId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Business_razorpayCustomerId_key" ON "Business"("razorpayCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Business_razorpaySubscriptionId_key" ON "Business"("razorpaySubscriptionId");

-- CreateIndex
CREATE INDEX "Business_plan_subscriptionStatus_idx" ON "Business"("plan", "subscriptionStatus");

-- CreateIndex
CREATE INDEX "Business_isSuspended_idx" ON "Business"("isSuspended");

-- CreateIndex
CREATE INDEX "Business_currentPeriodEnd_idx" ON "Business"("currentPeriodEnd");

-- CreateIndex
CREATE INDEX "InternalNote_ticketId_createdAt_idx" ON "InternalNote"("ticketId", "createdAt");

-- CreateIndex
CREATE INDEX "Invitation_businessId_isAccepted_idx" ON "Invitation"("businessId", "isAccepted");

-- CreateIndex
CREATE INDEX "Invitation_email_idx" ON "Invitation"("email");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Ticket_businessId_createdAt_idx" ON "Ticket"("businessId", "createdAt");

-- CreateIndex
CREATE INDEX "Ticket_customerId_status_idx" ON "Ticket"("customerId", "status");

-- CreateIndex
CREATE INDEX "Ticket_assignedAgentId_status_idx" ON "Ticket"("assignedAgentId", "status");

-- CreateIndex
CREATE INDEX "Ticket_category_idx" ON "Ticket"("category");

-- CreateIndex
CREATE INDEX "Ticket_priority_idx" ON "Ticket"("priority");

-- CreateIndex
CREATE INDEX "User_role_isActive_idx" ON "User"("role", "isActive");

-- AddForeignKey
ALTER TABLE "WebhookEvent" ADD CONSTRAINT "WebhookEvent_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;
