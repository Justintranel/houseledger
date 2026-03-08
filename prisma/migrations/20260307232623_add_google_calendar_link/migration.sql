-- CreateTable
CREATE TABLE "GoogleCalendarLink" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "icalUrl" TEXT NOT NULL,
    "calendarName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleCalendarLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GoogleCalendarLink_householdId_key" ON "GoogleCalendarLink"("householdId");

-- AddForeignKey
ALTER TABLE "GoogleCalendarLink" ADD CONSTRAINT "GoogleCalendarLink_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
