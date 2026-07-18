-- Realign existing products to the canonical Jumia category taxonomy.
UPDATE public.products
SET category = CASE category
  WHEN 'Clothing' THEN 'Fashion'
  WHEN 'Home' THEN 'Home & Office'
  WHEN 'Books' THEN 'Other categories'
  WHEN 'Books & Notes' THEN 'Other categories'
  WHEN 'Stationery' THEN 'Other categories'
  WHEN 'Food & Snacks' THEN 'Supermarket'
  WHEN 'Electronics' THEN 'Electronics'
  ELSE category
END;
