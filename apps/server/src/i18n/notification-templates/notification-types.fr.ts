
// src/i18n/notification-templates/notification-types.fr.ts
export const notificationTemplatesFr = {
  'article.like': {
    title: 'Nouveau J\'aime',
    message: '{{likerName}} a aimé votre article "{{articleTitle}}"'
  },
  'article.comment': {
    title: 'Nouveau Commentaire',
    message: '{{commenterName}} a commenté votre article "{{articleTitle}}"'
  },
  'comment.reply': {
    title: 'Nouvelle Réponse',
    message: '{{replierName}} a répondu à votre commentaire sur "{{articleTitle}}"'
  },
  'achievement.unlocked': {
    title: '🏆 Succès Débloqué !',
    message: 'Vous avez débloqué le succès "{{achievementTitle}}" !'
  },
  'reading.milestone': {
    title: '📚 Étape de Lecture',
    message: '{{milestone}}'
  },
  'recommendations.new': {
    title: '🎯 Nouvelles Recommandations',
    message: 'Vous avez {{count}} nouvelles recommandations d\'articles basées sur vos intérêts'
  },
  'premium.feature': {
    title: '👑 Fonctionnalité Premium',
    message: 'Nouvelle fonctionnalité premium disponible : {{featureName}}'
  },
  'digest': {
  title: '📊 Résumé de Lecture',
  message: 'Votre résumé de lecture {{period}} est prêt'
},
'mention': {
  title: 'Vous avez été mentionné',
  message: '{{userName}} vous a mentionné dans un commentaire'
},
'article.published': {
  title: 'Article Publié',
  message: 'Votre article "{{articleTitle}}" a été publié'
},

  // Add system notification templates in French
  'system.announcement': {
    title: '📢 Annonce',
    message: '{{message}}'
  },
  'system.update': {
    title: '🔄 Mise à jour du Système',
    message: '{{message}}'
  }
};