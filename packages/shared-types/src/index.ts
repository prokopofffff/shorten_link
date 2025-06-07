export interface ShortenUrlRequest {
  originalUrl: string;
  expiresAt?: string;
  alias?: string;
}

export interface ShortenUrlResponse {
  id: string;
  shortUrl: string;
}

export interface LinkInfo {
  originalUrl: string;
  createdAt: string;
  clickCount: number;
}

export interface AnalyticsInfo {
  clickCount: number;
  lastFiveIps: string[];
}

export interface AllLinksResponse {
  id: string;
  originalUrl: string;
  shortUrl: string;
  shortId: string;
  createdAt: string;
  clickCount: number;
  lastFiveIps: string[];
}
