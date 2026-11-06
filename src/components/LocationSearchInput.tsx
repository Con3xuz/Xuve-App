import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import { autocompletePlaces, getPlaceDetails } from '../lib/geo';

interface LocationResult {
  id: string;
  name: string;
  mainText: string;
  secondaryText: string;
  lat?: number;
  lng?: number;
  placeId?: string;
  source: 'google' | 'preset';
}

interface SelectedLocation {
  latitude: number;
  longitude: number;
  name: string;
}

interface LocationSearchInputProps {
  placeholder?: string;
  value?: SelectedLocation | null;
  onLocationSelect: (location: SelectedLocation | null) => void;
  iconColor?: string;
  dotColor?: string;
  /** Ubicación del usuario (GPS) para sesgar las sugerencias a su zona (opcional). */
  biasLocation?: SelectedLocation | null;
}

// Búsqueda vía proxy del backend (Google Places Autocomplete, cobertura NACIONAL).
// La API key vive SOLO en el servidor; aquí nunca se maneja ninguna llave de Google.
// Si hay ubicación del usuario (GPS), se envía como sesgo para priorizar su zona.
async function searchWithProxy(
  query: string,
  bias?: SelectedLocation | null,
): Promise<LocationResult[]> {
  try {
    const predictions = await autocompletePlaces(query, bias ?? null);
    return predictions.map((p) => ({
      id: `g_${p.place_id}`,
      name: p.description,
      mainText: p.mainText,
      secondaryText: p.secondaryText,
      placeId: p.place_id,
      source: 'google' as const,
    }));
  } catch (e) {
    console.log('Proxy search failed:', e);
    return [];
  }
}

export default function LocationSearchInput({
  placeholder = 'Buscar ubicacion...',
  value,
  onLocationSelect,
  iconColor = COLORS.primary,
  dotColor = COLORS.primary,
  biasLocation,
}: LocationSearchInputProps) {
  const [inputValue, setInputValue] = useState(value?.name || '');
  const [suggestions, setSuggestions] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<any>(null);
  // Mantiene el sesgo (GPS) más reciente disponible dentro del debounce.
  const biasRef = useRef(biasLocation);
  biasRef.current = biasLocation;

  const handleInputChange = useCallback((text: string) => {
    setInputValue(text);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.length < 2) {
      // Sin presets fijos (cobertura nacional): las sugerencias salen al escribir.
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      // Búsqueda remota nacional vía backend, sesgada al GPS del usuario si lo hay.
      const results = await searchWithProxy(text, biasRef.current);
      setSuggestions(results.slice(0, 8));
      setShowSuggestions(true);
      setLoading(false);
    }, 400);
  }, []);

  const handleSelectSuggestion = async (suggestion: LocationResult) => {
    setInputValue(suggestion.mainText);
    setShowSuggestions(false);
    Keyboard.dismiss();

    // Presets ya traen coordenadas; las predicciones de Google se resuelven
    // pidiendo los detalles del place_id al backend.
    if (suggestion.lat != null && suggestion.lng != null) {
      onLocationSelect({
        latitude: suggestion.lat,
        longitude: suggestion.lng,
        name: suggestion.mainText,
      });
      return;
    }

    if (suggestion.placeId) {
      try {
        const place = await getPlaceDetails(suggestion.placeId);
        if (place.latitude != null && place.longitude != null) {
          onLocationSelect({
            latitude: place.latitude,
            longitude: place.longitude,
            name: suggestion.mainText,
          });
        }
      } catch (e) {
        console.log('Place details failed:', e);
      }
    }
  };

  const handleClear = () => {
    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    onLocationSelect(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={handleInputChange}
          onFocus={() => {
            // Sin presets fijos: las sugerencias aparecen al escribir (≥2 caracteres).
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          onBlur={() => {
            setTimeout(() => setShowSuggestions(false), 300);
          }}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textLight}
          returnKeyType="search"
        />
        {loading && (
          <ActivityIndicator size="small" color={COLORS.primary} style={styles.loader} />
        )}
        {inputValue.length > 0 && !loading && (
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={suggestions.length > 4}
            style={styles.suggestionsList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleSelectSuggestion(item)}
              >
                <Ionicons name="location" size={16} color={iconColor} style={{ marginTop: 2 }} />
                <View style={styles.suggestionTextContainer}>
                  <Text style={styles.suggestionMainText} numberOfLines={1}>{item.mainText}</Text>
                  {item.secondaryText ? (
                    <Text style={styles.suggestionSecondaryText} numberOfLines={1}>{item.secondaryText}</Text>
                  ) : null}
                </View>
                {item.source === 'preset' && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>Popular</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 100,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    minHeight: 48,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    paddingVertical: SPACING.sm,
  },
  loader: {
    marginLeft: SPACING.sm,
  },
  clearBtn: {
    marginLeft: SPACING.sm,
    padding: 4,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: 240,
    zIndex: 999,
    elevation: 10,
  },
  suggestionsList: {
    borderRadius: BORDER_RADIUS.lg,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '40',
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionMainText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    color: COLORS.text,
  },
  suggestionSecondaryText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
    marginTop: 1,
  },
  popularBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
