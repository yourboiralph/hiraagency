-- CreateEnum
CREATE TYPE "TaskOrderStatus" AS ENUM ('OPEN', 'CLOSED');

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "taskOrderId" TEXT;

-- CreateTable
CREATE TABLE "TaskOrder" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "brief" TEXT,
    "status" "TaskOrderStatus" NOT NULL DEFAULT 'OPEN',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskOrder_projectId_status_idx" ON "TaskOrder"("projectId", "status");

-- CreateIndex
CREATE INDEX "Submission_taskOrderId_idx" ON "Submission"("taskOrderId");

-- AddForeignKey
ALTER TABLE "TaskOrder" ADD CONSTRAINT "TaskOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskOrder" ADD CONSTRAINT "TaskOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_taskOrderId_fkey" FOREIGN KEY ("taskOrderId") REFERENCES "TaskOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
