// controllers/auth.controller.js
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { env } from '../config/env.js';
import generateTokens from '../utils/generateTokens.js';

// Helper to parse cookies manually
const parseCookies = (cookieHeader) => {
    const list = {};
    if (!cookieHeader) return list;
    cookieHeader.split(';').forEach((cookie) => {
        const parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });
    return list;
};

// Helper to set HttpOnly cookies on response
const setTokenCookies = (res, accessToken, refreshToken) => {
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: env.isProduction,
        sameSite: 'strict',
        maxAge: 45 * 60 * 1000, // 45 minutes
    });
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: env.isProduction,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
};

// @route   POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new ApiError(409, 'An account with this email already exists');
    }

    // Only allow job_seeker or employer at registration.
    const allowedSignupRoles = ['job_seeker', 'employer'];
    const assignedRole = allowedSignupRoles.includes(role) ? role : 'job_seeker';

    const user = await User.create({ name, email, password, role: assignedRole });

    const { accessToken, refreshToken } = generateTokens(user._id);

    // Save refresh token to user document
    user.refreshToken = refreshToken;
    await user.save();

    setTokenCookies(res, accessToken, refreshToken);

    res.status(201).json({
        success: true,
        user,
        accessToken,
        refreshToken,
    });
});

// @route   POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, 'Please provide email and password');
    }

    // Explicitly select password since it may be excluded by default in the schema
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        throw new ApiError(401, 'Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new ApiError(401, 'Invalid email or password');
    }

    const { accessToken, refreshToken } = generateTokens(user._id);

    // Save refresh token to user document
    user.refreshToken = refreshToken;
    await user.save();

    setTokenCookies(res, accessToken, refreshToken);

    res.status(200).json({
        success: true,
        user,
        accessToken,
        refreshToken,
    });
});

// @route   POST /api/auth/refresh
export const refreshAccessToken = asyncHandler(async (req, res) => {
    let token = null;

    if (req.headers.cookie) {
        const cookies = parseCookies(req.headers.cookie);
        token = cookies.refreshToken;
    }
    if (!token) {
        token = req.body.refreshToken;
    }

    if (!token) {
        throw new ApiError(401, 'Refresh token required');
    }

    let decoded;
    try {
        decoded = jwt.verify(token, env.jwtRefreshSecret);
    } catch (err) {
        throw new ApiError(401, 'Invalid or expired refresh token');
    }

    const user = await User.findById(decoded.id);
    if (!user) {
        throw new ApiError(401, 'User no longer exists');
    }

    // Refresh Token Rotation (RTR) - Reuse Detection:
    // If the token sent doesn't match the active refresh token in the DB,
    // it implies reuse (the token was stolen or replayed). Wre revoke access.
    if (user.refreshToken !== token) {
        user.refreshToken = null; // Clear active token to force login from all devices
        await user.save();
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        throw new ApiError(401, 'Potential token reuse detected. Access revoked. Please log in again.');
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

    // Update with the rotated refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    setTokenCookies(res, accessToken, newRefreshToken);

    res.status(200).json({
        success: true,
        accessToken,
        refreshToken: newRefreshToken,
    });
});

// @route   POST /api/auth/logout
export const logout = asyncHandler(async (req, res) => {
    let token = null;

    if (req.headers.cookie) {
        const cookies = parseCookies(req.headers.cookie);
        token = cookies.refreshToken;
    }
    if (!token) {
        token = req.body.refreshToken;
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, env.jwtRefreshSecret);
            const user = await User.findById(decoded.id);
            if (user) {
                user.refreshToken = null;
                await user.save();
            }
        } catch (err) {
            // Ignore error since we are logging out anyway
        }
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.status(200).json({
        success: true,
        message: 'Logged out successfully',
    });
});