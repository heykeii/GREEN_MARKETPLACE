import { protect } from './auth.middleware.js';

export const isAdmin = (req, res, next) => {
  // Check if user has admin role
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admin can access this route' });
  }
  
  next();
}; 