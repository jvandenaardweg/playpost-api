export interface AnalyticsEventRequestBody {
  articleId: string;
  audiofileId: string;
  anonymousUserId: string;
  value: number;
  timestamp: number;
  event: 'view' | 'play:begin' | 'play:end' | 'play:1' | 'play:5' | 'play:25' | 'play:50' | 'play:75' | 'play:95' | 'play:99' | 'play:100' | 'playlist:add' | 'pause';
  device: 'mobile' | 'desktop' | 'tablet' | 'wearable' | 'smarttv' | 'console';

  sessionId: string | null;
  publisherId: string | null;
  userId: string | null;
  countryCode: string | null;
  regionCode: string | null;
  city: string | null;
}
