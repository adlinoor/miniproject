import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { TransactionStatus } from "@prisma/client";

export const createReview = async (req: Request, res: Response) => {
  try {
    // 1. Validate required fields
    const { eventId, rating, comment } = req.body;

    if (!eventId || !rating) {
      return res.status(400).json({
        message: "Event ID and rating are required",
      });
    }

    // 2. Check authentication and get user ID
    if (!req.user.id) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }
    const userId = Number(req.user.id);

    // 3. Validate rating range (1-5)
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5",
      });
    }

    // 4. Check if user attended the event (with proper status)
    const hasAttended = await prisma.transaction.findFirst({
      where: {
        userId,
        eventId,
        status: TransactionStatus.DONE, // Using enum for type safety
        event: {
          endDate: { lt: new Date() }, // Event must have ended
        },
      },
      select: { id: true }, // Only need to know if exists, no need for full data
    });

    if (!hasAttended) {
      return res.status(403).json({
        message: "You can only review events you have attended after they end",
      });
    }

    // 5. Check for existing review
    const existingReview = await prisma.review.findFirst({
      where: {
        userId,
        eventId,
      },
      select: { id: true }, // Only need to know if exists
    });

    if (existingReview) {
      return res.status(409).json({
        message: "You have already reviewed this event",
      });
    }

    // 6. Create the review
    const review = await prisma.review.create({
      data: {
        eventId,
        userId,
        rating,
        comment: comment || null, // Make comment optional
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
          select: {
            title: true,
          },
        },
      },
    });

    // 7. Return successful response
    return res.status(201).json({
      message: "Review created successfully",
      review,
    });
  } catch (error) {
    console.error("Error creating review:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// Additional review controller methods
export const getEventReviews = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({
        message: "Event ID is required",
      });
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
