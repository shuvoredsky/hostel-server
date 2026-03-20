export interface ICreateBookingPayload {
  listingId: string;
  message?: string;
  moveInDate?: string;
}

export interface IUpdateBookingStatusPayload {
  status: 'ACCEPTED' | 'REJECTED';
}