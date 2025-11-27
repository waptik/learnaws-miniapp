// Notification types for Farcaster miniapp
// These types may not be exported from @farcaster/miniapp-sdk, so we define them locally

export interface FrameNotificationDetails {
  url: string;
  token: string;
}

export interface SendNotificationRequest {
  notificationId: string;
  title: string;
  body: string;
  targetUrl: string;
  tokens: string[];
}

export interface SendNotificationResponse {
  result: {
    successfulTokens: string[];
    failedTokens: string[];
  };
}


