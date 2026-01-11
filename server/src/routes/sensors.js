import express from 'express';
import SensorReading from '../models/SensorReading.js';
import Device from '../models/Device.js';
import { validate, schemas } from '../middleware/validation.js';

const router = express.Router();

/**
 * GET /api/sensors/:deviceId/latest
 * Get latest sensor reading for a device
 */
router.get('/:deviceId/latest', async (req, res, next) => {
    try {
        const { deviceId } = req.params;

        // Check if device exists
        if (!await Device.exists(deviceId)) {
            return res.status(404).json({
                success: false,
                error: `Device with ID '${deviceId}' not found`
            });
        }

        const reading = await SensorReading.findLatest(deviceId);

        if (!reading) {
            return res.status(404).json({
                success: false,
                error: 'No sensor readings found for this device'
            });
        }

        res.json({
            success: true,
            data: reading
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/sensors/:deviceId/readings
 * Get sensor readings with pagination
 */
router.get('/:deviceId/readings', validate(schemas.paginationQuery, 'query'), async (req, res, next) => {
    try {
        const { deviceId } = req.params;
        const { limit, offset } = req.query;

        // Check if device exists
        if (!await Device.exists(deviceId)) {
            return res.status(404).json({
                success: false,
                error: `Device with ID '${deviceId}' not found`
            });
        }

        const readings = await SensorReading.findByDevice(deviceId, { limit, offset });
        const total = await SensorReading.count(deviceId);

        res.json({
            success: true,
            data: readings,
            pagination: {
                total,
                limit,
                offset,
                hasMore: parseInt(offset) + readings.length < total
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/sensors/:deviceId/range
 * Get sensor readings within a time range
 */
router.get('/:deviceId/range', validate(schemas.timeRangeQuery, 'query'), async (req, res, next) => {
    try {
        const { deviceId } = req.params;
        const { startTime, endTime } = req.query;

        // Check if device exists
        if (!await Device.exists(deviceId)) {
            return res.status(404).json({
                success: false,
                error: `Device with ID '${deviceId}' not found`
            });
        }

        const readings = await SensorReading.findByTimeRange(deviceId, startTime, endTime);

        res.json({
            success: true,
            data: readings,
            count: readings.length,
            timeRange: { startTime, endTime }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/sensors/:deviceId/stats
 * Get statistics for a device
 */
router.get('/:deviceId/stats', validate(schemas.statsQuery, 'query'), async (req, res, next) => {
    try {
        const { deviceId } = req.params;
        const { hours } = req.query;

        // Check if device exists
        if (!await Device.exists(deviceId)) {
            return res.status(404).json({
                success: false,
                error: `Device with ID '${deviceId}' not found`
            });
        }

        const stats = await SensorReading.getStats(deviceId, hours);

        res.json({
            success: true,
            data: stats,
            period: `${hours} hours`
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/sensors/:deviceId/chart
 * Get chart data (aggregated by time intervals)
 */
router.get('/:deviceId/chart', validate(schemas.chartQuery, 'query'), async (req, res, next) => {
    try {
        const { deviceId } = req.params;
        const { hours, interval } = req.query;

        // Check if device exists
        if (!await Device.exists(deviceId)) {
            return res.status(404).json({
                success: false,
                error: `Device with ID '${deviceId}' not found`
            });
        }

        const chartData = await SensorReading.getChartData(deviceId, hours, interval);

        res.json({
            success: true,
            data: chartData,
            config: {
                hours,
                intervalMinutes: interval
            }
        });
    } catch (error) {
        next(error);
    }
});

export default router;
