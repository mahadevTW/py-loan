# 📄 Loan Tracker Web App

A modern, mobile-friendly web application for managing loan files and daily payment tracking using Google Sheets as the backend database.

## 🚀 Quick Start

### 1. Test the UI Locally

1. **Open `index.html`** in your web browser
2. **Explore the interface**:
   - View active files (with mock data)
   - Create new files
   - Mark payments
   - View file details and transaction history

### 2. Deploy with Google Sheets

Follow the complete deployment guide in [`deployment.md`](./deployment.md) to:
- Set up Google Sheets as your database
- Configure Google Apps Script API
- Deploy the web app with real data

## 📱 Features

- **📋 File Management**: Create and manage loan files with borrower details
- **💰 Payment Tracking**: Mark daily payments with different modes (Online, Cash, UPI, Cheque)
- **📊 Real-time Analytics**: View pending amounts, bounces, and days remaining
- **🎨 Modern UI**: Beautiful, responsive design optimized for mobile devices
- **🔒 Access Control**: Two-level access (read-only and read-write)
- **✅ Validation**: Comprehensive input validation and business rules

## 🛠️ Technical Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Google Sheets + Google Apps Script
- **Database**: Google Sheets (files and transactions tables)
- **Authentication**: Google OAuth
- **Deployment**: Any web server or static hosting

## 📁 File Structure

```
loan-mgmt/
├── index.html          # Main HTML file
├── styles.css          # CSS styling
├── script.js           # JavaScript functionality
├── deployment.md       # Complete deployment guide
├── file management.md  # Requirements document
└── README.md          # This file
```

## 🎯 Key Business Rules

- **Principal Amount**: Maximum ₹500,000 per file
- **Daily Installments**: Must be positive numbers
- **File End Date**: Must be in the future
- **Payment Tracking**: No grace period - missing payments marked as "BOUNCE"
- **File Closure**: Only allowed when total received ≥ principal amount
- **Access Control**: Email-based permissions for read/write access

## 🔧 Configuration

### Required Settings

1. **Google Sheets ID**: Replace in Apps Script code
2. **Email Access Lists**: Configure read-only and read-write users
3. **Apps Script URL**: Update in frontend JavaScript

### Validation Rules

- All required fields must be filled
- Principal amount: 1 - 500,000
- Daily installment: Positive number
- File end date: Future date only

## 📱 Mobile Support

- **Base Design**: iPhone 16 Pro screen size
- **Responsive**: Adapts to tablets and larger screens
- **Touch-Friendly**: Optimized for mobile interactions

## 🚨 Important Notes

⚠️ **Financial Data**: This app handles financial transactions. Ensure:
- Proper access controls are configured
- Regular backups are maintained
- All users are authorized
- Test thoroughly before production use

## 📞 Support

For deployment assistance, refer to the detailed guide in [`deployment.md`](./deployment.md).

## 🔄 Updates

- Keep Google Apps Script quotas in mind
- Monitor for any breaking changes in Google APIs
- Regular testing recommended

---

**Built with ❤️ for efficient loan management** 