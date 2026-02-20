// services/prompt-builder.service.ts
import { Injectable } from '@nestjs/common';
import { IntentAnalysis, IntentType } from '../interfaces/intent.types';

@Injectable()
export class PromptBuilderService {
  
  buildSystemPrompt(
    userName: string,
    mode: string,
    context: any,
    intent: IntentAnalysis,
    lastMessage: string,
    clientTime?: string
  ): string {

     let memorySection = '';
    if (context.memories && context.memories.length > 0) {
      memorySection = `
  📝 **PREVIOUS CONVERSATIONS I REMEMBER:**

  ${context.memories.map((memory: any, index: number) => {
    const date = memory.date && memory.date !== 'Recently' 
      ? ` (${memory.date})` 
      : memory.updatedAt 
        ? ` (${new Date(memory.updatedAt).toLocaleDateString()})` 
        : '';
    
    const keyPoints = memory.keyPoints && memory.keyPoints.length > 0
      ? `\n   • ${memory.keyPoints.slice(0, 2).join('\n   • ')}`
      : '';
      
    return `${index + 1}. **${memory.topic}**${date}\n   ${memory.summary}${keyPoints}`;
  }).join('\n\n')}

  **CRITICAL RULE:** When the user asks about past conversations (like "what did we discuss last week?"), use these memories to answer accurately with dates.
  `;
    } else {
      memorySection = `📝 This is our first conversation - I don't have any previous memories of you yet.`;
    }

    const timeContext = clientTime ? this.formatNaturalTime(clientTime) : '';
    
    // Enhance context with last message for memory section
    const enhancedContext = { ...context, lastMessage };
    
    // Natural opening based on context
    const opening = this.getNaturalOpening(intent, userName, enhancedContext);
    
    // Build dynamic sections based on what's available
    const sections = [];
    
    // Time (natural greeting)
    if (timeContext) sections.push(timeContext);
    
    // Goals/Focus - if relevant
    const focusSection = this.buildNaturalFocusSection(enhancedContext, intent);
    if (focusSection) sections.push(focusSection);
    
    // Identity - if relevant and available
    const identitySection = this.buildNaturalIdentitySection(enhancedContext, intent);
    if (identitySection) sections.push(identitySection);
    
    
    // Articles - with rich formatting
    const articleSection = this.buildRichArticleSection(enhancedContext, intent);
    if (articleSection) sections.push(articleSection);
    
    // Emotional context - if detected
    const emotionalSection = this.buildNaturalEmotionalSection(enhancedContext, intent);
    if (emotionalSection) sections.push(emotionalSection);
    
    // CRITICAL BEHAVIORAL RULES
    const behavioralRules = `
CRITICAL RULES YOU MUST FOLLOW:

1. **NEVER invent past conversations** - If no memories exist, be honest
2. **When asked about previous conversations** - Show REAL memories with dates
3. **If no memories** - Say "This is our first conversation!" not "we talked about X"

4. **Conversation flow**:
   • Match their energy - brief = brief, deep = deep
   • One question per response max
   • When they say "thanks" or "bye" - one sentence, then stop
   • If they don't engage with suggestions - stop suggesting

5. **Article recommendations**:
   • Be excited - "I found this great article!"
   • Always include ratings if available
   • Share what readers say: "One reviewer mentioned..."
   • Always ask if they want a summary

6. **Use natural language**:
   • Contractions: I'm, you're, that's
   • Emojis sparingly: 😊 📚 🎯 💡
   • Reference what they just said
`;

    return `
${opening}

${sections.join('\n\n')}

${behavioralRules}

Remember: You're talking with ${userName}. Be helpful, be honest, and never invent things. 😊
`.replace(/\n{3,}/g, '\n\n').trim();
  }

  private getNaturalOpening(intent: IntentAnalysis, userName: string, context: any): string {
    // Check if this is a "last conversation" query
    const isAskingAboutHistory = context.lastMessage?.toLowerCase().includes('last conversation') ||
                                 context.lastMessage?.toLowerCase().includes('what did we talk about') ||
                                 context.lastMessage?.toLowerCase().includes('do you remember');
    
    if (isAskingAboutHistory) {
      if (context.memories && context.memories.length > 0) {
        return `Let me check our conversation history, ${userName}... 📝`;
      } else {
        return `Hey ${userName}! This is actually our first conversation - nice to meet you! 😊`;
      }
    }
    
    // Regular openings
    const hasHistory = context.memories && context.memories.length > 0;
    
    switch (intent.primary) {
      case IntentType.GREETING:
        return hasHistory 
          ? `Hey again ${userName}! 👋 Good to see you!`
          : `Hey ${userName}! 👋 Great to meet you!`;
        
      case IntentType.EMOTIONAL_SUPPORT:
      case IntentType.STRESS_EXPRESSION:
        return `I'm here with you, ${userName}. Take your time. 🫂`;
        
      case IntentType.GOAL_DISCUSSION:
        return `Love that you're working on goals, ${userName}! 🎯 Tell me more.`;
        
      case IntentType.LEARNING_PATH:
        return `${userName}! Learning something new? Awesome! 📚 What interests you?`;
        
      case IntentType.ARTICLE_RECOMMENDATION:
        return `Looking for something to read? Love that, ${userName}! 📖`;
        
      case IntentType.GENERAL_QUESTION:
        return `Great question, ${userName}! Let me help. 🤔`;
        
      default:
        return hasHistory 
          ? `Welcome back, ${userName}! 😊 What's on your mind?`
          : `Hey ${userName}! 😊 What brings you here today?`;
    }
  }

