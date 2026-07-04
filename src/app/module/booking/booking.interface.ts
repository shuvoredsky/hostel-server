export interface ICreateBookingPayload {
  listingId: string;
  message?: string;
  moveInDate?: string;
  paymentPlan?: 'FULL' | 'HALF_MONTHLY';
}

export interface IUpdateBookingStatusPayload {
  status: 'ACCEPTED' | 'REJECTED';
}