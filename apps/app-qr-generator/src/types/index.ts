export type QrDataType = 'url' | 'wifi' | 'vcard' | 'text' | 'sms' | 'email';

export type WizardStep = 1 | 2 | 3;

export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export type DotStyle = 'square' | 'rounded' | 'dots';

export type EyeStyle = 'square' | 'rounded' | 'circle';

export type CenterBadgeType = 'none' | 'link' | 'wifi' | 'vcard' | 'message' | 'star' | 'custom';

export interface WifiPayload {
  ssid: string;
  password: string;
  encryption: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
}

export interface VCardPayload {
  fullName: string;
  phone: string;
  organization: string;
  title: string;
  email: string;
  website: string;
}

export interface SmsPayload {
  phone: string;
  message: string;
}

export interface EmailPayload {
  email: string;
  subject: string;
  body: string;
}

export interface QrDesignSettings {
  fgColor: string;
  bgColor: string;
  dotStyle: DotStyle;
  eyeStyle: EyeStyle;
  ecLevel: ErrorCorrectionLevel;
  size: 512 | 1024 | 2048;
  margin: number; // 1 ~ 4 modules
  centerBadge: CenterBadgeType;
  customLogoDataUrl: string | null;
  showFrameLabel: boolean;
  frameTitle: string;
  frameSubtitle: string;
}

export interface QrMatrixResult {
  modules: boolean[][];
  isFunction: boolean[][];
  size: number;
  version: number;
  ecLevel: ErrorCorrectionLevel;
  byteLength: number;
  mask: number;
}
