// controllers/auth.controller.js
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { env } from '../config/env.js';
import generateTokens from '../utils/generateTokens.js';

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

    res.status(200).json({
        success: true,
        user,
        accessToken,
        refreshToken,
    });
});

// @route   POST /api/auth/refresh
export const refreshAccessToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        throw new ApiError(401, 'Refresh token required');
    }

    let decoded;
    try {
        decoded = jwt.verify(refreshToken, env.jwtRefreshSecret);
    } catch (err) {
        throw new ApiError(401, 'Invalid or expired refresh token');
    }

    const user = await User.findById(decoded.id);
    if (!user) {
        throw new ApiError(401, 'User no longer exists');
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

    res.status(200).json({
        success: true,
        accessToken,
        refreshToken: newRefreshToken,
    });
});