-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "address" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "license" TEXT,
ADD COLUMN     "preferred" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "website" TEXT;
