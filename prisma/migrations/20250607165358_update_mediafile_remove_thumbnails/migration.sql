/*
  Warnings:

  - You are about to drop the column `thumbnail_s3_key` on the `media_files` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnail_s3_url` on the `media_files` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "media_files" DROP COLUMN "thumbnail_s3_key",
DROP COLUMN "thumbnail_s3_url",
ALTER COLUMN "organization_id" DROP NOT NULL;
