-- Devices table
CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  plant_name TEXT NOT NULL,
  plant_species TEXT,
  location TEXT,
  plant_image TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sensor readings table
CREATE TABLE IF NOT EXISTS sensor_readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT NOT NULL,
  temperature REAL,
  air_humidity REAL,
  soil_moisture REAL,
  light REAL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- Index for faster queries by device and time
CREATE INDEX IF NOT EXISTS idx_readings_device_time ON sensor_readings(device_id, timestamp DESC);

-- Index for device lookups
CREATE INDEX IF NOT EXISTS idx_devices_id ON devices(id);
