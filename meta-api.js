/**
 * Meta Graph API Integration
 * Handle real API calls to Facebook and Instagram
 */

const axios = require('axios');

const GRAPH_API_VERSION = 'v18.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// Tagging a friend puts them in message_tags and leaves their plain name in the
// text, with no "@" to find. Typed handles still need matching, and \w misses
// Arabic entirely, so take whichever source sees more.
function countMentions(text, messageTags) {
  const tagged = Array.isArray(messageTags) ? messageTags.length : 0;
  const typed = ((text || '').match(/@[\p{L}\p{N}_.]+/gu) || []).length;
  return Math.max(tagged, typed);
}

// Helper to make Meta API calls
async function metaApiCall(endpoint, accessToken, params = {}) {
  try {
    const url = `${GRAPH_API_BASE}${endpoint}`;
    const response = await axios.get(url, {
      params: {
        ...params,
        access_token: accessToken
      },
      timeout: 15000
    });
    return response.data;
  } catch (error) {
    const errorData = error.response?.data?.error || {};
    const errorCode = errorData.code;
    const errorMsg = errorData.message;

    // Handle specific Meta API errors
    if (errorCode === 190) {
      throw new Error('Access Token expired or invalid. Please refresh your token.');
    } else if (errorCode === 200) {
      throw new Error('Permission denied. Check your Access Token permissions.');
    } else if (errorCode === 100) {
      throw new Error('فيسبوك لا يتعرّف على هذا المنشور بهذا التوكن. غالبًا لأنك تستعمل توكن حساب شخصي بدل توكن الصفحة، أو أن المنشور لا يخص صفحتك.');
    } else if (errorCode === 803) {
      throw new Error('Cannot query this post. It may be deleted or not accessible.');
    } else if (errorMsg) {
      throw new Error(errorMsg);
    }
    throw error;
  }
}

// Fetch Facebook pages
async function getFacebookPages(accessToken) {
  try {
    const data = await metaApiCall('/me', accessToken, {
      fields: 'accounts'
    });

    if (!data.accounts || !data.accounts.data) {
      return [];
    }

    return data.accounts.data.map(page => ({
      id: page.id,
      name: page.name,
      access_token: page.access_token
    }));
  } catch (error) {
    console.error('Error fetching Facebook pages:', error.message);
    throw error;
  }
}

// Get Instagram Business Account linked to Facebook Page
async function getInstagramAccount(pageId, accessToken) {
  const data = await metaApiCall(`/${pageId}`, accessToken, {
    fields: 'instagram_business_account{id,username}'
  });

  if (!data.instagram_business_account) {
    throw new Error(
      'لا يوجد حساب إنستغرام محترف مرتبط بهذه الصفحة. ' +
      'حوّل حسابك إلى Professional من إعدادات إنستغرام واربطه بصفحتك على فيسبوك.'
    );
  }

  return data.instagram_business_account;
}

// An Instagram link carries a shortcode (/p/C8xYz...), but the API addresses
// media by a numeric id, and offers no lookup between the two. The account's
// own media list is the only way across: find the item whose permalink
// carries that shortcode.
async function resolveInstagramMediaId(shortcode, userAccessToken, preferredPageId) {
  const pages = await getFacebookPages(userAccessToken);
  const page = preferredPageId ? pages.find(p => p.id === preferredPageId) : pages[0];

  if (!page) {
    throw new Error('لم يعثر التطبيق على صفحة فيسبوك مرتبطة بهذا التوكن، وحساب إنستغرام المحترف يُوصَل عبرها.');
  }

  const account = await getInstagramAccount(page.id, page.access_token);
  console.log(`📷 حساب إنستغرام: @${account.username} (${account.id})`);

  let url = `/${account.id}/media`;
  let params = { fields: 'id,permalink', limit: 100 };
  let scanned = 0;

  while (url) {
    const data = await metaApiCall(url, page.access_token, params);
    scanned += data.data?.length || 0;

    const match = (data.data || []).find(m => (m.permalink || '').includes(`/${shortcode}`));
    if (match) return { mediaId: match.id, pageToken: page.access_token };

    const after = data.paging?.cursors?.after;
    if (!after) break;
    params = { ...params, after };
  }

  throw new Error(
    `لم يُعثر على هذا المنشور ضمن ${scanned} منشورًا في حساب @${account.username}. ` +
    'تأكد أن الرابط يخص هذا الحساب نفسه.'
  );
}

