/*
 * Web (react-native-web): sem lembretes locais agendados. Mesma API do
 * reminders.ts; agendar sempre devolve false (como "sem permissão").
 */

export interface Reminder {
  key: string;
  title: string;
  body: string;
  at: Date;
  url?: string;
}

export async function scheduleReminder(_reminder: Reminder): Promise<boolean> {
  return false;
}

export async function cancelReminder(_key: string): Promise<void> {}

export async function cancelAllReminders(): Promise<void> {}
