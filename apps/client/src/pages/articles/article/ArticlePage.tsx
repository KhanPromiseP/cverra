import { t, Trans } from "@lingui/macro";
import React, { useEffect, useState } from 'react';
import SimpleArticleReader from '@/client/components/articles/SimpleArticleReader';

const ArticlePage: React.FC = () => {
  const [slug, setSlug] = useState<string>('');
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    // Extract slug from the current URL
    const currentPath = window.location.pathname;
    console.log('ArticlePage - Current path:', currentPath);
    
    // Expected format: /dashboard/article/{slug}
    const regex = /^\/dashboard\/article\/([^/]+)$/;
    const match = currentPath.match(regex);
    
    if (match && match[1]) {
      const extractedSlug = match[1];
      console.log('ArticlePage - Extracted slug:', extractedSlug);
      setSlug(extractedSlug);
      setIsValid(true);
    } else {
      console.error('ArticlePage - Invalid URL format:', currentPath);
      setIsValid(false);
    }
  }, []);

  if (!isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            {t`Invalid Article URL`}
          </h1>
          <p className="text-muted-foreground mb-6">
            {t`Please use a valid article URL format: /dashboard/article/your-article-slug`}
          </p>
          <button
            onClick={() => window.location.href = '/dashboard/articles'}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            {t`Go to Articles`}
          </button>
        </div>
      </div>
    );
  }

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t`Loading article...`}</p>
        </div>
      </div>
    );
  }

  return <SimpleArticleReader slug={slug} showReadingProgress={true} />;
};

export default ArticlePage;