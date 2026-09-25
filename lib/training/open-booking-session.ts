import { db } from "@/lib/db";

const OPEN_BOOKING_MAX_PARTICIPANTS = 9999;
const DEFAULT_START_HOUR = 9;

function parseDateKey(dateKey: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

function startOfLocalDay(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function endOfLocalDay(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day, 23, 59, 59, 999);
}

function isPastLocalDate(year: number, month: number, day: number): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return startOfLocalDay(year, month, day) < today;
}

/**
 * Find or create an ONLINE session for an open-booking program on the given local calendar day (YYYY-MM-DD).
 */
export async function findOrCreateOpenBookingSession(programId: string, dateKey: string) {
  const parsed = parseDateKey(dateKey);
  if (!parsed) {
    throw new Error("Invalid date. Use YYYY-MM-DD.");
  }

  if (isPastLocalDate(parsed.year, parsed.month, parsed.day)) {
    throw new Error("Cannot book a date in the past");
  }

  const program = await db.trainingProgram.findUnique({
    where: { id: programId },
  });

  if (!program || !program.isActive) {
    throw new Error("Training program not found");
  }

  if (!program.openBooking) {
    throw new Error("This program does not allow open date booking");
  }

  const dayStart = startOfLocalDay(parsed.year, parsed.month, parsed.day);
  const dayEnd = endOfLocalDay(parsed.year, parsed.month, parsed.day);

  const existing = await db.trainingSession.findFirst({
    where: {
      programId,
      format: "ONLINE",
      isActive: true,
      startDate: {
        gte: dayStart,
        lte: dayEnd,
      },
    },
    orderBy: { startDate: "asc" },
  });

  if (existing) {
    return existing;
  }

  const hours = Math.max(1, program.totalHours || 8);
  const startDate = new Date(
    parsed.year,
    parsed.month - 1,
    parsed.day,
    DEFAULT_START_HOUR,
    0,
    0,
    0
  );
  const endDate = new Date(startDate.getTime() + hours * 60 * 60 * 1000);

  return db.trainingSession.create({
    data: {
      programId,
      startDate,
      endDate,
      location: "Online",
      format: "ONLINE",
      maxParticipants: OPEN_BOOKING_MAX_PARTICIPANTS,
      isActive: true,
    },
  });
}
