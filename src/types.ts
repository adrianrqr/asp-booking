import { type } from "arktype";

export const BookingSlotSchema = type({
  date: "string",
  timeSlots: "number",
  dateAsDateTime: "string",
});

export const BookingSlotsSchema = BookingSlotSchema.array();

export type BookingSlot = typeof BookingSlotSchema.infer;
export type BookingSlots = typeof BookingSlotsSchema.infer;

export type BookingCheck = {
  slots: BookingSlots;
  changed: boolean;
  hash: string;
};
