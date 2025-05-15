import request from "supertest";
import app from "../app";
import { mockUserAndToken } from "../test/authHelper";

describe("Feature 1.3 - Review after event attendance", () => {
  it("User cannot review without attending event", async () => {
    const { token } = await mockUserAndToken("CUSTOMER");
    const res = await request(app)
      .post("/reviews")
      .set("Authorization", `Bearer ${token}`)
      .send({
        eventId: 1,
        rating: 4,
        comment: "Trying to review without attending",
      });

    expect([403, 400]).toContain(res.status);
  });
});
