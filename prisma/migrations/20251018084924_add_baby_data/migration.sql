-- CreateTable
CREATE TABLE "BabyData" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "babyId" INTEGER NOT NULL,
    "monthAge" INTEGER NOT NULL,
    "heightCm" REAL NOT NULL,
    "weightKg" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BabyData_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "BabyData_babyId_idx" ON "BabyData"("babyId");

-- CreateIndex
CREATE UNIQUE INDEX "BabyData_babyId_monthAge_key" ON "BabyData"("babyId", "monthAge");
