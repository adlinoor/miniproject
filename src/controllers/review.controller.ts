import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { TransactionStatus } from "@prisma/client";

/**
 * Create a new review for an event by a customer.
 */
export const createReview = async (req: Request, res: Response) => {
  try {
    const { eventId, rating, comment } = req.body;

    // 1. Validate required fields
    if (!eventId || !rating) {
      return res
        .status(400)
        .json({ message: "Event ID and rating are required" });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }

    // 2. Ensure user has completed a transaction and the event has ended
    const hasAttended = await prisma.transaction.findFirst({
      where: {
        userId,
        eventId: Number(eventId),
        status: TransactionStatus.DONE,
        event: {
          endDate: { lt: new Date() },
        },
      },
      select: { id: true },
    });

    if (!hasAttended) {
      return res
        .status(403)
        .json({
          message: "You can only review events you've attended after they end",
        });
    }

    // 3. Check if review already exists
    const existingReview = await prisma.review.findFirst({
      where: {
        userId,
        eventId: Number(eventId),
      },
      select: { id: true },
    });

    if (existingReview) {
      return res
        .status(409)
        .json({ message: "You have already reviewed this event" });
    }

    // 4. Create the review
    const review = await prisma.review.create({
      data: {
        userId,
        eventId: Number(eventId),
        rating: Number(rating),
        comment: comment || null,
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            profilePicture: true,
          },
        },
        event: {
          select: { title: true },
        },
      },
    });

    return res.status(201).json({
      message: "Review created successfully",
      review,
    });
  } catch (error) {
    console.error("❌ Error creating review:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * Get all reviews for a specific event.
 */
export const getEventReviews = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({ message: "Event ID is required" });
    }

    const reviews = await prisma.review.findMany({
      where: { eventId: Number(eventId) },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            profilePicture: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(reviews);
  } catch (error) {
    console.error("❌ Error fetching reviews:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
