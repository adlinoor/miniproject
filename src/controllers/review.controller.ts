import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { TransactionStatus } from "@prisma/client";

// Buat ulasan baru
export const createReview = async (req: Request, res: Response) => {
  try {
    const { eventId, rating, comment } = req.body;
    const userId = req.user?.id;

    // Validasi login
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Validasi input
    if (!eventId || rating == null) {
      return res
        .status(400)
        .json({ message: "Event ID and rating are required" });
    }

    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }

    // Cek apakah user pernah ikut event dan status transaksi selesai
    const hasAttended = await prisma.transaction.findFirst({
      where: {
        userId,
        eventId: Number(eventId),
        status: TransactionStatus.DONE,
        event: {
          endDate: { lt: new Date() }, // Event sudah berakhir
        },
      },
      select: { id: true },
    });

    if (!hasAttended) {
      return res.status(403).json({
        message:
          "Kamu hanya bisa memberi ulasan setelah mengikuti dan menyelesaikan event.",
      });
    }

    // Cek apakah user sudah review event ini
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
        .json({ message: "Kamu sudah memberikan ulasan untuk event ini." });
    }

    // Simpan review
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
      message: "Review berhasil dikirim",
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

// Ambil semua review untuk 1 event
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
