-- AlterEnum
ALTER TYPE "TimeEntryStatus" ADD VALUE 'RUNNING';

-- AlterTable
ALTER TABLE "TimeEntry" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "endAt" TIMESTAMP(3),
ADD COLUMN     "startAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "WorkerRate" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hourlyRateCents" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkerRate_householdId_userId_key" ON "WorkerRate"("householdId", "userId");

-- AddForeignKey
ALTER TABLE "WorkerRate" ADD CONSTRAINT "WorkerRate_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerRate" ADD CONSTRAINT "WorkerRate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
