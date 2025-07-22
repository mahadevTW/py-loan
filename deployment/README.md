# 🚀 Loan Tracker Web App - Deployment Guide

This guide will walk you through the complete setup and deployment process for the Loan Tracker web app using Google Sheets as the backend.

## ✨ Latest Features (v2.1)

### 🆕 New Features Added:
- **Self-Contained Deployment**: No external hosting required - everything runs in Google Apps Script
- **Transaction History**: Displays transactions in reverse chronological order (newest first)
- **Transaction Editing**: Edit or delete existing transactions with date validation
- **Enhanced File Details**: Shows Start Date, End Date, Transaction Count, and accurate Bounce Count
- **Smart Bounce Calculation**: Only counts missing payments for past dates (future dates show as "PENDING")
- **Payment Modal Improvements**: Date navigation with validation (no future dates, no dates before file start)
- **Mobile Responsive**: Optimized for iPhone 16 Pro and other mobile devices
- **Color-Coded Status**: Green for received, Red for bounces, Purple for pending, Orange for delayed
- **File Start Date Field**: Users can specify when the loan file should start (can be past date)
- **Responsive Typography**: Automatic font scaling for large amounts using CSS clamp()
- **Enhanced Mobile Layout**: Stats cards display horizontally on mobile devices

### 🔧 Technical Improvements:
- **No External Dependencies**: HTML, CSS, and JavaScript all served from Apps Script
- **Minimal Permissions**: Uses only basic SpreadsheetApp, no Drive API required
- **Accurate Date Validation**: Transaction dates cannot be before file start date
- **Real-time Calculations**: Bounce count updates based on actual payment history
- **Enhanced UI/UX**: Better visual feedback and user experience
- **Robust Error Handling**: Comprehensive validation and error messages
- **Secure Access**: Only accesses specific spreadsheet, no broad permissions
- **Fixed Navigation Issues**: Corrected view ID mapping for proper navigation
- **CSS-Only Responsive Design**: Uses modern CSS features like clamp() for responsive typography
- **Improved Data Loading**: Fixed issues with data not loading after file creation

## 📋 Prerequisites

- Google account with access to Google Sheets
- Basic knowledge of Google Apps Script
- Web browser (Chrome, Firefox, Safari, Edge)
- Text editor (VS Code, Sublime Text, etc.)

## 📁 Deployment Files Overview

The `deployment/` folder contains all the files needed for Google Apps Script deployment:

### **Core Files:**
- **`index.html`** - Complete web application (HTML + CSS + JavaScript)
- **`apps-script.js`** - Backend API code for Google Sheets integration
- **`README.md`** - This deployment guide

### **Additional Files:**
- **`script.js`** - Frontend JavaScript (referenced by index.html)

### **Important Notes:**
- The current deployment uses a **two-file approach**: `index.html` (frontend) + `script.js` (JavaScript)
- The `apps-script.js` file contains the backend API code that runs on Google's servers
- No external dependencies are required - everything is self-contained

---

## 🗂️ Step 1: Create Google Sheets Structure

### 1.1 Create the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Rename it to "Loan Tracker Database"
4. Create **2 sheets** with the following names:
   - `files` (for loan file data)
   - `transactions` (for payment transactions)

### 1.2 Set up the Files Sheet

In the `files` sheet, create the following columns in row 1:

| A | B | C | D | E | F | G | H | I | J | K | L | M |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| File Number | Person Full Name | Person Mobile | Reference Mobile | Address | Business Name | Business Address | Principal Amount | Installment | File Start Date | File End Date | Status | Installment Type |

**Column Headers:**
- A1: `File Number`
- B1: `Person Full Name`
- C1: `Person Mobile`
- D1: `Reference Mobile`
- E1: `Address`
- F1: `Business Name`
- G1: `Business Address`
- H1: `Principal Amount`
- I1: `Installment`
- J1: `File Start Date`
- K1: `File End Date`
- L1: `Status`
- M1: `Installment Type`

