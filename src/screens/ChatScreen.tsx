import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/authStore';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import api from '../api';

interface Message {
  message_id: string;
  service_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  message_type: string;
  created_at: string;
}

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const serviceId = params.serviceId as string;
  const serviceType = (params.serviceType as string) || '';
  const providerId = (params.providerId as string) || undefined;
  const { user } = useAuthStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const createServiceConversation = async () => {
    if (!serviceId || !serviceType || !providerId) {
      throw new Error('No es posible crear conversaciÃ³n sin serviceType y providerId');
    }

    const response = await api.post('/chat/service', {
      service_type: serviceType,
      service_id: serviceId,
      other_user_id: providerId,
    });

    return response.data.conversation_id || response.data.conversation?.conversation_id;
  };

  const fetchMessages = async () => {
    if (!serviceId || !serviceType) {
      setErrorMessage('ParÃ¡metros de chat invÃ¡lidos. Revisa el servicio y vuelve a intentarlo.');
      return;
    }

    try {
      setErrorMessage(null);
      const response = await api.get(`/chat/service/${serviceType}/${serviceId}`);
      setConversationId(response.data.conversation_id);
      setMessages(response.data.messages || []);
    } catch (error: any) {
      if (error.response?.status === 404 && providerId) {
        try {
          const createdConversationId = await createServiceConversation();
          if (createdConversationId) {
            setConversationId(createdConversationId);
            const response = await api.get(`/chat/service/${serviceType}/${serviceId}`);
            setMessages(response.data.messages || []);
            return;
          }
        } catch (innerError) {
          console.error('Error creando conversaciÃ³n de servicio:', innerError);
        }
      }
      console.error('Error fetching service messages:', error);
      setErrorMessage(
        providerId
          ? 'No se pudo cargar el chat. Intenta de nuevo mÃ¡s tarde.'
          : 'AÃºn no hay proveedor asignado para este servicio.'
      );
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    if (!conversationId) {
      setErrorMessage('ConversaciÃ³n no disponible. Vuelve a cargar la pantalla.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/chat/conversations/${conversationId}/messages`, {
        content: newMessage.trim(),
      });
      setMessages((prev) => [...prev, response.data.message || response.data]);
      setNewMessage('');

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending chat message:', error);
      Alert.alert('Error', 'No se pudo enviar el mensaje');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    
    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchMessages, 5000);
    
    return () => clearInterval(interval);
  }, [serviceId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender_id === user?.user_id;
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        {!isOwnMessage && (
          <Text style={styles.senderName}>{item.sender_name}</Text>
        )}
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble
        ]}>
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownText : styles.otherText
          ]}>
            {item.content}
          </Text>
        </View>
        <Text style={[
          styles.messageTime,
          isOwnMessage ? styles.ownTime : styles.otherTime
        ]}>
          {new Date(item.created_at).toLocaleTimeString('es-VE', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Chat del Servicio</Text>
          <TouchableOpacity onPress={fetchMessages} style={styles.refreshButton}>
            <Ionicons name="refresh" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.message_id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-outline" size={64} color={COLORS.textLight} />
              <Text style={styles.emptyText}>No hay mensajes aÃºn</Text>
              <Text style={styles.emptySubtext}>EnvÃ­a el primer mensaje</Text>
            </View>
          }
        />

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Escribe un mensaje..."
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!newMessage.trim() || loading) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || loading}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={(!newMessage.trim() || loading) ? COLORS.textLight : COLORS.primary} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  backButton: {
    padding: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  refreshButton: {
    padding: SPACING.sm,
  },
  messagesContainer: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  messageContainer: {
    marginBottom: SPACING.md,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  messageBubble: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    maxWidth: '100%',
  },
  ownBubble: {
    backgroundColor: COLORS.primary,
  },
  otherBubble: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  messageText: {
    fontSize: FONT_SIZE.md,
  },
  ownText: {
    color: COLORS.textOnPrimary,
  },
  otherText: {
    color: COLORS.text,
  },
  messageTime: {
    fontSize: FONT_SIZE.xs,
    marginTop: SPACING.xs,
  },
  ownTime: {
    color: COLORS.textSecondary,
  },
  otherTime: {
    color: COLORS.textLight,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyText: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    marginRight: SPACING.sm,
    maxHeight: 100,
    backgroundColor: COLORS.background,
    fontSize: FONT_SIZE.md,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.surface,
  },
});