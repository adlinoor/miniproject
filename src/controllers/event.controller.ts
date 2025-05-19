import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";
import * as voucherService from "../services/promotion.service";

// === SCHEMA VALIDATION ===
export const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  startDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid start date",
    }),
  endDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid end date" }),
  location: z.string().min(1),
  category: z.string().min(1),
  price: z.number().min(0),
  availableSeats: z.number().min(1),
  imageUrl: z.string().url().optional(),
  ticketTypes: z
    .array(
      z.object({
        type: z.string(),
        price: z.number().min(0),
        quota: z.number().min(1),
        quantity: z.number().min(1).optional(), // fallback ke quota
      })
    )
    .optional(),
});

export const updateEventSchema = createEventSchema.partial();

// === CREATE EVENT ===
export const createEvent = async (req: Request, res: Response) => {
  try {
    const validated = createEventSchema.parse(req.body);
    const organizerId = req.user?.id;
    if (!organizerId)
      return res.status(401).json({ status: "error", message: "Unauthorized" });

    const event = await prisma.$transaction(async (tx) => {
      const created = await tx.event.create({
        data: {
          ...validated,
          startDate: new Date(validated.startDate),
          endDate: new Date(validated.endDate),
          organizerId,
        },
      });

      if (validated.imageUrl) {
        await tx.image.create({
          data: { url: validated.imageUrl, eventId: created.id },
        });
      }

      if (validated.ticketTypes?.length) {
        await tx.ticket.createMany({
          data: validated.ticketTypes.map((ticket) => ({
            eventId: created.id,
            type: ticket.type,
            price: ticket.price,
            quota: ticket.quota,
            quantity: ticket.quantity ?? ticket.quota, // fallback
          })),
        });
      }

      return created;
    });

    res
      .status(201)
      .json({ status: "success", message: "Event created", data: event });
  } catch (error: any) {
    const status = error.name === "ZodError" ? 400 : 500;
    res.status(status).json({ status: "error", message: error.message });
  }
};

// === GET EVENTS (FILTER + PAGINASI) ===
export const getEvents = async (req: Request, res: Response) => {
  try {
    const {
      search,
      category,
      location,
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
    if (category) where.category = category;
    if (location) where.location = location;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }
    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = new Date(startDate as string);
      if (endDate) where.startDate.lte = new Date(endDate as string);
    }

    const orderBy: any =
      typeof sortBy === "string" &&
      (sortOrder === "asc" || sortOrder === "desc")
        ? { [sortBy]: sortOrder }
        : { startDate: "asc" as const };

    const pageNumber = Math.max(1, parseInt(page as string));
    const pageSize = Math.max(1, parseInt(limit as string));
    const skip = (pageNumber - 1) * pageSize;

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          organizer: {
            select: { id: true, first_name: true, last_name: true },
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

    res.status(200).json({
      status: "success",
      message: "Events retrieved",
      data: events,
      meta: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// === GET EVENT BY ID ===
export const getEventById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: { select: { id: true, first_name: true, last_name: true } },
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

    if (!event)
      return res
        .status(404)
        .json({ status: "error", message: "Event not found" });
    res
      .status(200)
      .json({ status: "success", message: "Event detail", data: event });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// === UPDATE EVENT ===
export const updateEvent = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const organizerId = req.user?.id;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event)
      return res
        .status(404)
        .json({ status: "error", message: "Event not found" });
    if (event.organizerId !== organizerId) {
      return res.status(403).json({ status: "error", message: "Forbidden" });
    }

    const validated = updateEventSchema.parse(req.body);
    const updateData: any = {
      ...validated,
      ...(validated.startDate && { startDate: new Date(validated.startDate) }),
      ...(validated.endDate && { endDate: new Date(validated.endDate) }),
    };

    const updated = await prisma.event.update({
      where: { id },
      data: updateData,
    });
    res
      .status(200)
      .json({ status: "success", message: "Event updated", data: updated });
  } catch (error: any) {
    const status = error.name === "ZodError" ? 400 : 500;
    res.status(status).json({ status: "error", message: error.message });
  }
};

// === DELETE EVENT ===
export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user?.id;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event)
      return res
        .status(404)
        .json({ status: "error", message: "Event not found" });
    if (event.organizerId !== userId) {
      return res.status(403).json({ status: "error", message: "Forbidden" });
    }

    await prisma.event.delete({ where: { id } });
    res.status(200).json({ status: "success", message: "Event deleted" });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// === GET EVENTS BY ORGANIZER ===
export const getEventsByOrganizer = async (req: Request, res: Response) => {
  try {
    const organizerId = req.user?.id;

    const events = await prisma.event.findMany({
      where: { organizerId },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ status: "success", data: events });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// === GET ATTENDEES BY EVENT ===
export const getEventAttendees = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const organizerId = req.user?.id;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event || event.organizerId !== organizerId) {
      return res.status(403).json({ status: "error", message: "Unauthorized" });
    }

    const attendees = await prisma.transaction.findMany({
      where: {
        eventId: id,
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

    res.status(200).json({ status: "success", data: formatted });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// === CREATE VOUCHER ===
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

    res.status(201).json({ status: "success", data: voucher });
  } catch (error: any) {
    res.status(400).json({ status: "error", message: error.message });
  }
};

// === GET VOUCHERS BY EVENT ===
export const getVouchersByEvent = async (req: Request, res: Response) => {
  try {
    const vouchers = await voucherService.getVouchersByEvent(
      req.params.eventId
    );
    res.status(200).json({ status: "success", data: vouchers });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
