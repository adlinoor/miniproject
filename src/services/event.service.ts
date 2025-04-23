import { prisma } from "../app";
import { z } from "zod";
import { uploadToCloudinary } from "./cloudinary.service";

// Zod validation schemas
export const createEventSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  location: z.string().min(3),
  category: z.string().min(3),
  price: z.number().min(0),
  availableSeats: z.number().min(1),
  isFree: z.boolean(),
  ticketTypes: z
    .array(
      z.object({
        type: z.string().min(1),
        price: z.number().min(0),
        quantity: z.number().min(1),
      })
    )
    .optional(),
});

export const createEvent = async (
  data: z.infer<typeof createEventSchema>,
  organizerId: string,
  images: Express.Multer.File[]
) => {
  const { ticketTypes, ...eventData } = data;

  // Upload images to Cloudinary
  const imageUrls = await Promise.all(
    images.map((image) => uploadToCloudinary(image))
  );

  // Create event with transaction to ensure data consistency
  const event = await prisma.$transaction(async (prisma) => {
    const createdEvent = await prisma.event.create({
      data: {
        ...eventData,
        organizerId,
        images: imageUrls,
      },
    });

    if (ticketTypes && ticketTypes.length > 0) {
      await prisma.ticket.createMany({
        data: ticketTypes.map((ticket) => ({
          eventId: createdEvent.id,
          ...ticket,
        })),
      });
    }

    return createdEvent;
  });

  return event;
};

export const getEvents = async (filters: {
  category?: string;
  location?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  dateFrom?: string;
  dateTo?: string;
}) => {
  const { category, location, search, minPrice, maxPrice, dateFrom, dateTo } =
    filters;

  const where: any = {
    startDate: { gte: new Date() }, // Only upcoming events
  };

  if (category) where.category = { contains: category, mode: "insensitive" };
  if (location) where.location = { contains: location, mode: "insensitive" };
  if (minPrice !== undefined) where.price = { gte: minPrice };
  if (maxPrice !== undefined) where.price = { ...where.price, lte: maxPrice };
  if (dateFrom)
    where.startDate = { ...where.startDate, gte: new Date(dateFrom) };
  if (dateTo) where.startDate = { ...where.startDate, lte: new Date(dateTo) };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
      { category: { contains: search, mode: "insensitive" } },
    ];
  }

  const events = await prisma.event.findMany({
    where,
    include: {
      organizer: {
        select: {
          id: true,
          name: true,
          profilePicture: true,
        },
      },
      tickets: true,
      promotions: {
        where: {
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
          OR: [{ maxUses: null }, { maxUses: { gt: { $field: "uses" } } }],
        },
      },
      _count: {
        select: {
          reviews: true,
        },
      },
    },
    orderBy: {
      startDate: "asc",
    },
  });

  return events;
};

export const getEventById = async (id: string) => {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      organizer: {
        select: {
          id: true,
          name: true,
          profilePicture: true,
        },
      },
      tickets: true,
      promotions: {
        where: {
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
          OR: [{ maxUses: null }, { maxUses: { gt: { $field: "uses" } } }],
        },
      },
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profilePicture: true,
            },
          },
        },
      },
    },
  });

  if (!event) {
    throw new Error("Event not found");
  }

  // Calculate average rating
  const avgRating =
    event.reviews.reduce((acc, review) => acc + review.rating, 0) /
      event.reviews.length || 0;

  return {
    ...event,
    avgRating,
  };
};
