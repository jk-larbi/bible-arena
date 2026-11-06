// ============================================================================
// BIBLEARENA — REGISTERED PLAYER NOTIFICATIONS & 5-HOUR REMINDERS SERVICE
// Respects permission, quiet hours, 5-hour interval, varied natural copy & in-app fallback
// ============================================================================

export interface UserNotificationPreferences {
  userId: string;
  enabled: boolean;
  intervalHours: number; // default: 5
  quietHoursStart: string; // e.g. "22:00" (10 PM)
  quietHoursEnd: string; // e.g. "08:00" (8 AM)
  permissionStatus: NotificationPermission | 'unsupported';
  lastReminderSentAt?: string;
  lastActiveAt?: string;
  hasShownRegistrationPrompt?: boolean;
}

export interface ReminderNotificationMessage {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
}

const STORAGE_KEY_PREFIX = 'biblearena_notifications_prefs_';
const LAST_ACTIVE_STORAGE_KEY = 'biblearena_last_player_activity';
const inMemoryPrefsMap = new Map<string, string>();

export const NATURAL_REMINDER_MESSAGES: ReminderNotificationMessage[] = [
  {
    title: 'BibleArena Challenge Ready',
    body: 'Your next BibleArena challenge is waiting! Come test your Scripture knowledge.',
  },
  {
    title: 'Ready for Another Round?',
    body: 'Ready for another round? Take a few minutes to explore God’s Word.',
  },
  {
    title: 'Keep Your Progress Going!',
    body: 'Your next level is waiting. Keep your daily Scripture progress going strong!',
  },
  {
    title: 'Time for a Quick Bible Challenge',
    body: 'Take five minutes for a refreshing Bible quiz challenge today.',
  },
  {
    title: 'Heroes of Faith Await',
    body: 'Discover what Abraham, Ruth, and David teach us today in BibleArena!',
  },
  {
    title: 'Sharpen Your Sword',
    body: 'Test your Bible mastery with a quick 10-question championship round!',
  },
];

export class PlayerNotificationService {
  private static instance: PlayerNotificationService;

  public static getInstance(): PlayerNotificationService {
    if (!PlayerNotificationService.instance) {
      PlayerNotificationService.instance = new PlayerNotificationService();
    }
    return PlayerNotificationService.instance;
  }

  private getStorageKey(userId: string): string {
    return `${STORAGE_KEY_PREFIX}${userId.trim()}`;
  }

  /**
   * Retrieves notification preferences for a user, or returns sensible defaults (5-hour interval).
   */
  public getPreferences(userId: string): UserNotificationPreferences {
    const defaultPermission: NotificationPermission | 'unsupported' =
      typeof window !== 'undefined' && 'Notification' in window
        ? Notification.permission
        : 'unsupported';

    const defaultPrefs: UserNotificationPreferences = {
      userId,
      enabled: false,
      intervalHours: 5,
      quietHoursStart: '22:00', // 10:00 PM
      quietHoursEnd: '08:00', // 8:00 AM
      permissionStatus: defaultPermission,
      hasShownRegistrationPrompt: false,
    };

    if (!userId) return defaultPrefs;

    try {
      let raw: string | null = null;
      if (typeof localStorage !== 'undefined') {
        raw = localStorage.getItem(this.getStorageKey(userId));
      } else {
        raw = inMemoryPrefsMap.get(this.getStorageKey(userId)) || null;
      }

      if (!raw) return defaultPrefs;
      const parsed = JSON.parse(raw) as UserNotificationPreferences;
      return {
        ...defaultPrefs,
        ...parsed,
        permissionStatus:
          typeof window !== 'undefined' && 'Notification' in window
            ? Notification.permission
            : parsed.permissionStatus || 'unsupported',
      };
    } catch {
      return defaultPrefs;
    }
  }

