import { Alert } from 'react-native';

export const showLocalNotification = (title: string, message: string) => {
  Alert.alert(title, message);
};

export const showServiceNotification = (type: 'requested' | 'matched' | 'accepted' | 'completed', details?: any) => {
  const notifications = {
    requested: {
      title: 'Servicio Solicitado',
      message: 'Tu solicitud ha sido enviada. Buscando proveedores...',
    },
    matched: {
      title: 'Proveedores Encontrados',
      message: `${details?.count || 0} proveedores disponibles cerca de ti.`,
    },
    accepted: {
      title: 'Servicio Aceptado',
      message: 'Un proveedor ha aceptado tu solicitud.',
    },
    completed: {
      title: 'Servicio Completado',
      message: 'Tu servicio ha finalizado exitosamente.',
    },
  };

  const notif = notifications[type];
  if (notif) {
    showLocalNotification(notif.title, notif.message);
  }
};