**Note:** You can either add existing loan files to this sheet manually, or create new files using the "Create File" feature in the app.

### 1.3 Set up the Transactions Sheet

In the `transactions` sheet, create the following columns in row 1:

| A | B | C | D |
|---|---|---|---|
| File Number | Date | Amount | Mode |

**Column Headers:**
- A1: `File Number`
- B1: `Date`
- C1: `Amount`
- D1: `Mode`

### 1.4 Format the Sheets

1. **Select row 1** in both sheets
2. **Bold the headers** (Ctrl+B or Cmd+B)
3. **Add background color** (light gray recommended)
4. **Freeze row 1** (View → Freeze → 1 row)

---

## 🔐 Step 2: Set up Google Apps Script

### 2.1 Create Apps Script Project

1. In your Google Sheet, go to **Extensions → Apps Script**
2. Rename the project to "Loan Tracker API"
3. Delete the default `Code.gs` content

### 2.2 No Additional APIs Required

The app uses only the built-in Google Apps Script services:
- **SpreadsheetApp**: For accessing Google Sheets
- **HtmlService**: For serving the web interface
- **ContentService**: For API responses

No additional APIs need to be enabled!

### 2.3 Create the API Code

1. **Copy the code** from `deployment/apps-script.js`
2. **Paste it** into your Apps Script editor (Code.gs)
3. **Save the project** (Ctrl+S or Cmd+S)

### 2.4 Configure Access Control

