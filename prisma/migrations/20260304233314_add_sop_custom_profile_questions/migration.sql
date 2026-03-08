-- AlterTable
ALTER TABLE "HouseProfileQuestion" ADD COLUMN     "householdId" TEXT;

-- CreateTable
CREATE TABLE "HouseSOP" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HouseSOP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseSOPPhoto" (
    "id" TEXT NOT NULL,
    "sopId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HouseSOPPhoto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "HouseProfileQuestion" ADD CONSTRAINT "HouseProfileQuestion_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseSOP" ADD CONSTRAINT "HouseSOP_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseSOPPhoto" ADD CONSTRAINT "HouseSOPPhoto_sopId_fkey" FOREIGN KEY ("sopId") REFERENCES "HouseSOP"("id") ON DELETE CASCADE ON UPDATE CASCADE;
