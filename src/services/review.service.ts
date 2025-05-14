import prisma from "../lib/prisma";

export const createReview = async (
  userId: number,
  eventId: number,
  rating: number,
  comment?: string
) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { endDate: true, organizerId: true },
  });

  if (!event) throw new Error("Event not found");
  if (new Date() < event.endDate) throw new Error("Event has not ended");

  const hasAttended = await prisma.transaction.findFirst({
    where: {
      userId,
      eventId,
      status: "DONE", // pastikan status transaksi selesai
    },
  });

  if (!hasAttended) throw new Error("You have not attended this event");

  return prisma.review.create({
    data: {
      userId,
      eventId,
      rating,
      comment,
    },
  });
};

export const getEventReviews = async (eventId: number) => {
  return prisma.review.findMany({
    where: { eventId },
    include: {
      user: { select: { first_name: true, last_name: true } },
    },
  });
};

export const getOrganizerRatings = async (organizerId: number) => {
  const events = await prisma.event.findMany({
    where: { organizerId },
    select: { id: true },
  });

  const eventIds = events.map((e) => e.id);

  return prisma.review.findMany({
    where: { eventId: { in: eventIds } },
    include: {
      event: { select: { title: true } },
      user: { select: { first_name: true, last_name: true } },
    },
  });
};
