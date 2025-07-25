#!/usr/bin/env python3
"""
User Management Script for Loan Tracker
This script allows administrators to add, list, and manage users in the database.
"""

import os
import sys
import bcrypt
from dotenv import load_dotenv
import pg8000
from urllib.parse import urlparse

# Load environment variables
load_dotenv()

def get_db_connection():
    """Get database connection using pg8000"""
    try:
        database_url = os.environ.get("DATABASE_URL")
        if not database_url:
            # Fallback to local PostgreSQL without SSL
            return pg8000.Connection(
                host='localhost',
                port=5432,
                database='loan_tracker',
                user='postgres',
                password='password'
            )
        
        # Parse the DATABASE_URL
        parsed = urlparse(database_url)
        
        # Check if it's a local connection (localhost or 127.0.0.1)
        is_local = parsed.hostname in ['localhost', '127.0.0.1', '::1']
        
        # Connect to PostgreSQL using pg8000
        connection_params = {
            'host': parsed.hostname,
            'port': parsed.port or 5432,
            'database': parsed.path[1:],  # Remove leading slash
            'user': parsed.username,
            'password': parsed.password
        }
        
        # Add SSL only for remote connections
        if not is_local:
            connection_params['ssl_context'] = True
        
        return pg8000.Connection(**connection_params)
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

def add_user(username, password, full_name):
    """Add a new user to the database"""
    try:
        conn = get_db_connection()
        if not conn:
            print("❌ Cannot connect to database")
            return False
        
        cursor = conn.cursor()
        
        # Check if user already exists
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        if cursor.fetchone():
            print(f"❌ User '{username}' already exists")
            cursor.close()
            conn.close()
            return False
        
        # Hash password
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        # Insert new user
        cursor.execute("""
            INSERT INTO users (username, password_hash, full_name, is_active)
            VALUES (%s, %s, %s, %s)
            RETURNING id
        """, (username, password_hash.decode('utf-8'), full_name, True))
        
        user_id = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✅ User '{username}' created successfully with ID: {user_id}")
        return True
        
    except Exception as e:
        print(f"❌ Error creating user: {e}")
        return False

def list_users():
    """List all users in the database"""
    try:
        conn = get_db_connection()
        if not conn:
            print("❌ Cannot connect to database")
            return False
        
        cursor = conn.cursor()
        cursor.execute("SELECT id, username, full_name, is_active, created_at FROM users ORDER BY id")
        users = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        if not users:
            print("No users found in database")
            return True
        
        print("\n📋 Users in Database:")
        print("-" * 80)
        print(f"{'ID':<5} {'Username':<20} {'Full Name':<25} {'Status':<10} {'Created'}")
        print("-" * 80)
        
        for user in users:
            status = "Active" if user[3] else "Inactive"
            created = user[4].strftime("%Y-%m-%d %H:%M")
            print(f"{user[0]:<5} {user[1]:<20} {user[2]:<25} {status:<10} {created}")
        
        print("-" * 80)
        return True
        
    except Exception as e:
        print(f"❌ Error listing users: {e}")
        return False

def deactivate_user(username):
    """Deactivate a user"""
    try:
        conn = get_db_connection()
        if not conn:
            print("❌ Cannot connect to database")
            return False
        
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        
        if not user:
            print(f"❌ User '{username}' not found")
            cursor.close()
            conn.close()
            return False
        
        # Deactivate user
        cursor.execute("UPDATE users SET is_active = FALSE WHERE username = %s", (username,))
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✅ User '{username}' deactivated successfully")
        return True
        
    except Exception as e:
        print(f"❌ Error deactivating user: {e}")
        return False

def activate_user(username):
    """Activate a user"""
    try:
        conn = get_db_connection()
        if not conn:
            print("❌ Cannot connect to database")
            return False
        
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        
        if not user:
            print(f"❌ User '{username}' not found")
            cursor.close()
            conn.close()
            return False
        
        # Activate user
        cursor.execute("UPDATE users SET is_active = TRUE WHERE username = %s", (username,))
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✅ User '{username}' activated successfully")
        return True
        
    except Exception as e:
        print(f"❌ Error activating user: {e}")
        return False

def change_password(username, new_password):
    """Change user password"""
    try:
        conn = get_db_connection()
        if not conn:
            print("❌ Cannot connect to database")
            return False
        
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        
        if not user:
            print(f"❌ User '{username}' not found")
            cursor.close()
            conn.close()
            return False
        
        # Hash new password
        password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
        
        # Update password
        cursor.execute("UPDATE users SET password_hash = %s WHERE username = %s", 
                      (password_hash.decode('utf-8'), username))
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✅ Password for user '{username}' changed successfully")
        return True
        
    except Exception as e:
        print(f"❌ Error changing password: {e}")
        return False

def show_help():
    """Show help information"""
    print("""
🔐 Loan Tracker User Management Script

Usage: python manage_users.py <command> [options]

Commands:
  add <username> <password> <full_name>    Add a new user
  list                                     List all users
  deactivate <username>                    Deactivate a user
  activate <username>                      Activate a user
  password <username> <new_password>       Change user password
  help                                     Show this help message

Examples:
  python manage_users.py add john password123 "John Doe"
  python manage_users.py list
  python manage_users.py deactivate john
  python manage_users.py activate john
  python manage_users.py password john newpassword123

Note: Make sure your .env file is configured with DATABASE_URL
""")

def main():
    if len(sys.argv) < 2:
        show_help()
        return
    
    command = sys.argv[1].lower()
    
    if command == "help":
        show_help()
    elif command == "add":
        if len(sys.argv) < 5:
            print("❌ Usage: python manage_users.py add <username> <password> <full_name>")
            return
        username = sys.argv[2]
        password = sys.argv[3]
        full_name = sys.argv[4]
        add_user(username, password, full_name)
    elif command == "list":
        list_users()
    elif command == "deactivate":
        if len(sys.argv) < 3:
            print("❌ Usage: python manage_users.py deactivate <username>")
            return
        username = sys.argv[2]
        deactivate_user(username)
    elif command == "activate":
        if len(sys.argv) < 3:
            print("❌ Usage: python manage_users.py activate <username>")
            return
        username = sys.argv[2]
        activate_user(username)
    elif command == "password":
        if len(sys.argv) < 4:
            print("❌ Usage: python manage_users.py password <username> <new_password>")
            return
        username = sys.argv[2]
        new_password = sys.argv[3]
        change_password(username, new_password)
    else:
        print(f"❌ Unknown command: {command}")
        show_help()

if __name__ == "__main__":
    main() 