  private buildMemorySection(context: any, intent: IntentAnalysis): string | null {
    if (!context.memories || context.memories.length === 0) {
      return null;
    }
    
    const isAskingAboutHistory = context.lastMessage?.toLowerCase().includes('last conversation') ||
                                 context.lastMessage?.toLowerCase().includes('what did we talk about') ||
                                 context.lastMessage?.toLowerCase().includes('do you remember');
    
    // SPECIAL HANDLING: User is asking about conversation history
    if (isAskingAboutHistory) {
      // Show ALL memories with dates
      const memoryList = context.memories.map((m: any, i: number) => {
        const date = m.date && m.date !== 'Recently' ? ` (${m.date})` : '';
        const keyPoints = m.keyPoints && m.keyPoints.length > 0 
          ? `\n   • ${m.keyPoints.slice(0, 2).join('\n   • ')}`
          : '';
        
        return `${i+1}. **${m.topic}**${date}\n   ${m.summary}${keyPoints}`;
      }).join('\n\n');
      
      return `📝 **Here's what we've talked about:**\n\n${memoryList}\n\nWant to continue any of these conversations?`;
    }
    
    // NORMAL CONVERSATION: Show recent memories naturally
    if (context.memories.length === 1) {
      const memory = context.memories[0];
      return `💭 By the way, last time we talked about ${memory.topic}. Happy to continue that!`;
    }
    
    if (context.memories.length > 1) {
      const recentTopics = context.memories.slice(0, 2).map((m: any) => m.topic).join(' and ');
      return `💭 We've chatted about ${recentTopics} recently. What would you like to focus on?`;
    }
    
    return null;
  }

  private buildNaturalFocusSection(context: any, intent: IntentAnalysis): string | null {
    if (!context.focus) return null;
    
    switch (intent.primary) {
      case IntentType.GOAL_STALLED:
        return `You mentioned this goal but haven't made progress:\n${context.focus}\n\nWant to talk about what's blocking you?`;
        
      case IntentType.GOAL_DISCUSSION:
        return `Here's what you're working on:\n${context.focus}`;
        
      case IntentType.DECISION_HELP:
        return `The decision you're weighing:\n${context.focus}`;
        
      default:
        return null;
    }
  }

  private buildNaturalIdentitySection(context: any, intent: IntentAnalysis): string | null {
    if (!context.identity) return null;
    
    const identityRelevantIntents = [
      IntentType.IDENTITY_EXPLORATION,
      IntentType.VALUE_CLARIFICATION,
      IntentType.CAREER_ADVICE,
      IntentType.GOAL_DISCUSSION,
      IntentType.DECISION_HELP
    ];
    
    if (identityRelevantIntents.includes(intent.primary)) {
      return `I remember you mentioned:\n${context.identity}`;
    }
    
    return null;
  }

  
private buildRichArticleSection(context: any, intent: IntentAnalysis): string | null {
  if (!context.articles || context.articles.length === 0) return null;
  
  const articleIntents = [
    IntentType.ARTICLE_RECOMMENDATION,
    IntentType.LEARNING_PATH,
    IntentType.CAREER_ADVICE,
    IntentType.GENERAL_QUESTION
  ];
  
  if (!articleIntents.includes(intent.primary)) return null;
  
  const articles = Array.isArray(context.articles) ? context.articles : [];
  if (articles.length === 0) return null;
  
  // Use the pre-formatted articles from the selector
  const articleList = articles
    .map((article: any, index: number) => {
      // If we have the rich formatted version, use it
      if (article.formatted) {
        return `${index + 1}. ${article.formatted}`;
      }
      
      // Fallback formatting
      const rating = article.rating ? ` ⭐${article.rating}` : '';
      return `${index + 1}. [${article.title}](${article.url})${rating}`;
    })
    .join('\n\n');
  
  // Add a conversational intro based on context
  let intro = '📚 **I found these articles that might help:**';
  
  // If this is a follow-up "another" request, acknowledge it
  if (context.lastMessage?.toLowerCase().includes('another')) {
    intro = '📚 **Sure! Here are more articles on that topic:**';
  }
  
  return `${intro}\n\n${articleList}\n\nWant me to summarize any of these? 😊`;
}

  private buildNaturalEmotionalSection(context: any, intent: IntentAnalysis): string | null {
    if (!context.mood) return null;
    
    const emotionalIntents = [
      IntentType.EMOTIONAL_SUPPORT,
      IntentType.STRESS_EXPRESSION,
      IntentType.MOTIVATION_SEEKING,
      IntentType.GOAL_STALLED
    ];
    
    if (!emotionalIntents.includes(intent.primary)) return null;
    
    const moodLower = context.mood.toLowerCase();
    if (moodLower.includes('stressed') || moodLower.includes('anxious')) {
      return `Take a deep breath - we'll go at your pace. 🧘`;
    }
    if (moodLower.includes('excited') || moodLower.includes('motivated')) {
      return `Love that energy! Let's channel it. ✨`;
    }
    if (moodLower.includes('tired') || moodLower.includes('overwhelmed')) {
      return `You sound tired. Want to take it slow? 😴`;
    }
    
    return null;
  }

  private formatNaturalTime(clientTime: string): string {
    try {
      const date = new Date(clientTime);
      const hour = date.getHours();
      
      if (hour < 5) return `Up late? 🌙 Hope you're getting rest too.`;
      if (hour < 12) return `Good morning! ☀️`;
      if (hour < 17) return `Good afternoon! 🌤️`;
      if (hour < 21) return `Good evening! 🌙`;
      return `Still going strong? 💪`;
    } catch {
      return '';
    }
  }
}