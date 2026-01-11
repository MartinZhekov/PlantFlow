# PlantFlow API Documentation

Base URL: `http://localhost:3001/api`

## Authentication

### Register a new user
**POST** `/auth/register`

Body:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe"
}
```

Response (201):
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_string",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "USER"
    }
  }
}
```

### Login
**POST** `/auth/login`

Body:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response (200):
```json
{
  "success": true,
  "token": "jwt_token_string",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "USER"
  }
}
```

### Get Current User
**GET** `/auth/me`
Headers: `Authorization: Bearer <token>`

Response (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "...",
    "full_name": "...",
    "role": "..."
  }
}
```

## Devices

### List Devices
**GET** `/devices`

Response (200):
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "esp32-001",
      "plant_name": "Basil",
      "current_reading": { ... }
    }
  ]
}
```

### Get Device Details
**GET** `/devices/:id`

Response (200):
```json
{
  "success": true,
  "data": { ... }
}
```

### Create Device
**POST** `/devices`

Body:
```json
{
  "id": "esp32-002",
  "plant_name": "Fern",
  "plant_species": "Boston Fern",
  "location": "Living Room"
}
```

### Update Device
**PUT** `/devices/:id`

### Delete Device
**DELETE** `/devices/:id`

## Sensors

### Get Latest Reading
**GET** `/sensors/:deviceId/latest`

### Get Readings History
**GET** `/sensors/:deviceId/readings?limit=50`

### Get Chart Data
**GET** `/sensors/:deviceId/chart?period=24h`

### Get Statistics
**GET** `/sensors/:deviceId/stats?hours=24`
