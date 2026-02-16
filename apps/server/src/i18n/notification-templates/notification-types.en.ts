// src/i18n/notification-templates/notification-types.en.ts
export const notificationTemplatesEn = {
  'article.like': {
    title: 'New Like',
    message: '{{likerName}} liked your article "{{articleTitle}}"'
  },
  'article.comment': {
    title: 'New Comment',
    message: '{{commenterName}} commented on your article "{{articleTitle}}"'
  },
  'comment.reply': {
    title: 'New Reply',
    message: '{{replierName}} replied to your comment on "{{articleTitle}}"'
  },
  'achievement.unlocked': {
    title: '🏆 Achievement Unlocked!',
    message: 'You unlocked "{{achievementTitle}}" achievement!'
  },
  'reading.milestone': {
    title: '📚 Reading Milestone',
    message: '{{milestone}}'
  },
  'recommendations.new': {
    title: '🎯 New Recommendations',
    message: 'You have {{count}} new article recommendations based on your interests'
  },
  'premium.feature': {
    title: '👑 Premium Feature',
    message: 'New premium feature available: {{featureName}}'
  },

  'digest': {
  title: '📊 Reading Digest',
  message: 'Your {{period}} reading summary is ready'
},
'mention': {
  title: 'You were mentioned',
  message: '{{userName}} mentioned you in a comment'
},
'article.published': {
  title: 'Article Published',
  message: 'Your article "{{articleTitle}}" has been published'
},
  // Add system notification templates
  'system.announcement': {
    title: '📢 Announcement',
    message: '{{message}}'
  },
  'system.update': {
    title: '🔄 System Update',
    message: '{{message}}'
  }
};
