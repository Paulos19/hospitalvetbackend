// lib/notificationService.ts
import { prisma } from './prisma';
import { sendPushNotification } from './notifications'; // Lib já existente

interface NotificationData {
  userId: string;
  petId?: string;
  title: string;
  message: string;
  type: 'VACCINE' | 'PRESCRIPTION' | 'APPOINTMENT' | 'GENERIC';
}

export async function createAndNotifyClient(data: NotificationData) {
  // 1. Cria a notificação no banco de dados (Persistência)
  const notification = await prisma.notification.create({
    data: {
      userId: data.userId,
      petId: data.petId,
      title: data.title,
      message: data.message,
      type: data.type,
      read: false,
    },
    include: {
      user: true, // Inclui o User para pegar o pushToken
    }
  });

  // 2. Envia a Push Notification (Tempo Real)
  if (notification.user.pushToken) {
    await sendPushNotification(notification.user.pushToken, data.title, data.message);
  }

  return notification;
}