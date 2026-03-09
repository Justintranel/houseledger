-- AlterTable
ALTER TABLE "MaintenanceItem" ADD COLUMN     "vehicleId" TEXT;

-- AddForeignKey
ALTER TABLE "MaintenanceItem" ADD CONSTRAINT "MaintenanceItem_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
