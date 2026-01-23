
export enum UserRole {
  PASSENGER = 'PASSENGER',
  DRIVER = 'DRIVER',
  ADMIN = 'ADMIN',
  PACKAGE_CLIENT = 'PACKAGE_CLIENT'
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  password?: string;
  vehicleNumber?: string;
  vehicleColor?: string;
  vehicleModel?: string;
  availableSeats?: number;
  photoUrl?: string;
  licenseUrl?: string; 
  isApproved?: boolean;
  isPriority?: boolean; // Novo campo para motoristas prioritários
  availableDates?: string[]; 
  // Rota específica por dia agora inclui horário
  dayRoutes?: Record<string, { start: string, end: string, time: string }>; 
  routeStart?: string;
  routeEnd?: string;
}

export interface TripRequest {
  id: string;
  passengerId: string;
  passengerName: string;
  passengerPhone: string;
  origin: string;
  destination: string;
  date: string;
  time: string; // Novo campo de horário
  seats: number;
  price: number;
  status: 'PENDING' | 'ASSIGNED' | 'PAID' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'POSTPONED';
  driverId?: string;
  paymentMethod: 'MPESA' | 'EMOLA';
  paymentConfirmed: boolean;
  feedback?: {
    rating: number;
    comment: string;
    tags?: string[];
  };
}

export type PackageSize = 'SMALL' | 'MEDIUM' | 'LARGE';

export interface PackageRequest {
  id: string;
  passengerId: string;
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  origin: string;
  destination: string;
  size: PackageSize;
  type: string;
  description: string;
  price: number;
  status: 'REQUESTED' | 'NEGOTIATING' | 'QUOTED' | 'PAYMENT_PENDING' | 'PAID' | 'IN_TRANSIT' | 'DELIVERED' | 'REJECTED';
  driverId?: string;
  feedback?: {
    rating: number;
    comment: string;
    tags?: string[];
  };
}
