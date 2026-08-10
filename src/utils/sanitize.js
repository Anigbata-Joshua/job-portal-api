import xss from 'xss';

// Recursively sanitize strings in objects or arrays to prevent stored XSS
export const sanitizeInput = (val) => {
    if (typeof val === 'string') {
        return xss(val);
    }
    if (Array.isArray(val)) {
        return val.map(sanitizeInput);
    }
    if (val !== null && typeof val === 'object') {
        const cleaned = {};
        for (const key of Object.keys(val)) {
            cleaned[key] = sanitizeInput(val[key]);
        }
        return cleaned;
    }
    return val;
};

// Express middleware to automatically sanitize req.body
export const sanitizeBody = (req, res, next) => {
    if (req.body) {
        req.body = sanitizeInput(req.body);
    }
    next();
};
