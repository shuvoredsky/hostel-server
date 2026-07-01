export interface ISubmitStudentVerificationPayload {
  universityName: string;
  department: string;
  session: string;
}

export interface IReviewVerificationPayload {
  rejectionReason?: string;
}