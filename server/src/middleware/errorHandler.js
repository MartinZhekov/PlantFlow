/**
 * Global error handling middleware
 */
export function errorHandler(err, req, res, next) {
    console.error('❌ Error:', err);

    // Default error
    let status = 500;
    let message = 'Internal server error';
    let details = null;

    // Handle specific error types
    if (err.name === 'ValidationError') {
        status = 400;
        message = 'Validation error';
        details = err.details;
    } else if (err.message.includes('not found')) {
        status = 404;
        message = err.message;
    } else if (err.message.includes('already exists')) {
        status = 409;
        message = err.message;
    } else if (err.code === 'SQLITE_CONSTRAINT') {
        status = 409;
        message = 'Database constraint violation';
    } else if (err.message) {
        message = err.message;
    }

    // Send error response
    res.status(status).json({
        success: false,
        error: message,
        ...(details && { details }),
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
}

/**
 * 404 handler for undefined routes
 */
export function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.path
    });
}

export default {
    errorHandler,
    notFoundHandler
};
