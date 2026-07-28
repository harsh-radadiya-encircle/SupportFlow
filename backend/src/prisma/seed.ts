import { PrismaClient, Role, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting SupportFlow Database Seeding...');

  // 1. Create Sample Business
  const business = await prisma.business.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corporation',
      slug: 'acme-corp',
      plan: SubscriptionPlan.BUSINESS,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
    },
  });

  console.log(`✅ Business created/found: ${business.name} (${business.id})`);

  // Hash default password
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 2. Create Platform Admin
  const platformAdmin = await prisma.user.upsert({
    where: { email: 'admin@supportflow.com' },
    update: {},
    create: {
      firebaseUid: 'mock_uid_platform_admin_001',
      email: 'admin@supportflow.com',
      fullName: 'System Platform Admin',
      role: Role.PLATFORM_ADMIN,
      isActive: true,
    },
  });
  console.log(`✅ Platform Admin created: ${platformAdmin.email}`);

  // 3. Create Business Admin
  const businessAdmin = await prisma.user.upsert({
    where: { email: 'owner@acme.com' },
    update: {},
    create: {
      firebaseUid: 'mock_uid_business_admin_002',
      email: 'owner@acme.com',
      fullName: 'Sarah Jenkins (Business Owner)',
      role: Role.BUSINESS_ADMIN,
      businessId: business.id,
      isActive: true,
    },
  });
  console.log(`✅ Business Admin created: ${businessAdmin.email}`);

  // 4. Create Support Agent
  const supportAgent = await prisma.user.upsert({
    where: { email: 'agent@acme.com' },
    update: {},
    create: {
      firebaseUid: 'mock_uid_support_agent_003',
      email: 'agent@acme.com',
      fullName: 'David Miller (Support Agent)',
      role: Role.SUPPORT_AGENT,
      businessId: business.id,
      isActive: true,
    },
  });
  console.log(`✅ Support Agent created: ${supportAgent.email}`);

  // 5. Create Customer
  const customer = await prisma.user.upsert({
    where: { email: 'customer@gmail.com' },
    update: {},
    create: {
      firebaseUid: 'mock_uid_customer_004',
      email: 'customer@gmail.com',
      fullName: 'John Smith (Customer)',
      role: Role.CUSTOMER,
      isActive: true,
    },
  });
  console.log(`✅ Customer created: ${customer.email}`);

  console.log('🌱 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
