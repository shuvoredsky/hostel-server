"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const better_auth_1 = require("better-auth");
const prisma_1 = require("better-auth/adapters/prisma");
const prisma_2 = require("./prisma");
const plugins_1 = require("better-auth/plugins");
const generated_1 = require("../generated");
const env_1 = require("../../config/env");
exports.auth = (0, better_auth_1.betterAuth)({
    baseURL: env_1.envVars.BETTER_AUTH_URL,
    secret: env_1.envVars.BETTER_AUTH_SECRET,
    database: (0, prisma_1.prismaAdapter)(prisma_2.prisma, {
        provider: 'postgresql',
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
    },
    socialProviders: {
        google: {
            clientId: env_1.envVars.GOOGLE_CLIENT_ID,
            clientSecret: env_1.envVars.GOOGLE_CLIENT_SECRET,
            mapProfileToUser: () => ({
                role: generated_1.$Enums.Role.STUDENT,
                status: generated_1.$Enums.UserStatus.ACTIVE,
                needPasswordChange: false,
                emailVerified: true,
                isDeleted: false,
                deletedAt: null,
            }),
        },
    },
    emailVerification: {
        sendOnSignUp: true,
        sendOnSignIn: false,
        autoSignInAfterVerification: true,
    },
    user: {
        additionalFields: {
            role: { type: 'string', required: true, defaultValue: generated_1.$Enums.Role.STUDENT },
            status: { type: 'string', required: true, defaultValue: generated_1.$Enums.UserStatus.ACTIVE },
            needPasswordChange: { type: 'boolean', required: true, defaultValue: false },
            isDeleted: { type: 'boolean', required: true, defaultValue: false },
            deletedAt: { type: 'date', required: false, defaultValue: null },
        },
    },
    plugins: [
        (0, plugins_1.bearer)(),
        (0, plugins_1.emailOTP)({
            overrideDefaultEmailVerification: true,
            async sendVerificationOTP({ email, otp, type }) {
                const user = await prisma_2.prisma.user.findUnique({ where: { email } });
                if (!user)
                    return;
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
        signIn: `${env_1.envVars.BETTER_AUTH_URL}/api/v1/auth/google/success`,
    },
    trustedOrigins: [env_1.envVars.BETTER_AUTH_URL, env_1.envVars.FRONTEND_URL],
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
