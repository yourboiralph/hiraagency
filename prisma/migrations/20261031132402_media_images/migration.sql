-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "image" TEXT;

-- CreateTable
CREATE TABLE "SubmissionImage" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SubmissionImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubmissionImage_submissionId_idx" ON "SubmissionImage"("submissionId");

-- AddForeignKey
ALTER TABLE "SubmissionImage" ADD CONSTRAINT "SubmissionImage_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
