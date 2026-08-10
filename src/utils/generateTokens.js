import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// Generates a short-lived access token and a long-lived refresh token for a given user
const generateTokens = (userId) => {
    const accessToken = jwt.sign({ id: userId }, env.jwtAccessSecret, {
        expiresIn: env.jwtAccessExpiresIn,
    });

    const refreshToken = jwt.sign({ id: userId }, env.jwtRefreshSecret, {
        expiresIn: env.jwtRefreshExpiresIn,
    });

    return { accessToken, refreshToken };
};

export default generateTokens;