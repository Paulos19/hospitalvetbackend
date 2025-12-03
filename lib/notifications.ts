import { Expo } from 'expo-server-sdk';

// Cria uma nova instância do cliente Expo SDK
const expo = new Expo();

export async function sendPushNotification(pushToken: string, title: string, body: string, data: any = {}) {
  // Verifica se o token é um token Expo válido
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Push token ${pushToken} is not a valid Expo push token`);
    return;
  }

  const messages = [{
    to: pushToken,
    sound: 'default',
    title: title,
    body: body,
    data: data,
  }];

  try {
    // O método sendPushNotificationsAsync envia as notificações para o servidor do Expo
    const chunks = expo.chunkPushNotifications(messages as any);
    const tickets = [];
    
    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error(error);
      }
    }
    
    console.log('Notificação enviada com sucesso');
    return tickets;
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
  }
}