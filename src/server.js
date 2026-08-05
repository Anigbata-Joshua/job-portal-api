import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { connectDatabase, closeDatabase } from './config/db.js';
import errorHandler from './middleware/error.middleware.js';
import adminRoutes from './routes/admin.route.js';
import authRoutes from './routes/auth.route.js';
import companyRoutes from './routes/company.route.js';

// Connect to database
await connectDatabase();

const app = express();

// Middleware
app.use(cors({
    origin: env.corsOrigins.length > 0 ? env.corsOrigins : env.frontendURI,
    credentials: true,
}));
app.use(express.json());

// Test route
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Job Portal API is running!',
        environment: env.nodeEnv,
        isProduction: env.isProduction,
    });
});

// 📍 API Routes
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);





app.use(errorHandler); // must be last

const PORT = env.port;
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📦 Environment: ${env.nodeEnv}`);
    console.log(`🌐 Frontend URI: ${env.frontendURI}`);
    if (env.corsOrigins.length > 0) {
        console.log(`🔗 CORS Origins: ${env.corsOrigins.join(', ')}`);
    }
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await closeDatabase();
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

export default app;