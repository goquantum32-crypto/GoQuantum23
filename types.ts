
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
  // Novos campos para inteligência de rotas
  availableDates?: string[]; // Datas em formato YYYY-MM-DD
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
  seats: number;
  price: number;
  status: 'PENDING' | 'ASSIGNED' | 'PAID' | 'COMPLETED' | 'CANCELLED';
  driverId?: string;
  paymentMethod: 'MPESA' | 'EMOLA';
  paymentConfirmed: boolean;
}

export type PackageSize = 'SMALL' | 'MEDIUM' | 'LARGE';

export interface PackageRequest {
  id: string;
  passengerId: string;
  senderName: string;
  senderPhone: string;
  origin: string;
  destination: string;
  size: PackageSize;
  type: string;
  description: string;
  price: number;
  status: 'REQUESTED' | 'NEGOTIATING' | 'QUOTED' | 'PAID' | 'IN_TRANSIT' | 'DELIVERED';
  driverId?: string;
}
