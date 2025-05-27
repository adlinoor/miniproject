import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { z } from "zod";
import * as voucherService from "../services/promotion.service";

// === Schema Validation ===
export const createEventSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid start date",
  }),
  endDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid end date" }),
  price: z.number().min(0),
  seats: z.number().min(1),
  eventType: z.enum(["PAID", "FREE"]),
  category: z.string().min(1),
  city: z.string().min(1),
  location: z.string().min(1),
  ticketTypes: z
    .array(
      z.object({
        type: z.string(),
        price: z.number().min(0),
        quantity: z.number().min(1),
      })
    )
    .min(1),
  imageUrls: z.array(z.string().url()).optional(), // hasil upload middleware
});
export const updateEventSchema = createEventSchema.partial();

export const createEvent = async (req: Request, res: Response) => {
  try {
    // ticketTypes bisa string (dari FormData) atau array
    let ticketTypes = req.body.ticketTypes;
    if (typeof ticketTypes === "string") ticketTypes = JSON.parse(ticketTypes);

    const dataToValidate = {
      ...req.body,
      ticketTypes,
      price: Number(req.body.price),
      seats: Number(req.body.seats),
    };

    const validated = createEventSchema.parse(dataToValidate);

    const organizerId = req.user?.id;
    if (!organizerId)
      return res.status(401).json({ status: "error", message: "Unauthorized" });

    const event = await prisma.$transaction(async (tx) => {
      const created = await tx.event.create({
        data: {
          title: validated.name,
          description: validated.description,
          startDate: new Date(validated.startDate),
          endDate: new Date(validated.endDate),
          price: validated.eventType === "FREE" ? 0 : validated.price,
          availableSeats: validated.seats,
          category: validated.category,
          location: validated.location,
          organizerId,
        },
      });

      // Save images
      if (validated.imageUrls?.length) {
        await tx.image.createMany({
          data: validated.imageUrls.map((url) => ({
            url,
            eventId: created.id,
          })),
        });
      }

      // Save tickets
      if (validated.ticketTypes.length) {
        await tx.ticket.createMany({
          data: validated.ticketTypes.map((t) => ({
            eventId: created.id,
            type: t.type,
            price: t.price,
            quantity: t.quantity,
          })),
        });
      }

      return created;
    });

    res.status(201).json({
      status: "success",
      message: "Event created",
      data: event,
    });
  } catch (error: any) {
    const status = error.name === "ZodError" ? 400 : 500;
    res.status(status).json({ status: "error", message: error.message });
  }
};

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

    const where: Prisma.EventWhereInput = {};

    if (typeof search === "string") {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (typeof category === "string") where.category = category;
    if (typeof location === "string") where.location = location;

    if (typeof minPrice === "string" || typeof maxPrice === "string") {
      where.price = {};
      if (typeof minPrice === "string") where.price.gte = Number(minPrice);
      if (typeof maxPrice === "string") where.price.lte = Number(maxPrice);
    }

    if (typeof startDate === "string" || typeof endDate === "string") {
      where.startDate = {};
      if (startDate && !isNaN(Date.parse(startDate as string))) {
        where.startDate.gte = new Date(startDate as string);
      }
      if (endDate && !isNaN(Date.parse(endDate as string))) {
        where.startDate.lte = new Date(endDate as string);
      }
    }

    const validSortOrder: "asc" | "desc" =
      sortOrder === "desc" ? "desc" : "asc";

    const orderBy: Prisma.EventOrderByWithRelationInput =
      typeof sortBy === "string"
        ? { [sortBy]: validSortOrder }
        : { startDate: "asc" };

    const pageNumber = Math.max(1, parseInt(page as string, 10));
    const pageSize = Math.max(1, parseInt(limit as string, 10));
    const skip = (pageNumber - 1) * pageSize;

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          organizer: {
            select: { id: true, first_name: true, last_name: true },
          },
          tickets: true,
          images: true,
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

export const getEventById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: { select: { id: true, first_name: true, last_name: true } },
        tickets: true,
        images: true,
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

    const dataWithOrganizerId = { ...event, organizerId: event.organizer.id };

    res.status(200).json({
      status: "success",
      message: "Event detail",
      data: dataWithOrganizerId,
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const updateEvent = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const organizerId = req.user?.id;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event)
      return res
        .status(404)
        .json({ status: "error", message: "Event not found" });
    if (event.organizerId !== organizerId)
      return res.status(403).json({ status: "error", message: "Forbidden" });

    // Parse ticketTypes jika FormData
    let ticketTypes = req.body.ticketTypes;
    if (typeof ticketTypes === "string") ticketTypes = JSON.parse(ticketTypes);

    const dataToValidate = {
      ...req.body,
      ticketTypes,
      price: Number(req.body.price),
      seats: Number(req.body.seats),
    };

    const validated = updateEventSchema.parse(dataToValidate);

    // Update event data
    const updateData: any = {
      title: validated.name,
      description: validated.description,
      startDate: validated.startDate
        ? new Date(validated.startDate)
        : undefined,
      endDate: validated.endDate ? new Date(validated.endDate) : undefined,
      price: validated.eventType === "FREE" ? 0 : validated.price,
      availableSeats: validated.seats,
      category: validated.category,
      location: validated.location,
    };

    const updated = await prisma.$transaction(async (tx) => {
      const eventUpdate = await tx.event.update({
        where: { id },
        data: updateData,
      });

      // Handle image update
      if (validated.imageUrls?.length) {
        await tx.image.deleteMany({ where: { eventId: id } }); // Remove old
        await tx.image.createMany({
          data: validated.imageUrls.map((url) => ({
            url,
            eventId: id,
          })),
        });
      }

      // Handle ticket update (replace all for simplicity)
      if (validated.ticketTypes?.length) {
        await tx.ticket.deleteMany({ where: { eventId: id } });
        await tx.ticket.createMany({
          data: validated.ticketTypes.map((t) => ({
            eventId: id,
            type: t.type,
            price: t.price,
            quantity: t.quantity,
          })),
        });
      }

      return eventUpdate;
    });

    res.status(200).json({
      status: "success",
      message: "Event updated",
      data: updated,
    });
  } catch (error: any) {
    const status = error.name === "ZodError" ? 400 : 500;
    res.status(status).json({ status: "error", message: error.message });
  }
};

export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user?.id;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event)
      return res
        .status(404)
        .json({ status: "error", message: "Event not found" });
    if (event.organizerId !== userId)
      return res.status(403).json({ status: "error", message: "Forbidden" });

    await prisma.event.delete({ where: { id } });

    res.status(200).json({ status: "success", message: "Event deleted" });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const getEventsByOrganizer = async (req: Request, res: Response) => {
  try {
    const organizerId = req.user?.id;
    const events = await prisma.event.findMany({
      where: { organizerId },
      orderBy: { createdAt: "desc" },
      include: { images: true, tickets: true },
    });

    res.status(200).json({ status: "success", data: events });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const getEventAttendees = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const organizerId = req.user?.id;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event || event.organizerId !== organizerId)
      return res.status(403).json({ status: "error", message: "Unauthorized" });

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

// === Vouchers ===
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
