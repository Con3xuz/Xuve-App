// entities/user/index.ts — Barrel export
// Los consumidores importan desde 'entities/user', nunca desde sub-paths.

export type {
  User,
  UserRole,
  UserStatus,
  KycStatus,
  WalletSummary,
} from './types';

export {
  ROLE_LABELS,
  SUBSCRIPTION_ROLES,
  requiresSubscription,
  computeWalletSummary,
} from './types';

export {
  useCurrentUser,
  useWalletSummary,
  useInvalidateUser,
  USER_QUERY_KEY,
} from './hooks/useCurrentUser';
