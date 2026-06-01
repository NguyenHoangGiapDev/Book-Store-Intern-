-- Update existing categories to have Type = 'sach' (books)
UPDATE "BookCategories" 
SET "Type" = 'sach' 
WHERE "Type" IS NULL OR "Type" = '';

-- Verify the update
SELECT COUNT(*) as total_categories, 
       COUNT(CASE WHEN "Type" = 'sach' THEN 1 END) as book_categories,
       COUNT(CASE WHEN "Type" != 'sach' THEN 1 END) as other_categories
FROM "BookCategories";
