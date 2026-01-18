// src/pages/articles/ArticlesPage.tsx
import React from 'react';
import ArticleFeed from '@/client/components/articles/ArticleFeed';

const ArticlesPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <ArticleFeed 
          showPersonalization={true}
          initialTab="all"
          hideFilters={false}
        />
      </div>
    </div>
  );
};

export default ArticlesPage;