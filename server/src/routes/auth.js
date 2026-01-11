import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { verifyToken, JWT_SECRET } from '../middleware/auth.js';

const router = express.Router();

/**
 * Register a new user
 * POST /api/auth/register
 */
router.post('/register', async (req, res, next) => {
    try {
        const { email, password, full_name, role } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password are required' });
        }

        // Check if user exists
        const existingUser = await User.findByEmailWithPassword(email);
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'Email already registered' });
        }

        // Create user
        const user = await User.create({ email, password, full_name, role });

        // Generate token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    full_name: user.fullName,
                    role: user.role,
                    avatar_color: '#10B981' // Mock color
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Login user
 * POST /api/auth/login
 */
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password are required' });
        }

        // Find user
        const user = await User.findByEmailWithPassword(email);
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Verify password
        const isValid = await User.verifyPassword(password, user.password);
        if (!isValid) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.fullName,
                role: user.role,
                avatar_color: '#10B981'
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Get current user
 * GET /api/auth/me
 */
router.get('/me', verifyToken, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
});

export default router;
