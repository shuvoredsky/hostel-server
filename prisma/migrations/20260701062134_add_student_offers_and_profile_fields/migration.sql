-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "Profession" AS ENUM ('SOFTWARE_ENGINEER', 'DOCTOR', 'TEACHER', 'BANKER', 'FREELANCER', 'BUSINESS', 'OTHERS');

-- CreateEnum
CREATE TYPE "AdvanceOption" AS ENUM ('NO_ADVANCE', 'ONE_MONTH', 'TWO_MONTH');

-- CreateEnum
CREATE TYPE "GenderPreference" AS ENUM ('BOYS', 'GIRLS', 'ANYONE');

-- CreateEnum
CREATE TYPE "PaymentPlan" AS ENUM ('FULL', 'HALF_MONTHLY');

-- CreateEnum
CREATE TYPE "InstallmentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "paymentPlan" "PaymentPlan" NOT NULL DEFAULT 'FULL';

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "advanceOption" "AdvanceOption" NOT NULL DEFAULT 'TWO_MONTH',
ADD COLUMN     "allowHalfMonthlyPay" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "genderPreference" "GenderPreference" NOT NULL DEFAULT 'ANYONE',
ADD COLUMN     "studentDiscountPercent" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "discountAmount" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "discountPercent" INTEGER DEFAULT 0,
ADD COLUMN     "originalAmount" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "gender" "Gender",
ADD COLUMN     "profession" "Profession";

-- CreateTable
CREATE TABLE "PaymentInstallment" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "installmentNo" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" "InstallmentStatus" NOT NULL DEFAULT 'PENDING',
    "transactionId" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentInstallment_transactionId_key" ON "PaymentInstallment"("transactionId");

-- AddForeignKey
ALTER TABLE "PaymentInstallment" ADD CONSTRAINT "PaymentInstallment_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
