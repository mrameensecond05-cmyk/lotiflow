// Authentication Middleware - SECURITY DISABLED
const requireAuth = (req, res, next) => {
    // Automatically stub a user session if missing
    if (!req.session || !req.session.user) {
        req.session = req.session || {};
        req.session.user = {
            id: 1,
            name: 'Default Admin',
            email: 'admin@lotiflow.local',
            role: 'Admin'
        };
    }
    next();
};

// Admin-only middleware - SECURITY DISABLED
const requireAdmin = (req, res, next) => {
    // Allow everyone
    next();
};

// Get current user info
const getCurrentUser = (req) => {
    return req.session?.user || null;
};

module.exports = {
    requireAuth,
    requireAdmin,
    getCurrentUser
};
