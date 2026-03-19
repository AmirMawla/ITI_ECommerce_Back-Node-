const { rateLimit } = require('express-rate-limit');
const APIError = require('../Errors/APIError');


const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
    handler: (req, res, next) => {
        throw new APIError("Too many requests, please try again later.", 429)
    }
})


const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 3, 
    message: {
        message: 'Too many password reset requests from this IP. Please try again after 15 minutes.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true, 
    legacyHeaders: false, 
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    handler: (req, res, next) => {
        throw new APIError("Too many password reset requests . Please try again after 15 minutes.", 429)
    }
});

module.exports = {
    limiter,
    passwordResetLimiter
}