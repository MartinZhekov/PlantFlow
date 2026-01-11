import Joi from 'joi';

/**
 * Validation schemas
 */
export const schemas = {
    // Device validation
    createDevice: Joi.object({
        id: Joi.string().required().min(1).max(100),
        plant_name: Joi.string().required().min(1).max(200),
        plant_species: Joi.string().allow('', null).max(200),
        location: Joi.string().allow('', null).max(200),
        plant_image: Joi.string().uri().allow('', null)
    }),

    updateDevice: Joi.object({
        plant_name: Joi.string().min(1).max(200),
        plant_species: Joi.string().allow('', null).max(200),
        location: Joi.string().allow('', null).max(200),
        plant_image: Joi.string().uri().allow('', null)
    }).min(1),

    // Query parameter validation
    paginationQuery: Joi.object({
        limit: Joi.number().integer().min(1).max(1000).default(100),
        offset: Joi.number().integer().min(0).default(0)
    }),

    timeRangeQuery: Joi.object({
        startTime: Joi.date().iso().required(),
        endTime: Joi.date().iso().required()
    }),

    chartQuery: Joi.object({
        hours: Joi.number().integer().min(1).max(168).default(24),
        interval: Joi.number().integer().min(5).max(1440).default(60)
    }),

    statsQuery: Joi.object({
        hours: Joi.number().integer().min(1).max(168).default(24)
    })
};

/**
 * Validation middleware factory
 */
export function validate(schema, property = 'body') {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: errors
            });
        }

        // Replace request property with validated value
        req[property] = value;
        next();
    };
}

export default {
    schemas,
    validate
};
