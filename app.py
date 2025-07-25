import os
import json
import pytz
from datetime import datetime, date, timedelta
from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
import pg8000
from urllib.parse import urlparse
import jwt
import bcrypt
from functools import wraps

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# Set timezone to IST
IST = pytz.timezone('Asia/Kolkata')

# Configuration
MAX_PRINCIPAL_AMOUNT = int(os.environ.get("MAX_PRINCIPAL_AMOUNT", 500000))
JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

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
        # Use SSL only for remote connections (not localhost)
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

def init_db():
    """Initialize database tables"""
    conn = get_db_connection()
    if not conn:
        print("❌ Cannot connect to database")
        return False
    
    try:
        cursor = conn.cursor()
        
        # Create users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create files table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS files (
                id SERIAL PRIMARY KEY,
                person_full_name VARCHAR(255) NOT NULL,
                person_mobile VARCHAR(20) NOT NULL,
                reference_mobile VARCHAR(20) NOT NULL,
                address TEXT NOT NULL,
                business_name VARCHAR(255) NOT NULL,
                business_address TEXT NOT NULL,
                principal_amount NUMERIC(10, 2) NOT NULL,
                installment NUMERIC(10, 2) NOT NULL,
                file_start_date DATE NOT NULL,
                file_end_date DATE NOT NULL,
                status VARCHAR(20) DEFAULT 'ACTIVE',
                installment_type VARCHAR(20) DEFAULT 'DAILY',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create transactions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                file_id INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
                date DATE NOT NULL,
                amount NUMERIC(10, 2) NOT NULL,
                mode VARCHAR(20) NOT NULL,
                status VARCHAR(20) DEFAULT 'RECEIVED',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create default admin user if not exists
        cursor.execute("SELECT COUNT(*) FROM users WHERE username = 'admin'")
        admin_exists = cursor.fetchone()[0]
        
        if admin_exists == 0:
            # Create default admin user (password: admin123)
            password_hash = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt())
            cursor.execute("""
                INSERT INTO users (username, password_hash, full_name, is_active)
                VALUES (%s, %s, %s, %s)
            """, ('admin', password_hash.decode('utf-8'), 'Administrator', True))
            print("✅ Default admin user created (username: admin, password: admin123)")
        
        conn.commit()
        cursor.close()
        conn.close()
        print("✅ Database tables created successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        conn.rollback()
        conn.close()
        return False

def check_database_connection():
    """Check if PostgreSQL database connection is working"""
    try:
        conn = get_db_connection()
        if not conn:
            return "error"
        
        # Test the connection with a simple query
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        cursor.close()
        conn.close()
        
        return "ok"
    except Exception as e:
        print(f"Database connection error: {e}")
        return "error"

def generate_token(user_id, username):
    """Generate JWT token for user"""
    payload = {
        'user_id': user_id,
        'username': username,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def verify_token(token):
    """Verify JWT token and return user info"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def authenticate_user(username, password):
    """Authenticate user with username and password"""
    try:
        conn = get_db_connection()
        if not conn:
            return None
        
        cursor = conn.cursor()
        cursor.execute("SELECT id, username, password_hash, full_name FROM users WHERE username = %s AND is_active = TRUE", (username,))
        user_data = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if user_data and bcrypt.checkpw(password.encode('utf-8'), user_data[2].encode('utf-8')):
            return {
                'id': user_data[0],
                'username': user_data[1],
                'full_name': user_data[3]
            }
        return None
    except Exception as e:
        print(f"Authentication error: {e}")
        return None

def require_auth(f):
    """Decorator to require authentication for routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({'error': 'Authorization header missing'}), 401
        
        try:
            # Extract token from "Bearer <token>"
            token = auth_header.split(' ')[1]
            payload = verify_token(token)
            
            if not payload:
                return jsonify({'error': 'Invalid or expired token'}), 401
            
            # Add user info to request context
            request.user = payload
            return f(*args, **kwargs)
            
        except (IndexError, KeyError):
            return jsonify({'error': 'Invalid authorization header format'}), 401
    
    return decorated_function

# Routes
@app.route('/')
def index():
    """Root route that renders the index.html template"""
    return render_template('index.html')

@app.route('/login')
def login_page():
    """Login page route"""
    return render_template('login.html')

@app.route('/loan-tracker')
def loan_tracker():
    """Loan tracker application route"""
    return render_template('loan-tracker.html')

@app.route('/health')
def health():
    """Health check endpoint that returns status and database connectivity"""
    db_status = check_database_connection()
    return jsonify({
        "status": "ok",
        "db": db_status,
        "max_principal_amount": MAX_PRINCIPAL_AMOUNT
    })

@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()
        
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Username and password are required'}), 400
        
        username = data['username']
        password = data['password']
        
        # Authenticate user
        user = authenticate_user(username, password)
        
        if not user:
            return jsonify({'error': 'Invalid username or password'}), 401
        
        # Generate token
        token = generate_token(user['id'], user['username'])
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'full_name': user['full_name']
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/verify', methods=['GET'])
def verify_auth():
    """Verify authentication token"""
    try:
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({'error': 'Authorization header missing'}), 401
        
        token = auth_header.split(' ')[1]
        payload = verify_token(token)
        
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        return jsonify({
            'valid': True,
            'user': {
                'user_id': payload['user_id'],
                'username': payload['username']
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API Routes
@app.route('/api/files', methods=['GET'])
@require_auth
def get_files():
    """Get all files with optional status filter"""
    try:
        status = request.args.get('status', 'ACTIVE')
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor()
        
        if status == 'ACTIVE':
            cursor.execute("SELECT * FROM files WHERE status = 'ACTIVE' ORDER BY id")
        elif status == 'CLOSED':
            cursor.execute("SELECT * FROM files WHERE status = 'CLOSED' ORDER BY id")
        else:
            cursor.execute("SELECT * FROM files ORDER BY id")
        
        files_data = cursor.fetchall()
        
        # Get column names
        columns = [desc[0] for desc in cursor.description]
        
        files = []
        for row in files_data:
            file_dict = dict(zip(columns, row))
            
            # Get transactions for this file
            cursor.execute("SELECT * FROM transactions WHERE file_id = %s", (file_dict['id'],))
            transactions_data = cursor.fetchall()
            transaction_columns = [desc[0] for desc in cursor.description]
            
            transactions = []
            total_received = 0
            for t_row in transactions_data:
                t_dict = dict(zip(transaction_columns, t_row))
                transactions.append(t_dict)
                total_received += float(t_dict['amount'])
            
            # Calculate additional fields
            pending_amount = float(file_dict['principal_amount']) - total_received
            bounces = calculate_bounce_count(file_dict, transactions)
            
            # Format response
            file_response = {
                'id': file_dict['id'],
                'personName': file_dict['person_full_name'],
                'personMobile': file_dict['person_mobile'],
                'referenceMobile': file_dict['reference_mobile'],
                'address': file_dict['address'],
                'businessName': file_dict['business_name'],
                'businessAddress': file_dict['business_address'],
                'principalAmount': float(file_dict['principal_amount']),
                'installment': float(file_dict['installment']),
                'fileStartDate': file_dict['file_start_date'].isoformat(),
                'fileEndDate': file_dict['file_end_date'].isoformat(),
                'status': file_dict['status'],
                'installmentType': file_dict['installment_type'],
                'totalReceived': total_received,
                'pendingAmount': pending_amount,
                'bounces': bounces,
                'transactions': len(transactions),
                'createdAt': file_dict['created_at'].isoformat(),
                'updatedAt': file_dict['updated_at'].isoformat()
            }
            
            files.append(file_response)
        
        cursor.close()
        conn.close()
        
        return jsonify(files)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/files', methods=['POST'])
@require_auth
def create_file():
    """Create a new file"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = [
            'personFullName', 'personMobile', 'referenceMobile', 'address',
            'businessName', 'businessAddress', 'principalAmount', 'installment',
            'fileStartDate', 'fileEndDate'
        ]
        
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate principal amount
        principal_amount = float(data['principalAmount'])
        if principal_amount <= 0 or principal_amount > MAX_PRINCIPAL_AMOUNT:
            return jsonify({'error': f'Principal amount must be between ₹1 and ₹{MAX_PRINCIPAL_AMOUNT:,}'}), 400
        
        # Validate installment
        installment = float(data['installment'])
        if installment <= 0:
            return jsonify({'error': 'Daily installment must be positive'}), 400
        
        # Validate dates
        start_date = datetime.strptime(data['fileStartDate'], '%Y-%m-%d').date()
        end_date = datetime.strptime(data['fileEndDate'], '%Y-%m-%d').date()
        
        if end_date <= start_date:
            return jsonify({'error': 'File end date must be after start date'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor()
        
        # Insert new file
        cursor.execute("""
            INSERT INTO files (
                person_full_name, person_mobile, reference_mobile, address,
                business_name, business_address, principal_amount, installment,
                file_start_date, file_end_date, status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            data['personFullName'], data['personMobile'], data['referenceMobile'],
            data['address'], data['businessName'], data['businessAddress'],
            principal_amount, installment, start_date, end_date, 'ACTIVE'
        ))
        
        file_id = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'message': 'File created successfully',
            'fileNumber': file_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/files/<int:file_id>', methods=['GET'])
@require_auth
def get_file(file_id):
    """Get a specific file by ID"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM files WHERE id = %s", (file_id,))
        file_data = cursor.fetchone()
        
        if not file_data:
            cursor.close()
            conn.close()
            return jsonify({'error': 'File not found'}), 404
        
        # Get column names
        columns = [desc[0] for desc in cursor.description]
        file_dict = dict(zip(columns, file_data))
        
        # Get transactions
        cursor.execute("SELECT * FROM transactions WHERE file_id = %s ORDER BY date DESC", (file_id,))
        transactions_data = cursor.fetchall()
        transaction_columns = [desc[0] for desc in cursor.description]
        
        transactions = []
        total_received = 0
        for t_row in transactions_data:
            t_dict = dict(zip(transaction_columns, t_row))
            transactions.append(t_dict)
            total_received += float(t_dict['amount'])
        
        # Calculate additional fields
        pending_amount = float(file_dict['principal_amount']) - total_received
        bounces = calculate_bounce_count(file_dict, transactions)
        
        # Format response
        file_response = {
            'id': file_dict['id'],
            'personName': file_dict['person_full_name'],
            'personMobile': file_dict['person_mobile'],
            'referenceMobile': file_dict['reference_mobile'],
            'address': file_dict['address'],
            'businessName': file_dict['business_name'],
            'businessAddress': file_dict['business_address'],
            'principalAmount': float(file_dict['principal_amount']),
            'installment': float(file_dict['installment']),
            'fileStartDate': file_dict['file_start_date'].isoformat(),
            'fileEndDate': file_dict['file_end_date'].isoformat(),
            'status': file_dict['status'],
            'installmentType': file_dict['installment_type'],
            'totalReceived': total_received,
            'pendingAmount': pending_amount,
            'bounces': bounces,
            'transactions': len(transactions),
            'createdAt': file_dict['created_at'].isoformat(),
            'updatedAt': file_dict['updated_at'].isoformat()
        }
        
        cursor.close()
        conn.close()
        
        return jsonify(file_response)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/files/<int:file_id>/status', methods=['PUT'])
@require_auth
def update_file_status(file_id):
    """Update file status (close file)"""
    try:
        data = request.get_json()
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor()
        
        # Get file
        cursor.execute("SELECT * FROM files WHERE id = %s", (file_id,))
        file_data = cursor.fetchone()
        
        if not file_data:
            cursor.close()
            conn.close()
            return jsonify({'error': 'File not found'}), 404
        
        if data.get('status') == 'CLOSED':
            # Check if file can be closed (all payments received)
            cursor.execute("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE file_id = %s", (file_id,))
            total_received = float(cursor.fetchone()[0])
            
            cursor.execute("SELECT principal_amount FROM files WHERE id = %s", (file_id,))
            principal_amount = float(cursor.fetchone()[0])
            
            if total_received < principal_amount:
                cursor.close()
                conn.close()
                return jsonify({'error': 'Cannot close file: pending amount remaining'}), 400
            
            # Update status
            cursor.execute("UPDATE files SET status = 'CLOSED', updated_at = CURRENT_TIMESTAMP WHERE id = %s", (file_id,))
            conn.commit()
            
            cursor.close()
            conn.close()
            
            return jsonify({'message': 'File closed successfully'})
        else:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Invalid status'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/files/<int:file_id>/transactions', methods=['GET'])
@require_auth
def get_transactions(file_id):
    """Get all transactions for a file"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM transactions WHERE file_id = %s ORDER BY date DESC", (file_id,))
        transactions_data = cursor.fetchall()
        
        # Get column names
        columns = [desc[0] for desc in cursor.description]
        
        transactions = []
        for row in transactions_data:
            t_dict = dict(zip(columns, row))
            transactions.append({
                'id': t_dict['id'],
                'fileId': t_dict['file_id'],
                'date': t_dict['date'].isoformat(),
                'amount': float(t_dict['amount']),
                'mode': t_dict['mode'],
                'status': t_dict['status'],
                'createdAt': t_dict['created_at'].isoformat(),
                'updatedAt': t_dict['updated_at'].isoformat()
            })
        
        cursor.close()
        conn.close()
        
        return jsonify(transactions)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/transactions', methods=['POST'])
@require_auth
def create_transaction():
    """Create a new transaction"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['fileNumber', 'date', 'amount', 'mode']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        file_id = int(data['fileNumber'])
        
        # Validate amount
        amount = float(data['amount'])
        if amount <= 0:
            return jsonify({'error': 'Amount must be positive'}), 400
        
        # Validate date
        transaction_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        today = date.today()
        
        # Validate date - no future dates, but allow past end dates for delayed payments
        if transaction_date > today:
            return jsonify({'error': 'Transaction date cannot be in the future'}), 400
        
        # Validate payment mode
        valid_modes = ['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE']
        if data['mode'] not in valid_modes:
            return jsonify({'error': 'Invalid payment mode'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor()
        
        # Check if file exists and is active
        cursor.execute("SELECT file_start_date, status FROM files WHERE id = %s", (file_id,))
        file_data = cursor.fetchone()
        
        if not file_data:
            cursor.close()
            conn.close()
            return jsonify({'error': 'File not found'}), 404
        
        file_start_date, status = file_data
        
        if status != 'ACTIVE':
            cursor.close()
            conn.close()
            return jsonify({'error': 'Cannot add transaction to closed file'}), 400
        
        if transaction_date < file_start_date:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Transaction date cannot be before file start date'}), 400
        
        # Create transaction
        cursor.execute("""
            INSERT INTO transactions (file_id, date, amount, mode, status)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        """, (file_id, transaction_date, amount, data['mode'], 'RECEIVED'))
        
        transaction_id = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'message': 'Transaction created successfully',
            'transactionId': transaction_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/transactions/<int:transaction_id>', methods=['PUT'])
@require_auth
def update_transaction(transaction_id):
    """Update a transaction"""
    try:
        data = request.get_json()
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor()
        
        # Get transaction
        cursor.execute("SELECT * FROM transactions WHERE id = %s", (transaction_id,))
        transaction_data = cursor.fetchone()
        
        if not transaction_data:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Transaction not found'}), 404
        
        # Get column names
        columns = [desc[0] for desc in cursor.description]
        transaction_dict = dict(zip(columns, transaction_data))
        
        # Check if file is active
        cursor.execute("SELECT status FROM files WHERE id = %s", (transaction_dict['file_id'],))
        file_status = cursor.fetchone()[0]
        
        if file_status != 'ACTIVE':
            cursor.close()
            conn.close()
            return jsonify({'error': 'Cannot modify transaction in closed file'}), 400
        
        # Update fields
        update_fields = []
        update_values = []
        
        if 'amount' in data:
            amount = float(data['amount'])
            if amount <= 0:
                cursor.close()
                conn.close()
                return jsonify({'error': 'Amount must be positive'}), 400
            update_fields.append("amount = %s")
            update_values.append(amount)
        
        if 'date' in data:
            new_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
            today = date.today()
            
            # Validate date - no future dates, but allow past end dates for delayed payments
            if new_date > today:
                cursor.close()
                conn.close()
                return jsonify({'error': 'Transaction date cannot be in the future'}), 400
            
            # Check file start date
            cursor.execute("SELECT file_start_date FROM files WHERE id = %s", (transaction_dict['file_id'],))
            file_start_date = cursor.fetchone()[0]
            
            if new_date < file_start_date:
                cursor.close()
                conn.close()
                return jsonify({'error': 'Transaction date cannot be before file start date'}), 400
            
            # Check if another transaction exists for the new date (if date changed)
            if new_date != transaction_dict['date']:
                cursor.execute("""
                    SELECT COUNT(*) FROM transactions 
                    WHERE file_id = %s AND date = %s AND id != %s
                """, (transaction_dict['file_id'], new_date, transaction_id))
                
                if cursor.fetchone()[0] > 0:
                    cursor.close()
                    conn.close()
                    return jsonify({'error': 'Another transaction already exists for this date'}), 400
            
            update_fields.append("date = %s")
            update_values.append(new_date)
        
        if 'mode' in data:
            valid_modes = ['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE']
            if data['mode'] not in valid_modes:
                cursor.close()
                conn.close()
                return jsonify({'error': 'Invalid payment mode'}), 400
            update_fields.append("mode = %s")
            update_values.append(data['mode'])
        
        if update_fields:
            update_fields.append("updated_at = CURRENT_TIMESTAMP")
            update_values.append(transaction_id)
            
            query = f"UPDATE transactions SET {', '.join(update_fields)} WHERE id = %s"
            cursor.execute(query, update_values)
            conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Transaction updated successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/transactions/<int:transaction_id>', methods=['DELETE'])
@require_auth
def delete_transaction(transaction_id):
    """Delete a transaction"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor()
        
        # Check if file is active
        cursor.execute("""
            SELECT f.status FROM files f 
            JOIN transactions t ON f.id = t.file_id 
            WHERE t.id = %s
        """, (transaction_id,))
        
        result = cursor.fetchone()
        if not result:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Transaction not found'}), 404
        
        if result[0] != 'ACTIVE':
            cursor.close()
            conn.close()
            return jsonify({'error': 'Cannot delete transaction in closed file'}), 400
        
        # Delete transaction
        cursor.execute("DELETE FROM transactions WHERE id = %s", (transaction_id,))
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Transaction deleted successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats', methods=['GET'])
@require_auth
def get_stats():
    """Get application statistics"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor()
        
        # Get counts
        cursor.execute("SELECT COUNT(*) FROM files WHERE status = 'ACTIVE'")
        active_files = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM files WHERE status = 'CLOSED'")
        closed_files = cursor.fetchone()[0]
        
        # Calculate total pending amount
        cursor.execute("""
            SELECT COALESCE(SUM(f.principal_amount - COALESCE(t.total_received, 0)), 0)
            FROM files f
            LEFT JOIN (
                SELECT file_id, SUM(amount) as total_received
                FROM transactions
                GROUP BY file_id
            ) t ON f.id = t.file_id
            WHERE f.status = 'ACTIVE'
        """)
        total_pending = float(cursor.fetchone()[0])
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'activeFiles': active_files,
            'closedFiles': closed_files,
            'totalPending': round(total_pending, 2),
            'maxPrincipalAmount': MAX_PRINCIPAL_AMOUNT
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def calculate_bounce_count(file_dict, transactions):
    """Calculate bounce count (days without transactions)"""
    if file_dict['status'] == 'CLOSED':
        end_date = file_dict['file_end_date']
    else:
        end_date = date.today()
    
    # Get all dates from start to end
    current_date = file_dict['file_start_date']
    bounce_count = 0
    
    while current_date <= end_date:
        # Check if there's any transaction for this date
        has_transaction = any(t['date'] == current_date for t in transactions)
        if not has_transaction and current_date <= date.today():
            bounce_count += 1
        current_date = current_date.replace(day=current_date.day + 1)
    
    return bounce_count

# Initialize database when app starts (works with both Flask dev server and Gunicorn)
def initialize_database():
    """Initialize database tables"""
    print("Initializing database...")
    if init_db():
        print("✅ Database initialized successfully!")
    else:
        print("❌ Database initialization failed!")

# Initialize database on app startup
initialize_database()

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True) 