import * as Notifications from "expo-notifications";

/*
 * Lembretes locais (agendados no aparelho, sem passar pela API):
 * "seu cupom vence em 1 h", "o evento começa em 30 min". A chave identifica
 * o lembrete: agendar de novo com a mesma chave substitui o anterior.
 */

export interface Reminder {
  /** Ex.: `claim:<id>`, `event:<id>`. */
  key: string;
  title: string;
  body: string;
  at: Date;
  /** Caminho aberto ao tocar (ex.: /wallet/<id>). */
  url?: string;
}

/** Nunca pede permissão aqui: o pedido tem hora certa (ver features/auth/sheets/push-offer). */
async function canNotify(): Promise<boolean> {
  return (await Notifications.getPermissionsAsync()).granted;
}

/** Agenda (ou reagenda) o lembrete. false = horário já passou ou ainda sem permissão. */
export async function scheduleReminder(reminder: Reminder): Promise<boolean> {
  if (reminder.at.getTime() <= Date.now() + 5_000) return false;
  try {
    if (!(await canNotify())) return false;
    await Notifications.cancelScheduledNotificationAsync(reminder.key).catch(() => undefined);
    await Notifications.scheduleNotificationAsync({
      identifier: reminder.key,
      content: {
        title: reminder.title,
        body: reminder.body,
        data: reminder.url ? { url: reminder.url } : {},
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminder.at },
    });
    return true;
  } catch {
    return false;
  }
}

export async function cancelReminder(key: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(key).catch(() => undefined);
}

/** Ao sair da conta: lembretes de cupom e evento eram da conta anterior. */
export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => undefined);
}
