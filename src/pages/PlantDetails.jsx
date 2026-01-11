import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Droplets,
  Sun,
  Thermometer,
  Wind,
  Heart,
  Calendar,
  Clock,
  TrendingUp,
  Settings,
  Bell,
  AlertTriangle,
  Leaf
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { createPageUrl } from '@/utils';
import AreaChartComponent from '@/components/charts/AreaChartComponent';
import PumpControl from '@/components/ui/PumpControl';
import { cn } from '@/lib/utils';
import { api } from '@/api/api';

// Default ranges (could be moved to DB later)
const DEFAULT_RANGES = {
  soil_moisture: { min: 40, max: 80 },
  temperature: { min: 18, max: 30 },
  air_humidity: { min: 50, max: 80 },
  light: { min: 5000, max: 15000 }
};

export default function PlantDetails() {
  const [pumpOn, setPumpOn] = useState(false);
  const [alerts, setAlerts] = useState({
    lowMoisture: true,
    autoWatering: true,
    lightReminder: false
  });

  const { id: deviceId } = useParams();

  // Fetch device details
  const { data: deviceResponse, isLoading: isDeviceLoading, isError, error } = useQuery({
    queryKey: ['device', deviceId],
    queryFn: () => api.devices.get(deviceId),
    enabled: !!deviceId
  });

  // Fetch chart data (last 24h)
  const { data: chartResponse } = useQuery({
    queryKey: ['device', deviceId, 'chart'],
    queryFn: () => api.sensors.getChartData(deviceId, 24, 60),
    enabled: !!deviceId
  });

  const device = deviceResponse?.data;
  const rawChartData = chartResponse?.data || [];

  // Map chart data
  const historyData = rawChartData.map(point => ({
    time: new Date(point.time_bucket).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    soil_moisture: point.soil_moisture,
    temperature: point.temperature,
    air_humidity: point.air_humidity,
    light: point.light
  }));

  const isLoading = isDeviceLoading;

  // Prepare plant object
  const plant = device ? {
    id: device.id,
    name: device.plant_name || 'Unnamed Plant',
    species: device.plant_species || 'Unknown Species',
    image: device.plant_image,
    location: device.location || 'Not specified',
    health: 'good', // Placeholder
    description: 'Monitoring via PlantFlow Sensor',
    addedDate: new Date(device.created_at).toLocaleDateString(),
    currentReadings: device.current_reading || {
      soil_moisture: 0,
      temperature: 0,
      air_humidity: 0,
      light: 0
    },
    optimalRanges: DEFAULT_RANGES,
    careSchedule: {
      lastWatered: 'Unknown',
      nextWatering: 'Unknown',
      lastFertilized: 'Unknown',
      nextFertilizing: 'Unknown'
    }
  } : null;


  const getStatusColor = (value, range) => {
    if (!range) return 'text-slate-600';
    if (value >= range.min && value <= range.max) return 'text-emerald-600';
    if (value < range.min * 0.8 || value > range.max * 1.2) return 'text-red-600';
    return 'text-amber-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-emerald-100 flex items-center justify-center animate-pulse">
            <Droplets className="w-8 h-8 text-emerald-600" />
          </div>
          <p className="text-slate-600">Loading plant details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Failed to load plant</h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            {error?.message || "There was a problem connecting to the sensor device."}
          </p>
          <Link to={createPageUrl('Plants')}>
            <Button>Back to Plants</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Fallback if no ID
  if (!plant && deviceId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Plant device not found</p>
          <Link to={createPageUrl('Plants')}>
            <Button>Back to Plants</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!plant) return null;

  return (
    <div className="space-y-6 w-full mx-auto">
      {/* Back Button */}
      <Link to={createPageUrl('Plants')}>
        <Button variant="ghost" className="gap-2 text-slate-600 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4" />
          Back to Plants
        </Button>
      </Link>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Plant Image */}
        <div className="relative rounded-2xl overflow-hidden aspect-[4/3] lg:aspect-square">
          <div
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: plant.image
                ? `url(${plant.image})`
                : 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
            }}
          >
            {!plant.image && (
              <div className="w-full h-full flex items-center justify-center">
                <Leaf className="w-20 h-20 text-emerald-500 opacity-40" />
              </div>
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <Badge className="absolute top-4 right-4 bg-emerald-500 text-white border-0">
            <Heart className="w-3 h-3 mr-1" />
            {plant.health}
          </Badge>
        </div>

        {/* Plant Info */}
        <div className="flex flex-col justify-center space-y-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-800 tracking-tight">
              {plant.name}
            </h1>
            <p className="text-lg text-slate-500 mt-1">{plant.species}</p>
          </div>

          <p className="text-slate-600 leading-relaxed">
            {plant.description}
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Calendar className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Added</p>
                <p className="text-sm font-medium text-slate-700">{plant.addedDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Last Reading</p>
                <p className="text-sm font-medium text-slate-700">
                  {plant.currentReadings.timestamp
                    ? new Date(plant.currentReadings.timestamp).toLocaleTimeString()
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-xl">
              <Droplets className="w-5 h-5 mx-auto text-blue-600 mb-1" />
              <p className={cn('text-lg font-bold', getStatusColor(plant.currentReadings.soil_moisture, plant.optimalRanges.soil_moisture))}>
                {plant.currentReadings.soil_moisture?.toFixed(0)}%
              </p>
              <p className="text-xs text-slate-500">Moisture</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-xl">
              <Thermometer className="w-5 h-5 mx-auto text-red-500 mb-1" />
              <p className={cn('text-lg font-bold', getStatusColor(plant.currentReadings.temperature, plant.optimalRanges.temperature))}>
                {plant.currentReadings.temperature?.toFixed(1)}°
              </p>
              <p className="text-xs text-slate-500">Temp</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-xl">
              <Wind className="w-5 h-5 mx-auto text-purple-500 mb-1" />
              <p className={cn('text-lg font-bold', getStatusColor(plant.currentReadings.air_humidity, plant.optimalRanges.air_humidity))}>
                {plant.currentReadings.air_humidity?.toFixed(0)}%
              </p>
              <p className="text-xs text-slate-500">Humidity</p>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-xl">
              <Sun className="w-5 h-5 mx-auto text-amber-500 mb-1" />
              <p className={cn('text-lg font-bold', getStatusColor(plant.currentReadings.light, plant.optimalRanges.light))}>
                {(plant.currentReadings.light / 1000)?.toFixed(1)}k
              </p>
              <p className="text-xs text-slate-500">Light</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs Section */}
      <Tabs defaultValue="readings" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="readings" className="rounded-lg">Live Readings</TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg">History</TabsTrigger>
          <TabsTrigger value="care" className="rounded-lg">Care Schedule</TabsTrigger>
          <TabsTrigger value="settings" className="rounded-lg">Settings</TabsTrigger>
        </TabsList>

        {/* Live Readings Tab */}
        <TabsContent value="readings" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'soil_moisture', label: 'Soil Moisture', icon: Droplets, color: 'blue', unit: '%' },
              { key: 'temperature', label: 'Temperature', icon: Thermometer, color: 'red', unit: '°C' },
              { key: 'air_humidity', label: 'Air Humidity', icon: Wind, color: 'purple', unit: '%' },
              { key: 'light', label: 'Light Intensity', icon: Sun, color: 'amber', unit: ' lux' }
            ].map((sensor) => (
              <Card key={sensor.key} className="border-slate-100">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 bg-${sensor.color}-100 rounded-lg`}>
                        <sensor.icon className={`w-5 h-5 text-${sensor.color}-600`} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-700">{sensor.label}</p>
                        <p className="text-xs text-slate-400">
                          Optimal: {plant.optimalRanges[sensor.key]?.min}-{plant.optimalRanges[sensor.key]?.max}{sensor.unit}
                        </p>
                      </div>
                    </div>
                    <p className={cn(
                      'text-2xl font-bold',
                      getStatusColor(plant.currentReadings[sensor.key], plant.optimalRanges[sensor.key])
                    )}>
                      {plant.currentReadings[sensor.key]}{sensor.unit}
                    </p>
                  </div>
                  <Progress
                    value={(plant.currentReadings[sensor.key] / Math.max(100, plant.optimalRanges[sensor.key]?.max * 1.5)) * 100}
                    className="h-2"
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pump Control */}
          <PumpControl
            isOn={pumpOn}
            onToggle={() => setPumpOn(!pumpOn)}
            lastActivated={plant.careSchedule.lastWatered}
          />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-slate-100">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  Moisture History (24h)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AreaChartComponent
                  data={historyData}
                  dataKey="soil_moisture"
                  color="#3B82F6"
                  gradientId="moistureHistory"
                  title="Moisture"
                  unit="%"
                />
              </CardContent>
            </Card>
            <Card className="border-slate-100">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-red-500" />
                  Temperature History (24h)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AreaChartComponent
                  data={historyData}
                  dataKey="temperature"
                  color="#EF4444"
                  gradientId="tempHistory"
                  title="Temperature"
                  unit="°C"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Care Schedule Tab */}
        <TabsContent value="care" className="mt-6">
          <div className="p-4 rounded-xl bg-slate-50 text-center text-slate-500">
            Care schedule tracking not connected to sensors yet.
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-6">
          <Card className="border-slate-100">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Alert Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'lowMoisture', label: 'Low Moisture Alert', desc: 'Get notified when soil moisture drops below optimal range' },
                { key: 'autoWatering', label: 'Auto Watering', desc: 'Automatically activate pump when moisture is low' },
                { key: 'lightReminder', label: 'Light Reminder', desc: 'Remind to move plant for better light exposure' }
              ].map((setting) => (
                <div key={setting.key} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                  <div>
                    <p className="font-medium text-slate-700">{setting.label}</p>
                    <p className="text-sm text-slate-500">{setting.desc}</p>
                  </div>
                  <Switch
                    checked={alerts[setting.key]}
                    onCheckedChange={(checked) => setAlerts({ ...alerts, [setting.key]: checked })}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}