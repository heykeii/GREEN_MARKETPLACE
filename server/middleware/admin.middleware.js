import { protect } from './auth.middleware.js';

export const isAdmin = (req, res, next) => {
  // First ensure user is authenticated
  protect(req, res, (err) => {
    if (err) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    next();
  });
}; 