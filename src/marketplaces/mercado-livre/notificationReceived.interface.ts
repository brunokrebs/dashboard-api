export interface NotificationRecived {
  resource: string;
  user_id: number;
  topic: string;
  application_id: number;
  attempts: number;
  sent: Date;
  received: Date;
}
