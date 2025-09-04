-- CreateEnum
CREATE TYPE "public"."EventEmployeeRole" AS ENUM ('CASHIER', 'COMMON');

-- CreateTable
CREATE TABLE "public"."Employee" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Terminal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mpTerminalId" TEXT NOT NULL,
    "mpExternalPosId" TEXT,
    "alias" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Terminal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EventTerminal" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "terminalId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventTerminal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EventEmployee" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "role" "public"."EventEmployeeRole" NOT NULL,
    "terminalId" TEXT,
    "password" TEXT,
    "expense" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventEmployee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventTerminal_eventId_terminalId_key" ON "public"."EventTerminal"("eventId", "terminalId");

-- CreateIndex
CREATE UNIQUE INDEX "EventEmployee_eventId_employeeId_key" ON "public"."EventEmployee"("eventId", "employeeId");

-- AddForeignKey
ALTER TABLE "public"."Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Terminal" ADD CONSTRAINT "Terminal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventTerminal" ADD CONSTRAINT "EventTerminal_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventTerminal" ADD CONSTRAINT "EventTerminal_terminalId_fkey" FOREIGN KEY ("terminalId") REFERENCES "public"."Terminal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventEmployee" ADD CONSTRAINT "EventEmployee_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventEmployee" ADD CONSTRAINT "EventEmployee_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventEmployee" ADD CONSTRAINT "EventEmployee_terminalId_fkey" FOREIGN KEY ("terminalId") REFERENCES "public"."Terminal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
