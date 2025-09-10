/*
  Warnings:

  - You are about to drop the column `terminalId` on the `EventEmployee` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cashierId]` on the table `EventTerminal` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."EventEmployee" DROP CONSTRAINT "EventEmployee_terminalId_fkey";

-- AlterTable
ALTER TABLE "public"."EventEmployee" DROP COLUMN "terminalId";

-- AlterTable
ALTER TABLE "public"."EventTerminal" ADD COLUMN     "cashierId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "EventTerminal_cashierId_key" ON "public"."EventTerminal"("cashierId");

-- AddForeignKey
ALTER TABLE "public"."EventTerminal" ADD CONSTRAINT "EventTerminal_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "public"."EventEmployee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
