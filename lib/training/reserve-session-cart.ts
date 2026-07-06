import { db } from "@/lib/db";

export type ReserveTrainingSessionResult = {
  bookingId: string;
  cartTrainingItemId: string;
};

export async function reserveTrainingSessionForCart(
  userId: string,
  sessionId: string
): Promise<ReserveTrainingSessionResult> {
  const trainingSession = await db.trainingSession.findUnique({
    where: { id: sessionId },
    include: {
      program: true,
      _count: {
        select: {
          bookings: true,
        },
      },
    },
  });

  if (!trainingSession) {
    throw new Error("Training session not found");
  }

  if (!trainingSession.isActive || !trainingSession.program.isActive) {
    throw new Error("Training session is not active");
  }

  if (trainingSession.startDate < new Date()) {
    throw new Error("Cannot book a session that has already started");
  }

  if (trainingSession._count.bookings >= trainingSession.maxParticipants) {
    const existingBooking = await db.trainingBooking.findFirst({
      where: { userId, sessionId },
    });
    if (!existingBooking) {
      throw new Error("Training session is full");
    }
  }

  let booking = await db.trainingBooking.findFirst({
    where: { userId, sessionId },
  });

  if (!booking) {
    booking = await db.trainingBooking.create({
      data: {
        userId,
        programId: trainingSession.programId,
        sessionId,
        status: "PENDING",
      },
    });
  } else if (booking.status === "CANCELLED") {
    booking = await db.trainingBooking.update({
      where: { id: booking.id },
      data: { status: "PENDING" },
    });
  }

  let cart = await db.cart.findUnique({
    where: { userId },
  });

  if (!cart) {
    cart = await db.cart.create({
      data: { userId },
    });
  }

  const cartTrainingItem = await db.cartTrainingItem.upsert({
    where: {
      cartId_sessionId: {
        cartId: cart.id,
        sessionId,
      },
    },
    create: {
      cartId: cart.id,
      sessionId,
      bookingId: booking.id,
    },
    update: {
      bookingId: booking.id,
    },
  });

  return {
    bookingId: booking.id,
    cartTrainingItemId: cartTrainingItem.id,
  };
}
