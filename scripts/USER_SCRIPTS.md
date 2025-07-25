# 👤 User Management Scripts

Simple scripts to manage users in the Loan Tracker database.

## 📋 Available Scripts

### 1. `create-user.py` - Create New User

Creates a new user in the database with secure password hashing.

#### Usage

**Interactive Mode:**
```bash
python create-user.py
```

**Command Line Mode:**
```bash
python create-user.py username password "Full Name"
```

#### Examples

```bash
# Interactive mode
python create-user.py
# Enter details when prompted

# Command line mode
python create-user.py john_doe securepass123 "John Doe"
python create-user.py manager1 strongpass456 "Jane Manager"
```

### 2. `list-users.py` - List All Users

Lists all users in the database with their details.

#### Usage

```bash
python list-users.py
```

#### Output Example

```
🔐 Loan Tracker - User Listing Script
==================================================
🔗 Connecting to database: localhost:5432/loan_tracker

📋 Users in Database (3 total):
================================================================================
ID    Username             Full Name                Status     Created
================================================================================
1     admin                Administrator            ✅ Active   2024-01-15 10:30
2     john_doe             John Doe                 ✅ Active   2024-01-15 11:45
3     manager1             Jane Manager             ✅ Active   2024-01-15 14:20
================================================================================

📊 Summary:
   Total Users: 3
   Active Users: 3
   Inactive Users: 0

✅ User listing completed successfully!
```

### 3. `manage_users.py` - Advanced User Management

Full-featured user management script with additional commands.

#### Usage

```bash
# List all users
python manage_users.py list

# Add a new user
python manage_users.py add username password "Full Name"

# Deactivate a user
python manage_users.py deactivate username

# Activate a user
python manage_users.py activate username

# Change user password
python manage_users.py password username newpassword

# Show help
python manage_users.py help
```

## 🔧 Prerequisites

### 1. Environment Setup

Make sure you have a `.env` file with your database configuration:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/loan_tracker
```

### 2. Database Initialization

The database must be initialized first. Run the main application once to create the required tables:

```bash
python app.py
```

### 3. Dependencies

Install required packages:

```bash
pip install -r requirements.txt
```

## 🔐 Security Features

### Password Security

- Passwords are hashed using bcrypt with salt
- Minimum password length: 6 characters
- Plain text passwords are never stored

### Input Validation

- Username minimum length: 3 characters
- All fields are required
- Duplicate username prevention
- Database connection validation

## 📝 Usage Examples

### Creating Your First User

```bash
# 1. Make sure your .env file is configured
echo "DATABASE_URL=postgresql://postgres:password@localhost:5432/loan_tracker" > .env

# 2. Run the main app once to initialize database
python app.py
# (Stop it after it starts - Ctrl+C)

# 3. Create your first user
python create-user.py
# Enter: username, password, full name when prompted

# 4. Verify user was created
python list-users.py
```

### Creating Multiple Users

```bash
# Create loan officers
python create-user.py loan_officer1 pass123 "Alice Johnson"
python create-user.py loan_officer2 pass456 "Bob Smith"

# Create managers
python create-user.py manager1 secure789 "Carol Davis"
python create-user.py manager2 strong999 "David Wilson"

# List all users
python list-users.py
```

### Advanced Management

```bash
# Use the full management script
python manage_users.py add supervisor1 superpass "Supervisor User"
python manage_users.py list
python manage_users.py deactivate loan_officer1
python manage_users.py password admin newadminpass
```

## 🚨 Important Notes

### Default Admin User

When you first run the application, a default admin user is created:

- **Username**: `admin`
- **Password**: `admin123`

**⚠️ Security**: Change this password immediately after first login!

### Database Connection

- Scripts use the same DATABASE_URL as the main application
- Supports both local and remote PostgreSQL databases
- SSL is automatically enabled for remote connections

### Error Handling

Scripts include comprehensive error handling:

- Database connection failures
- Missing environment variables
- Invalid input validation
- Duplicate user prevention
- Missing database tables

## 🔍 Troubleshooting

### Common Issues

1. **"DATABASE_URL not found"**
   - Create a `.env` file with your database URL
   - Ensure the file is in the same directory as the scripts

2. **"Users table does not exist"**
   - Run the main application first: `python app.py`
   - Stop it after initialization (Ctrl+C)

3. **"Database connection error"**
   - Check your DATABASE_URL format
   - Ensure PostgreSQL is running
   - Verify credentials

4. **"User already exists"**
   - Choose a different username
   - Use `list-users.py` to see existing users

### Debug Commands

```bash
# Test database connection
python -c "from app import check_database_connection; print(check_database_connection())"

# Check environment variables
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print('DATABASE_URL:', os.environ.get('DATABASE_URL'))"

# List all users
python list-users.py
```

## 📞 Support

For issues with user management scripts:

1. Check the troubleshooting section above
2. Verify your `.env` file configuration
3. Ensure the database is initialized
4. Check that all dependencies are installed
5. Review the error messages for specific issues

---

**✅ User management scripts ready for use!** 