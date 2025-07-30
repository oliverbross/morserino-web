
# Morserino Web

## Overview
Morserino Web is a web-based application designed to interact with the [Morserino-32](https://www.morserino.info/), a versatile Morse code training device. The application allows users to practice Morse code by connecting to the Morserino-32 via the Web Serial API, selecting training modes (e.g., real words, callsigns, QSOs), and tracking performance statistics. Built with HTML, JavaScript, and PHP, it uses a MariaDB database to store user accounts and session data, with Chart.js for visualizing training progress.

The project is hosted at [https://om0rx.com/morserino](https://om0rx.com/morserino) and aims to provide a user-friendly platform for Morse code enthusiasts to improve their skills.

## Goals
- **Interactive Morse Code Training**: Enable users to connect to the Morserino-32, select training modes, and practice Morse code in a browser.
- **User Accounts**: Support user registration and login to save preferences and session history.
- **Performance Tracking**: Store training session data (correct/total items, mode, date) and display it using bar charts.
- **Future Features**:
  - Add WPM (words per minute) control for customized training speed.
  - Enhance statistics with detailed metrics (e.g., accuracy over time, mode-specific performance).
  - Support additional training modes (e.g., custom word lists).
  - Improve user interface with responsive design and Tailwind CSS enhancements.
  - Add account management features (e.g., password change, user preferences for date/time formats).

## Features
- **Web Serial Integration**: Connects to the Morserino-32 via USB using the Web Serial API (supported in Chrome/Edge).
- **Training Modes**: Practice with real words, callsigns, or simulated QSOs.
- **User Authentication**: Secure registration and login with password hashing.
- **Session History**: Saves training session results to a MariaDB database (work in progress).
- **Statistics Visualization**: Displays correct/incorrect responses in a stacked bar chart using Chart.js.
- **Account Management**: Basic account page for changing passwords (work in progress).

## Project Structure
```
morserino-web/
├── index.html                # Main page with login/register and training interface
├── account.html              # Account management page
├── dom_elements_and_handlers.js  # Handles UI events and Web Serial communication
├── stats_class.js            # Manages stats fetching and saving
├── account.js                # Handles account management logic
├── callsign_generator.js     # Generates callsigns for training
├── custom_styles_supplement_tailwind_css.css  # Custom CSS with Tailwind
├── package.json              # Node.js dependencies (e.g., Chart.js)
├── package-lock.json         # Dependency lock file
├── api/
│   ├── register.php          # Handles user registration
│   ├── login.php            # Handles user login
│   ├── session.php          # Checks session status
│   ├── stats.php            # Saves and retrieves session data
│   ├── change-password.php   # Updates user password
│   ├── delete-account.php    # Deletes user account
│   └── .env                 # Environment variables (not in Git)
├── .gitignore                # Excludes sensitive files (e.g., .env)
└── README.md                 # Project documentation
```

## Prerequisites
- **Server**: A web server (e.g., Apache) with PHP 7.x or higher and MariaDB.
- **Browser**: Chrome or Edge (for Web Serial API support).
- **Morserino-32**: Connected via USB with the CP2102 driver installed ([download here](https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers)).
- **Git**: For cloning the repository.
- **Composer**: For PHP dependencies (optional, for `phpdotenv`).

## Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/oliverbross/morserino-web.git
cd morserino-web
```

### 2. Set Up the Web Server
- **Copy Files**: Place the repository files in your web server’s public directory (e.g., `/var/www/html/morserino` or `/home/om0rx/public_html/morserino`).
- **Permissions**:
  ```bash
  chown -R www-data:www-data /path/to/morserino-web
  chmod -R 644 /path/to/morserino-web/*.html
  chmod -R 644 /path/to/morserino-web/*.js
  chmod -R 644 /path/to/morserino-web/api/*.php
  chmod 755 /path/to/morserino-web/api
  ```
- **Apache Configuration**:
  - Ensure the virtual host is configured for HTTPS with a valid SSL certificate (e.g., Let’s Encrypt).
  - Example `/etc/apache2/sites-available/morserino.conf`:
    ```apache
    <VirtualHost *:443>
        ServerName your-domain.com
        DocumentRoot /path/to/morserino-web
        SSLEngine on
        SSLCertificateFile /etc/letsencrypt/live/your-domain.com/fullchain.pem
        SSLCertificateKeyFile /etc/letsencrypt/live/your-domain.com/privkey.pem
        <Directory /path/to/morserino-web>
            Options Indexes FollowSymLinks
            AllowOverride None
            Require all granted
        </Directory>
        <Directory /path/to/morserino-web/api>
            Header set Access-Control-Allow-Origin "https://your-domain.com"
            Header set Access-Control-Allow-Credentials "true"
            Header set Access-Control-Allow-Methods "GET, POST"
            Header set Access-Control-Allow-Headers "Content-Type"
        </Directory>
    </VirtualHost>
    ```
  - Enable site and restart Apache:
    ```bash
    sudo a2ensite morserino.conf
    sudo systemctl restart apache2
    ```

### 3. Set Up the Database
- **Create Database**:
  ```bash
  mysql -u root -p
  ```
  ```sql
  CREATE DATABASE morserino;
  GRANT ALL PRIVILEGES ON morserino.* TO 'morserino_user'@'localhost' IDENTIFIED BY 'YOUR_PASSWORD';
  FLUSH PRIVILEGES;
  EXIT;
  ```
- **Create Tables**:
  ```sql
  USE morserino;

  CREATE TABLE users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      hash VARCHAR(255) NOT NULL,
      salt VARCHAR(255) NOT NULL
  ) ENGINE=InnoDB;

  CREATE TABLE stats (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL,
      correct INT NOT NULL,
      total INT NOT NULL,
      mode VARCHAR(50) NOT NULL,
      date DATETIME NOT NULL,
      FOREIGN KEY (username) REFERENCES users(username)
  ) ENGINE=InnoDB;

  CREATE TABLE preferences (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      dateFormat VARCHAR(50) DEFAULT 'DD/MM/YYYY',
      timeFormat VARCHAR(50) DEFAULT '24h',
      FOREIGN KEY (username) REFERENCES users(username)
  ) ENGINE=InnoDB;
  ```

### 4. Configure Environment Variables
- **Install `phpdotenv`** (optional, for secure credentials):
  ```bash
  cd /path/to/morserino-web
  composer require vlucas/phpdotenv
  ```
- **Create `api/.env`**:
  ```env
  DB_HOST=localhost
  DB_NAME=morserino
  DB_USER=morserino_user
  DB_PASS=YOUR_PASSWORD
  ```
- **Update PHP Files**:
  - Edit `api/register.php`, `api/login.php`, `api/session.php`, `api/stats.php`, etc., to use environment variables:
    ```php
    require_once __DIR__ . '/../vendor/autoload.php';
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
    $dotenv->load();
    $dbHost = $_ENV['DB_HOST'];
    $dbName = $_ENV['DB_NAME'];
    $dbUser = $_ENV['DB_USER'];
    $dbPass = $_ENV['DB_PASS'];
    ```

### 5. Install Frontend Dependencies
- **Install Node.js** (if not installed):
  ```bash
  sudo apt update
  sudo apt install -y nodejs npm
  ```
- **Install Chart.js**:
  ```bash
  npm install
  ```
  - This uses `package.json` to install dependencies like Chart.js.

### 6. Run the Application
- Access `https://your-domain.com/morserino/index.html` in Chrome or Edge.
- Register a new user (e.g., username: `test`, password: `pass123`).
- Log in, connect to the Morserino-32 via USB, and select a training mode (e.g., Real Words).
- Complete a session and view stats (work in progress).

### 7. Troubleshooting
- **Web Serial Issues**:
  - Ensure the Morserino-32 is connected and the CP2102 driver is installed.
  - Use Chrome/Edge and check DevTools (F12) for errors.
- **Database Issues**:
  - Verify credentials in `api/.env`.
  - Check MariaDB logs: `sudo tail -n 50 /var/log/mysql/error.log`.
- **PHP Issues**:
  - Check Apache logs: `sudo tail -n 50 /var/log/apache2/error.log`.
  - Enable PHP errors temporarily:
    ```php
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
    ```
- **Session Issues**:
  - Ensure session storage is writable:
    ```bash
    sudo chown -R www-data:www-data /var/lib/php/sessions
    sudo chmod -R 770 /var/lib/php/sessions
    ```

## Contributing
Contributions are welcome! To contribute:
1. Fork the repository.
2. Create a branch: `git checkout -b feature/your-feature`.
3. Commit changes: `git commit -m "Add your feature"`.
4. Push to your fork: `git push origin feature/your-feature`.
5. Open a pull request on `https://github.com/oliverbross/morserino-web`.

## License
[MIT License](LICENSE) (to be added).

## Contact
For issues or suggestions, open an issue on GitHub or contact [your.email@example.com].

