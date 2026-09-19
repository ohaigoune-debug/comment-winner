const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
let DatabaseSync;
try {
  ({ DatabaseSync } = require('node:sqlite'));
} catch {
  console.error('\n  نسخة Node.js قديمة. ثبّت أحدث نسخة من nodejs.org ثم أعد المحاولة.');
  console.error('  Your Node.js is too old. Install the latest version from nodejs.org\n');
  process.exit(1);
}
const dotenv = require('dotenv');
const metaApi = require('./meta-api');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const APP_VERSION = require('./package.json').version;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize Database
const dbPath = path.join(__dirname, 'database.db');
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL');

// Create database tables if they don't exist
function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS contests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contest_id INTEGER NOT NULL,
      platform TEXT NOT NULL CHECK(platform IN ('facebook', 'instagram')),
      post_id TEXT NOT NULL,
      post_url TEXT NOT NULL,
      post_type TEXT,
      total_comments INTEGER DEFAULT 0,
      fetched_at DATETIME,
      FOREIGN KEY(contest_id) REFERENCES contests(id),
      UNIQUE(contest_id, platform, post_id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      comment_id TEXT NOT NULL UNIQUE,
      user_id TEXT,
      username TEXT,
      name TEXT NOT NULL,
      text TEXT,
      likes_count INTEGER DEFAULT 0,
      created_time DATETIME,
      is_reply INTEGER DEFAULT 0,
      parent_comment_id TEXT,
      mentions_count INTEGER DEFAULT 0,
      is_eligible INTEGER DEFAULT 1,
      fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(post_id) REFERENCES posts(id)
    );

    CREATE TABLE IF NOT EXISTS winners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contest_id INTEGER NOT NULL,
      comment_id TEXT NOT NULL,
      user_id TEXT,
      username TEXT,
      name TEXT NOT NULL,
      comment_text TEXT,
      winner_rank INTEGER,
      drawn_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(contest_id) REFERENCES contests(id),
      FOREIGN KEY(comment_id) REFERENCES comments(comment_id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
    CREATE INDEX IF NOT EXISTS idx_comments_eligible ON comments(is_eligible);
    CREATE INDEX IF NOT EXISTS idx_winners_contest_id ON winners(contest_id);
  `);
}

// Initialize database on startup
try {
  initializeDatabase();
  console.log('✓ Database initialized');
} catch (error) {
  console.error('✗ Database initialization error:', error.message);
}

// Helper function to safely log errors (no token exposure)
function logError(context, error) {
  const message = error.message || String(error);
  // Don't log sensitive info like tokens
  if (message.includes('401') || message.includes('403')) {
    console.error(`[${context}] Authentication error - check your Meta Access Token`);
  } else if (message.includes('4')) {
    console.error(`[${context}] API Error: ${message.substring(0, 100)}`);
  } else {
    console.error(`[${context}] Error: ${message}`);
  }
}

// ============ Meta API Helper Functions ============

// Extract Post ID from Facebook URL
function extractFacebookPostId(url) {
  try {
    const fbUrlPatterns = [
      /\/posts\/(\d+)/,
      /fbid=(\d+)/,
      /v\.(\d+)/,
      /\/photo\.php\?fbid=(\d+)/,
      /\/video\.php\?v=(\d+)/,
      /\/reel\/(\d+)/
    ];

    for (const pattern of fbUrlPatterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  } catch (error) {
    return null;
  }
}

// Extract Instagram Media ID from URL
function extractInstagramMediaId(url) {
  try {
    const igUrlPatterns = [
      /\/p\/([A-Za-z0-9_-]+)/,
      /\/reel\/([A-Za-z0-9_-]+)/,
      /\/tv\/([A-Za-z0-9_-]+)/
    ];

    for (const pattern of igUrlPatterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  } catch (error) {
    return null;
  }
}

// Extract mentions from text
function extractMentions(text) {
  if (!text) return 0;
  const mentions = text.match(/@\w+/g) || [];
  return mentions.length;
}

// ============ API Endpoints ============

// GET /api/meta/pages - Get Facebook pages
app.get('/api/meta/pages', async (req, res) => {
  try {
    const accessToken = req.query.accessToken || process.env.META_ACCESS_TOKEN;

    if (!accessToken) {
      return res.status(400).json({
        error: 'التوكن غير موجود',
        message: 'ضع Meta Access Token في الإعدادات أولًا'
      });
    }

    // Fetch pages from Meta API
    try {
      const pages = await metaApi.getFacebookPages(accessToken);

      if (pages.length === 0) {
        return res.status(400).json({
          error: 'هذا التوكن لا يرى أي صفحة',
          message: 'أنشئ توكنًا بصلاحيات pages_show_list و pages_read_engagement و pages_read_user_content، واختر صفحتك عند إنشائه.'
        });
      }

      res.json({
        success: true,
        pages: pages.map(page => ({
          id: page.id,
          name: page.name
        })),
        message: `Found ${pages.length} Facebook page(s)`
      });
    } catch (metaError) {
      console.error('Meta API Error:', metaError.message);
      return res.status(401).json({
        error: metaError.message,
        message: 'Failed to fetch pages. Check your Access Token.'
      });
    }
  } catch (error) {
    logError('GET /api/meta/pages', error);
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
});

// POST /api/posts/resolve - Resolve post URL to post ID
app.post('/api/posts/resolve', (req, res) => {
  try {
    const { url, platform } = req.body;

    if (!url || !platform) {
      return res.status(400).json({ error: 'Missing url or platform' });
    }

    let postId = null;

    if (platform === 'facebook') {
      postId = extractFacebookPostId(url);
      if (!postId) {
        return res.status(400).json({
          error: 'Cannot extract Post ID from URL',
          message: 'Please enter the Post ID manually or use a direct post link'
        });
      }
    } else if (platform === 'instagram') {
      postId = extractInstagramMediaId(url);
      if (!postId) {
        return res.status(400).json({
          error: 'Cannot extract Media ID from URL',
          message: 'Please enter the Media ID manually or use a direct post link'
        });
      }
    }

    res.json({ postId, platform, url });
  } catch (error) {
    logError('POST /api/posts/resolve', error);
    res.status(500).json({ error: 'Failed to resolve post' });
  }
});

// POST /api/comments/fetch - Fetch comments from post
app.post('/api/comments/fetch', async (req, res) => {
  try {
    const { platform, postId, postUrl } = req.body;
    const accessToken = req.body.accessToken || process.env.META_ACCESS_TOKEN;

    if (!platform || !postId) {
      return res.status(400).json({ error: 'Missing platform or postId' });
    }

    if (!accessToken) {
      return res.status(401).json({
        error: 'التوكن غير موجود',
        message: 'ضع Meta Access Token في الإعدادات أولًا'
      });
    }

    let comments = [];
    try {
      if (platform === 'facebook') {
        comments = await metaApi.fetchFacebookCommentsAsPage(postId, accessToken, req.body.facebookPageId);
      } else if (platform === 'instagram') {
        comments = await metaApi.fetchInstagramComments(postId, accessToken);
      }
    } catch (metaError) {
      logError('POST /api/comments/fetch', metaError);
      return res.status(502).json({
        error: 'تعذّر جلب التعليقات من فيسبوك',
        message: metaError.message
      });
    }

    if (comments.length === 0) {
      return res.status(400).json({
        error: 'No comments found',
        message: 'The post may not have any comments or may not be accessible.'
      });
    }

    // comment_id is globally unique, so a second fetch of the same post would
    // insert nothing and leave the new contest empty. Refetching refreshes the
    // post that is already stored instead of creating a rival empty one.
    const existingPost = db.prepare(
      'SELECT id, contest_id FROM posts WHERE platform = ? AND post_id = ?'
    ).get(platform, postId);

    let newContestId;
    let newPostRowId;

    if (existingPost) {
      newContestId = existingPost.contest_id;
      newPostRowId = existingPost.id;
      db.prepare('DELETE FROM comments WHERE post_id = ?').run(newPostRowId);
      db.prepare('DELETE FROM winners WHERE contest_id = ?').run(newContestId);
      db.prepare('UPDATE posts SET total_comments = ?, fetched_at = ? WHERE id = ?')
        .run(comments.length, new Date().toISOString(), newPostRowId);
    } else {
      const contestRow = db.prepare('INSERT INTO contests (name) VALUES (?)').run(
        `${platform.toUpperCase()} - ${new Date().toLocaleDateString('ar')}`
      );
      newContestId = contestRow.lastInsertRowid;

      const postRow = db.prepare(
        'INSERT INTO posts (contest_id, platform, post_id, post_url, total_comments, fetched_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(
        newContestId,
        platform,
        postId,
        postUrl || `https://${platform}.com/post/${postId}`,
        comments.length,
        new Date().toISOString()
      );
      newPostRowId = postRow.lastInsertRowid;
    }

    // Insert comments
    const insertComment = db.prepare(`
      INSERT OR IGNORE INTO comments (
        post_id, comment_id, user_id, username, name, text,
        likes_count, created_time, is_reply, mentions_count, is_eligible
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Meta omits fields like username on some accounts; binding undefined throws,
    // which would drop those commenters from the draw without a trace.
    let inserted = 0;
    let skipped = 0;
    comments.forEach(comment => {
      try {
        const result = insertComment.run(
          newPostRowId,
          comment.comment_id,
          comment.user_id ?? null,
          comment.username ?? null,
          comment.name ?? 'بدون اسم',
          comment.text ?? null,
          comment.likes_count ?? 0,
          comment.created_time ?? null,
          comment.is_reply ?? 0,
          comment.mentions_count ?? 0,
          comment.is_eligible ?? 1
        );
        // OR IGNORE reports no error when it stores nothing, so count real rows
        if (result.changes > 0) inserted++; else skipped++;
      } catch {
        skipped++;
      }
    });

    res.json({
      success: true,
      commentsFetched: comments.length,
      commentsInserted: inserted,
      commentsSkipped: skipped,
      platform,
      postId,
      contestId: newContestId
    });
  } catch (error) {
    logError('POST /api/comments/fetch', error);
    res.status(500).json({ error: 'Failed to fetch comments', details: error.message });
  }
});

// GET /api/comments - Get comments for contest
app.get('/api/comments', (req, res) => {
  try {
    const { contestId, platform } = req.query;

    if (!contestId) {
      return res.status(400).json({ error: 'Missing contestId' });
    }

    const query = platform
      ? `SELECT c.*, p.platform, p.post_url FROM comments c
         JOIN posts p ON c.post_id = p.id
         WHERE p.contest_id = ? AND p.platform = ?
         ORDER BY c.created_time DESC`
      : `SELECT c.*, p.platform, p.post_url FROM comments c
         JOIN posts p ON c.post_id = p.id
         WHERE p.contest_id = ?
         ORDER BY c.created_time DESC`;

    const params = platform ? [contestId, platform] : [contestId];
    const comments = db.prepare(query).all(...params);

    res.json(comments);
  } catch (error) {
    logError('GET /api/comments', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// POST /api/draw - Draw winners
app.post('/api/draw', (req, res) => {
  try {
    const {
      contestId,
      winnerCount,
      minMentions = 0,
      requiredKeyword = '',
      filterDuplicates = false,
      excludePageOwner = false,
      excludeReplies = false
    } = req.body;

    if (!contestId || !winnerCount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get eligible comments
    let query = `
      SELECT c.*, p.post_id, p.post_url, p.platform
      FROM comments c
      JOIN posts p ON c.post_id = p.id
      WHERE p.contest_id = ? AND c.is_eligible = 1
    `;
    const params = [contestId];

    if (excludeReplies) {
      query += ` AND c.is_reply = 0`;
    }

    if (minMentions > 0) {
      query += ` AND c.mentions_count >= ?`;
      params.push(minMentions);
    }

    if (requiredKeyword) {
      query += ` AND c.text LIKE ?`;
      params.push(`%${requiredKeyword}%`);
    }

    query += ` ORDER BY RANDOM()`;

    let candidates = db.prepare(query).all(...params);

    if (filterDuplicates || excludePageOwner) {
      const seen = new Set();
      candidates = candidates.filter(c => {
        if (seen.has(c.user_id || c.username)) return false;
        seen.add(c.user_id || c.username);
        return true;
      });
    }

    if (candidates.length < winnerCount) {
      return res.status(400).json({
        error: 'Not enough eligible comments',
        available: candidates.length,
        requested: winnerCount
      });
    }

    // Select winners using secure random
    const winners = candidates.slice(0, winnerCount);

    // Clear previous winners
    db.prepare('DELETE FROM winners WHERE contest_id = ?').run(contestId);

    // Insert new winners
    const insertStmt = db.prepare(`
      INSERT INTO winners (contest_id, comment_id, user_id, username, name, comment_text, winner_rank)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    winners.forEach((winner, index) => {
      insertStmt.run(
        contestId,
        winner.comment_id,
        winner.user_id,
        winner.username,
        winner.name,
        winner.text,
        index + 1
      );
    });

    res.json({
      success: true,
      winnersCount: winners.length,
      winners: winners.map((w, i) => ({
        rank: i + 1,
        name: w.name,
        username: w.username,
        comment: w.text,
        platform: w.platform
      }))
    });
  } catch (error) {
    logError('POST /api/draw', error);
    res.status(500).json({ error: 'Failed to draw winners' });
  }
});

