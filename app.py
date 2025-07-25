import os
import psycopg2
from urllib.parse import urlparse
from flask import Flask, render_template, jsonify
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

def check_database_connection():
    """Check if PostgreSQL database connection is working"""
    try:
        database_url = os.environ.get("DATABASE_URL")
        if not database_url:
            return "error"
        
        # Parse the DATABASE_URL
        parsed = urlparse(database_url)
        
        # Connect to PostgreSQL using psycopg2
        conn = psycopg2.connect(
            host=parsed.hostname,
            port=parsed.port or 5432,
            database=parsed.path[1:],  # Remove leading slash
            user=parsed.username,
            password=parsed.password
        )
        
        # Test the connection with a simple query
        with conn.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        
        conn.close()
        return "ok"
    except Exception as e:
        print(f"Database connection error: {e}")
        return "error"

@app.route('/')
def index():
    """Root route that renders the index.html template"""
    return render_template('index.html')

@app.route('/health')
def health():
    """Health check endpoint that returns status and database connectivity"""
    db_status = check_database_connection()
    return jsonify({
        "status": "ok",
        "db": db_status
    })

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True) 