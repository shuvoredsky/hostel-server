import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

import { prisma } from '../src/app/lib/prisma';
import { auth } from '../src/app/lib/auth';
import { Role, UserStatus } from '../src/generated';

const ADMIN_EMAIL = 'kumarshuvo265@gmail.com';
const ADMIN_NAME = 'Admin User';

const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  throw new Error('SEED_ADMIN_PASSWORD env var is missing. Add it to .env');
}

async function main() {
  console.log('Starting Admin User Seed...');

  const existingUser = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (existingUser) {
    console.log(`User with email "${ADMIN_EMAIL}" already exists.`);
    
    // Ensure the user has ADMIN role
    const updated = await prisma.user.update({
      where: { email: ADMIN_EMAIL },
      data: {
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
    });
    
    console.log(`User role updated/confirmed as: ${updated.role}`);
  } else {
    console.log(`Creating new Admin User with email "${ADMIN_EMAIL}"...`);
    
    // Register the user via Better-Auth to handle scrypt password hashing
    const signUpResult = await auth.api.signUpEmail({
      body: {
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      },
    });

    if (!signUpResult || !signUpResult.user) {
      throw new Error('Failed to create user via Better-Auth');
    }

    // Set role as ADMIN
    const updated = await prisma.user.update({
      where: { id: signUpResult.user.id },
      data: {
        role: Role.ADMIN,
        emailVerified: true,
      },
    });

    console.log(`Admin user created successfully with ID: ${updated.id} and role: ${updated.role}`);
  }
}

main()
  .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
