import express from 'express';
export const sseRouter = express.Router();
sseRouter.get('/pulse', (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  res.flushHeaders?.();
  let i = 0;
  const t = setInterval(() => {
    i += 1;
    res.write(`event: ping\n`);
    res.write(`data: {"i": ${i}, "ts": "${new Date().toISOString()}"}\n\n`);
    if (i >= 30) { clearInterval(t); res.write('event: end\n'); res.write('data: done\n\n'); res.end(); }
  }, 3000);
  req.on('close', () => clearInterval(t));
});
