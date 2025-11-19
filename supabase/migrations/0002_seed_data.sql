-- Insert categories
INSERT INTO categories (id, name, description) VALUES
(1, 'Base Box', 'Base cabinets for kitchen'),
(2, 'Wall Box', 'Wall-mounted cabinets'),
(3, 'Partial', 'Partial components and accessories'),
(4, 'Ready Products', 'Ready-made products');

-- Insert parameter groups
INSERT INTO parameter_groups (id, name, description) VALUES
(1, 'Handle', 'Handle visibility options'),
(2, 'Depth', 'Cabinet depth in cm'),
(3, 'Height', 'Cabinet height in cm'),
(4, 'Width', 'Cabinet width in cm'),
(5, 'Colour', 'Door color options'),
(6, 'Shelf', 'Number of shelves'),
(7, 'Quantity', 'Product quantity'),
(8, 'Rail', 'Rail type');

-- Insert parameters for Handle
INSERT INTO parameters (id, parameter_group_id, name, price_modifier) VALUES
(1, 1, 'Hidden', 0),
(2, 1, 'Visible', 50);

-- Insert parameters for Depth
INSERT INTO parameters (id, parameter_group_id, name, price_modifier) VALUES
(3, 2, '56cm', 0),
(4, 2, '30cm', -20),
(5, 2, '60cm', 10);

-- Insert parameters for Height
INSERT INTO parameters (id, parameter_group_id, name, price_modifier) VALUES
(6, 3, '72cm', 0),
(7, 3, '60cm', -10),
(8, 3, '40cm', -20),
(9, 3, '200cm', 100);

-- Insert parameters for Width
INSERT INTO parameters (id, parameter_group_id, name, price_modifier) VALUES
(10, 4, '20cm', -50),
(11, 4, '15cm', -60),
(12, 4, '40cm', 0),
(13, 4, '50cm', 20),
(14, 4, '60cm', 40),
(15, 4, '80cm', 60),
(16, 4, '90cm', 80),
(17, 4, '100cm', 100),
(18, 4, 'Custom', 0),
(19, 4, '240cm', 200),
(20, 4, '300cm', 250),
(21, 4, '420cm', 350),
(22, 4, '100cm', 100),
(23, 4, '120cm', 120),
(24, 4, '180cm', 180),
(25, 4, '200cm', 200);

-- Insert parameters for Colour (10+ colors as mentioned)
INSERT INTO parameters (id, parameter_group_id, name, price_modifier) VALUES
(26, 5, 'White', 0),
(27, 5, 'Black', 10),
(28, 5, 'Green', 10),
(29, 5, 'Red', 10),
(30, 5, 'Blue', 10),
(31, 5, 'Gray', 5),
(32, 5, 'Brown', 8),
(33, 5, 'Beige', 5),
(34, 5, 'Yellow', 10),
(35, 5, 'Orange', 10),
(36, 5, 'Purple', 12),
(37, 5, 'Pink', 10),
(38, 5, 'Navy', 10),
(39, 5, 'Cream', 5);

-- Insert parameters for Shelf
INSERT INTO parameters (id, parameter_group_id, name, price_modifier) VALUES
(40, 6, '1 Shelf', 0),
(41, 6, '2 Shelves', 15),
(42, 6, '3 Shelves', 30);

-- Insert parameters for Quantity (1 to 10)
INSERT INTO parameters (id, parameter_group_id, name, price_modifier) VALUES
(43, 7, '1', 0),
(44, 7, '2', 0),
(45, 7, '3', 0),
(46, 7, '4', 0),
(47, 7, '5', 0),
(48, 7, '6', 0),
(49, 7, '7', 0),
(50, 7, '8', 0),
(51, 7, '9', 0),
(52, 7, '10', 0);

-- Insert parameters for Rail
INSERT INTO parameters (id, parameter_group_id, name, price_modifier) VALUES
(53, 8, 'Ul', 0),
(54, 8, 'Shanaa', 5);

-- Insert Base Box products
INSERT INTO products (id, category_id, name, description, base_price) VALUES
(1, 1, '1 Door Drawer', 'Single door drawer base box', 25000),
(2, 1, '2 Door Drawer', 'Two door drawer base box', 35000),
(3, 1, '2 Door Drawer/1 Inside', 'Two door drawer with one inside compartment', 38000),
(4, 1, '3 Door Drawer/2s1big/', '3 door drawer with 2 small and 1 big', 45000),
(5, 1, '3 Door Drawer/Same', '3 door drawer with same size compartments', 45000),
(6, 1, '1 Door Box', 'Single door box', 22000),
(7, 1, '2 Door Box', 'Two door box', 32000),
(8, 1, 'Corner Box', 'Corner cabinet box', 40000),
(9, 1, 'Open Box', 'Open storage box', 18000),
(10, 1, 'With Oven', 'Base box designed for oven', 50000);

-- Insert Wall Box products
INSERT INTO products (id, category_id, name, description, base_price) VALUES
(11, 2, '1 Door Box', 'Single door wall box', 20000),
(12, 2, '2 Door Box', 'Two door wall box', 30000),
(13, 2, 'Corner Box', 'Corner wall box', 35000),
(14, 2, 'Vent Box Integrated', 'Integrated ventilation box', 45000),
(15, 2, 'Vent Box', 'Ventilation box', 40000);

