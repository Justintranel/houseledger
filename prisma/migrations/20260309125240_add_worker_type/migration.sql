-- AlterTable
ALTER TABLE "WorkerRate" ADD COLUMN     "isTemporary" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "workerType" TEXT NOT NULL DEFAULT 'REGULAR';
