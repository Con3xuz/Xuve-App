// entities/user/types.ts
// Fuente de verdad para todos los tipos relacionados al usuario en la app.
// Cualquier componente o hook que necesite datos del usuario importa desde aquí.

// ─── Enums como union types (preferible a enum de TS para tree-shaking) ──────

export type UserRole =
  | 'user'
  | 'socio_conductor'
  | 'socio_repartidor'
  | 'socio_comercial'
  | 'rent_owner'
  | 'carga_pesada'
  | 'line_admin'
  | 'chofer_linea'
  | 'medico'
  | 'admin';

export type UserStatus = 'active' | 'inactive' | 'suspended';

export type KycStatus = 'pending' | 'approved' | 'rejected';

// ─── Entidad principal ───────────────────────────────────────────────────────

export interface User {
  user_id: string;
  email: string;
  name: string;
  phone?: string;
  picture?: string;
  role: UserRole;
  sub_role?: string;
  wallet_balance: number;
  wallet_held: number;      // nunca undefined — el backend lo retorna como 0 por defecto
  status: UserStatus;
  kyc_status?: KycStatus;
  avg_rating?: number;      // 0–5, solo relevante para socios
  created_at: string;       // ISO 8601
}

// ─── Tipos derivados (calculados, no almacenados en el backend) ───────────────

export interface WalletSummary {
  balance: number;
  held: number;
  available: number;        // balance - held
}

// Útil para mostrar el nombre del rol en la UI (ej. badges, headers)
export const ROLE_LABELS: Record<UserRole, string> = {
  user:              'Cliente',
  socio_conductor:   'Conductor',
  socio_repartidor:  'Repartidor',
  socio_comercial:   'Comercio',
  rent_owner:        'Rent-a-Car',
  carga_pesada:      'Carga',
  line_admin:        'Terminal',
  chofer_linea:      'Chofer Línea',
  medico:            'Médico',
  admin:             'Administrador',
} as const;

// Roles que necesitan suscripción diaria activa para operar
export const SUBSCRIPTION_ROLES: ReadonlySet<UserRole> = new Set([
  'socio_conductor',
  'socio_repartidor',
  'socio_comercial',
  'rent_owner',
  'carga_pesada',
]);

export function requiresSubscription(role: UserRole): boolean {
  return SUBSCRIPTION_ROLES.has(role);
}

export function computeWalletSummary(user: Pick<User, 'wallet_balance' | 'wallet_held'>): WalletSummary {
  return {
    balance:   user.wallet_balance,
    held:      user.wallet_held,
    available: user.wallet_balance - user.wallet_held,
  };
}
