// OMNI SuperApp - Cyberpunk Elite Theme
// Based on design_guidelines.json from web app

export const COLORS = {
  // Core Cyberpunk Palette
  primary: '#4DFF91',         // Neon Green
  primaryDim: '#2Eb865',      // Dimmed green (for text on dark)
  primaryDark: '#1a8a4a',
  primaryLight: '#7AFFA8',
  secondary: '#00F0FF',       // Cyan
  secondaryDark: '#00C4D6',
  accent: '#FF003C',          // Red accent

  // Backgrounds - Dark Mode Only
  background: '#050505',      // Near black
  surface: '#121212',         // Dark surface
  surfaceHighlight: '#1A1A1A', // Slightly lighter
  surfaceVariant: '#0D0D0D',

  // Text
  text: '#FFFFFF',
  textSecondary: '#888888',
  textLight: '#555555',
  textOnPrimary: '#050505',   // Dark text on neon green buttons
  textMuted: '#666666',

  // Status
  success: '#4DFF91',
  warning: '#F59E0B',
  error: '#FF003C',
  info: '#00F0FF',

  // Borders
  border: '#333333',
  borderDark: '#222222',
  borderNeon: '#4DFF91',

  // Glass / Overlay
  glass: 'rgba(18, 18, 18, 0.6)',
  glassLight: 'rgba(255, 255, 255, 0.05)',
  overlay: 'rgba(0, 0, 0, 0.7)',

  // Role Colors
  roleUser: '#4DFF91',
  roleDriver: '#F59E0B',
  roleDelivery: '#00F0FF',
  roleCommerce: '#8B5CF6',
  roleDoctor: '#EC4899',
  roleRent: '#F59E0B',
  roleAdmin: '#FF003C',
  roleCarga: '#FF8C00',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT_SIZE = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
  xxxl: 32,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#4DFF91',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#4DFF91',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#4DFF91',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  neon: {
    shadowColor: '#4DFF91',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
};

// OMNI Logo URL
export const OMNI_LOGO_URL = 'https://customer-assets.emergentagent.com/job_12daae48-403e-4cde-9f49-5328468da1b1/artifacts/2v2raro2_Gemini_Generated_Image_fvupv3fvupv3fvup.png';
