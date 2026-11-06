// features/rides/types.ts
// Tipos para el módulo de viajes (taxi, mototaxi, carro particular).
// Solo este módulo importa desde aquí — no exponer hacia entities/.

// ─── Enums de dominio ────────────────────────────────────────────────────────

export type VehicleType = 'carro_particular' | 'taxi_linea' | 'mototaxi';

export type PaymentMethod = 'efectivo' | 'pago_movil' | 'wallet';

export type ServiceStatus =
  | 'pending'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

// ─── Modelos de dominio ──────────────────────────────────────────────────────

export interface GeoLocation {
  latitude: number;
  longitude: number;
  name: string;       // nombre legible (ej. "Av. Libertador, Caracas")
  address?: string;   // dirección completa opcional
}

export interface ExchangeRate {
  usd_to_bs: number;
  updated_at?: string;
}

/** Servicio retornado por el backend */
export interface Service {
  service_id: string;
  service_type: VehicleType;
  status: ServiceStatus;
  origin_address: string;
  destination_address: string;
  origin_lat: number;
  origin_lng: number;
  destination_lat: number;
  destination_lng: number;
  payment_method: PaymentMethod;
  estimated_fare?: number;      // USD
  final_fare?: number;          // USD, disponible al completar
  driver_id?: string;
  user_id: string;
  created_at: string;           // ISO 8601
  accepted_at?: string;
  completed_at?: string;
}

// ─── Tipos de la capa de aplicación (UI ↔ Hook) ──────────────────────────────

/** Lo que el formulario del usuario entrega al hook */
export interface RideRequest {
  origin: GeoLocation;
  destination: GeoLocation;
  vehicleType: VehicleType;
  paymentMethod: PaymentMethod;
}

/** Lo que se envía al backend (snake_case según convención del API) */
export interface RideRequestPayload {
  service_type: VehicleType;
  origin_lat: number;
  origin_lng: number;
  destination_lat: number;
  destination_lng: number;
  origin_address: string;
  destination_address: string;
  payment_method: PaymentMethod;
}

// ─── Opciones estáticas de la UI (antes vivían en el componente) ─────────────

export interface VehicleOption {
  id: VehicleType;
  label: string;
  icon: string;           // nombre de ícono Ionicons
  estimatedTime: string;  // ej. "3-5 min"
}

export interface PaymentOption {
  id: PaymentMethod;
  label: string;
  icon: string;           // nombre de ícono Ionicons
}

export const VEHICLE_OPTIONS: readonly VehicleOption[] = [
  { id: 'carro_particular', label: 'Carro',    icon: 'car',         estimatedTime: '3-5 min' },
  { id: 'taxi_linea',       label: 'Taxi',     icon: 'car-sport',   estimatedTime: '5-8 min' },
  { id: 'mototaxi',         label: 'Mototaxi', icon: 'bicycle',     estimatedTime: '2-4 min' },
] as const;

export const PAYMENT_OPTIONS: readonly PaymentOption[] = [
  { id: 'efectivo',   label: 'Efectivo',     icon: 'cash'            },
  { id: 'pago_movil', label: 'Pago Móvil',   icon: 'phone-portrait'  },
  { id: 'wallet',     label: 'Wallet Xuve',  icon: 'wallet'          },
] as const;

// ─── Validación del formulario ────────────────────────────────────────────────

export type RideValidationError =
  | 'MISSING_ORIGIN'
  | 'MISSING_DESTINATION'
  | 'MISSING_VEHICLE'
  | 'MISSING_PAYMENT';

export interface RideValidationResult {
  valid: boolean;
  error?: RideValidationError;
  message?: string;
}

export function validateRideRequest(
  origin: GeoLocation | null,
  destination: GeoLocation | null,
  vehicleType: VehicleType | null,
  paymentMethod: PaymentMethod | null,
): RideValidationResult {
  if (!origin)       return { valid: false, error: 'MISSING_ORIGIN',      message: 'Selecciona el punto de origen' };
  if (!destination)  return { valid: false, error: 'MISSING_DESTINATION', message: 'Selecciona el destino' };
  if (!vehicleType)  return { valid: false, error: 'MISSING_VEHICLE',     message: 'Selecciona un tipo de vehículo' };
  if (!paymentMethod)return { valid: false, error: 'MISSING_PAYMENT',     message: 'Selecciona un método de pago' };
  return { valid: true };
}
