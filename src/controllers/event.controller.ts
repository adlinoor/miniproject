import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { number, z } from "zod";
import * as voucherService from "../services/promotion.service";

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
    .refine((date) => !date || !isNaN(Date.parse(date)), {
      message: "Invalid start date",
    }),
  endDate: z
    .string()
    .optional()
    .refine((date) => !date || !isNaN(Date.parse(date)), {
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
      ticketTypes,
    } = req.body;

    const organizerId = req.user?.id;

    if (!organizerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const event = await prisma.$transaction(async (tx) => {
      const newEvent = await tx.event.create({
        data: {
          title,
          description,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          location,
          category,
          price,
          availableSeats: Number(availableSeats),
          organizerId,
        },
      });

      if (ticketTypes && ticketTypes.length > 0) {
        await tx.ticket.createMany({
          data: ticketTypes.map((ticket: any) => ({
            eventId: newEvent.id,
            ...ticket,
          })),
        });
      }

      return newEvent;
    });

    res.status(201).json(event);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Server error" });
  }
};

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

    // 🔍 Search
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } },
      ];
    }

    // 🔖 Filter
    if (category) where.category = { equals: category as string };
    if (location) where.location = { equals: location as string };

    // 💰 Price Range
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseInt(minPrice as string, 10);
      if (maxPrice) where.price.lte = parseInt(maxPrice as string, 10);
    }

    // 📆 Date Range
    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = new Date(startDate as string);
      if (endDate) where.startDate.lte = new Date(endDate as string);
    }

    // ↕ Sort
    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy as string] = sortOrder as "asc" | "desc";
    } else {
      orderBy.startDate = "asc";
    }

    // 📄 Pagination
    const pageNumber = Math.max(1, parseInt(page as string, 10) || 1);
    const pageSize = Math.max(1, parseInt(limit as string, 10) || 10);
    const skip = (pageNumber - 1) * pageSize;

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          organizer: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
          tickets: true,
          promotions: {
            where: {
              startDate: { lte: new Date() },
              endDate: { gte: new Date() },
            },
          },
        },
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.event.count({ where }),
    ]);

    // 🛑 Handling No Results
    if (events.length === 0) {
      return res.status(200).json({
        data: [],
        meta: {
          total: 0,
          page: pageNumber,
          limit: pageSize,
          totalPages: 0,
        },
        message: "No events found matching your criteria.",
      });
    }

    // ✅ Response
    res.json({
      data: events,
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

export const getEventById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        organizer: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
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

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const eventId = parseInt(id, 10);
    const userId = req.user?.id;

    const existing = await prisma.event.findUnique({ where: { id: eventId } });
    if (!existing) return res.status(404).json({ message: "Event not found" });

    if (existing.organizerId !== userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to modify this event" });
    }

    const updateData = req.body;

    if (updateData.startDate)
      updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

    const event = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
    });

    res.json(event);
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const eventId = parseInt(id, 10);
    const userId = req.user?.id;

    const existing = await prisma.event.findUnique({ where: { id: eventId } });
    if (!existing) return res.status(404).json({ message: "Event not found" });

    if (existing.organizerId !== userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this event" });
    }

    await prisma.event.delete({
      where: { id: eventId },
    });

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const createVoucher = async (req: Request, res: Response) => {
  try {
    const { code, discount, startDate, endDate } = req.body;
    const eventId = req.params.eventId;

    const voucher = await voucherService.createVoucher({
      code,
      discount: Number(discount),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      eventId,
    });

    res.status(201).json(voucher);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getVouchersByEvent = async (req: Request, res: Response) => {
  try {
    const vouchers = await voucherService.getVouchersByEvent(
      req.params.eventId
    );
    res.json(vouchers);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getEventAttendees = async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const organizerId = req.user?.id;

    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event || event.organizerId !== organizerId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const attendees = await prisma.transaction.findMany({
      where: {
        eventId,
        status: { in: ["DONE", "WAITING_FOR_ADMIN_CONFIRMATION"] },
      },
      include: {
        user: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
        details: { include: { ticket: true } },
      },
    });

    const formatted = attendees.map((tx) => ({
      user: tx.user,
      ticketTypes: tx.details.map((d) => ({
        type: d.ticket.type,
        quantity: d.quantity,
        price: d.ticket.price,
      })),
      totalQuantity: tx.quantity,
      totalPaid: tx.totalPrice,
      status: tx.status,
      paymentProof: tx.paymentProof,
    }));

    res.status(200).json({ attendees: formatted });
  } catch (error) {
    console.error("Error fetching attendees:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getEventsByOrganizer = async (req: Request, res: Response) => {
  try {
    const organizerId = req.user?.id;

    const events = await prisma.event.findMany({
      where: { organizerId },
      orderBy: { createdAt: "desc" },
    });

    res.json(events);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch your events" });
  }
};
