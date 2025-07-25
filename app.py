import os
from flask import Flask, render_template, jsonify
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
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
        
        engine = create_engine(database_url)
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return "ok"
    except SQLAlchemyError:
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