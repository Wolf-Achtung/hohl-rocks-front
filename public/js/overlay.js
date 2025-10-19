// Minimal overlay helpers; legacy scripts may import formatTime from utils.js
import { formatTime } from './utils.js';
// (No-op module to avoid import errors; real overlay logic sits in app.js)
// Export something if legacy expects default
export const overlay = { formatTime };
