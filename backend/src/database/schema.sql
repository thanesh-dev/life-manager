-- MySQL schema for Life Manager (v2 — updated)
-- Full re-run (IF NOT EXISTS safe):
--   mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS lifemanager;"
--   mysql -u root -p lifemanager < schema.sql

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS goals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  type ENUM('FITNESS','FINANCE','LEARNING') NOT NULL,
  title TEXT NOT NULL,
  target JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Fitness logs: steps for cardio, workout_details JSON for gym
CREATE TABLE IF NOT EXISTS fitness_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  activity VARCHAR(100) NOT NULL,
  activity_type ENUM('cardio','gym','other') DEFAULT 'other',
  duration INT NOT NULL,
  calories INT,
  steps INT,                    -- walking / running / jogging
  workout_details JSON,         -- gym: [{exercise, sets, reps, weight_kg}]
  notes TEXT,
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Finance logs (amounts encrypted AES-256-GCM)
CREATE TABLE IF NOT EXISTS finance_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  category VARCHAR(50) NOT NULL,
  amount_enc TEXT NOT NULL,
  note_enc TEXT,
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Learning notes
CREATE TABLE IF NOT EXISTS learning_notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  topic TEXT NOT NULL,
  content TEXT NOT NULL,
  tags JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Food logs
CREATE TABLE IF NOT EXISTS food_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  food_name VARCHAR(200) NOT NULL,
  kcal INT NOT NULL,
  serving_unit VARCHAR(50) DEFAULT 'quantity', -- g, kg, katori, bowl, quantity
  serving_size DECIMAL(10,2) DEFAULT 1.0,
  meal_type ENUM('breakfast','lunch','dinner','snack') DEFAULT 'snack',
  image_analyzed BOOLEAN DEFAULT FALSE,
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Per-user daily kcal target
CREATE TABLE IF NOT EXISTS food_targets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNIQUE,
  daily_kcal_target INT DEFAULT 2000,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id INT PRIMARY KEY,
  age INT,
  height DECIMAL(5,2), -- in cm
  weight DECIMAL(5,2), -- in kg
  profession VARCHAR(100),
  goal_description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Upgrade existing fitness_logs if already created (comment out if fresh install)
-- ALTER TABLE fitness_logs ADD COLUMN IF NOT EXISTS activity_type ENUM('cardio','gym','other') DEFAULT 'other';
-- ALTER TABLE fitness_logs ADD COLUMN IF NOT EXISTS steps INT;
-- ALTER TABLE fitness_logs ADD COLUMN IF NOT EXISTS workout_details JSON;
