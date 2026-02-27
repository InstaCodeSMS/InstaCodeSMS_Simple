/**
 * 通知系统
 * 用于显示成功、错误、警告等消息
 */

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number // 毫秒，0 表示不自动关闭
}

// 通知存储
const notifications = new Map<string, Notification>()

/**
 * 生成通知 ID
 */
function generateNotificationId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * 添加通知
 */
export function addNotification(
  type: 'success' | 'error' | 'warning' | 'info',
  message: string,
  duration: number = 3000
): string {
  const id = generateNotificationId()
  const notification: Notification = {
    id,
    type,
    message,
    duration,
  }

  notifications.set(id, notification)

  // 自动移除通知
  if (duration > 0) {
    setTimeout(() => {
      notifications.delete(id)
    }, duration)
  }

  return id
}

/**
 * 移除通知
 */
export function removeNotification(id: string): void {
  notifications.delete(id)
}

/**
 * 获取所有通知
 */
export function getNotifications(): Notification[] {
  return Array.from(notifications.values())
}

/**
 * 生成通知 HTML
 */
export function renderNotifications(): string {
  const notifs = getNotifications()

  if (notifs.length === 0) {
    return ''
  }

  const notifHtml = notifs
    .map((notif) => {
      const bgColor =
        notif.type === 'success'
          ? 'bg-green-100 border-green-300'
          : notif.type === 'error'
            ? 'bg-red-100 border-red-300'
            : notif.type === 'warning'
              ? 'bg-yellow-100 border-yellow-300'
              : 'bg-blue-100 border-blue-300'

      const textColor =
        notif.type === 'success'
          ? 'text-green-800'
          : notif.type === 'error'
            ? 'text-red-800'
            : notif.type === 'warning'
              ? 'text-yellow-800'
              : 'text-blue-800'

      const icon =
        notif.type === 'success'
          ? '✓'
          : notif.type === 'error'
            ? '✕'
            : notif.type === 'warning'
              ? '⚠'
              : 'ℹ'

      return `
        <div class="border ${bgColor} rounded-lg p-3 mb-2 flex items-center gap-2 ${textColor}">
          <span class="font-bold">${icon}</span>
          <span>${notif.message}</span>
          <button hx-post="/mini-app/api/notifications/dismiss?id=${notif.id}"
                  hx-target="closest div"
                  hx-swap="swap:outerHTML swap:1s"
                  class="ml-auto text-sm opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      `
    })
    .join('')

  return `<div id="notifications" class="fixed top-4 left-4 right-4 z-50 max-w-md">${notifHtml}</div>`
}
