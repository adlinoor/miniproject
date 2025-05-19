import prisma from "../lib/prisma";

/**
 * Ambil daftar event berdasarkan filter ringan (jika dibutuhkan).
 */
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

/**
 * Ambil detail satu event by ID lengkap dengan tiket, promo, dan review.
 */
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

/**
 * Ambil semua event milik organizer tertentu.
 */
export const getEventsByOrganizer = async (organizerId: number) => {
  return await prisma.event.findMany({
    where: { organizerId },
    orderBy: { createdAt: "desc" },
  });
};

/**
 * Ambil peserta dari event tertentu (untuk dashboard organizer).
 */
export const getAttendeesByEvent = async (eventId: number) => {
  return await prisma.transaction.findMany({
    where: {
      eventId,
      status: { in: ["DONE", "WAITING_FOR_ADMIN_CONFIRMATION"] },
    },
    include: {
      user: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
      details: {
        include: { ticket: true },
      },
    },
  });
};

/**
 * Ambil semua voucher milik suatu event.
 */
export const getVouchersByEvent = async (eventId: string) => {
  return await prisma.promotion.findMany({
    where: { eventId: parseInt(eventId) },
  });
};
