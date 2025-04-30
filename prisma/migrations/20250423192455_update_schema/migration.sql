/*
  Warnings:

  - You are about to drop the column `available_seats` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `end_date` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `is_online` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `organizer_id` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `seats` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `start_date` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `Event` table. All the data in the column will be lost.
  - You are about to alter the column `price` on the `Event` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to drop the column `created_at` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `event_id` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `message` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `confirmed_at` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `event_id` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `expired_at` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `payment_date` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `payment_method` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `payment_proof` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `ticket_quantity` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `total_amount` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `expiry_points` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `first_name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `last_name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `profile_picture` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `referral_code` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `user_points` on the `User` table. All the data in the column will be lost.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Discount` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Referral` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,eventId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[referralCode]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `availableSeats` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endDate` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizerId` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `Event` required. This step will fail if there are existing NULL values in that column.
  - Made the column `category` on table `Event` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `eventId` to the `Review` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Review` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eventId` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expiresAt` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalPrice` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('customer', 'organizer');

-- DropForeignKey
ALTER TABLE "Discount" DROP CONSTRAINT "Discount_event_id_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_organizer_id_fkey";

-- DropForeignKey
ALTER TABLE "Referral" DROP CONSTRAINT "Referral_discount_id_fkey";

-- DropForeignKey
ALTER TABLE "Referral" DROP CONSTRAINT "Referral_referee_id_fkey";

-- DropForeignKey
ALTER TABLE "Referral" DROP CONSTRAINT "Referral_referrer_id_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_event_id_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_event_id_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_user_id_fkey";

-- DropIndex
DROP INDEX "Review_user_id_event_id_key";

-- DropIndex
DROP INDEX "User_referral_code_key";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "available_seats",
DROP COLUMN "created_at",
DROP COLUMN "end_date",
DROP COLUMN "is_online",
DROP COLUMN "name",
DROP COLUMN "organizer_id",
DROP COLUMN "seats",
DROP COLUMN "start_date",
DROP COLUMN "updated_at",
ADD COLUMN     "availableSeats" INTEGER NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "organizerId" INTEGER NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "price" SET DATA TYPE INTEGER,
ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "category" SET NOT NULL;

-- AlterTable
ALTER TABLE "Review" DROP COLUMN "created_at",
DROP COLUMN "event_id",
DROP COLUMN "message",
DROP COLUMN "updated_at",
DROP COLUMN "user_id",
ADD COLUMN     "comment" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "eventId" INTEGER NOT NULL,
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "confirmed_at",
DROP COLUMN "created_at",
DROP COLUMN "event_id",
DROP COLUMN "expired_at",
DROP COLUMN "payment_date",
DROP COLUMN "payment_method",
DROP COLUMN "payment_proof",
DROP COLUMN "ticket_quantity",
DROP COLUMN "total_amount",
DROP COLUMN "updated_at",
DROP COLUMN "user_id",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "eventId" INTEGER NOT NULL,
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "paymentProof" TEXT,
ADD COLUMN     "pointsUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "quantity" INTEGER NOT NULL,
ADD COLUMN     "totalPrice" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userId" INTEGER NOT NULL,
ADD COLUMN     "voucherCode" TEXT,
ALTER COLUMN "status" SET DEFAULT 'waiting_for_payment';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "created_at",
DROP COLUMN "expiry_points",
DROP COLUMN "first_name",
DROP COLUMN "last_name",
DROP COLUMN "profile_picture",
DROP COLUMN "referral_code",
DROP COLUMN "updated_at",
DROP COLUMN "user_points",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "profilePicture" TEXT,
ADD COLUMN     "referralCode" TEXT,
ADD COLUMN     "referredBy" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userPoints" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'customer';

-- DropTable
DROP TABLE "Discount";

-- DropTable
DROP TABLE "Referral";

-- DropEnum
DROP TYPE "UserRole";

-- CreateTable
CREATE TABLE "Point" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Point_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Image" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "eventId" INTEGER NOT NULL,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "eventId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "discount" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "maxUses" INTEGER,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discount" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Point_userId_idx" ON "Point"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Promotion_code_key" ON "Promotion"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "Event_organizerId_idx" ON "Event"("organizerId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_eventId_key" ON "Review"("userId", "eventId");

-- CreateIndex
CREATE INDEX "Transaction_userId_eventId_idx" ON "Transaction"("userId", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Point" ADD CONSTRAINT "Point_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