  /**
   * Saves updated notification preferences to local storage.
   */
  public savePreferences(prefs: UserNotificationPreferences): void {
    if (!prefs.userId) return;
    try {
      const serialized = JSON.stringify(prefs);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.getStorageKey(prefs.userId), serialized);
      } else {
        inMemoryPrefsMap.set(this.getStorageKey(prefs.userId), serialized);
      }
    } catch (e) {
      console.warn('Failed to persist notification preferences:', e);
    }
  }

  /**
   * Requests browser notification permission safely and gracefully.
   */
  public async requestPermission(userId: string): Promise<NotificationPermission | 'unsupported'> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }

    try {
      const permission = await Notification.requestPermission();
      const current = this.getPreferences(userId);
      this.savePreferences({
        ...current,
        permissionStatus: permission,
        enabled: permission === 'granted' ? current.enabled : false,
      });
      return permission;
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
      return 'denied';
    }
  }

  /**
   * Records user activity to ensure reminders are never sent while actively playing.
   */
  public recordUserActivity(userId: string): void {
    const now = new Date().toISOString();
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(LAST_ACTIVE_STORAGE_KEY, now);
      }
    } catch {}

    const prefs = this.getPreferences(userId);
    this.savePreferences({
      ...prefs,
      lastActiveAt: now,
    });
  }

  /**
   * Checks whether the current time falls within the user's quiet hours (e.g. 10 PM - 8 AM).
   */
  public isInsideQuietHours(prefs: UserNotificationPreferences, date = new Date()): boolean {
    const [startH, startM] = prefs.quietHoursStart.split(':').map(Number);
    const [endH, endM] = prefs.quietHoursEnd.split(':').map(Number);

    const currentMinutes = date.getHours() * 60 + date.getMinutes();
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes > endMinutes) {
      // Overnight quiet hours (e.g. 22:00 to 08:00)
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    } else {
      // Daytime quiet hours (e.g. 13:00 to 15:00)
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }
  }

  /**
   * Evaluates eligibility and triggers a reminder if appropriate:
   * 1. Reminders must be enabled.
   * 2. Must not be inside quiet hours.
   * 3. Must not be actively playing (active within last 15 minutes).
   * 4. Must be at least `intervalHours` (default 5 hours) since last reminder or activity.
   */
  public checkAndTriggerReminder(
    userId: string,
    onInAppFallback?: (msg: ReminderNotificationMessage) => void
  ): {
    triggered: boolean;
    reason: string;
    message?: ReminderNotificationMessage;
  } {
    const prefs = this.getPreferences(userId);

    if (!prefs.enabled) {
      return { triggered: false, reason: 'Reminders are disabled by the user.' };
    }

    if (this.isInsideQuietHours(prefs)) {
      return { triggered: false, reason: 'Current time is inside configured quiet hours.' };
    }

    const now = Date.now();

    // Check last active time: do NOT send while actively playing (e.g., active within last 15 minutes)
    if (prefs.lastActiveAt) {
      const msSinceActive = now - new Date(prefs.lastActiveAt).getTime();
      if (msSinceActive < 15 * 60 * 1000) {
        return { triggered: false, reason: 'User is actively playing or was active within 15 minutes.' };
      }
    }

    // Check interval since last reminder
    const requiredIntervalMs = prefs.intervalHours * 60 * 60 * 1000;
    if (prefs.lastReminderSentAt) {
      const msSinceLast = now - new Date(prefs.lastReminderSentAt).getTime();
      if (msSinceLast < requiredIntervalMs) {
        const hoursRemaining = ((requiredIntervalMs - msSinceLast) / (60 * 60 * 1000)).toFixed(1);
        return {
          triggered: false,
          reason: `Interval has not elapsed yet (${hoursRemaining} hours remaining).`,
        };
      }
    }

    // Select a varied natural message (avoiding identical repeat)
    const randomIndex = Math.floor(Math.random() * NATURAL_REMINDER_MESSAGES.length);
    const msg = NATURAL_REMINDER_MESSAGES[randomIndex];

    // Trigger Notification
    let deliveredViaBrowser = false;
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        new Notification(msg.title, {
          body: msg.body,
          icon: '/biblearena-logo.png',
          tag: 'biblearena-gameplay-reminder',
        });
        deliveredViaBrowser = true;
      } catch (e) {
        console.warn('Browser push notification could not be dispatched:', e);
      }
    }

    // If browser notification wasn't available or delivered, trigger in-app fallback
    if (!deliveredViaBrowser && onInAppFallback) {
      onInAppFallback(msg);
    }

    // Update last reminder timestamp
    this.savePreferences({
      ...prefs,
      lastReminderSentAt: new Date().toISOString(),
    });

    return {
      triggered: true,
      reason: deliveredViaBrowser
        ? 'Browser notification successfully dispatched.'
        : 'In-app notification delivered.',
      message: msg,
    };
  }
}

export const playerNotificationService = PlayerNotificationService.getInstance();
