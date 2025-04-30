import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";

/**
 * Fetch all events with optional filters.
 */
export const getEvents = async (req: Request, res: Response) => {
  try {
    const {
      category,
      location,
      search,
      minPrice,
      maxPrice,
      startDate,
      endDate,
      sortBy,
      sortOrder = "asc",
      page = "1",
      limit = "10",
    } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } },
      ];
    }

    if (category) where.category = { equals: category as string };
    if (location) where.location = { equals: location as string };

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseInt(minPrice as string, 10);
      if (maxPrice) where.price.lte = parseInt(maxPrice as string, 10);
    }

    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = new Date(startDate as string);
      if (endDate) where.startDate.lte = new Date(endDate as string);
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy as string] = sortOrder as "asc" | "desc";
    } else {
      orderBy.startDate = "asc";
    }

    const pageNumber = parseInt(page as string, 10);
    const pageSize = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * pageSize;

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          images: true,
          organizer: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
          _count: {
            select: {
              reviews: true,
            },
          },
        },
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.event.count({ where }),
    ]);

    const eventsWithRatings = await Promise.all(
      events.map(async (event) => {
        const avgRating = await prisma.review.aggregate({
          where: { eventId: event.id },
          _avg: { rating: true },
        });
        return {
          ...event,
          averageRating: avgRating._avg.rating || 0,
        };
      })
    );

    res.json({
      data: eventsWithRatings,
      meta: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Fetch a specific event by ID.
 */
export const getEventById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        images: true,
        organizer: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(event);
  } catch (error) {
    console.error("Error fetching event by ID:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Create a new event.
 */
export const createEvent = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      startDate,
      endDate,
      location,
      category,
      price,
      availableSeats,
    } = req.body;
    const organizerId = req.user?.id;

    if (!organizerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate), // Ensure this is included
        location,
        category,
        price,
        availableSeats: parseInt(availableSeats, 10), // Ensure this is included
        organizerId: parseInt(organizerId, 10),
      },
    });

    res.status(201).json(event);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update an existing event.
 */
export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, startDate, location, category, price } =
      req.body;

    const event = await prisma.event.update({
      where: { id: parseInt(id, 10) },
      data: {
        title,
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        location,
        category,
        price,
      },
    });

    res.json(event);
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Delete an event.
 */
export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.event.delete({
      where: { id: parseInt(id, 10) },
    });

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const createEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid start date",
  }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid end date",
  }),
  location: z.string().min(1, "Location is required"),
  category: z.string().min(1, "Category is required"),
  price: z.number().min(0, "Price must be a positive number"),
  availableSeats: z.number().min(1, "Available seats must be at least 1"),
});

export const updateEventSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  startDate: z
    .string()
    .optional()
    .refine((date) => typeof date === "string" && !isNaN(Date.parse(date)), {
      message: "Invalid start date",
    }),
  endDate: z
    .string()
    .optional()
    .refine((date) => typeof date === "string" && !isNaN(Date.parse(date)), {
      message: "Invalid end date",
    }),
  location: z.string().optional(),
  category: z.string().optional(),
  price: z.number().min(0, "Price must be a positive number").optional(),
  availableSeats: z
    .number()
    .min(1, "Available seats must be at least 1")
    .optional(),
});
