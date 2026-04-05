import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
// import { PrismaClient } from '../../generated';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

export const prisma = new PrismaClient({ adapter });

// Connection test
prisma.$connect()
  .then(() => console.log('✅ Database connected'))
  .catch((err) => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  });