-- Insert Partial products
INSERT INTO products (id, category_id, name, description, base_price) VALUES
(16, 3, 'With Fridge 60x195', 'Cabinet for fridge 60x195', 35000),
(17, 3, 'Toe Kick 10cm', 'Toe kick panel 10cm height', 5000),
(18, 3, 'Tavtsan', 'Tavtsan component', 15000),
(19, 3, 'Tavtsangiin Ar', 'Tavtsangiin ar component', 12000);

-- Insert Ready Products
INSERT INTO products (id, category_id, name, description, base_price) VALUES
(20, 4, 'Shurguulga Tusgaarlagch', 'Cabinet separator', 8000),
(21, 4, 'Objur', 'Objur component', 6000),
(22, 4, 'Matrass', 'Mattress', 25000),
(23, 4, 'Combo Bagaj', 'Combo baggage unit', 30000);

-- Link products to parameter groups with defaults
-- Product 1: 1 Door Drawer (Handle, Depth, Height, Width, Colour, Quantity, Rail)
INSERT INTO product_parameter_groups (product_id, parameter_group_id, default_parameter_id) VALUES
(1, 1, 1), -- Handle: Hidden
(1, 2, 3), -- Depth: 56cm
(1, 3, 6), -- Height: 72cm
(1, 4, 12), -- Width: 40cm
(1, 5, 26), -- Colour: White
(1, 7, 43), -- Quantity: 1
(1, 8, 53); -- Rail: Ul

-- Product 2-5: Similar drawer configurations
INSERT INTO product_parameter_groups (product_id, parameter_group_id, default_parameter_id) VALUES
(2, 1, 1), (2, 2, 3), (2, 3, 6), (2, 4, 12), (2, 5, 26), (2, 7, 43), (2, 8, 53),
(3, 1, 1), (3, 2, 3), (3, 3, 6), (3, 4, 12), (3, 5, 26), (3, 7, 43), (3, 8, 53),
(4, 1, 1), (4, 2, 3), (4, 3, 6), (4, 4, 12), (4, 5, 26), (4, 7, 43), (4, 8, 53),
(5, 1, 1), (5, 2, 3), (5, 3, 6), (5, 4, 12), (5, 5, 26), (5, 7, 43), (5, 8, 53);

-- Product 6-7: Door boxes with shelves
INSERT INTO product_parameter_groups (product_id, parameter_group_id, default_parameter_id) VALUES
(6, 1, 1), (6, 2, 3), (6, 3, 6), (6, 4, 12), (6, 5, 26), (6, 6, 40), (6, 7, 43),
(7, 1, 1), (7, 2, 3), (7, 3, 6), (7, 4, 12), (7, 5, 26), (7, 6, 40), (7, 7, 43);

-- Product 8: Corner box
INSERT INTO product_parameter_groups (product_id, parameter_group_id, default_parameter_id) VALUES
(8, 1, 1), (8, 2, 3), (8, 3, 6), (8, 4, 16), (8, 5, 26), (8, 6, 40), (8, 7, 43);

-- Product 9: Open box
INSERT INTO product_parameter_groups (product_id, parameter_group_id, default_parameter_id) VALUES
(9, 1, 1), (9, 2, 3), (9, 3, 6), (9, 4, 12), (9, 5, 26), (9, 6, 40), (9, 7, 43);

-- Product 10: With oven
INSERT INTO product_parameter_groups (product_id, parameter_group_id, default_parameter_id) VALUES
(10, 1, 1), (10, 2, 3), (10, 3, 6), (10, 4, 14), (10, 5, 26), (10, 7, 43);

-- Wall box products (11-15)
INSERT INTO product_parameter_groups (product_id, parameter_group_id, default_parameter_id) VALUES
(11, 1, 1), (11, 2, 4), (11, 3, 7), (11, 4, 12), (11, 5, 26), (11, 6, 40), (11, 7, 43),
(12, 1, 1), (12, 2, 4), (12, 3, 7), (12, 4, 12), (12, 5, 26), (12, 6, 40), (12, 7, 43),
(13, 1, 1), (13, 2, 4), (13, 3, 7), (13, 4, 14), (13, 5, 26), (13, 6, 40), (13, 7, 43),
(14, 1, 1), (14, 2, 4), (14, 3, 7), (14, 4, 14), (14, 5, 26), (14, 6, 40), (14, 7, 43),
(15, 1, 1), (15, 2, 4), (15, 3, 7), (15, 4, 14), (15, 5, 26), (15, 7, 43);

-- Partial products (16-19)
INSERT INTO product_parameter_groups (product_id, parameter_group_id, default_parameter_id) VALUES
(16, 2, 3), (16, 3, 9), (16, 4, 14), (16, 5, 26), (16, 7, 43),
(17, 4, 19), (17, 5, 26), (17, 7, 43),
(18, 2, 5), (18, 4, 20), (18, 5, 26), (18, 7, 43),
(19, 2, 5), (19, 4, 20), (19, 5, 26), (19, 7, 43);

-- Ready products (20-23)
INSERT INTO product_parameter_groups (product_id, parameter_group_id, default_parameter_id) VALUES
(20, 4, 12), (20, 7, 43),
(21, 5, 26), (21, 7, 43),
(22, 4, 22), (22, 7, 43),
(23, 7, 43);

-- Insert the seed data migration version
INSERT INTO schema_migrations (version) VALUES ('0002_seed_data');
