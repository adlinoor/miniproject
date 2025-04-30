-- CreateTable
CREATE TABLE "TransactionDetail" (
    "id" SERIAL NOT NULL,
    "transactionId" INTEGER NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "TransactionDetail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransactionDetail_transactionId_idx" ON "TransactionDetail"("transactionId");

-- CreateIndex
CREATE INDEX "TransactionDetail_ticketId_idx" ON "TransactionDetail"("ticketId");

-- AddForeignKey
ALTER TABLE "TransactionDetail" ADD CONSTRAINT "TransactionDetail_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionDetail" ADD CONSTRAINT "TransactionDetail_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
