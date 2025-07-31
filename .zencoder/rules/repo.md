# Morserino Web - Repository Information

## Project Overview
Morserino Web is a web-based Morse code training application that interfaces with the Morserino-32 device via Web Serial API. The application provides interactive Morse code practice with user accounts, session tracking, and performance statistics visualization.

**Live URL**: https://om0rx.com/morserino  
**Repository**: https://github.com/oliverbross/morserino-web

## Technology Stack

### Frontend
- **HTML5**: Semantic markup with Web Serial API integration
- **JavaScript (ES6+)**: Modular architecture with classes and async/await
- **CSS3**: Custom styles with Tailwind CSS framework
- **Chart.js**: Statistics visualization with stacked bar charts
- **Web Serial API**: Hardware communication (Chrome/Edge only)

### Backend
- **PHP 7.x+**: RESTful API endpoints with procedural style
- **MariaDB/MySQL**: Relational database for user data and statistics
- **Apache**: Web server with HTTPS/SSL requirements
- **Composer**: PHP dependency management (phpdotenv)

### Dependencies
- **Frontend**: Chart.js (via npm)
- **Backend**: vlucas/phpdotenv for environment variables
- **External**: Sortable.min.js for drag-and-drop functionality

## File Structure & Architecture

### Root Level Files
- `index.html` - Main application interface with login/training UI
- `account.html` - User account management page
- `index.js` - Main application logic and initialization
- `dom_elements_and_handlers.js` - UI event handling and Web Serial communication
- `stats_class.js` - Statistics management and Chart.js integration
- `account.js` - Account management functionality
- `callsign_generator.js` - Amateur radio callsign generation
- `custom_styles_supplement_tailwind_css.css` - Custom CSS additions to Tailwind
- `styles.css` - Additional custom styles
- `tailwind.min.css` - Tailwind CSS framework (minified)
- `Sortable.min.js` - Third-party sortable functionality

### API Directory (`/api/`)
**Authentication & User Management:**
- `register.php` - User registration with password hashing
- `login.php` - User authentication and session creation
- `session.php` - Session validation and user status
- `logout.php` - Session termination
- `change_password.php` - Password update functionality
- `delete-account.php` - Account deletion

**Data Management:**
- `stats.php` - Training session statistics (save/retrieve)
- `get_stats.php` - Statistics data retrieval
- `preferences.php` - User preferences management
- `settings.php` - Application settings
- `words.php` - Word list management
- `test.php` - API testing and debugging

### Data Directory (`/data/`)
- `abbreviations.txt` - Common amateur radio abbreviations
- `callsigns.txt` - Sample callsigns for training
- `qr-codes.txt` - QR code content for training
- `top-words-in-cw.txt` - Most common Morse code words
- `words.txt` - General word list for practice
- `index.html`, `index.js` - Data directory interface files

## Database Schema

### Tables
```sql
-- Users table
users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    hash VARCHAR(255) NOT NULL,
    salt VARCHAR(255) NOT NULL
)

-- Training statistics
stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    correct INT NOT NULL,
    total INT NOT NULL,
    mode VARCHAR(50) NOT NULL,
    date DATETIME NOT NULL,
    FOREIGN KEY (username) REFERENCES users(username)
)

-- User preferences
preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    dateFormat VARCHAR(50) DEFAULT 'DD/MM/YYYY',
    timeFormat VARCHAR(50) DEFAULT '24h',
    FOREIGN KEY (username) REFERENCES users(username)
)
```

## Key Components & Patterns

### Web Serial Communication
- Uses Web Serial API for Morserino-32 device communication
- Requires HTTPS and modern Chrome/Edge browsers
- Handles USB device connection, data transmission, and error management
- CP2102 USB driver required for device recognition

### Training Modes
1. **Real Words** - Common English words for practice
2. **Callsigns** - Amateur radio callsign practice
3. **QSOs** - Simulated amateur radio conversations
4. **Abbreviations** - Common CW abbreviations
5. **Custom** - User-defined practice content

### Authentication System
- Session-based authentication with PHP sessions
- Password hashing with salt for security
- CORS headers configured for API access
- Secure credential storage via environment variables

### Statistics & Visualization
- Chart.js integration for performance tracking
- Stacked bar charts showing correct/incorrect responses
- Date-based filtering and grouping
- Real-time statistics updates during training

## Development Workflow

### Environment Setup
1. **Local Development**: XAMPP/WAMP with PHP 7.x+ and MariaDB
2. **Dependencies**: Run `npm install` for frontend packages
3. **Database**: Import schema and create `.env` file with credentials
4. **SSL**: HTTPS required for Web Serial API functionality

### Common Tasks
- **Frontend Testing**: Use Chrome DevTools for Web Serial debugging
- **API Testing**: Use `api/test.php` for endpoint verification
- **Database Changes**: Update schema in both development and production
- **Deployment**: Copy files to web server, update environment variables

## Important Notes & Considerations

### Browser Compatibility
- **Web Serial API**: Chrome 89+, Edge 89+ only
- **Fallback**: No fallback for other browsers (technical limitation)
- **Mobile**: Not supported due to Web Serial API restrictions

### Security Considerations
- HTTPS required for Web Serial API
- Environment variables for database credentials
- Password hashing with individual salts
- Session management with proper cleanup
- CORS headers properly configured

### Performance Notes
- Chart.js can be resource-intensive with large datasets
- Database queries should be optimized for statistics retrieval
- Web Serial communication is asynchronous and requires proper error handling

### Future Development Areas
1. **WPM Control**: Customizable training speed
2. **Enhanced Statistics**: More detailed performance metrics
3. **Responsive Design**: Better mobile experience (where possible)
4. **Custom Word Lists**: User-defined practice content
5. **Account Management**: Enhanced user preferences

## File Naming Conventions
- **JavaScript**: camelCase for functions, snake_case for files
- **PHP**: snake_case for files and functions
- **CSS**: kebab-case for custom classes
- **HTML**: semantic naming with consistent structure

## API Patterns
- **Request Method**: Primarily POST with JSON payloads
- **Response Format**: JSON with consistent success/error structure
- **Authentication**: Session-based with username validation
- **Error Handling**: Proper HTTP status codes and error messages

## Development Commands
```bash
# Install frontend dependencies
npm install

# Install PHP dependencies
composer install

# Set up database (MySQL/MariaDB)
mysql -u root -p < schema.sql

# Start local development (if using built-in PHP server)
php -S localhost:8000
```

This repository represents a specialized web application combining hardware integration, user management, and educational content delivery for amateur radio operators and Morse code enthusiasts.