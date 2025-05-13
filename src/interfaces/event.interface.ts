export interface IEvent {
  id: number;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: string;
  category: string;
  price: number;
  availableSeats: number;
  organizerId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVoucherInput {
  code: string;
  discount: number;
  startDate: Date;
  endDate: Date;
  eventId: string;
}
