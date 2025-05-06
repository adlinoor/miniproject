-- CreateIndex
CREATE INDEX "Transaction_status_expiresAt_idx" ON "Transaction"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "Transaction_userId_status_idx" ON "Transaction"("userId", "status");
