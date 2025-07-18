INSERT INTO `longtermhire_uploads` VALUES (NULL, 'random_string_0', 'random_string_0', 1, 23, 42, 0, '2025-07-14', '2025-07-14');
INSERT INTO `longtermhire_uploads` VALUES (NULL, 'random_string_1', 'random_string_1', 1, 97, 51, 0, '2025-07-14', '2025-07-14');
INSERT INTO `longtermhire_uploads` VALUES (NULL, 'random_string_2', 'random_string_2', 1, 84, 98, 0, '2025-07-14', '2025-07-14');
INSERT INTO `longtermhire_tokens` VALUES (NULL, 1, 'random_string_0', 'random_string_0', 0, '{"key": "value"}', 0, '2025-07-14', '2025-07-14', '2025-07-14');
INSERT INTO `longtermhire_tokens` VALUES (NULL, 1, 'random_string_1', 'random_string_1', 0, '{"key": "value"}', 0, '2025-07-14', '2025-07-14', '2025-07-14');
INSERT INTO `longtermhire_tokens` VALUES (NULL, 1, 'random_string_2', 'random_string_2', 0, '{"key": "value"}', 0, '2025-07-14', '2025-07-14', '2025-07-14');
INSERT INTO `longtermhire_preference` VALUES (NULL, 'random_string_0', 'random_string_0', 'random_string_0', 'random_string_0', 37);
INSERT INTO `longtermhire_preference` VALUES (NULL, 'random_string_1', 'random_string_1', 'random_string_1', 'random_string_1', 13);
INSERT INTO `longtermhire_preference` VALUES (NULL, 'random_string_2', 'random_string_2', 'random_string_2', 'random_string_2', 43);
-- Admin user (password: admin123) - bcrypt hash for "admin123"
INSERT INTO `longtermhire_user` VALUES (NULL, 'admin@equipmenthire.com', '$2a$10$QpmL43lCHlk.fHFRcovgTu287gkAVvKpNL7HGaNE1wVoe5Hax5Mz6', 0, 'super_admin', '{}', 1, 1, 0, 0, 'admin', NOW(), NOW());

-- Sample client user (password: client123) - bcrypt hash for "client123"
INSERT INTO `longtermhire_user` VALUES (NULL, 'client@example.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ4uJzQjta1HN6B8L3nxXCo7UFk2qJRK', 0, 'member', '{}', 1, 1, 0, 0, 'client_user', NOW(), NOW());
-- Sample client profile for the client user (user_id = 2)
INSERT INTO `longtermhire_client` VALUES (NULL, 2, 'John Smith', 'ABC Construction', '+1234567890', NOW(), NOW());

-- Additional sample client user (password: demo123) - bcrypt hash for "demo123"
INSERT INTO `longtermhire_user` VALUES (NULL, 'demo@client.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjdQXvbVdO.lfy.lHpVHpyDvzCUBPK', 0, 'member', '{}', 1, 1, 0, 0, 'demo_client', NOW(), NOW());
-- Sample client profile for the demo client user (user_id = 3)
INSERT INTO `longtermhire_client` VALUES (NULL, 3, 'Jane Doe', 'Demo Construction Ltd', '+1987654321', NOW(), NOW());

-- Sample pricing packages
INSERT INTO `longtermhire_pricing_package` VALUES (NULL, 'PKG001', 'Starter Package', 'Basic discount for new clients', 0, 10.00, 1, NOW(), NOW());
INSERT INTO `longtermhire_pricing_package` VALUES (NULL, 'PKG002', 'Premium Package', 'Premium discount for regular clients', 0, 15.00, 1, NOW(), NOW());

-- Sample equipment
INSERT INTO `longtermhire_equipment_item` VALUES (NULL, 'EXC', 'Excavators', 'EXC001', 'CAT 320D Excavator', '$2500/month', '3 Months', 1, 1, NOW(), NOW());
INSERT INTO `longtermhire_equipment_item` VALUES (NULL, 'EXC', 'Excavators', 'EXC002', 'Volvo EC210 Excavator', '$2800/month', '3 Months', 1, 1, NOW(), NOW());
INSERT INTO `longtermhire_equipment_item` VALUES (NULL, 'LOD', 'Loaders', 'LOD001', 'CAT 950M Loader', '$2200/month', '3 Months', 0, 1, NOW(), NOW());

-- Sample content
INSERT INTO `longtermhire_content` VALUES (NULL, 'EXC001', 'CAT 320D Excavator', 'Powerful and reliable excavator perfect for construction projects', 'Heavy-duty excavator for all your construction needs', 'excavator1.jpg', 1, NOW(), NOW());

-- Sample equipment assignments (clients get access to equipment)
INSERT INTO `longtermhire_client_equipment` VALUES (NULL, 2, 1, 1, NOW()); -- John Smith gets CAT 320D
INSERT INTO `longtermhire_client_equipment` VALUES (NULL, 2, 2, 1, NOW()); -- John Smith gets Volvo EC210
INSERT INTO `longtermhire_client_equipment` VALUES (NULL, 3, 1, 1, NOW()); -- Jane Doe gets CAT 320D
INSERT INTO `longtermhire_client_equipment` VALUES (NULL, 3, 3, 1, NOW()); -- Jane Doe gets CAT 950M Loader

-- Sample pricing assignments (clients get packages)
INSERT INTO `longtermhire_client_pricing` VALUES (NULL, 2, 1, 1, NOW()); -- John Smith gets Starter Package (10% off)
INSERT INTO `longtermhire_client_pricing` VALUES (NULL, 3, 2, 1, NOW()); -- Jane Doe gets Premium Package (15% off)

-- Sample requests
INSERT INTO `longtermhire_request` VALUES (NULL, 2, 1, 'I need this excavator for a 3-month project', 'pending', NOW(), NOW());
INSERT INTO `longtermhire_request` VALUES (NULL, 3, 1, 'Looking to rent this for a construction project', 'approved', NOW(), NOW());
