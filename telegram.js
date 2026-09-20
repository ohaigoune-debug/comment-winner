/**
 * Telegram Bot API - send draw results to a chat
 */

const axios = require('axios');

const API_BASE = 'https://api.telegram.org';

function describeError(error) {
  const description = error.response?.data?.description;
  if (!description) return error.message;

  if (/bot token|Unauthorized/i.test(description)) {
    return 'توكن البوت غير صحيح. انسخه من BotFather مرة أخرى.';
  }
  if (/chat not found/i.test(description)) {
    return 'لم يجد تليغرام هذه المحادثة. أرسل رسالة إلى بوتك أولًا، ثم اضغط «اعثر على محادثتي».';
  }
  return description;
}

async function sendMessage(botToken, chatId, text) {
  try {
    // Comment text is arbitrary user input, so it is sent as plain text rather
    // than HTML or Markdown, which would break on stray < & or *
    const { data } = await axios.post(
      `${API_BASE}/bot${botToken}/sendMessage`,
      { chat_id: chatId, text, disable_web_page_preview: true },
      { timeout: 15000 }
    );
    return data;
  } catch (error) {
    throw new Error(describeError(error));
  }
}

// Telegram will not reveal a chat id until the user has written to the bot,
// so this reads whoever has already done so.
async function findChats(botToken) {
  try {
    const { data } = await axios.get(`${API_BASE}/bot${botToken}/getUpdates`, { timeout: 15000 });
    const chats = new Map();

    (data.result || []).forEach(update => {
      const chat = update.message?.chat || update.channel_post?.chat;
      if (!chat) return;
      const name = chat.title
        || [chat.first_name, chat.last_name].filter(Boolean).join(' ')
        || chat.username
        || '';
      chats.set(String(chat.id), name);
    });

    return [...chats].map(([id, name]) => ({ id, name }));
  } catch (error) {
    throw new Error(describeError(error));
  }
}

function formatWinners(winners, contestName) {
  const lines = [`🎉 نتائج السحب — ${contestName}`, ''];

  winners.forEach(winner => {
    lines.push(`${winner.winner_rank}. ${winner.name}`);
    if (winner.comment_text) lines.push(`   "${winner.comment_text}"`);
    if (winner.link) lines.push(`   ${winner.link}`);
    lines.push('');
  });

  lines.push(`عدد الفائزين: ${winners.length}`);
  return lines.join('\n');
}

module.exports = { sendMessage, findChats, formatWinners };
