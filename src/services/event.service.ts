import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const createEvent = async (
  title: string,
  description: string,
  startDate: Date,
  endDate: Date,
  location: string,
  category: string,
  price: number,
  availableSeats: number,
  organizerId: number,
  ticketTypes?: { type: string; price: number; quantity: number }[]
) => {
  return await prisma.$transaction(async (tx) => {
    const event = await tx.event.create({
      data: {
        title,
        description,
        startDate,
        endDate,
        location,
        category,
        price,
        availableSeats,
        organizerId,
      },
    });

    if (ticketTypes && ticketTypes.length > 0) {
      await tx.ticket.createMany({
        data: ticketTypes.map((ticket) => ({
          eventId: event.id,
          type: ticket.type,
          price: ticket.price,
          quantity: ticket.quantity,
        })),
      });
    }

    return event;
  });
};

export const getEvents = async (
  filters: {
    category?: string;
    location?: string;
    search?: string;
    upcomingOnly?: boolean;
  } = {}
) => {
  const { category, location, search, upcomingOnly } = filters;
  const now = new Date();

  return await prisma.event.findMany({
    where: {
      AND: [
        category ? { category } : {},
        location ? { location } : {},
        search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        upcomingOnly ? { startDate: { gt: now } } : {},
      ],
    },
    include: {
      organizer: {
        select: {
          first_name: true,
          last_name: true,
          profilePicture: true,
        },
      },
      promotions: {
        where: {
          startDate: { lte: now },
          endDate: { gte: now },
        },
      },
    },
  });
};

export const getEventById = async (id: number) => {
  return await prisma.event.findUnique({
    where: { id },
    include: {
      organizer: true,
      tickets: true,
      promotions: true,
      reviews: {
        include: {
          user: {
            select: {
              first_name: true,
              last_name: true,
              profilePicture: true,
            },
          },
        },
      },
    },
  });
};

export const createPromotion = async (
  eventId: number,
  code: string,
  discount: number,
  startDate: Date,
  endDate: Date,
  maxUses?: number
) => {
  return await prisma.promotion.create({
    data: {
      eventId,
      code,
      discount,
      startDate,
      endDate,
      maxUses,
    },
  });
};
// Export the function to make it available for import
export function restoreTicketAvailability(tx: any, details: any) {
  // Function implementation
}
