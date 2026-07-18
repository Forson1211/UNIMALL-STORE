-- Realign existing products to the canonical category taxonomy used across
-- the storefront (nav, hero, shop filters, search). The vendor product form
-- previously only offered a narrower, differently-named set of categories
-- (Clothing, Home, Books, Stationery) that never matched the site's filter
-- values, so products tagged with them were invisible under any category
-- link. This brings existing rows in line with the new shared list.
UPDATE public.products
SET category = CASE category
  WHEN 'Clothing' THEN 'Fashion'
  WHEN 'Home' THEN 'Home & Office'
  WHEN 'Books' THEN 'Books & Notes'
  WHEN 'Stationery' THEN 'Books & Notes'
  ELSE category
END
WHERE category IN ('Clothing', 'Home', 'Books', 'Stationery');
