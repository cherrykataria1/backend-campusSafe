-- Create the 'college_health_management' database
CREATE DATABASE IF NOT EXISTS college_health_management;
USE college_health_management;

-- Table for Users (Students, Teachers, Admin)
CREATE TABLE IF NOT EXISTS users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    user_type ENUM('student', 'teacher', 'admin') NOT NULL
);

-- Table for Classes
CREATE TABLE IF NOT EXISTS classes (
    class_id INT PRIMARY KEY AUTO_INCREMENT,
    class_name VARCHAR(50) NOT NULL
);

-- Table for Subjects
CREATE TABLE IF NOT EXISTS subjects (
    subject_id INT PRIMARY KEY AUTO_INCREMENT,
    subject_name VARCHAR(100) NOT NULL
);

-- Table for Students
CREATE TABLE IF NOT EXISTS students (
    student_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE,
    class_id INT,
    full_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (class_id) REFERENCES classes(class_id)
);

-- Table for Teachers
CREATE TABLE IF NOT EXISTS teachers (
    teacher_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE,
    class_id INT,
    full_name VARCHAR(100) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (class_id) REFERENCES classes(class_id)
);

-- Table for Admins
CREATE TABLE IF NOT EXISTS admins (
    admin_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Table for Health Stats
CREATE TABLE IF NOT EXISTS health_stats (
    stat_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    height DECIMAL(5, 2),
    weight DECIMAL(5, 2),
    blood_pressure VARCHAR(20),
    heart_rate INT,
    other_stats TEXT,
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);

-- Table for Student-Subject Relationship (Assuming Many-to-Many)
CREATE TABLE IF NOT EXISTS student_subjects (
    student_id INT,
    subject_id INT,
    PRIMARY KEY (student_id, subject_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id)
);
