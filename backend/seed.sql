SET FOREIGN_KEY_CHECKS=0;
REPLACE INTO Users (id, name, email, password, role, createdAt, updatedAt) 
VALUES (999, 'Super Admin', 'admin@jobie.app', '$2b$10$XoB/2n9V3H9f/R8XzYpS8.nLzYvXp.z6V7yVp.z6V7yVp.z6V7yVp.', 'admin', NOW(), NOW());
SET FOREIGN_KEY_CHECKS=1;
