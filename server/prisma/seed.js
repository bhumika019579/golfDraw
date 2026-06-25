const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Clean existing database records
  await prisma.winner.deleteMany({});
  await prisma.score.deleteMany({});
  await prisma.draw.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.charity.deleteMany({});

  console.log('Existing DB records cleared.');

  // 1. Seed 3 Charities
  const charities = [];
  charities.push(
    await prisma.charity.create({
      data: {
        name: 'Junior Golf Foundation',
        description: 'Supporting youth development through golf training, equipment donations, and leadership programs for underprivileged youth.',
        imageUrl: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=600'
      }
    })
  );

  charities.push(
    await prisma.charity.create({
      data: {
        name: 'Green Fairways Conservancy',
        description: 'Dedicated to ecological preservation, organic course management, and water protection across regional golf facilities.',
        imageUrl: 'https://i.pinimg.com/1200x/57/94/de/5794de5081588ba149435575c9067572.jpg'
      }
    })
  );

  charities.push(
    await prisma.charity.create({
      data: {
        name: 'Caddy Education Fund',
        description: 'Providing fully-funded college scholarships and academic tutoring support to hardworking regional caddies and support staff.',
        imageUrl: 'https://i.pinimg.com/1200x/d5/db/94/d5db9474017164b331c417c58baaa87f.jpg'
      }
    })
  );

  console.log(`Successfully seeded ${charities.length} charities.`);

  // 2. Hash Passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const sub1Password = await bcrypt.hash('sub123', 10);
  const sub2Password = await bcrypt.hash('sub123', 10);

  // 3. Seed 1 Admin User
  const admin = await prisma.user.create({
    data: {
      name: 'Executive Admin',
      email: 'admin@golfdraw.com',
      password: adminPassword,
      role: 'admin',
      isSubscribed: false
    }
  });

  console.log(`Successfully seeded admin: ${admin.email}`);

  // 4. Seed 2 Subscriber Users
  const subscriber1 = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@golfdraw.com',
      password: sub1Password,
      role: 'subscriber',
      isSubscribed: true,
      subscriptionPlan: 'monthly',
      subscriptionDate: new Date(),
      charityId: charities[0].id,
      charityPercent: 12.0
    }
  });

  const subscriber2 = await prisma.user.create({
    data: {
      name: 'Jane Smith',
      email: 'jane@golfdraw.com',
      password: sub2Password,
      role: 'subscriber',
      isSubscribed: true,
      subscriptionPlan: 'yearly',
      subscriptionDate: new Date(),
      charityId: charities[1].id,
      charityPercent: 15.0
    }
  });

  console.log(`Successfully seeded subscribers: ${subscriber1.email}, ${subscriber2.email}`);

  // 5. Seed 5 Scores for each subscriber user (between 1-45, unique dates)
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const sub1ScoreValues = [14, 27, 8, 35, 42];
  for (let i = 0; i < 5; i++) {
    const scoreDate = new Date(today);
    scoreDate.setUTCDate(today.getUTCDate() - i - 1); // unique consecutive days in the past
    await prisma.score.create({
      data: {
        userId: subscriber1.id,
        value: sub1ScoreValues[i],
        date: scoreDate
      }
    });
  }

  const sub2ScoreValues = [7, 18, 27, 33, 45];
  for (let i = 0; i < 5; i++) {
    const scoreDate = new Date(today);
    scoreDate.setUTCDate(today.getUTCDate() - i - 1); // unique consecutive days in the past
    await prisma.score.create({
      data: {
        userId: subscriber2.id,
        value: sub2ScoreValues[i],
        date: scoreDate
      }
    });
  }

  console.log('Successfully seeded scores for subscribers.');
  console.log('Seeding process complete!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
