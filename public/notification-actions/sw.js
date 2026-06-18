// Activate immediately so the demo works on first load without a reload.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) =>
  event.waitUntil(self.clients.claim()),
);

self.addEventListener('notificationclick', (event) => {
  // event.action is '' when the notification body itself is clicked,
  // or the `action` id of the button that was clicked.
  const action = event.action;

  event.notification.close();

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
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
        client = await self.clients.openWindow('./');
      }

      // Tell the page which action was clicked so it can update its log.
      client?.postMessage({ type: 'notification-action', action });
    })(),
  );
});
