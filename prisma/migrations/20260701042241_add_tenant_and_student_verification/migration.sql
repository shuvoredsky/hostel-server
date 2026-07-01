-- CreateEnum
CREATE TYPE "TenantType" AS ENUM ('JOB_HOLDER', 'FREELANCER', 'INTERN', 'BUSINESS_PERSON', 'FAMILY', 'OTHERS');

-- CreateEnum
CREATE TYPE "StudentVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'TENANT';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "tenantType" "TenantType";

-- CreateTable
CREATE TABLE "StudentVerification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "studentIdCardUrl" TEXT NOT NULL,
    "universityName" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "status" "StudentVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentVerification_userId_key" ON "StudentVerification"("userId");

-- AddForeignKey
ALTER TABLE "StudentVerification" ADD CONSTRAINT "StudentVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
