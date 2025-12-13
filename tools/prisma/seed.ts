import { PrismaClient, PlanInterval } from '@prisma/client';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

async function main() {
  const plans = [
    { id: 'starter', name: 'Starter', coins: 50, price: new Decimal(100), interval: PlanInterval.MONTHLY },
    { id: 'basic', name: 'Basic', coins: 150, price: new Decimal(250), interval: PlanInterval.MONTHLY },
    { id: 'pro', name: 'Pro', coins: 400, price: new Decimal(600), interval: PlanInterval.MONTHLY },
    { id: 'premium', name: 'Premium', coins: 1000, price: new Decimal(1500), interval: PlanInterval.MONTHLY },
    { id: 'starter-annual', name: 'Starter Annual', coins: 600, price: new Decimal(1200), interval: PlanInterval.YEARLY },
    { id: 'pro-annual', name: 'Pro Annual', coins: 5000, price: new Decimal(7200), interval: PlanInterval.YEARLY },
    { id: 'premium-annual', name: 'Premium Annual', coins: 12000, price: new Decimal(15000), interval: PlanInterval.YEARLY },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { id: plan.id }, // ✅ now using unique id
      update: { coins: plan.coins, price: plan.price, interval: plan.interval, name: plan.name },
      create: plan,
    });
  }

  console.log('✅ Production subscription plans seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
