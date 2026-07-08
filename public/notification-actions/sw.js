/// <reference lib="webworker" />
// Tell TypeScript that `self` is a service worker global, not a Window.
const sw = /** @type {ServiceWorkerGlobalScope} */ (self);

// Activate immediately so the demo works on first load without a reload.
sw.addEventListener('install', () => sw.skipWaiting());
sw.addEventListener('activate', (event) => event.waitUntil(sw.clients.claim()));

sw.addEventListener('notificationclick', (event) => {
  // event.action is '' when the notification body itself is clicked,
  // or the `action` id of the button that was clicked.
  const action = event.action;

  // When the "quick-reply" action is clicked, replace the notification's
  // actions with emoji choices and update its body, rather than closing it.
  if (action === 'quick-reply') {
    // Re-showing with the same tag replaces the current notification in place.
    event.waitUntil(
      sw.registration.showNotification(event.notification.title, {
        body: 'Choose reply…',
        // Reuse the same tag so this replaces the existing notification.
        tag: event.notification.tag,
        actions: [
          { action: 'reply-happy', title: '😀' },
          { action: 'reply-sad', title: '😢' },
        ],
      }),
    );
    return;
  }

  if (!action) event.notification.close();

  event.waitUntil(
    (async () => {
      const allClients = await sw.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      // Focus an existing tab if there is one, otherwise open a new one.
      let client = allClients.find((c) =>
        c.url.includes('/notification-actions/'),
      );
      if (client) {
        await client.focus();
      } else {
        client = await sw.clients.openWindow('./');
      }

      // Tell the page which action was clicked so it can update its log.
      client?.postMessage({ type: 'notification-action', action });
    })(),
  );
});
