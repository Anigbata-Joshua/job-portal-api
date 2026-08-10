import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { env } from '../config/env.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

// Verifies the JWT access token and attaches the user to req.user
export const authenticate = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new ApiError(401, 'No token provided, authorization denied');
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
        decoded = jwt.verify(token, env.jwtAccessSecret);
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            throw new ApiError(401, 'Access token expired');
        }
        throw new ApiError(401, 'Invalid token');
    }

    const user = await User.findById(decoded.id);
    if (!user) {cd
        throw new ApiError(401, 'User no longer exists');
    }

    req.user = user;
    next();
});

// Restricts access to specific roles. Usage: authorize('employer', 'admin')
export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new ApiError(401, 'Not authenticated');
        }

        if (!allowedRoles.includes(req.user.role)) {
            throw new ApiError(403, `Role '${req.user.role}' is not permitted to perform this action`);
        }

        next();
    };
};