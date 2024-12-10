# Project Documentation

This project consists of two main parts:

1. **Frontend**: Vanilla JS/CSS/HTML, with SPA routing enabled by the class Router (assets/scripts/modules/Router/Router.mjs).
2. **Backend**: Built with PHP (2 very small APIs).

## General Setup

### Prerequisites

- PHP 8.x or later.
- MySQL/MariaDB.

### Setup Instructions

#### Backend

1. **Create Database User and Schema**:

   - Create a MySQL user and schema.
   - Example SQL:
     ```sql
     CREATE DATABASE web_dev_proj_db;
     CREATE USER 'web_dev_proj_db'@'localhost' IDENTIFIED BY 'your_password';
     GRANT SELECT, INSERT ON web_dev_proj_db.* TO 'web_dev_proj_db'@'localhost';
     FLUSH PRIVILEGES;
     ```

2. **Environment File**:

   - Navigate to the `/backend/db/` directory.
   - Create a `.env` file based on `.env.example`.
   - Example `.env` content:
     ```env
        DB_HOST="127.0.0.1"
        DB_USERNAME="web_dev_proj_db"
        DB_PASSWORD="your_db_user_password"
        DB_SCHEMA="web_dev_proj_db"
        MAIL_HOST="your_mail_host"
        MAIL_USERNAME="your_mail_user"
        MAIL_PSW="your_mail_psw"
        MAIL_SMTP_SECURE="tls_secure"
        MAIL_PORT="your_mail_port"
        MAIL_DEFAULT_TO_ADDRESS="your_mail_default_to_address"
        MAIL_DEFAULT_TO_NAME="your_mail_default_to_name"
        MAIL_FROM_ADDRESS="your_mail_from_address"
        MAIL_FROM_NAME="Michael Lavigna's Project Notification"
        MAIL_CHARSET=UTF-8
        MAIL_REPLY_TO_ADDRESS="your_mail_reply_to_address"
        MAIL_REPLY_TO_NAME="your_mail_reply_to_name"
     ```
     - Replace `your_db_user_password` with the database password.
     - Replace all the MAIL_* variables with yours.