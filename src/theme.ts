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
  tint: '#C2410C',
  primarySoft: '#FFF3E8',
  accent: '#F97316',
  buttonPrimary: '#C2410C',
  buttonSecondary: '#FFF0E3',
  buttonDanger: '#DC2626',
  danger: '#E11D48',
  dangerSurface: '#FFF1F2',
  dangerBorder: '#FECDD3',
  success: '#C2410C',
  warning: '#C2410C',
  warningSurface: '#FFF7ED',
  warningBorder: '#FDBA74',
  chartColors: ['#9A3412', '#C2410C', '#EA580C', '#F97316', '#FB923C', '#FDBA74'],
  userBubble: '#C2410C',
  userBubbleText: '#FFFFFF',
  assistantBubble: '#FFF3E8',
  inputBackground: '#F9FAFB',
};

const dark: Theme = {
  background: '#0A0A0A',
  card: '#161616',
  text: '#F9FAFB',
  textSecondary: '#A3A3A3',
  border: '#333333',
  tint: '#FDBA74',
  primarySoft: '#2A180D',
  accent: '#FF9500',
  buttonPrimary: '#C2410C',
  buttonSecondary: '#262626',
  buttonDanger: '#EF4444',
  danger: '#FB7185',
  dangerSurface: '#2D1519',
  dangerBorder: '#5E222B',
  success: '#FDBA74',
  warning: '#FDBA74',
  warningSurface: '#2C1A0D',
  warningBorder: '#8C501B',
  chartColors: ['#9A3412', '#C2410C', '#EA580C', '#F97316', '#FB923C', '#FDBA74'],
  userBubble: '#C2410C',
  userBubbleText: '#FFFFFF',
  assistantBubble: '#1E1E1E',
  inputBackground: '#101010',
};

export function useTheme(): Theme {
  return useSettings().settings.theme === 'dark' ? dark : light;
}
