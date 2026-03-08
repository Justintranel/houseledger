-- CreateTable
CREATE TABLE "TrainingVideoProgress" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingVideoProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingVideoQuestion" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingVideoQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingVideoAnswer" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingVideoAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrainingVideoProgress_householdId_idx" ON "TrainingVideoProgress"("householdId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingVideoProgress_videoId_userId_key" ON "TrainingVideoProgress"("videoId", "userId");

-- CreateIndex
CREATE INDEX "TrainingVideoQuestion_videoId_sortOrder_idx" ON "TrainingVideoQuestion"("videoId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingVideoAnswer_questionId_userId_key" ON "TrainingVideoAnswer"("questionId", "userId");

-- AddForeignKey
ALTER TABLE "TrainingVideoProgress" ADD CONSTRAINT "TrainingVideoProgress_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "TrainingVideo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingVideoProgress" ADD CONSTRAINT "TrainingVideoProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingVideoProgress" ADD CONSTRAINT "TrainingVideoProgress_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingVideoQuestion" ADD CONSTRAINT "TrainingVideoQuestion_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "TrainingVideo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingVideoAnswer" ADD CONSTRAINT "TrainingVideoAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "TrainingVideoQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingVideoAnswer" ADD CONSTRAINT "TrainingVideoAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
