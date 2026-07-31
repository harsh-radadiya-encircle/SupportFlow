import {
  PrismaClient,
  Role,
  SubscriptionPlan,
  SubscriptionStatus,
  TicketStatus,
  TicketPriority,
  TicketCategory,
} from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Wipe existing data
  console.log("🧹 Wiping existing data...");
  await prisma.notification.deleteMany();
  await prisma.fcmToken.deleteMany();
  await prisma.ticketActivity.deleteMany();
  await prisma.internalNote.deleteMany();
  await prisma.message.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.billingHistory.deleteMany();
  await prisma.user.deleteMany();
  await prisma.business.deleteMany();

  // 2. Create Platform Admin
  console.log("👑 Creating Platform Admin...");
  await prisma.user.create({
    data: {
      firebaseUid: faker.string.uuid(),
      email: "platform_admin@example.com",
      fullName: "System Administrator",
      role: Role.PLATFORM_ADMIN,
      authProvider: "EMAIL_PASSWORD",
    },
  });

  console.log(
    "✅ Seeding completed successfully! (Only Platform Admin created)",
  );

  console.log("✅ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
