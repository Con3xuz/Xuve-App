// Configuración dinámica de Expo.
// =================================
// Toma como base app.json e inyecta la llave del Maps SDK (render del mapa)
// desde el entorno, para NO hardcodearla en el repo.
//
// IMPORTANTE: EXPO_PUBLIC_GOOGLE_MAPS_KEY es la llave "A": viaja dentro del
// bundle (inevitable para que react-native-maps dibuje el mapa) y por eso DEBE
// estar restringida en Google Cloud Console por:
//   - Android: nombre de paquete + huella SHA-1 de la firma de la app
//   - iOS: bundle identifier
//   - API restrictions: SOLO Maps SDK for Android / iOS (y Maps JavaScript en web)
// Las APIs facturables (Places, Directions, Distance Matrix, Geocoding) NO se
// llaman desde aquí: van por el backend con la llave de servidor.

const MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || '';

export default ({ config }) => ({
  ...config,
  ios: {
    ...config.ios,
    config: {
      ...(config.ios?.config || {}),
      googleMapsApiKey: MAPS_KEY,
    },
  },
  android: {
    ...config.android,
    config: {
      ...(config.android?.config || {}),
      googleMaps: { apiKey: MAPS_KEY },
    },
  },
});
