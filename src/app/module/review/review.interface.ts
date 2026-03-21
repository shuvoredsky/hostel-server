export interface ICreateReviewPayload {
  listingId: string;
  rating: number;
  comment?: string;
}