/*
  Warnings:

  - Added the required column `paymentMethod` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('CARD', 'PIX', 'CASH');

-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "paymentMethod" "public"."PaymentMethod" NOT NULL;
