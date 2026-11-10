CREATE TABLE IF NOT EXISTS profiles (
  id VARCHAR(40) PRIMARY KEY,
  display_name VARCHAR(80) NOT NULL,
  is_demo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS preferences (
  profile_id VARCHAR(40) PRIMARY KEY,
  settings JSON NOT NULL,
  FOREIGN KEY (profile_id) REFERENCES profiles(id)
);
CREATE TABLE IF NOT EXISTS tutorials (
  id VARCHAR(40) PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  version INT NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS tutorial_steps (
  tutorial_id VARCHAR(40) NOT NULL,
  step_index INT NOT NULL,
  definition JSON NOT NULL,
  PRIMARY KEY (tutorial_id, step_index),
  FOREIGN KEY (tutorial_id) REFERENCES tutorials(id)
);
CREATE TABLE IF NOT EXISTS training_sessions (
  id CHAR(36) PRIMARY KEY,
  profile_id VARCHAR(40) NOT NULL,
  tutorial_id VARCHAR(40) NOT NULL,
  guided BOOLEAN NOT NULL,
  mode ENUM('guided','assisted','independent') NOT NULL,
  event_log JSON NOT NULL,
  completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES profiles(id),
  FOREIGN KEY (tutorial_id) REFERENCES tutorials(id),
  INDEX profile_date (profile_id, completed_at)
);
CREATE TABLE IF NOT EXISTS completions (
  session_id CHAR(36) PRIMARY KEY,
  profile_id VARCHAR(40) NOT NULL,
  tutorial_id VARCHAR(40) NOT NULL,
  FOREIGN KEY (session_id) REFERENCES training_sessions(id),
  FOREIGN KEY (profile_id) REFERENCES profiles(id),
  FOREIGN KEY (tutorial_id) REFERENCES tutorials(id)
);
CREATE TABLE IF NOT EXISTS activities (
  id VARCHAR(40) PRIMARY KEY,
  kind ENUM('lesson','game') NOT NULL,
  definition JSON NOT NULL
);
CREATE TABLE IF NOT EXISTS activity_results (
  id CHAR(36) PRIMARY KEY,
  profile_id VARCHAR(40) NOT NULL,
  activity_id VARCHAR(40) NOT NULL,
  correct BOOLEAN NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES profiles(id),
  FOREIGN KEY (activity_id) REFERENCES activities(id)
);
CREATE TABLE IF NOT EXISTS satisfaction_feedback (
  id CHAR(36) PRIMARY KEY,
  profile_id VARCHAR(40) NOT NULL,
  rating INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES profiles(id),
  CHECK (rating BETWEEN 1 AND 3)
);
