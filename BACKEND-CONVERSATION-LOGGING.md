# Backend-Briefing: Conversation Logging & Sicherheit

**Datum:** 2026-02-01
**Projekt:** hohl.rocks Backend (Railway)
**Ziel:** Chat-Gespräche protokollieren und Sicherheit erhöhen

---

## 1. Übersicht

Dieses Briefing beschreibt die Implementierung von:
1. **Conversation Logging** - Alle Chat-Gespräche werden gespeichert
2. **Content Moderation** - Zusätzliche Sicherheitsprüfung vor der KI-Antwort
3. **Admin-Dashboard API** - Endpoints zum Abrufen der Logs

---

## 2. Datenbank-Schema

### 2.1 Conversation Log Tabelle (PostgreSQL)

```sql
CREATE TABLE chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(64) NOT NULL,
  user_message TEXT NOT NULL,
  ai_response TEXT,
  model VARCHAR(32) DEFAULT 'claude',
  ip_address VARCHAR(45),  -- IPv4 oder IPv6
  user_agent TEXT,
  flagged BOOLEAN DEFAULT FALSE,
  flag_reason VARCHAR(255),
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Index für schnelle Abfragen
  INDEX idx_chat_logs_created_at (created_at DESC),
  INDEX idx_chat_logs_session (session_id),
  INDEX idx_chat_logs_flagged (flagged) WHERE flagged = TRUE
);

-- Optional: Automatische Bereinigung nach 90 Tagen (DSGVO)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM chat_logs WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;
```

### 2.2 Alternative: MongoDB Schema

```javascript
const chatLogSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  userMessage: { type: String, required: true },
  aiResponse: { type: String },
  model: { type: String, default: 'claude' },
  ipAddress: { type: String },
  userAgent: { type: String },
  flagged: { type: Boolean, default: false },
  flagReason: { type: String },
  responseTimeMs: { type: Number },
  createdAt: { type: Date, default: Date.now, expires: 7776000 } // 90 Tage TTL
});

chatLogSchema.index({ createdAt: -1 });
chatLogSchema.index({ flagged: 1 }, { partialFilterExpression: { flagged: true } });
```

---

## 3. Chat-Endpoint mit Logging

### 3.1 Aktualisierter Chat-Handler

```javascript
import { v4 as uuidv4 } from 'uuid';
import { pool } from './db.js';  // PostgreSQL Pool
import { moderateContent } from './moderation.js';

// Session-ID aus Cookie oder generieren
function getSessionId(req, res) {
  let sessionId = req.cookies?.chat_session;
  if (!sessionId) {
    sessionId = uuidv4();
    res.cookie('chat_session', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 Stunden
    });
  }
  return sessionId;
}

app.post('/api/chat', chatLimiter, async (req, res) => {
  const startTime = Date.now();
  const sessionId = getSessionId(req, res);
  const { messages } = req.body;

  // Letzte User-Nachricht extrahieren
  const userMessage = messages.find(m => m.role === 'user')?.content || '';

  // 1. Content Moderation VORHER
  const modResult = await moderateContent(userMessage);

  if (modResult.flagged) {
    // Log den Versuch trotzdem
    await logConversation({
      sessionId,
      userMessage,
      aiResponse: null,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      flagged: true,
      flagReason: modResult.reason,
      responseTimeMs: Date.now() - startTime
    });

    return res.json({
      response: "Das ist nicht mein Thema. Frag mich lieber was über KI, meine Arbeit oder den SC Freiburg!",
      flagged: true
    });
  }

  // 2. KI-Antwort generieren
  let aiResponse;
  try {
    aiResponse = await generateAIResponse(messages);
  } catch (error) {
    aiResponse = 'Entschuldige, gerade kann ich nicht antworten.';
  }

  // 3. Gespräch loggen
  await logConversation({
    sessionId,
    userMessage,
    aiResponse,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    flagged: false,
    flagReason: null,
    responseTimeMs: Date.now() - startTime
  });

  res.json({ response: aiResponse });
});

// Logging-Funktion
async function logConversation(data) {
  try {
    await pool.query(`
      INSERT INTO chat_logs
        (session_id, user_message, ai_response, ip_address, user_agent, flagged, flag_reason, response_time_ms)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      data.sessionId,
      data.userMessage,
      data.aiResponse,
      data.ipAddress,
      data.userAgent,
      data.flagged,
      data.flagReason,
      data.responseTimeMs
    ]);
  } catch (error) {
    console.error('Failed to log conversation:', error);
    // Logging-Fehler sollte die User-Experience nicht beeinträchtigen
  }
}
```

---

## 4. Content Moderation

### 4.1 Keyword-basierte Moderation

```javascript
// moderation.js

const BLOCKED_KEYWORDS = [
  // Illegale Aktivitäten
  'bomb', 'waffe', 'drogen', 'hack', 'ddos', 'exploit',
  // Gewalt
  'töten', 'morden', 'verletzen', 'angriff',
  // Betrug
  'betrug', 'scam', 'phishing',
  // Weitere nach Bedarf...
];

