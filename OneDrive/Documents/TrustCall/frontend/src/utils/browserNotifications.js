// Browser Notification API Helper for Guard 3 Threat Alerts

/**
 * Requests browser notification permission via user gesture or load.
 * Returns the resulting permission status string ('granted', 'denied', or 'default').
 */
export async function requestNotificationPermission() {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      if (Notification.permission === 'granted') {
        return 'granted';
      }
      const permission = await Notification.requestPermission();
      console.log("🔔 [Browser Notification Permission Status]:", permission);
      return permission;
    } catch (e) {
      console.warn("⚠️ [Notification Permission Error]:", e);
    }
  }
  return 'denied';
}

/**
 * Displays a desktop browser notification if permission was granted.
 */
export function triggerBrowserNotification(title, body) {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn("⚠️ Browser does not support HTML5 Notification API.");
      return false;
    }

    if (Notification.permission === 'granted') {
      const notif = new Notification(title, {
        body,
        tag: 'trustcall-threat-alert',
        renotify: true,
        requireInteraction: false
      });

      notif.onclick = () => {
        if (typeof window !== 'undefined') window.focus();
      };
      
      console.log("✓ [Browser Notification Triggered]:", title);
      return true;
    } else {
      console.warn(`⚠️ Cannot show notification: Notification.permission is currently '${Notification.permission}'. Click 'Enable Desktop Notifications' button in UI to grant permission.`);
      return false;
    }
  } catch (e) {
    console.warn("⚠️ [Browser Notification Exception]:", e);
    return false;
  }
}
