# Flask Application

A simple Flask web application with PostgreSQL database connectivity check and health monitoring.

## Features

- ✅ Root route (`/`) that displays "Hello, World!"
- ✅ Health check endpoint (`/health`) with database connectivity status
- ✅ PostgreSQL database connection using psycopg2
- ✅ Modern, responsive web interface
- ✅ Ready for deployment on Render.com

## Local Development Setup

### Prerequisites

- Python 3.8 or higher
- pip (Python package installer)
- PostgreSQL database (optional for local testing)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd py-loan
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**

   Create a `.env` file in the project root:
   ```bash
   # .env file
   DATABASE_URL=postgresql://username:password@localhost:5432/database_name
   FLASK_ENV=development
   ```

   **Or set environment variables directly:**
   ```bash
   export DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
   export FLASK_ENV=development
   ```

   **DATABASE_URL Format:**
   ```
   postgresql://username:password@host:port/database_name
   ```

   **Example:**
   ```
   postgresql://myuser:mypassword@localhost:5432/mydatabase
   ```

4. **Run the application**
   ```bash
   flask run
   ```

   The application will be available at `http://localhost:5000`

### Testing the Application

1. **Visit the homepage**: Open `http://localhost:5000` in your browser
2. **Check health endpoint**: Visit `http://localhost:5000/health` to see the JSON response
3. **Database connectivity**: The health endpoint will show database connection status

## Deployment to Render.com

### Prerequisites

- GitHub account with your code pushed to a repository
- Render.com account

### Deployment Steps

1. **Set up PostgreSQL Database FIRST (Recommended)**

   **Create a PostgreSQL service on Render:**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" and select "PostgreSQL"
   - Configure the database:
     - **Name**: `your-app-database`
     - **Database**: `your_app_db`
     - **User**: `your_app_user`
     - **Region**: Choose closest to your users
   - Click "Create Database"
   - **Important**: Copy the connection string from the database dashboard

2. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

3. **Create a new Web Service on Render**

   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" and select "Web Service"
   - Connect your GitHub repository
   - Configure the service:

4. **Service Configuration**

   **Basic Settings:**
   - **Name**: `your-app-name`
   - **Environment**: `Python 3`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)

   **Build & Deploy Settings:**
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`

5. **Environment Variables**

   Add the following environment variable in Render dashboard:
   - **Key**: `DATABASE_URL`
   - **Value**: Use the **Internal URL** from your PostgreSQL service
   
   **Important - URL Types:**
   - **Internal URL**: Use this for `DATABASE_URL` (faster, more secure)
   - **External URL**: Only use if you need external access to the database

6. **Deploy**

   - Click "Create Web Service"
   - Render will automatically build and deploy your application
   - Your app will be available at the provided URL

### Render Configuration Summary

| Setting | Value |
|---------|-------|
| Build Command | `pip install -r requirements.txt` |
| Start Command | `gunicorn app:app` |
| Environment | Python 3 |
| Environment Variable | `DATABASE_URL` |

### Important Notes for Render Deployment

- **Database First**: Always create the PostgreSQL service before the web service
- **Internal URL**: Use the Internal URL from PostgreSQL service for `DATABASE_URL` (faster, more secure)
- **Auto-Deploy**: Render automatically deploys when you push to your main branch
- **Health Checks**: The `/health` endpoint can be used for Render's health check configuration
- **Environment Variables**: Set `DATABASE_URL` in Render's dashboard, not in your code
- **Logs**: Check Render's logs if deployment fails

## API Endpoints

### GET /
- **Description**: Homepage with "Hello, World!" message
- **Response**: HTML page with health status display

### GET /health
- **Description**: Health check endpoint
- **Response**: JSON with application and database status

**Success Response:**
```json
{
  "status": "ok",
  "db": "ok"
}
```

**Database Error Response:**
```json
{
  "status": "ok",
  "db": "error"
}
```

## Project Structure

```
.
├── app.py              # Main Flask application
├── templates/
│   └── index.html      # Homepage template with JavaScript
├── requirements.txt    # Python dependencies
└── README.md          # This file
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify your `DATABASE_URL` is correct
   - Ensure PostgreSQL server is running
   - Check firewall settings
   - For Render: Ensure database is accessible from Render's servers

2. **Port Already in Use**
   - Change the port in `app.py` or set `PORT` environment variable
   - Kill existing processes using the port

3. **Dependencies Installation Issues**
   - Ensure you're using Python 3.8+
   - Try upgrading pip: `pip install --upgrade pip`
   - Use virtual environment: `python -m venv venv && source venv/bin/activate`

4. **Render Deployment Issues**
   - Check build logs in Render dashboard
   - Ensure `requirements.txt` is in the root directory
   - Verify `gunicorn` is in requirements.txt
   - Check that `DATABASE_URL` is set in environment variables

### Environment Variables Reference

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` | Yes |
| `PORT` | Application port (Render sets this) | `5000` | No |
| `FLASK_ENV` | Flask environment | `development` | No |

### Render-Specific Environment Variables

- **`PORT`**: Automatically set by Render (don't override)
- **`DATABASE_URL`**: Must be set in Render dashboard
- **`FLASK_ENV`**: Set to `production` on Render (optional)

### PostgreSQL URL Types on Render

When you create a PostgreSQL service on Render, you'll see two connection URLs:

**Internal URL** (Recommended for `DATABASE_URL`):
- Format: `postgresql://user:pass@internal-host:5432/database`
- **Use this for your web service** - faster and more secure
- Only accessible from other Render services in the same region

**External URL**:
- Format: `postgresql://user:pass@external-host:5432/database`
- Only use if you need external access (e.g., from your local machine)
- Slower and less secure than internal URL

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE). 