const BLOCKED_PATTERNS = [
  /wie\s+(bau|mach|erstell).*\s+(bombe|waffe|virus|malware)/i,
  /anleitung\s+(für|zu|zum)\s+(hack|einbruch|betrug)/i,
  /passwort\s+(knack|hack|brech)/i,
];

export async function moderateContent(text) {
  const lowerText = text.toLowerCase();

  // 1. Keyword-Check
  for (const keyword of BLOCKED_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      return {
        flagged: true,
        reason: `blocked_keyword:${keyword}`
      };
    }
  }

  // 2. Pattern-Check
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return {
        flagged: true,
        reason: `blocked_pattern:${pattern.source.substring(0, 30)}`
      };
    }
  }

  // 3. Optional: Anthropic Moderation API
  // const anthropicResult = await checkWithAnthropic(text);
  // if (anthropicResult.flagged) return anthropicResult;

  return { flagged: false, reason: null };
}
```

### 4.2 Anthropic Moderation API (Optional)

```javascript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

export async function checkWithAnthropic(text) {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 10,
      messages: [{
        role: 'user',
        content: `Ist diese Nachricht problematisch (illegal, gewaltverherrlichend, betrügerisch)? Antworte nur mit JA oder NEIN: "${text}"`
      }]
    });

    const answer = response.content[0].text.trim().toUpperCase();
    return {
      flagged: answer === 'JA',
      reason: answer === 'JA' ? 'anthropic_moderation' : null
    };
  } catch (error) {
    console.error('Anthropic moderation failed:', error);
    return { flagged: false, reason: null };
  }
}
```

---

## 5. Admin-Dashboard API

### 5.1 Admin-Authentifizierung

```javascript
// Einfache API-Key Authentifizierung für Admin-Endpoints
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

function adminAuth(req, res, next) {
  const apiKey = req.headers['x-admin-key'];

  if (!apiKey || apiKey !== ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}
```

### 5.2 Admin-Endpoints

```javascript
// Alle Logs abrufen (mit Pagination)
app.get('/api/admin/chat-logs', adminAuth, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = (page - 1) * limit;
  const onlyFlagged = req.query.flagged === 'true';

  let query = 'SELECT * FROM chat_logs';
  let countQuery = 'SELECT COUNT(*) FROM chat_logs';
  const params = [];

  if (onlyFlagged) {
    query += ' WHERE flagged = TRUE';
    countQuery += ' WHERE flagged = TRUE';
  }

  query += ' ORDER BY created_at DESC LIMIT $1 OFFSET $2';
  params.push(limit, offset);

  const [logs, countResult] = await Promise.all([
    pool.query(query, params),
    pool.query(countQuery)
  ]);

  res.json({
    logs: logs.rows,
    pagination: {
      page,
      limit,
      total: parseInt(countResult.rows[0].count),
      pages: Math.ceil(countResult.rows[0].count / limit)
    }
  });
});

// Einzelne Session abrufen
app.get('/api/admin/chat-logs/session/:sessionId', adminAuth, async (req, res) => {
  const { sessionId } = req.params;

  const result = await pool.query(
    'SELECT * FROM chat_logs WHERE session_id = $1 ORDER BY created_at ASC',
    [sessionId]
  );

  res.json({ conversation: result.rows });
});

// Statistiken
app.get('/api/admin/chat-stats', adminAuth, async (req, res) => {
  const stats = await pool.query(`
    SELECT
      COUNT(*) as total_messages,
      COUNT(DISTINCT session_id) as unique_sessions,
      COUNT(*) FILTER (WHERE flagged = TRUE) as flagged_messages,
      AVG(response_time_ms)::INTEGER as avg_response_time,
      DATE_TRUNC('day', created_at) as day,
      COUNT(*) as messages_per_day
    FROM chat_logs
    WHERE created_at > NOW() - INTERVAL '30 days'
    GROUP BY DATE_TRUNC('day', created_at)
    ORDER BY day DESC
  `);

  res.json({
    summary: {
      totalMessages: stats.rows.reduce((sum, r) => sum + parseInt(r.messages_per_day), 0),
      uniqueSessions: stats.rows[0]?.unique_sessions || 0,
      flaggedMessages: stats.rows.reduce((sum, r) => sum + parseInt(r.flagged_messages || 0), 0),
      avgResponseTime: stats.rows[0]?.avg_response_time || 0
    },
    dailyStats: stats.rows
  });
});

// Log manuell als problematisch markieren
app.patch('/api/admin/chat-logs/:id/flag', adminAuth, async (req, res) => {
  const { id } = req.params;
  const { flagged, reason } = req.body;

  await pool.query(
    'UPDATE chat_logs SET flagged = $1, flag_reason = $2 WHERE id = $3',
    [flagged, reason, id]
  );

  res.json({ success: true });
});