// Fetch comments from Facebook Post
async function fetchFacebookComments(postId, accessToken) {
  try {
    console.log(`🔄 Fetching Facebook comments for post: ${postId}`);

    const comments = [];
    let hasMore = true;
    let after = null;
    let totalFetched = 0;

    while (hasMore) {
      const params = {
        fields: 'id,message,message_tags,from,created_time,like_count,permalink_url,comments.limit(0).summary(true)',
        limit: 100,
        summary: true
      };

      if (after) {
        params.after = after;
      }

      const data = await metaApiCall(`/${postId}/comments`, accessToken, params);

      if (!data.data || data.data.length === 0) {
        hasMore = false;
        break;
      }

      // Process comments
      data.data.forEach(comment => {
        if (comment.message) {
          const mentions = countMentions(comment.message, comment.message_tags);
          // Facebook omits `from` for commenters it will not identify to this app
          const author = comment.from || {};
          comments.push({
            comment_id: comment.id,
            user_id: author.id ?? null,
            username: author.name ?? null,
            name: author.name ?? 'مستخدم فيسبوك',
            text: comment.message,
            likes_count: comment.like_count || 0,
            created_time: comment.created_time,
            mentions_count: mentions,
            is_reply: 0, // Top-level comment
            parent_comment_id: null,
            is_eligible: 1,
            // from.id is app-scoped, so facebook.com/<id> does not open a profile;
            // the comment permalink is the link that actually resolves
            link: comment.permalink_url || null,
            platform: 'facebook'
          });
          totalFetched++;
        }
      });

      // Check if there are more pages
      if (data.paging && data.paging.cursors && data.paging.cursors.after) {
        after = data.paging.cursors.after;
      } else {
        hasMore = false;
      }
    }

    console.log(`✅ Fetched ${totalFetched} Facebook comments`);

    // A draw is pointless if no winner can be named, so say so rather than
    // handing back a list of anonymous entries.
    if (comments.length > 0 && !comments.some(c => c.user_id)) {
      throw new Error(
        `وصلت ${comments.length} تعليقًا، لكن فيسبوك لم يرسل أسماء أصحابها، فلا يمكن معرفة الفائز. ` +
        `أضف صلاحية pages_read_user_content إلى التوكن وأعد المحاولة.`
      );
    }

    return comments;
  } catch (error) {
    console.error('Error fetching Facebook comments:', error.message);
    throw error;
  }
}

// Reading comments on a Page's post needs that Page's own token, not the user's.
// Page posts are also addressed as {page-id}_{post-id} as often as by the bare id.
async function fetchFacebookCommentsAsPage(postId, userAccessToken, preferredPageId) {
  let pages = [];
  try {
    pages = await getFacebookPages(userAccessToken);
  } catch (error) {
    console.warn('تعذّر سرد الصفحات:', error.message);
  }

  const page = preferredPageId
    ? pages.find(p => p.id === preferredPageId)
    : pages[0];

  if (!page) {
    throw new Error(
      'لم يعثر التطبيق على أي صفحة مرتبطة بهذا التوكن. ' +
      'تعليقات منشورات الصفحات تحتاج توكن صفحة بصلاحيات pages_show_list و pages_read_engagement و pages_read_user_content. ' +
      'أنشئ توكنًا جديدًا بهذه الصلاحيات واختر صفحتك عند إنشائه.'
    );
  }

  console.log(`📄 استعمال توكن الصفحة: ${page.name} (${page.id})`);

  try {
    return await fetchFacebookComments(postId, page.access_token);
  } catch (error) {
    console.log(`↻ إعادة المحاولة بالصيغة ${page.id}_${postId}`);
    try {
      return await fetchFacebookComments(`${page.id}_${postId}`, page.access_token);
    } catch {
      throw error;
    }
  }
}

// Fetch comments from Instagram Media
async function fetchInstagramComments(mediaId, accessToken) {
  try {
    console.log(`🔄 Fetching Instagram comments for media: ${mediaId}`);

    const comments = [];
    let hasMore = true;
    let after = null;
    let totalFetched = 0;

    while (hasMore) {
      const params = {
        fields: 'id,text,username,timestamp,like_count,replies.limit(0).summary(true)',
        limit: 100,
        summary: true
      };

      if (after) {
        params.after = after;
      }

      const data = await metaApiCall(`/${mediaId}/comments`, accessToken, params);

      if (!data.data || data.data.length === 0) {
        hasMore = false;
        break;
      }

      // Process comments
      data.data.forEach(comment => {
        if (comment.text) {
          const mentions = countMentions(comment.text);
          // Instagram returns the handle as a plain `username`, not inside `from`
          const author = comment.from || {};
          const username = comment.username ?? author.username ?? null;
          comments.push({
            comment_id: comment.id,
            user_id: author.id ?? username,
            username,
            name: author.name ?? username ?? 'مستخدم إنستغرام',
            text: comment.text,
            likes_count: comment.like_count || 0,
            created_time: comment.timestamp,
            mentions_count: mentions,
            is_reply: 0, // Top-level comment
            parent_comment_id: null,
            is_eligible: 1,
            link: username ? `https://instagram.com/${username}` : null,
            platform: 'instagram'
          });
          totalFetched++;
        }
      });

      // Check if there are more pages
      if (data.paging && data.paging.cursors && data.paging.cursors.after) {
        after = data.paging.cursors.after;
      } else {
        hasMore = false;
      }
    }

    console.log(`✅ Fetched ${totalFetched} Instagram comments`);
    return comments;
  } catch (error) {
    console.error('Error fetching Instagram comments:', error.message);
    throw error;
  }
}

// Validate Access Token
async function validateAccessToken(accessToken) {
  try {
    const data = await metaApiCall('/me', accessToken, {
      fields: 'id,name,email'
    });
    return {
      valid: true,
      userId: data.id,
      name: data.name,
      email: data.email
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}

module.exports = {
  getFacebookPages,
  getInstagramAccount,
  resolveInstagramMediaId,
  fetchFacebookComments,
  fetchFacebookCommentsAsPage,
  fetchInstagramComments,
  validateAccessToken,
  metaApiCall
};
