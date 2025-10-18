-- CreateTable
CREATE TABLE "WhoData" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gender" TEXT NOT NULL,
    "monthAge" INTEGER NOT NULL,
    "heightMedianCm" REAL NOT NULL,
    "weightMedianKg" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "WhoData_gender_monthAge_key" ON "WhoData"("gender", "monthAge");
