// features/rides/index.ts — Barrel export
// Los consumidores importan desde 'features/rides', nunca desde sub-paths.

export type {
  VehicleType,
  PaymentMethod,
  ServiceStatus,
  GeoLocation,
  ExchangeRate,
  Service,
  RideRequest,
  RideRequestPayload,
  VehicleOption,
  PaymentOption,
  RideValidationError,
  RideValidationResult,
} from './types';

export {
  VEHICLE_OPTIONS,
  PAYMENT_OPTIONS,
  validateRideRequest,
} from './types';

export {
  useExchangeRate,
  useConvertToBs,
  EXCHANGE_RATE_QUERY_KEY,
} from './hooks/useExchangeRate';

export {
  useRequestRide,
  validateRideRequest as validateRide,
  SERVICES_QUERY_KEY,
} from './hooks/useRequestRide';
