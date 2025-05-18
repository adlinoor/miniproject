import {
  createTransaction,
  updateTransactionStatus,
} from "../services/transaction.service";
import { prismaMock } from "./setup";

describe("💳 Transaction Service", () => {
  describe("createTransaction", () => {
    it("should create a transaction successfully", async () => {
      // TODO: implement test
    });
  });

  describe("updateTransactionStatus", () => {
    it("should update transaction to accepted", async () => {
      // TODO: implement test
    });

    it("should update transaction to rejected", async () => {
      // TODO: implement test
    });

    it("should return points and restore seats on rejection", async () => {
      // TODO: implement test
    });
  });
});