// Logs exportieren (CSV)
app.get('/api/admin/chat-logs/export', adminAuth, async (req, res) => {
  const { from, to } = req.query;

  const result = await pool.query(`
    SELECT
      created_at,
      session_id,
      user_message,
      ai_response,
      flagged,
      flag_reason,
      response_time_ms
    FROM chat_logs
    WHERE created_at BETWEEN $1 AND $2
    ORDER BY created_at DESC
  `, [from || '1970-01-01', to || new Date().toISOString()]);

  // CSV generieren
  const headers = ['Datum', 'Session', 'User-Nachricht', 'KI-Antwort', 'Markiert', 'Grund', 'Antwortzeit (ms)'];
  const csv = [
    headers.join(';'),
    ...result.rows.map(row => [
      row.created_at,
      row.session_id,
      `"${(row.user_message || '').replace(/"/g, '""')}"`,
      `"${(row.ai_response || '').replace(/"/g, '""')}"`,
      row.flagged ? 'Ja' : 'Nein',
      row.flag_reason || '',
      row.response_time_ms
    ].join(';'))
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=chat-logs-${new Date().toISOString().split('T')[0]}.csv`);
  res.send('\uFEFF' + csv); // BOM für Excel
});
```

---

## 6. Umgebungsvariablen

Füge diese zum Backend hinzu:

```bash
# Datenbank
DATABASE_URL=postgresql://user:pass@host:5432/hohl_rocks

# Admin-Zugang
ADMIN_API_KEY=ein-sicherer-zufaelliger-key-hier

# Moderation (optional)
ENABLE_ANTHROPIC_MODERATION=false
```

---

## 7. DSGVO-Compliance

### 7.1 Datenschutz-Hinweise (bereits im Frontend implementiert)

Das Frontend zeigt bereits den Hinweis:
> "Gespräche werden zur Qualitätssicherung gespeichert. [Datenschutz]"

### 7.2 Automatische Löschung

```javascript
// Cron-Job für automatische Bereinigung (täglich um 3:00 Uhr)
import cron from 'node-cron';

cron.schedule('0 3 * * *', async () => {
  try {
    const result = await pool.query(
      "DELETE FROM chat_logs WHERE created_at < NOW() - INTERVAL '90 days'"
    );
    console.log(`Cleaned up ${result.rowCount} old chat logs`);
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
});
```

### 7.3 Daten-Export für Nutzer (optional)

```javascript
// Nutzer kann seine Daten anfordern (per Session-ID aus Cookie)
app.get('/api/my-data', async (req, res) => {
  const sessionId = req.cookies?.chat_session;

  if (!sessionId) {
    return res.status(400).json({ error: 'Keine Session gefunden' });
  }

  const result = await pool.query(
    'SELECT created_at, user_message, ai_response FROM chat_logs WHERE session_id = $1 ORDER BY created_at ASC',
    [sessionId]
  );

  res.json({ conversations: result.rows });
});

// Nutzer kann seine Daten löschen
app.delete('/api/my-data', async (req, res) => {
  const sessionId = req.cookies?.chat_session;

  if (!sessionId) {
    return res.status(400).json({ error: 'Keine Session gefunden' });
  }

  await pool.query('DELETE FROM chat_logs WHERE session_id = $1', [sessionId]);
  res.clearCookie('chat_session');

  res.json({ success: true, message: 'Alle deine Chat-Daten wurden gelöscht.' });
});
```

---

## 8. Implementierungs-Checkliste

- [ ] PostgreSQL/MongoDB Tabelle erstellen
- [ ] `logConversation()` Funktion implementieren
- [ ] Chat-Endpoint mit Logging erweitern
- [ ] Content Moderation implementieren
- [ ] Admin-Authentifizierung einrichten
- [ ] Admin-Endpoints implementieren:
  - [ ] GET `/api/admin/chat-logs`
  - [ ] GET `/api/admin/chat-logs/session/:id`
  - [ ] GET `/api/admin/chat-stats`
  - [ ] PATCH `/api/admin/chat-logs/:id/flag`
  - [ ] GET `/api/admin/chat-logs/export`
- [ ] Umgebungsvariablen setzen
- [ ] Cron-Job für automatische Bereinigung
- [ ] Optional: Nutzer-Datenexport/-löschung

---

## 9. Schnellzugriff für Wolf

Nach der Implementierung kannst du die Logs so abrufen:

```bash
# Alle Logs der letzten Seite
curl -H "x-admin-key: DEIN_KEY" https://hohl-rocks-back.railway.app/api/admin/chat-logs

# Nur markierte/verdächtige Logs
curl -H "x-admin-key: DEIN_KEY" https://hohl-rocks-back.railway.app/api/admin/chat-logs?flagged=true

# Statistiken
curl -H "x-admin-key: DEIN_KEY" https://hohl-rocks-back.railway.app/api/admin/chat-stats

# Export als CSV
curl -H "x-admin-key: DEIN_KEY" "https://hohl-rocks-back.railway.app/api/admin/chat-logs/export?from=2026-01-01&to=2026-02-01" -o logs.csv
```

---

**Erstellt von:** Claude Code
**Für:** hohl.rocks Backend - Conversation Logging & Sicherheit
