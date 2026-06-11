import { type } from "arktype";

export const BookingSlotSqlSchema = type({
  id: "number",
  slots: "number",
  date: "string",
  booking_snapshot_id: "number",
});

export const BookingSlotSchema = type({
  id: "number",
  timeSlots: "number",
  date: "string",
  bookingSnapshotId: "number",
});

export const BookingSlotCreateSchema = type({
  date: "string",
  timeSlots: "number",
});

export const BookingSnapshotSqlSchema = type({
  id: "number",
  hash: "string",
  raw: "string",
  created_at: "string",
});

export const BookingSnapshotSchema = type({
  id: "number",
  hash: "string",
  raw: "string",
  createdAt: "string",
  timeSlots: BookingSlotSchema.array(),
});

export const BookingSnapshotCreateSchema = type({
  hash: "string",
  raw: "string",
  timeSlots: BookingSlotCreateSchema.array(),
});

export const BookingSlotsSchema = BookingSlotSchema.array();

export type BookingSlot = typeof BookingSlotSchema.infer;
export type BookingSlotCreate = typeof BookingSlotCreateSchema.infer;
export type BookingsSlot = typeof BookingSlotsSchema.infer;
export type BookingSnapshot = typeof BookingSnapshotSchema.infer;
export type BookingSnapshotCreate = typeof BookingSnapshotCreateSchema.infer;
