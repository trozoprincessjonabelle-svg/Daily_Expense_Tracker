import { useSettings } from '@/settings/SettingsContext';

export interface Theme {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  tint: string;
  primarySoft: string;
  accent: string;
  buttonPrimary: string;
  buttonSecondary: string;
  buttonDanger: string;
  danger: string;
  dangerSurface: string;
  dangerBorder: string;
  success: string;
  warning: string;
  warningSurface: string;
  warningBorder: string;
  chartColors: readonly string[];
  userBubble: string;
  userBubbleText: string;
  assistantBubble: string;
  inputBackground: string;
}

const light: Theme = {
  background: '#FFFFFF',
  card: '#FFFFFF',
  text: '#1C1917',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  tint: '#047857',
  primarySoft: '#ECFDF5',
  accent: '#10B981',
  buttonPrimary: '#047857',
  buttonSecondary: '#ECFDF5',
  buttonDanger: '#DC2626',
  danger: '#E11D48',
  dangerSurface: '#FFF1F2',
  dangerBorder: '#FECDD3',
  success: '#047857',
  warning: '#B45309',
  warningSurface: '#FFFBEB',
  warningBorder: '#FCD34D',
  chartColors: ['#064E3B', '#047857', '#059669', '#10B981', '#34D399', '#6EE7B7'],
  userBubble: '#047857',
  userBubbleText: '#FFFFFF',
  assistantBubble: '#ECFDF5',
  inputBackground: '#F9FAFB',
};

const dark: Theme = {
  background: '#0A0A0A',
  card: '#161616',
  text: '#F9FAFB',
  textSecondary: '#A3A3A3',
  border: '#333333',
  tint: '#6EE7B7',
  primarySoft: '#052E2B',
  accent: '#34D399',
  buttonPrimary: '#047857',
  buttonSecondary: '#262626',
  buttonDanger: '#EF4444',
  danger: '#FB7185',
  dangerSurface: '#2D1519',
  dangerBorder: '#5E222B',
  success: '#34D399',
  warning: '#FBBF24',
  warningSurface: '#2C1A0D',
  warningBorder: '#8C501B',
  chartColors: ['#A7F3D0', '#6EE7B7', '#34D399', '#10B981', '#059669', '#047857'],
  userBubble: '#047857',
  userBubbleText: '#FFFFFF',
  assistantBubble: '#1E1E1E',
  inputBackground: '#101010',
};

export function useTheme(): Theme {
  return useSettings().settings.theme === 'dark' ? dark : light;
}
