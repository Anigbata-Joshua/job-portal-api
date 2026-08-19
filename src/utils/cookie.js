import { env } from '../config/env.js';


export const parseCookies = (cookieHeader) => {
    const list = {};
    if (!cookieHeader) return list;
    cookieHeader.split(';').forEach((cookie) => {
        const parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });
    return list;
};


export const setTokenCookies = (res, accessToken, refreshToken) => {
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

export const clearTokenCookies = (res) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
};

export const getRefreshToken = (req) => {
    if (req.headers.cookie) {
        const cookies = parseCookies(req.headers.cookie);
        if (cookies.refreshToken) {
            return cookies.refreshToken;
        }
    }
    return req.body.refreshToken || null;
};
