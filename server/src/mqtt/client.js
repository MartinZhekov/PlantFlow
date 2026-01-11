import mqtt from 'mqtt';
import { handleSensorData } from './handlers.js';

let client = null;

/**
 * Initialize MQTT client and connect to broker
 */
export function initMqttClient(config) {
    const { brokerUrl, username, password, topicPrefix } = config;

    const options = {
        clientId: `plantflow-server-${Math.random().toString(16).slice(2, 8)}`,
        clean: true,
        reconnectPeriod: 5000,
        connectTimeout: 30000,
    };

    // Add credentials if provided
    if (username) {
        options.username = username;
        options.password = password;
    }

    console.log(`🔌 Connecting to MQTT broker: ${brokerUrl}`);
    client = mqtt.connect(brokerUrl, options);

    // Connection event handlers
    client.on('connect', () => {
        console.log('✅ Connected to MQTT broker');

        // Subscribe to all device sensor topics
        const topic = `${topicPrefix}/+/sensors`;
        client.subscribe(topic, (err) => {
            if (err) {
                console.error('❌ Failed to subscribe to topic:', err);
            } else {
                console.log(`📡 Subscribed to topic: ${topic}`);
            }
        });
    });

    client.on('error', (error) => {
        console.error('❌ MQTT connection error:', error);
    });

    client.on('reconnect', () => {
        console.log('🔄 Reconnecting to MQTT broker...');
    });

    client.on('offline', () => {
        console.log('📴 MQTT client offline');
    });

    client.on('close', () => {
        console.log('🔌 MQTT connection closed');
    });

    // Message handler
    client.on('message', (topic, message) => {
        try {
            handleSensorData(topic, message, topicPrefix);
        } catch (error) {
            console.error('❌ Error handling MQTT message:', error);
        }
    });

    return client;
}

/**
 * Get the MQTT client instance
 */
export function getMqttClient() {
    if (!client) {
        throw new Error('MQTT client not initialized. Call initMqttClient() first.');
    }
    return client;
}

/**
 * Publish a message to a topic
 */
export function publish(topic, message, options = {}) {
    if (!client || !client.connected) {
        throw new Error('MQTT client not connected');
    }

    const payload = typeof message === 'string' ? message : JSON.stringify(message);

    return new Promise((resolve, reject) => {
        client.publish(topic, payload, options, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

/**
 * Close MQTT connection
 */
export function closeMqttClient() {
    if (client) {
        client.end();
        client = null;
        console.log('MQTT client closed');
    }
}

export default {
    initMqttClient,
    getMqttClient,
    publish,
    closeMqttClient
};
