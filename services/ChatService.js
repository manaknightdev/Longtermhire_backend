const redis = require('redis');

class ChatService {
  constructor() {
    this.publisher = null;
    this.subscriber = null;
    this.isConnected = false;
    this.messageHandlers = new Map();
  }

  async initialize() {
    try {
      // Create Redis clients
      this.publisher = redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
      });

      this.subscriber = redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
      });

      // Connect clients
      await this.publisher.connect();
      await this.subscriber.connect();

      console.log('✅ Redis Chat Service connected successfully');
      this.isConnected = true;

      // Set up message handling
      this.subscriber.on('message', (channel, message) => {
        this.handleIncomingMessage(channel, message);
      });

    } catch (error) {
      console.error('❌ Redis Chat Service connection failed:', error);
      this.isConnected = false;
    }
  }

  // Subscribe to user's chat channel
  async subscribeToUserChannel(userId) {
    if (!this.isConnected) {
      console.warn('Redis not connected, cannot subscribe to channel');
      return;
    }

    const channel = `chat:user:${userId}`;
    try {
      await this.subscriber.subscribe(channel);
      console.log(`📡 Subscribed to channel: ${channel}`);
    } catch (error) {
      console.error(`Failed to subscribe to channel ${channel}:`, error);
    }
  }

  // Unsubscribe from user's chat channel
  async unsubscribeFromUserChannel(userId) {
    if (!this.isConnected) return;

    const channel = `chat:user:${userId}`;
    try {
      await this.subscriber.unsubscribe(channel);
      console.log(`📡 Unsubscribed from channel: ${channel}`);
    } catch (error) {
      console.error(`Failed to unsubscribe from channel ${channel}:`, error);
    }
  }

  // Publish message to user's channel
  async publishMessage(userId, messageData) {
    if (!this.isConnected) {
      console.warn('Redis not connected, cannot publish message');
      return false;
    }

    const channel = `chat:user:${userId}`;
    try {
      await this.publisher.publish(channel, JSON.stringify(messageData));
      console.log(`📤 Message published to channel: ${channel}`);
      return true;
    } catch (error) {
      console.error(`Failed to publish message to channel ${channel}:`, error);
      return false;
    }
  }

  // Send chat message to specific user
  async sendMessage(fromUserId, toUserId, messageData) {
    const message = {
      id: messageData.id,
      from_user_id: fromUserId,
      to_user_id: toUserId,
      message: messageData.message,
      message_type: messageData.message_type || 'text',
      equipment_id: messageData.equipment_id || null,
      equipment_name: messageData.equipment_name || null,
      created_at: new Date().toISOString(),
      timestamp: Date.now()
    };

    // Publish to recipient's channel
    return await this.publishMessage(toUserId, message);
  }

  // Send equipment request message
  async sendEquipmentRequest(clientId, adminId, equipmentData, messageId) {
    const requestMessage = {
      id: messageId,
      from_user_id: clientId,
      to_user_id: adminId,
      message: `Equipment Request: ${equipmentData.equipment_name}`,
      message_type: 'equipment_request',
      equipment_id: equipmentData.equipment_id,
      equipment_name: equipmentData.equipment_name,
      created_at: new Date().toISOString(),
      timestamp: Date.now(),
      equipment_details: {
        id: equipmentData.equipment_id,
        name: equipmentData.equipment_name,
        category: equipmentData.category,
        base_price: equipmentData.base_price
      }
    };

    // Send to admin
    return await this.publishMessage(adminId, requestMessage);
  }

  // Handle incoming Redis messages
  handleIncomingMessage(channel, message) {
    try {
      const messageData = JSON.parse(message);
      const userId = channel.replace('chat:user:', '');
      
      console.log(`📥 Received message for user ${userId}:`, messageData);

      // Call registered message handlers
      if (this.messageHandlers.has(userId)) {
        const handler = this.messageHandlers.get(userId);
        handler(messageData);
      }
    } catch (error) {
      console.error('Error handling incoming message:', error);
    }
  }

  // Register message handler for a user
  registerMessageHandler(userId, handler) {
    this.messageHandlers.set(userId, handler);
  }

  // Unregister message handler for a user
  unregisterMessageHandler(userId) {
    this.messageHandlers.delete(userId);
  }

  // Get online users (stored in Redis)
  async getOnlineUsers() {
    if (!this.isConnected) return [];

    try {
      const keys = await this.publisher.keys('online:user:*');
      return keys.map(key => key.replace('online:user:', ''));
    } catch (error) {
      console.error('Error getting online users:', error);
      return [];
    }
  }

  // Set user as online
  async setUserOnline(userId) {
    if (!this.isConnected) return;

    try {
      await this.publisher.setEx(`online:user:${userId}`, 300, 'true'); // 5 minutes TTL
    } catch (error) {
      console.error('Error setting user online:', error);
    }
  }

  // Set user as offline
  async setUserOffline(userId) {
    if (!this.isConnected) return;

    try {
      await this.publisher.del(`online:user:${userId}`);
    } catch (error) {
      console.error('Error setting user offline:', error);
    }
  }

  // Cleanup connections
  async disconnect() {
    try {
      if (this.publisher) await this.publisher.disconnect();
      if (this.subscriber) await this.subscriber.disconnect();
      console.log('✅ Redis Chat Service disconnected');
    } catch (error) {
      console.error('Error disconnecting Redis:', error);
    }
  }
}

// Singleton instance
const chatService = new ChatService();

module.exports = chatService;
