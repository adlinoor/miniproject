import prisma from "../lib/prisma";
import { createEvent } from "../services/event.service";
import { Role } from "@prisma/client";
import { mockEvent } from "./mockData";
import "../setup"; // <-- pastikan ini paling atas

describe("🎪 Event Service", () => {
  let organizerId: number;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: {
        first_name: "Organizer",
        last_name: "One",
        email: "organizer@example.com",
        password: "hashedpass",
        role: Role.ORGANIZER,
      },
    });
    organizerId = user.id;
  });

  it("should create a new event", async () => {
    const event = await createEvent({ ...mockEvent, organizerId });

    expect(event).toHaveProperty("id");
    expect(event.organizerId).toBe(organizerId);
    expect(event.title).toBe(mockEvent.title);
  });
});
