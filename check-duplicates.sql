cat > check-duplicates.sql << 'EOF'
-- Check for duplicate likes (should show 0 rows if constraint is working)
SELECT 
    "articleId", 
    "userId", 
    "language", 
    COUNT(*) as duplicate_count
FROM "ArticleLike"
GROUP BY "articleId", "userId", "language"
HAVING COUNT(*) > 1;
EOF