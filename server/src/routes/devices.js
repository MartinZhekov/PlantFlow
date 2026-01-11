import express from 'express';
import Device from '../models/Device.js';
import { validate, schemas } from '../middleware/validation.js';

const router = express.Router();

/**
 * GET /api/devices
 * Get all devices
 */
router.get('/', async (req, res, next) => {
    try {
        const devices = await Device.findAll();
        res.json({
            success: true,
            data: devices,
            count: devices.length
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/devices/:id
 * Get device by ID
 */
router.get('/:id', async (req, res, next) => {
    try {
        const device = await Device.findById(req.params.id);

        if (!device) {
            return res.status(404).json({
                success: false,
                error: `Device with ID '${req.params.id}' not found`
            });
        }

        res.json({
            success: true,
            data: device
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/devices
 * Create a new device
 */
router.post('/', validate(schemas.createDevice, 'body'), async (req, res, next) => {
    try {
        const device = await Device.create(req.body);
        res.status(201).json({
            success: true,
            data: device,
            message: 'Device created successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/devices/:id
 * Update device
 */
router.put('/:id', validate(schemas.updateDevice, 'body'), async (req, res, next) => {
    try {
        const device = await Device.update(req.params.id, req.body);
        res.json({
            success: true,
            data: device,
            message: 'Device updated successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/devices/:id
 * Delete device
 */
router.delete('/:id', async (req, res, next) => {
    try {
        const result = await Device.delete(req.params.id);
        res.json({
            success: true,
            message: result.message
        });
    } catch (error) {
        next(error);
    }
});

export default router;
