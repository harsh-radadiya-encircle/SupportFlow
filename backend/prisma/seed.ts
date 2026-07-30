import { PrismaClient, Role, SubscriptionPlan, SubscriptionStatus, TicketStatus, TicketPriority, TicketCategory } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Wipe existing data
  console.log('🧹 Wiping existing data...');
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
  console.log('👑 Creating Platform Admin...');
  await prisma.user.create({
    data: {
      firebaseUid: faker.string.uuid(),
      email: 'platform_admin@example.com',
      fullName: 'System Administrator',
      role: Role.PLATFORM_ADMIN,
      authProvider: 'EMAIL_PASSWORD',
    },
  });

  const BUSINESS_COUNT = 15;
  const START_DATE = new Date();
  START_DATE.setMonth(START_DATE.getMonth() - 6); // 6 months ago

  console.log(`🏢 Creating ${BUSINESS_COUNT} Businesses and assigning users/tickets...`);

  const plans = [SubscriptionPlan.FREE, SubscriptionPlan.STANDARD, SubscriptionPlan.BUSINESS];
  const statuses = [SubscriptionStatus.ACTIVE, SubscriptionStatus.ACTIVE, SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE, SubscriptionStatus.CANCELED];

  for (let i = 0; i < BUSINESS_COUNT; i++) {
    const businessName = faker.company.name();
    const createdAt = faker.date.between({ from: START_DATE, to: new Date() });

    // Create Business
    const business = await prisma.business.create({
      data: {
        name: businessName,
        slug: faker.helpers.slugify(businessName).toLowerCase() + '-' + faker.string.alphanumeric(4),
        plan: faker.helpers.arrayElement(plans),
        subscriptionStatus: faker.helpers.arrayElement(statuses),
        isSuspended: faker.number.int({ min: 1, max: 10 }) === 1, // 10% chance
        createdAt,
      },
    });

    // Create Business Admin
    const businessAdmin = await prisma.user.create({
      data: {
        firebaseUid: faker.string.uuid(),
        email: `admin_${i}@${business.slug}.com`,
        fullName: faker.person.fullName(),
        role: Role.BUSINESS_ADMIN,
        businessId: business.id,
        createdAt,
      },
    });

    // Create Support Agents
    const AGENT_COUNT = faker.number.int({ min: 1, max: 5 });
    const agents = await Promise.all(
      Array.from({ length: AGENT_COUNT }).map((_, j) =>
        prisma.user.create({
          data: {
            firebaseUid: faker.string.uuid(),
            email: `agent_${i}_${j}@${business.slug}.com`,
            fullName: faker.person.fullName(),
            role: Role.SUPPORT_AGENT,
            businessId: business.id,
            createdAt: faker.date.between({ from: createdAt, to: new Date() }),
          },
        })
      )
    );

    // Create Customers & Tickets
    const CUSTOMER_COUNT = faker.number.int({ min: 10, max: 30 });
    for (let j = 0; j < CUSTOMER_COUNT; j++) {
      const customer = await prisma.user.create({
        data: {
          firebaseUid: faker.string.uuid(),
          email: faker.internet.email(),
          fullName: faker.person.fullName(),
          role: Role.CUSTOMER,
          createdAt: faker.date.between({ from: createdAt, to: new Date() }),
        },
      });

      // Create 1-5 Tickets per Customer
      const TICKET_COUNT = faker.number.int({ min: 1, max: 5 });
      for (let k = 0; k < TICKET_COUNT; k++) {
        const ticketCreatedAt = faker.date.between({ from: customer.createdAt, to: new Date() });
        const status = faker.helpers.arrayElement(Object.values(TicketStatus));
        
        const isResolvedOrClosed = status === 'RESOLVED' || status === 'CLOSED';
        
        let firstResponseAt: Date | null = null;
        let resolvedAt: Date | null = null;
        let closedAt: Date | null = null;
        let assignedAgentId: string | null = null;

        // Simulate SLA Timestamps
        if (status !== 'OPEN') {
          const minutesToResponse = faker.number.int({ min: 5, max: 2880 }); // 5 mins to 48 hours
          firstResponseAt = new Date(ticketCreatedAt.getTime() + minutesToResponse * 60000);
          assignedAgentId = faker.helpers.arrayElement(agents).id;
        }

        if (isResolvedOrClosed) {
          const hoursToResolve = faker.number.int({ min: 1, max: 168 }); // 1 hour to 7 days
          resolvedAt = new Date(firstResponseAt ? firstResponseAt.getTime() : ticketCreatedAt.getTime() + hoursToResolve * 3600000);
          if (status === 'CLOSED') {
            closedAt = new Date(resolvedAt.getTime() + 86400000); // 1 day after resolved
          }
        }

        const ticket = await prisma.ticket.create({
          data: {
            title: faker.lorem.sentence({ min: 3, max: 8 }),
            description: faker.lorem.paragraphs(2),
            category: faker.helpers.arrayElement(Object.values(TicketCategory)),
            priority: faker.helpers.arrayElement(Object.values(TicketPriority)),
            status,
            businessId: business.id,
            customerId: customer.id,
            assignedAgentId,
            createdAt: ticketCreatedAt,
            updatedAt: resolvedAt || firstResponseAt || ticketCreatedAt,
            firstResponseAt,
            resolvedAt,
            closedAt,
          },
        });

        // Generate Messages
        await prisma.message.create({
          data: {
            ticketId: ticket.id,
            senderId: customer.id,
            content: ticket.description,
            createdAt: ticketCreatedAt,
          }
        });

        if (firstResponseAt && assignedAgentId) {
          await prisma.message.create({
            data: {
              ticketId: ticket.id,
              senderId: assignedAgentId,
              content: faker.lorem.paragraph(),
              createdAt: firstResponseAt,
            }
          });
        }
      }
    }
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
