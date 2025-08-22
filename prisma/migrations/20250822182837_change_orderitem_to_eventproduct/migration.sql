/*
  Warnings:

  - You are about to drop the column `productId` on the `OrderItem` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[orderId,eventProductId]` on the table `OrderItem` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `eventProductId` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."OrderItem" DROP CONSTRAINT "OrderItem_productId_fkey";

-- DropIndex
DROP INDEX "public"."OrderItem_orderId_productId_key";

-- AlterTable
ALTER TABLE "public"."OrderItem" DROP COLUMN "productId",
ADD COLUMN     "eventProductId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_orderId_eventProductId_key" ON "public"."OrderItem"("orderId", "eventProductId");

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_eventProductId_fkey" FOREIGN KEY ("eventProductId") REFERENCES "public"."EventProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
