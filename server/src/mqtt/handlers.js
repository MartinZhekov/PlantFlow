import SensorReading from '../models/SensorReading.js';
import Device from '../models/Device.js';

/**
 * Handle incoming sensor data from MQTT
 */
export async function handleSensorData(topic, message, topicPrefix) {
    try {
        // Extract device ID from topic
        // Topic format: plantflow/devices/{deviceId}/sensors
        const topicParts = topic.split('/');
        const deviceIdIndex = topicParts.indexOf('devices') + 1;

        if (deviceIdIndex === 0 || deviceIdIndex >= topicParts.length) {
            console.error('❌ Invalid topic format:', topic);
            return;
        }

        const deviceId = topicParts[deviceIdIndex];

        // Parse message payload
        let data;
        try {
            data = JSON.parse(message.toString());
        } catch (parseError) {
            console.error('❌ Failed to parse MQTT message:', parseError);
            console.error('   Message:', message.toString());
            return;
        }

        // Validate data structure
        if (!isValidSensorData(data)) {
            console.error('❌ Invalid sensor data format:', data);
            return;
        }

        // Check if device exists, if not log a warning
        if (!await Device.exists(deviceId)) {
            console.warn(`⚠️  Device '${deviceId}' not registered. Creating auto-registered device.`);

            // Auto-register the device
            try {
                await Device.create({
                    id: deviceId,
                    plant_name: `Auto-registered ${deviceId}`,
                    plant_species: 'Unknown',
                    location: 'Unknown'
                });
                console.log(`✅ Auto-registered device: ${deviceId}`);
            } catch (error) {
                console.error('❌ Failed to auto-register device:', error);
                return;
            }
        }

        // Store sensor reading
        const reading = {
            device_id: deviceId,
            temperature: data.temperature,
            air_humidity: data.air_humidity || data.humidity,
            soil_moisture: data.soil_moisture || data.moisture,
            light: data.light,
            timestamp: data.timestamp || null
        };

        await SensorReading.create(reading);

        console.log(`📊 Sensor data stored for device '${deviceId}':`, {
            temperature: reading.temperature,
            air_humidity: reading.air_humidity,
            soil_moisture: reading.soil_moisture,
            light: reading.light
        });

    } catch (error) {
        console.error('❌ Error handling sensor data:', error);
    }
}

/**
 * Validate sensor data structure
 */
function isValidSensorData(data) {
    if (typeof data !== 'object' || data === null) {
        return false;
    }

    // At least one sensor value should be present
    const hasTemperature = typeof data.temperature === 'number';
    const hasHumidity = typeof data.air_humidity === 'number' || typeof data.humidity === 'number';
    const hasMoisture = typeof data.soil_moisture === 'number' || typeof data.moisture === 'number';
    const hasLight = typeof data.light === 'number';

    return hasTemperature || hasHumidity || hasMoisture || hasLight;
}

/**
 * Handle device status updates (optional)
 */
export function handleDeviceStatus(topic, message) {
    try {
        const data = JSON.parse(message.toString());
        console.log('📱 Device status update:', data);
        // You can extend this to track device online/offline status
    } catch (error) {
        console.error('❌ Error handling device status:', error);
    }
}

export default {
    handleSensorData,
    handleDeviceStatus
};
