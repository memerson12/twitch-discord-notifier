import { config } from "../config/index.js";

export function requireAuth(req, res, next) {
  if (req.session.isAuthenticated) {
    next();
  } else {
    if (req.headers.accept?.includes('application/json')) {
      res.status(401).json({ error: 'Unauthorized' });
    } else {
      res.redirect('/login.html');
    }
  }
}