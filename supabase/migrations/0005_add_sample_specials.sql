-- Migration: Add 3 sample special offers
-- Creates attractive bundle deals with pre-configured products

-- Insert 3 special offers
INSERT INTO specials (id, name, description, discounted_price, status, picture_url) VALUES
(1, 'Starter Kitchen Bundle', 'Perfect for small apartments - everything you need to get started', 180000, 'available', 'https://picsum.photos/seed/special1/800/600'),
(2, 'Complete Kitchen Package', 'Full kitchen setup with modern amenities and storage', 350000, 'available', 'https://picsum.photos/seed/special2/800/600'),
(3, 'Premium Kitchen Suite', 'Luxury kitchen package with premium finishes and maximum storage', 520000, 'available', 'https://picsum.photos/seed/special3/800/600');

-- Starter Kitchen Bundle items (5 products)
-- Product 2: 2 Door Drawer (Base Box) - White, 40cm width
INSERT INTO special_items (special_id, product_id, quantity, selected_parameters) VALUES
(1, 2, 1, '{"1": 1, "2": 3, "3": 6, "4": 12, "5": 26, "7": 43, "8": 53}'::jsonb);

-- Product 6: 1 Door Box (Base Box) - White, 40cm width, 2 shelves
INSERT INTO special_items (special_id, product_id, quantity, selected_parameters) VALUES
(1, 6, 2, '{"1": 1, "2": 3, "3": 6, "4": 12, "5": 26, "6": 41, "7": 43}'::jsonb);

-- Product 12: 2 Door Box (Wall Box) - White, 40cm width, 2 shelves
INSERT INTO special_items (special_id, product_id, quantity, selected_parameters) VALUES
(1, 12, 2, '{"1": 1, "2": 4, "3": 7, "4": 12, "5": 26, "6": 41, "7": 43}'::jsonb);

-- Product 17: Toe Kick 10cm - White, 240cm width
INSERT INTO special_items (special_id, product_id, quantity, selected_parameters) VALUES
(1, 17, 1, '{"4": 19, "5": 26, "7": 43}'::jsonb);

-- Complete Kitchen Package items (6 products)
-- Product 5: 3 Door Drawer/Same (Base Box) - Gray, 60cm width
INSERT INTO special_items (special_id, product_id, quantity, selected_parameters) VALUES
(2, 5, 1, '{"1": 2, "2": 3, "3": 6, "4": 14, "5": 31, "7": 43, "8": 54}'::jsonb);

-- Product 7: 2 Door Box (Base Box) - Gray, 50cm width, 3 shelves
INSERT INTO special_items (special_id, product_id, quantity, selected_parameters) VALUES
(2, 7, 2, '{"1": 2, "2": 3, "3": 6, "4": 13, "5": 31, "6": 42, "7": 43}'::jsonb);

-- Product 10: With Oven (Base Box) - Gray, 60cm width
INSERT INTO special_items (special_id, product_id, quantity, selected_parameters) VALUES
(2, 10, 1, '{"1": 2, "2": 3, "3": 6, "4": 14, "5": 31, "7": 43}'::jsonb);

-- Product 12: 2 Door Box (Wall Box) - Gray, 60cm width, 2 shelves
INSERT INTO special_items (special_id, product_id, quantity, selected_parameters) VALUES
(2, 12, 2, '{"1": 2, "2": 4, "3": 7, "4": 14, "5": 31, "6": 41, "7": 43}'::jsonb);

-- Product 15: Vent Box (Wall Box) - Gray, 60cm width
INSERT INTO special_items (special_id, product_id, quantity, selected_parameters) VALUES
(2, 15, 1, '{"1": 2, "2": 4, "3": 7, "4": 14, "5": 31, "7": 43}'::jsonb);

-- Product 16: With Fridge 60x195 (Partial) - Gray, 60cm width
INSERT INTO special_items (special_id, product_id, quantity, selected_parameters) VALUES
(2, 16, 1, '{"2": 3, "3": 9, "4": 14, "5": 31, "7": 43}'::jsonb);

-- Premium Kitchen Suite items (6 products)
-- Product 4: 3 Door Drawer/2s1big/ (Base Box) - Black, Visible handle, 80cm width
INSERT INTO special_items (special_id, product_id, quantity, selected_parameters) VALUES
(3, 4, 1, '{"1": 2, "2": 3, "3": 6, "4": 15, "5": 27, "7": 43, "8": 54}'::jsonb);

-- Product 2: 2 Door Drawer (Base Box) - Black, Visible handle, 60cm width
INSERT INTO special_items (special_id, product_id, quantity, selected_parameters) VALUES
(3, 2, 2, '{"1": 2, "2": 3, "3": 6, "4": 14, "5": 27, "7": 43, "8": 54}'::jsonb);

-- Product 8: Corner Box (Base Box) - Black, Visible handle, 90cm width, 2 shelves
INSERT INTO special_items (special_id, product_id, quantity, selected_parameters) VALUES
(3, 8, 1, '{"1": 2, "2": 3, "3": 6, "4": 16, "5": 27, "6": 41, "7": 43}'::jsonb);

-- Product 13: Corner Box (Wall Box) - Black, Visible handle, 60cm width, 2 shelves
INSERT INTO special_items (special_id, product_id, quantity, selected_parameters) VALUES
(3, 13, 1, '{"1": 2, "2": 4, "3": 7, "4": 14, "5": 27, "6": 41, "7": 43}'::jsonb);

-- Product 14: Vent Box Integrated (Wall Box) - Black, Visible handle, 60cm width, 2 shelves
INSERT INTO special_items (special_id, product_id, quantity, selected_parameters) VALUES
(3, 14, 1, '{"1": 2, "2": 4, "3": 7, "4": 14, "5": 27, "6": 41, "7": 43}'::jsonb);

-- Product 18: Tavtsan (Partial) - Black, 300cm width
INSERT INTO special_items (special_id, product_id, quantity, selected_parameters) VALUES
(3, 18, 1, '{"2": 5, "4": 20, "5": 27, "7": 43}'::jsonb);

-- Track migration
INSERT INTO schema_migrations (version) VALUES ('0005_add_sample_specials')
ON CONFLICT (version) DO NOTHING;
