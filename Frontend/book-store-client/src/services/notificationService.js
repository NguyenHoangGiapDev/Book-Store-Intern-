/** 
 * NotificationService.js
 * Quản lý thông báo toàn cục cho ứng dụng
 */

const NOTIFICATIONS_KEY = 'global_notifications';

class NotificationService {
  getNotifications() {
    try {
      const data = localStorage.getItem(NOTIFICATIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveNotifications(notifications) {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
    window.dispatchEvent(new Event('notificationsUpdated'));
  }

  addNotification({ title, message, type = 'info', icon = 'bi-bell' }) {
    const notifications = this.getNotifications();
    const newNotif = {
      id: Date.now(),
      title,
      message,
      type, // 'info', 'success', 'warning', 'danger'
      icon,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    
    // Add to the beginning of the list
    const updated = [newNotif, ...notifications].slice(0, 50); // Keep last 50
    this.saveNotifications(updated);
    return newNotif;
  }

  markAsRead(id) {
    const notifications = this.getNotifications();
    const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    this.saveNotifications(updated);
  }

  markAllAsRead() {
    const notifications = this.getNotifications();
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    this.saveNotifications(updated);
  }

  getUnreadCount() {
    return this.getNotifications().filter(n => !n.isRead).length;
  }

  clearAll() {
    this.saveNotifications([]);
  }
}

export const notificationService = new NotificationService();
