import prisma from "../lib/prisma";

// ✅ Interface agar lebih mudah digunakan dan autocomplete-friendly
export interface CreateEventParams {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: string;
  category: string;
  price: number;
  availableSeats: number;
  organizerId: number;
}

export const createEvent = async (params: CreateEventParams) => {
  return await prisma.event.create({
    data: {
      ...params,
    },
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

export const getOrganizerStats = async (organizerId: number) => {
  return await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('month', created_at) AS month,
      COUNT(*) AS event_count,
      SUM(available_seats) AS total_seats
    FROM events
    WHERE organizer_id = ${organizerId}
    GROUP BY month
  `;
};
