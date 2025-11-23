-- Fix sequences for all tables with SERIAL primary keys
-- This resets the sequence to the maximum ID + 1

-- Fix products sequence
SELECT setval('products_id_seq', COALESCE((SELECT MAX(id) FROM products), 0) + 1, false);

-- Fix categories sequence
SELECT setval('categories_id_seq', COALESCE((SELECT MAX(id) FROM categories), 0) + 1, false);

-- Fix parameter_groups sequence
SELECT setval('parameter_groups_id_seq', COALESCE((SELECT MAX(id) FROM parameter_groups), 0) + 1, false);

-- Fix parameters sequence
SELECT setval('parameters_id_seq', COALESCE((SELECT MAX(id) FROM parameters), 0) + 1, false);

-- Fix product_parameter_groups sequence
SELECT setval('product_parameter_groups_id_seq', COALESCE((SELECT MAX(id) FROM product_parameter_groups), 0) + 1, false);

-- Fix users sequence
SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 0) + 1, false);

-- Fix carts sequence
SELECT setval('carts_id_seq', COALESCE((SELECT MAX(id) FROM carts), 0) + 1, false);

-- Fix product_in_cart sequence
SELECT setval('product_in_cart_id_seq', COALESCE((SELECT MAX(id) FROM product_in_cart), 0) + 1, false);

-- Fix orders sequence
SELECT setval('orders_id_seq', COALESCE((SELECT MAX(id) FROM orders), 0) + 1, false);

-- Fix specials sequence
SELECT setval('specials_id_seq', COALESCE((SELECT MAX(id) FROM specials), 0) + 1, false);

-- Fix special_items sequence
SELECT setval('special_items_id_seq', COALESCE((SELECT MAX(id) FROM special_items), 0) + 1, false);

-- Fix admins sequence
SELECT setval('admins_id_seq', COALESCE((SELECT MAX(id) FROM admins), 0) + 1, false);