// POST /api/winners - record the winners drawn in the browser, so the exports
// can mark them; the draw itself stays client-side.
app.post('/api/winners', (req, res) => {
  try {
    const { contestId, winners } = req.body;

    if (!contestId || !Array.isArray(winners)) {
      return res.status(400).json({ error: 'Missing contestId or winners' });
    }

    db.prepare('DELETE FROM winners WHERE contest_id = ?').run(contestId);

    const insert = db.prepare(`
      INSERT INTO winners (contest_id, comment_id, user_id, username, name, comment_text, winner_rank)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    winners.forEach((winner, index) => {
      insert.run(
        contestId,
        winner.comment_id,
        winner.user_id ?? null,
        winner.username ?? null,
        winner.name ?? 'بدون اسم',
        winner.text ?? null,
        index + 1
      );
    });

    res.json({ success: true, saved: winners.length });
  } catch (error) {
    logError('POST /api/winners', error);
    res.status(500).json({ error: 'Failed to save winners' });
  }
});

// GET /api/export/csv - Export as CSV
app.get('/api/export/csv', (req, res) => {
  try {
    const { contestId } = req.query;

    if (!contestId) {
      return res.status(400).json({ error: 'Missing contestId' });
    }

    const comments = db.prepare(`
      SELECT c.*, p.platform, p.post_url,
             CASE WHEN w.id IS NOT NULL THEN w.winner_rank ELSE NULL END as winner_rank
      FROM comments c
      JOIN posts p ON c.post_id = p.id
      LEFT JOIN winners w ON c.comment_id = w.comment_id AND w.contest_id = ?
      WHERE p.contest_id = ?
      ORDER BY c.created_time DESC
    `).all(contestId, contestId);

    // Format CSV
    const csvRows = [
      ['Platform', 'Name', 'Username', 'User ID', 'Comment', 'Mentions', 'Date', 'Post URL', 'Comment ID', 'Eligible', 'Winner Rank']
    ];

    comments.forEach(c => {
      csvRows.push([
        c.platform,
        c.name || '',
        c.username || '',
        c.user_id || '',
        c.text || '',
        c.mentions_count || 0,
        c.created_time || '',
        c.post_url || '',
        c.comment_id,
        c.is_eligible ? 'Yes' : 'No',
        c.winner_rank || ''
      ]);
    });

    const csv = csvRows.map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="contest_${contestId}_${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    logError('GET /api/export/csv', error);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// GET /api/export/xlsx - Export as Excel
app.get('/api/export/xlsx', (req, res) => {
  try {
    const xlsx = require('xlsx');
    const { contestId } = req.query;

    if (!contestId) {
      return res.status(400).json({ error: 'Missing contestId' });
    }

    const comments = db.prepare(`
      SELECT c.*, p.platform, p.post_url,
             CASE WHEN w.id IS NOT NULL THEN w.winner_rank ELSE NULL END as winner_rank
      FROM comments c
      JOIN posts p ON c.post_id = p.id
      LEFT JOIN winners w ON c.comment_id = w.comment_id AND w.contest_id = ?
      WHERE p.contest_id = ?
      ORDER BY c.created_time DESC
    `).all(contestId, contestId);

    // Format data
    const data = comments.map(c => ({
      'Platform': c.platform,
      'Name': c.name || '',
      'Username': c.username || '',
      'User ID': c.user_id || '',
      'Comment': c.text || '',
      'Mentions': c.mentions_count || 0,
      'Date': c.created_time || '',
      'Post URL': c.post_url || '',
      'Comment ID': c.comment_id,
      'Eligible': c.is_eligible ? 'Yes' : 'No',
      'Winner Rank': c.winner_rank || ''
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Comments');

    // Set column widths
    worksheet['!cols'] = [
      { wch: 12 }, // Platform
      { wch: 20 }, // Name
      { wch: 20 }, // Username
      { wch: 15 }, // User ID
      { wch: 50 }, // Comment
      { wch: 10 }, // Mentions
      { wch: 20 }, // Date
      { wch: 40 }, // Post URL
      { wch: 20 }, // Comment ID
      { wch: 10 }, // Eligible
      { wch: 12 }  // Winner Rank
    ];

    const filename = `contest_${contestId}_${Date.now()}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.send(xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
  } catch (error) {
    logError('GET /api/export/xlsx', error);
    res.status(500).json({ error: 'Failed to export Excel' });
  }
});

// GET /api/health - Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: APP_VERSION, timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// The address a phone on the same Wi-Fi would use; `family` is a string on
// current Node and was a number on older releases.
function lanAddresses() {
  return Object.values(require('os').networkInterfaces())
    .flat()
    .filter(n => n && !n.internal && (n.family === 'IPv4' || n.family === 4))
    .map(n => n.address);
}

// Start server
app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`\n🎉 Comment Winner v${APP_VERSION} running on ${url}`);
  console.log(`📊 Database: ${dbPath}`);
  console.log(`\n   على هذا الجهاز:  ${url}`);

  for (const address of lanAddresses()) {
    console.log(`   من الهاتف:       http://${address}:${PORT}`);
  }
  console.log('');

  // Opened here rather than by the launcher, so it cannot fire before the port is listening
  if (process.env.OPEN_BROWSER === '1') {
    const opener = process.platform === 'win32' ? `start "" "${url}"`
      : process.platform === 'darwin' ? `open "${url}"`
      : `xdg-open "${url}"`;
    require('child_process').exec(opener, () => {});
  }
});

module.exports = app;
