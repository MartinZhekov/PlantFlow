# PlantFlow API Server

REST API server for PlantFlow plant monitoring system with MQTT integration for ESP32 devices.

## Features

- 🌱 **Device Management**: Register and manage plant monitoring devices
- 📊 **Sensor Data Storage**: Store temperature, humidity, soil moisture, and light readings
- 🔌 **MQTT Integration**: Real-time data ingestion from ESP32 via Mosquitto broker
- 📡 **REST API**: Query sensor data, statistics, and historical trends
- 💾 **SQLite Database**: Lightweight, file-based storage
- 🔄 **Auto-registration**: Devices automatically register when sending data

## Prerequisites

- Node.js 18+ 
- Mosquitto MQTT broker (optional, for ESP32 integration)

## Installation

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` to match your configuration:
```env
PORT=3001
MQTT_BROKER_URL=mqtt://localhost:1883
DATABASE_PATH=./plantflow.db
CORS_ORIGIN=http://localhost:5173
```

## Running the Server

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

The server will start on `http://localhost:3001` (or your configured PORT).

## API Endpoints

### Health Check
- `GET /api/health` - Check if API is running

### Device Management
- `GET /api/devices` - List all devices
- `GET /api/devices/:id` - Get device by ID
- `POST /api/devices` - Register new device
- `PUT /api/devices/:id` - Update device info
- `DELETE /api/devices/:id` - Delete device

### Sensor Data
- `GET /api/sensors/:deviceId/latest` - Get latest reading
- `GET /api/sensors/:deviceId/readings?limit=100&offset=0` - Get readings with pagination
- `GET /api/sensors/:deviceId/range?startTime=...&endTime=...` - Get readings in time range
- `GET /api/sensors/:deviceId/stats?hours=24` - Get statistics (min/max/avg)
- `GET /api/sensors/:deviceId/chart?hours=24&interval=60` - Get chart data

## MQTT Integration

### Topic Structure
The server subscribes to: `plantflow/devices/+/sensors`

Where `+` is a wildcard for any device ID.

### Message Format
ESP32 devices should publish JSON messages:

```json
{
  "temperature": 24.5,
  "air_humidity": 65,
  "soil_moisture": 42,
  "light": 12500
}
```

### Example: Publishing Test Data
```bash
mosquitto_pub -h localhost -t "plantflow/devices/esp32-001/sensors" \
  -m '{"temperature":24.5,"air_humidity":65,"soil_moisture":42,"light":12500}'
```

## Database Schema

### Devices Table
- `id` (TEXT, PRIMARY KEY) - Unique device identifier
- `plant_name` (TEXT) - Name of the plant
- `plant_species` (TEXT) - Species of the plant
- `location` (TEXT) - Physical location
- `plant_image` (TEXT) - URL to plant image
- `created_at` (DATETIME) - Creation timestamp
- `updated_at` (DATETIME) - Last update timestamp

### Sensor Readings Table
- `id` (INTEGER, PRIMARY KEY) - Auto-increment ID
- `device_id` (TEXT) - Foreign key to devices
- `temperature` (REAL) - Temperature in °C
- `air_humidity` (REAL) - Air humidity in %
- `soil_moisture` (REAL) - Soil moisture in %
- `light` (REAL) - Light intensity in lux
- `timestamp` (DATETIME) - Reading timestamp

## Example API Usage

### Register a Device
```bash
curl -X POST http://localhost:3001/api/devices \
  -H "Content-Type: application/json" \
  -d '{
    "id": "esp32-001",
    "plant_name": "Basil",
    "plant_species": "Ocimum basilicum",
    "location": "Kitchen Window"
  }'
```

### Get Latest Sensor Data
```bash
curl http://localhost:3001/api/sensors/esp32-001/latest
```

### Get Chart Data
```bash
curl "http://localhost:3001/api/sensors/esp32-001/chart?hours=24&interval=60"
```

## Troubleshooting

### MQTT Connection Issues
- Ensure Mosquitto is running: `brew services start mosquitto` (macOS)
- Check broker URL in `.env`
- Test with: `mosquitto_pub -h localhost -t test -m "hello"`

### Database Issues
- Delete `plantflow.db` to reset database
- Check file permissions
- Ensure SQLite is properly installed

### CORS Issues
- Update `CORS_ORIGIN` in `.env` to match your frontend URL
- For multiple origins, modify `src/index.js`

## Project Structure

```
server/
├── src/
│   ├── database/
│   │   ├── db.js           # Database initialization
│   │   └── schema.sql      # Database schema
│   ├── models/
│   │   ├── Device.js       # Device model
│   │   └── SensorReading.js # Sensor reading model
│   ├── mqtt/
│   │   ├── client.js       # MQTT client setup
│   │   └── handlers.js     # MQTT message handlers
│   ├── routes/
│   │   ├── devices.js      # Device routes
│   │   ├── sensors.js      # Sensor routes
│   │   └── index.js        # Route aggregator
│   ├── middleware/
│   │   ├── validation.js   # Request validation
│   │   └── errorHandler.js # Error handling
│   └── index.js            # Main server file
├── .env                    # Environment config
├── .env.example            # Environment template
└── package.json            # Dependencies
```

## License

MIT
