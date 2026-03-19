import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './prisma';
import { bearer, emailOTP } from 'better-auth/plugins';
import { Role, UserStatus } from '../../generated';
import { envVars } from '../../config/env';

export const auth = betterAuth({
  baseURL: envVars.BETTER_AUTH_URL,
  secret: envVars.BETTER_AUTH_SECRET,

  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  socialProviders: {
    google: {
      clientId: envVars.GOOGLE_CLIENT_ID,
      clientSecret: envVars.GOOGLE_CLIENT_SECRET,
      mapProfileToUser: () => ({
        role: Role.STUDENT,
        status: UserStatus.ACTIVE,
        needPasswordChange: false,
        emailVerified: true,
        isDeleted: false,
        deletedAt: null,
      }),
    },
  },

  emailVerification: {
    sendOnSignUp: false,
    sendOnSignIn: false,
    autoSignInAfterVerification: true,
  },

  user: {
    additionalFields: {
      role: { type: 'string', required: true, defaultValue: Role.STUDENT },
      status: { type: 'string', required: true, defaultValue: UserStatus.ACTIVE },
      needPasswordChange: { type: 'boolean', required: true, defaultValue: false },
      isDeleted: { type: 'boolean', required: true, defaultValue: false },
      deletedAt: { type: 'date', required: false, defaultValue: null },
    },
  },

  plugins: [
    bearer(),
    emailOTP({
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return;

        if (type === 'email-verification' && !user.emailVerified) {
          // TODO: sendEmail লাগাবে পরে
          console.log(`[OTP] Email verification OTP for ${email}: ${otp}`);
        }

        if (type === 'forget-password') {
          console.log(`[OTP] Forget password OTP for ${email}: ${otp}`);
        }
      },
      expiresIn: 2 * 60,
      otpLength: 6,
    }),
  ],

  session: {
    expiresIn: 60 * 60 * 24,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24,
    },
  },

  redirectURLs: {
    signIn: `${envVars.BETTER_AUTH_URL}/api/v1/auth/google/success`,
  },

  trustedOrigins: [envVars.BETTER_AUTH_URL, envVars.FRONTEND_URL],

  advanced: {
    useSecureCookies: false,
    cookies: {
      state: {
        attributes: { sameSite: 'none', secure: true, httpOnly: true, path: '/' },
      },
      sessionToken: {
        attributes: { sameSite: 'none', secure: true, httpOnly: true, path: '/' },
      },
    },
  },
});