1. **Replace `YOUR_SPREADSHEET_ID_HERE`** with your actual spreadsheet ID
   - Find this in the URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit`
2. **Update `SPREADSHEET_NAME`** to match your spreadsheet name exactly
3. **Update email addresses** in the arrays:
   - `READ_ONLY_EMAILS`: Users who can only view data
   - `READ_WRITE_EMAILS`: Users who can view and modify data
4. **Email verification is required** - all users must be in the access lists

### 2.5 Deploy the Apps Script

1. Click **Deploy → New deployment**
2. Choose **Web app** as the type
3. Set **Execute as**: "Me"
4. Set **Who has access**: "Anyone with Google Account"
5. Click **Deploy**
6. **Copy the Web App URL** (you'll need this for the frontend configuration)

### 2.6 Important: Update Frontend URL

After deploying, you need to update the frontend code with your Apps Script URL:

1. **Copy your deployment URL** from the Apps Script deployment
2. **Open the `index.html` file** in your Apps Script project
3. **Find this line** in the JavaScript section:
   ```javascript
   const GOOGLE_APPS_SCRIPT_URL = 'YOUR_APPS_SCRIPT_URL_HERE';
   ```
4. **Replace** `YOUR_APPS_SCRIPT_URL_HERE` with your actual deployment URL
5. **Save the file** (Ctrl+S or Cmd+S)

### 2.7 Configure User Access

1. **Add authorized users** to the email arrays in the Apps Script:
   ```javascript
   const READ_ONLY_EMAILS = ['user1@example.com', 'user2@example.com'];
   const READ_WRITE_EMAILS = ['admin@example.com', 'manager@example.com'];
   ```

2. **Test access** with each user account
3. **Verify permissions** work correctly for each user type

---
## 🌐 Step 3: Set up Google Apps Script Files

### 3.1 Create the Main HTML File

1. **In your Apps Script project**, click the **"+"** next to "Files"
2. **Select "HTML"** from the dropdown
3. **Name it "index"**
4. **Copy the content** from `deployment/index.html` and paste it

### 3.2 Create the Backend Code File

1. **In your Apps Script project**, click the **"+"** next to "Files"
2. **Select "Script"** from the dropdown
3. **Name it "Code"** (or keep the default name)
4. **Copy the content** from `deployment/apps-script.js` and paste it

### 3.3 Update Configuration

1. **Update the Apps Script Code** (`Code.gs`):
   - Replace `YOUR_SPREADSHEET_ID_HERE` with your actual spreadsheet ID
   - Update `READ_ONLY_EMAILS` and `READ_WRITE_EMAILS` arrays with authorized user emails
   - Verify `SPREADSHEET_NAME` matches your Google Sheet name exactly

2. **Update the Frontend Code** (in `index.html`):
   - Find the `GOOGLE_APPS_SCRIPT_URL` variable in the JavaScript section
   - Replace `YOUR_APPS_SCRIPT_URL_HERE` with your actual Apps Script deployment URL
   - The URL will look like: `https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec`

### 3.4 File Structure in Apps Script

Your Apps Script project should have these files:
- **`index.html`** - Main web interface (contains HTML, CSS, and JavaScript)
- **`Code.gs`** - Backend API code for Google Sheets integration

### 3.5 Current Deployment Approach

The current deployment uses a **single HTML file approach** where:
- All frontend code (HTML, CSS, JavaScript) is embedded in `index.html`
- The backend API code runs in `Code.gs`
- No separate JavaScript files are needed
- This approach is simpler and more reliable for Google Apps Script deployment

---

## 🔧 Step 4: Access Your App

### 4.1 Access Your App

1. **Open the Web App URL** in your browser
2. **Sign in with Google** when prompted
3. **Grant permissions** when asked
4. **Start using your loan tracker!**

### 4.2 Share with Others

1. **Share the Web App URL** with authorized users
2. **Add their emails** to the access lists in Apps Script
3. **They can access** the app directly from the URL

---

## 🔒 Step 5: Security Configuration

### 5.1 Google Sheets Permissions

1. **Share the Google Sheet** with authorized users:
   - Go to Share button in Google Sheets
   - Add email addresses with appropriate permissions
   - **Viewer**: Read-only access
   - **Editor**: Read-write access

2. **Minimal Apps Script Permissions**:
   - The Apps Script uses only basic SpreadsheetApp permissions
   - It only accesses the specific spreadsheet you configure (by ID)
   - It does NOT request access to all your Google Sheets
   - It does NOT request delete permissions
   - Only reads and writes to the configured spreadsheet
   - **Email verification required** for all users
   - **Minimal permission scope** - no Drive API needed

### 5.2 Apps Script Permissions

1. **Minimal Permission Request**:
   - The app will request: "See, edit, create, and delete all your Google Sheets spreadsheets"
   - This is the standard permission for SpreadsheetApp
   - It's required to access your specific spreadsheet
   - The app only accesses the spreadsheet you configure

2. **First-time access**:
   - When users first access the web app, they'll need to authorize it
   - They'll see a Google OAuth consent screen
   - Click "Advanced" → "Go to [Project Name] (unsafe)" → "Allow"
   - This is safe for personal/development use

### 5.3 CORS Configuration

The Apps Script code includes CORS headers, but if you encounter issues:

1. **Add your domain** to the CORS headers in the Apps Script
2. **Or use a CORS proxy** for development

---

## 🧪 Step 6: Testing

### 6.1 Test the Setup

1. **Open the web app** in your browser
2. **Sign in with Google** when prompted
3. **Grant permissions** when asked
4. **Try creating a new file**:
   - Fill out the form with test data (including File Start Date)
   - Submit and check if it appears in Google Sheets
5. **Verify files load**:
   - Check that your files appear in the Active Files list
   - Verify file details are displayed correctly
6. **Try marking a payment**:
   - Select an active file
   - Mark a payment and verify it appears in the transactions sheet
7. **Test file closing**:
   - Add enough payments to cover the principal amount
   - Try closing the file

### 6.2 Verify Data Integrity

1. **Check Google Sheets** after each operation
2. **Verify calculations** are correct
3. **Test validation rules** (amount limits, date validation, etc.)

### 6.3 Test New Features

1. **Transaction History**:
   - Verify transactions are displayed in reverse chronological order (newest first)
   - Check that past dates without transactions show as "BOUNCE"
   - Verify future dates without transactions show as "PENDING"

2. **Transaction Editing**:
   - Click the edit button on any "Received" transaction
   - Test date navigation (left/right arrows)
   - Verify date validation (cannot select future dates or dates before file start)
   - Test updating and deleting transactions

3. **File Details Display**:
   - Verify "Start Date" and "End Date" are displayed correctly
   - Check "Transactions" count shows total number of payments received
   - Verify "Bounces" count only includes past dates

4. **Payment Modal**:
   - Test date navigation in payment modal
   - Verify future date prevention
   - Check file start date validation

5. **File Start Date Feature**:
   - Test creating files with past start dates
   - Verify File Start Date field is required
   - Check that End Date must be after Start Date
   - Test dynamic date validation when changing start date

6. **Responsive Design**:
   - Test on mobile devices - stats should display horizontally
   - Verify large amounts don't overflow stat cards
   - Check font scaling works on different screen sizes
   - Test navigation works properly on all devices

---

## 🚨 Troubleshooting

### Common Issues

1. **"Google hasn't verified this app" error**:
   - Click "Advanced" → "Go to [Project Name] (unsafe)" → "Allow"
   - This is safe for personal/development use
   - For production, consider verifying your app with Google

2. **"Access denied" error**:
   - Check if user email is in the access lists (`READ_ONLY_EMAILS` or `READ_WRITE_EMAILS`)
   - Verify Google Sheets sharing permissions
   - Ensure user is signed in with the correct Google account

3. **"Action parameter is required"**:
   - Check if the Apps Script URL is correct
   - Verify the API calls are formatted properly

3. **CORS errors**:
   - Ensure the Apps Script includes proper CORS headers
   - Check browser console for specific error messages

4. **Data not loading**:
   - Check Google Sheets column headers match exactly
   - Verify the spreadsheet ID is correct
   - Check Apps Script logs for errors

### Debug Steps

1. **Check browser console** for JavaScript errors
2. **Check Apps Script logs** (View → Execution log)
3. **Test API endpoints** directly in browser
4. **Verify Google Sheets permissions**

---

## 📞 Support

If you encounter issues:

1. **Check the troubleshooting section** above
2. **Verify all configuration steps** were completed correctly
3. **Test with a simple API call** first
4. **Check Google Apps Script quotas** and limits

---

## 🔄 Maintenance

### Regular Tasks

1. **Monitor Google Apps Script quotas**:
   - Daily execution time: 6 hours
   - Daily API calls: 20,000
   - Daily URL fetch calls: 20,000

2. **Backup data**:
   - Export Google Sheets regularly
   - Keep local backups of the web app files

3. **Update access lists**:
   - Review and update email addresses periodically
   - Remove access for users who no longer need it

### Updates

1. **Test changes** in a development environment first
2. **Backup data** before making changes
3. **Update version numbers** in your deployment
4. **Notify users** of any breaking changes

---

## 📋 Deployment Checklist

Before deploying, ensure you have:

### ✅ **Files Ready:**
- [ ] `deployment/index.html` - Main web application (HTML + CSS)
- [ ] `deployment/script.js` - Frontend JavaScript code
- [ ] `deployment/apps-script.js` - Backend API code
- [ ] `deployment/README.md` - This deployment guide

### ✅ **Configuration Complete:**
- [ ] Spreadsheet ID updated in `apps-script.js`
- [ ] Authorized email addresses added
- [ ] Apps Script URL updated in `index.html`
- [ ] Google Sheets structure created (files and transactions sheets)

### ✅ **Testing Done:**
- [ ] File creation works
- [ ] Payment recording works
- [ ] File closing works
- [ ] Data loads correctly
- [ ] Mobile responsive design works

---

**🎉 Congratulations!** Your Loan Tracker web app is now deployed and ready to use. 