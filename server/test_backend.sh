#!/bin/bash
# Clean up old SQLite DB to ensure we are using MySQL
rm -f plantflow.db

echo "--- Health Check ---"
curl -s http://localhost:3001/api/health | python3 -m json.tool || echo "Failed"

echo "--- Create Device (Prisma) ---"
curl -s -X POST http://localhost:3001/api/devices \
  -H "Content-Type: application/json" \
  -d '{"id":"prisma-01","plant_name":"MySQL Plant","plant_species":"Test","location":"Office"}' | python3 -m json.tool || echo "Failed"

echo "--- Check Device List ---"
curl -s http://localhost:3001/api/devices | python3 -m json.tool || echo "Failed"

echo "--- Publish MQTT Data ---"
mosquitto_pub -h localhost -t "plantflow/devices/prisma-01/sensors" \
  -m '{"temperature":26.5,"air_humidity":55,"soil_moisture":60,"light":8000}'
echo "Published MQTT message..."
sleep 2

echo "--- Get Sensor Data ---"
curl -s http://localhost:3001/api/sensors/prisma-01/latest | python3 -m json.tool || echo "Failed"

echo "--- Get Stats ---"
curl -s "http://localhost:3001/api/sensors/prisma-01/stats?hours=1" | python3 -m json.tool || echo "Failed"
