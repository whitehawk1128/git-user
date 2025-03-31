CREATE TABLE saved_users (
    id INT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    avatar_url TEXT NULL,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);