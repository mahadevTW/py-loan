# 🚀 Loan Tracker Web App - Deployment Guide

This guide will walk you through the complete setup and deployment process for the Loan Tracker web app using Google Sheets as the backend.

## 📋 Prerequisites

- Google account with access to Google Sheets
- Basic knowledge of Google Apps Script
- Web browser (Chrome, Firefox, Safari, Edge)
- Text editor (VS Code, Sublime Text, etc.)

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

| A | B | C | D | E | F | G | H | I | J | K | L |
|---|---|---|---|---|---|---|---|---|---|---|---|
| File Number | Person Full Name | Person Mobile | Reference Mobile | Address | Business Name | Business Address | Principal Amount | Installment | File End Date | Status | Installment Type |

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
- J1: `File End Date`
- K1: `Status`
- L1: `Installment Type`

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

### 2.2 Create the API Code

Replace the content with this code:

```javascript
// Configuration
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // Replace with your sheet ID
const READ_ONLY_EMAILS = ['readonly@example.com']; // Add read-only email addresses
const READ_WRITE_EMAILS = ['admin@example.com']; // Add read-write email addresses

// Main function to handle web requests
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    // Set CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    // Handle preflight requests
    if (e.parameter.method === 'OPTIONS') {
      return ContentService.createTextOutput('')
        .setMimeType(ContentService.MimeType.TEXT)
        .setHeaders(headers);
    }

    const action = e.parameter.action || e.postData?.contents ? JSON.parse(e.postData.contents).action : null;
    
    if (!action) {
      return createResponse(400, { error: 'Action parameter is required' }, headers);
    }

    // Check user permissions
    const userEmail = Session.getActiveUser().getEmail();
    const hasReadAccess = READ_ONLY_EMAILS.includes(userEmail) || READ_WRITE_EMAILS.includes(userEmail);
    const hasWriteAccess = READ_WRITE_EMAILS.includes(userEmail);

    if (!hasReadAccess) {
      return createResponse(403, { error: 'Access denied' }, headers);
    }

    let result;
    switch (action) {
      case 'getFiles':
        result = getFiles();
        break;
      case 'getTransactions':
        const fileNumber = e.parameter.fileNumber || JSON.parse(e.postData.contents).fileNumber;
        result = getTransactions(fileNumber);
        break;
      case 'createFile':
        if (!hasWriteAccess) {
          return createResponse(403, { error: 'Write access required' }, headers);
        }
        const fileData = JSON.parse(e.postData.contents).data;
        result = createFile(fileData);
        break;
      case 'addTransaction':
        if (!hasWriteAccess) {
          return createResponse(403, { error: 'Write access required' }, headers);
        }
        const transactionData = JSON.parse(e.postData.contents).data;
        result = addTransaction(transactionData);
        break;
      case 'updateFileStatus':
        if (!hasWriteAccess) {
          return createResponse(403, { error: 'Write access required' }, headers);
        }
        const statusData = JSON.parse(e.postData.contents).data;
        result = updateFileStatus(statusData);
        break;
      default:
        return createResponse(400, { error: 'Invalid action' }, headers);
    }

    return createResponse(200, result, headers);

  } catch (error) {
    console.error('Error:', error);
    return createResponse(500, { error: 'Internal server error' }, headers);
  }
}

function createResponse(statusCode, data, headers) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(headers);
}

function getFiles() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('files');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);

  return rows.map(row => {
    const file = {};
    headers.forEach((header, index) => {
      file[header.replace(/\s+/g, '').toLowerCase()] = row[index];
    });
    return file;
  });
}

function getTransactions(fileNumber) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('transactions');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);

  return rows
    .filter(row => row[0] == fileNumber)
    .map(row => {
      const transaction = {};
      headers.forEach((header, index) => {
        transaction[header.replace(/\s+/g, '').toLowerCase()] = row[index];
      });
      return transaction;
    });
}

function createFile(fileData) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('files');
  
  // Get next file number
  const lastRow = sheet.getLastRow();
  const nextFileNumber = lastRow === 1 ? 1 : sheet.getRange(lastRow, 1).getValue() + 1;
  
  const rowData = [
    nextFileNumber,
    fileData.personName,
    fileData.personMobile,
    fileData.referenceMobile,
    fileData.address,
    fileData.businessName,
    fileData.businessAddress,
    fileData.principalAmount,
    fileData.installment,
    fileData.fileEndDate,
    'ACTIVE',
    'DAILY'
  ];

  sheet.appendRow(rowData);
  
  return { success: true, fileNumber: nextFileNumber };
}

function addTransaction(transactionData) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('transactions');
  
  const rowData = [
    transactionData.fileNumber,
    transactionData.date,
    transactionData.amount,
    transactionData.mode
  ];

  sheet.appendRow(rowData);
  
  return { success: true };
}

function updateFileStatus(statusData) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('files');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == statusData.fileNumber) {
      sheet.getRange(i + 1, 11).setValue(statusData.status); // Status column
      break;
    }
  }
  
  return { success: true };
}
```

### 2.3 Configure Access Control

1. **Replace `YOUR_SPREADSHEET_ID_HERE`** with your actual spreadsheet ID
   - Find this in the URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit`
2. **Update email addresses** in the arrays:
   - `READ_ONLY_EMAILS`: Users who can only view data
   - `READ_WRITE_EMAILS`: Users who can view and modify data

### 2.4 Deploy the Apps Script

1. Click **Deploy → New deployment**
2. Choose **Web app** as the type
3. Set **Execute as**: "Me"
4. Set **Who has access**: "Anyone"
5. Click **Deploy**
6. **Copy the Web App URL** (you'll need this for the frontend)

---

## 🌐 Step 3: Update Frontend Code

### 3.1 Update the JavaScript File

Replace the mock data section in `script.js` with Google Sheets integration:

```javascript
// Replace the mock data section with this:

// Configuration
const GOOGLE_APPS_SCRIPT_URL = 'YOUR_APPS_SCRIPT_URL_HERE'; // Replace with your deployment URL

// Global variables
let files = [];
let transactions = [];
let currentView = 'active';
let currentFile = null;

// API Functions
async function fetchFiles() {
  try {
    const response = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?action=getFiles`);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    files = data;
    return data;
  } catch (error) {
    console.error('Error fetching files:', error);
    showToast('Error loading files: ' + error.message, 'error');
    return [];
  }
}

async function fetchTransactions(fileNumber) {
  try {
    const response = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?action=getTransactions&fileNumber=${fileNumber}`);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    showToast('Error loading transactions: ' + error.message, 'error');
    return [];
  }
}

async function createFileAPI(fileData) {
  try {
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'createFile',
        data: fileData
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data;
  } catch (error) {
    console.error('Error creating file:', error);
    throw error;
  }
}

async function addTransactionAPI(transactionData) {
  try {
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'addTransaction',
        data: transactionData
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data;
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
}

async function updateFileStatusAPI(statusData) {
  try {
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'updateFileStatus',
        data: statusData
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data;
  } catch (error) {
    console.error('Error updating file status:', error);
    throw error;
  }
}

// Update the loadFiles function
async function loadFiles() {
  const allFiles = await fetchFiles();
  const activeFiles = allFiles.filter(file => file.status === 'ACTIVE');
  const closedFiles = allFiles.filter(file => file.status === 'CLOSED');

  // Update counts
  document.getElementById('active-count').textContent = activeFiles.length;
  document.getElementById('closed-count').textContent = closedFiles.length;

  // Calculate total pending amount
  const totalPending = activeFiles.reduce((sum, file) => {
    const received = getTotalReceived(file.filenumber);
    return sum + (file.principalamount - received);
  }, 0);
  document.getElementById('total-pending').textContent = `₹${totalPending.toLocaleString()}`;

  // Render files
  renderFiles(activeFiles, 'active-files-grid');
  renderFiles(closedFiles, 'history-files-grid');
}

// Update the handleCreateFile function
async function handleCreateFile(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  
  // Validation
  const principalAmount = parseInt(formData.get('principalAmount'));
  const installment = parseInt(formData.get('installment'));
  const endDate = formData.get('fileEndDate');
  
  if (principalAmount > 500000) {
    showToast('Principal amount cannot exceed ₹500,000', 'error');
    return;
  }
  
  if (principalAmount <= 0 || installment <= 0) {
    showToast('Amounts must be positive numbers', 'error');
    return;
  }
  
  if (new Date(endDate) <= new Date()) {
    showToast('File end date must be in the future', 'error');
    return;
  }

  try {
    const fileData = {
      personName: formData.get('personName'),
      personMobile: formData.get('personMobile'),
      referenceMobile: formData.get('referenceMobile'),
      address: formData.get('address'),
      businessName: formData.get('businessName'),
      businessAddress: formData.get('businessAddress'),
      principalAmount: principalAmount,
      installment: installment,
      fileEndDate: endDate
    };

    await createFileAPI(fileData);
    
    // Reset form
    e.target.reset();
    
    // Show success message
    showToast('File created successfully!', 'success');
    
    // Reload files
    await loadFiles();
    
    // Go back to active files
    showView('active');
  } catch (error) {
    showToast('Error creating file: ' + error.message, 'error');
  }
}

// Update the handlePayment function
async function handlePayment(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const payment = {
    fileNumber: currentFile.filenumber,
    date: formData.get('paymentDate'),
    amount: parseInt(formData.get('paymentAmount')),
    mode: formData.get('paymentMode')
  };

  try {
    await addTransactionAPI(payment);
    
    // Close modal
    closePaymentModal();
    
    // Show success message
    showToast('Payment marked successfully!', 'success');
    
    // Reload files
    await loadFiles();
    
    // If on file details view, reload it
    if (currentView === 'details') {
      await viewFile(currentFile.filenumber);
    }
  } catch (error) {
    showToast('Error adding payment: ' + error.message, 'error');
  }
}

// Update the handleCloseFile function
async function handleCloseFile() {
  if (!currentFile) return;
  
  const received = getTotalReceived(currentFile.filenumber);
  if (received < currentFile.principalamount) {
    showToast('Cannot close file: Total received amount is less than principal amount', 'error');
    return;
  }
  
  try {
    await updateFileStatusAPI({
      fileNumber: currentFile.filenumber,
      status: 'CLOSED'
    });
    
    // Show success message
    showToast('File closed successfully!', 'success');
    
    // Go back to active files
    showView('active');
  } catch (error) {
    showToast('Error closing file: ' + error.message, 'error');
  }
}

// Update the viewFile function
async function viewFile(fileNumber) {
  const file = files.find(f => f.filenumber === fileNumber);
  if (!file) return;

  currentFile = file;
  
  // Update file details
  document.getElementById('file-details-title').textContent = `File #${file.filenumber}`;
  document.getElementById('file-person-name').textContent = file.personfullname;
  document.getElementById('file-number').textContent = `#${file.filenumber}`;
  document.getElementById('file-principal').textContent = `₹${file.principalamount.toLocaleString()}`;
  document.getElementById('file-installment').textContent = `₹${file.installment.toLocaleString()}`;

  const received = getTotalReceived(file.filenumber);
  const pending = file.principalamount - received;
  const daysLeft = getDaysLeft(file.fileenddate);
  const bounces = getBounceCount(file.filenumber, file.fileenddate);

  document.getElementById('file-received').textContent = `₹${received.toLocaleString()}`;
  document.getElementById('file-pending').textContent = `₹${pending.toLocaleString()}`;
  document.getElementById('file-bounces').textContent = bounces;
  document.getElementById('file-days-left').textContent = daysLeft;

  // Enable/disable close file button
  const closeBtn = document.getElementById('close-file-btn');
  closeBtn.disabled = file.status === 'CLOSED' || received < file.principalamount;

  // Load transactions
  await loadTransactions(file);

  // Show file details view
  showView('details');
}

// Update the loadTransactions function
async function loadTransactions(file) {
  const fileTransactions = await fetchTransactions(file.filenumber);
  const tbody = document.getElementById('transactions-tbody');
  tbody.innerHTML = '';

  const startDate = new Date();
  const endDate = file.status === 'CLOSED' ? new Date(file.fileenddate) : new Date();
  
  // Generate all dates from start to end
  const dates = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  dates.forEach(date => {
    const dateStr = date.toISOString().split('T')[0];
    const transaction = fileTransactions.find(t => t.date === dateStr);

    const row = document.createElement('tr');
    if (transaction) {
      // Transaction exists
      row.innerHTML = `
        <td>${formatDate(dateStr)}</td>
        <td><span class="status-received">Received</span></td>
        <td>₹${transaction.amount.toLocaleString()}</td>
        <td>${transaction.mode}</td>
      `;
    } else {
      // No transaction - bounce
      row.innerHTML = `
        <td>${formatDate(dateStr)}</td>
        <td><span class="status-bounce">BOUNCE</span></td>
        <td>-</td>
        <td>-</td>
      `;
    }
    tbody.appendChild(row);
  });
}

// Update utility functions to work with new data structure
function getTotalReceived(fileNumber) {
  return transactions
    .filter(t => t.filenumber === fileNumber)
    .reduce((sum, t) => sum + t.amount, 0);
}

function getBounceCount(fileNumber, endDate) {
  const startDate = new Date();
  const end = new Date(endDate);
  const currentDate = new Date(startDate);
  let bounces = 0;
  
  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const hasTransaction = transactions.some(t => 
      t.filenumber === fileNumber && t.date === dateStr
    );
    
    if (!hasTransaction) {
      bounces++;
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return bounces;
}
```

### 3.2 Update Configuration

1. **Replace `YOUR_APPS_SCRIPT_URL_HERE`** with your actual Google Apps Script deployment URL
2. **Update the renderFiles function** to use the new field names:

```javascript
// Update field references in renderFiles function
const fileCard = document.createElement('div');
fileCard.className = 'file-card';
fileCard.innerHTML = `
    <div class="file-header">
        <div>
            <div class="file-person-name">${file.personfullname}</div>
            <div class="file-info-item">
                <span class="label">Mobile:</span>
                <span class="value">${file.personmobile}</span>
            </div>
        </div>
        <span class="file-number">#${file.filenumber}</span>
    </div>
    
    <div class="file-info">
        <div class="file-info-item">
            <span class="label">Principal:</span>
            <span class="value">₹${file.principalamount.toLocaleString()}</span>
        </div>
        <div class="file-info-item">
            <span class="label">Daily Installment:</span>
            <span class="value">₹${file.installment.toLocaleString()}</span>
        </div>
        <div class="file-info-item">
            <span class="label">Received:</span>
            <span class="value">₹${received.toLocaleString()}</span>
        </div>
        <div class="file-info-item">
            <span class="label">Pending:</span>
            <span class="value">₹${pending.toLocaleString()}</span>
        </div>
        <div class="file-info-item">
            <span class="label">Bounces:</span>
            <span class="value bounce-count">${bounces}</span>
        </div>
        <div class="file-info-item">
            <span class="label">Days Left:</span>
            <span class="value">${daysLeft}</span>
        </div>
    </div>
    
    <div class="file-actions">
        ${file.status === 'ACTIVE' ? `
            <button class="btn btn-primary" onclick="markPayment(${file.filenumber})">
                <i class="fas fa-plus"></i>
                Mark Payment
            </button>
        ` : ''}
        <button class="btn btn-secondary" onclick="viewFile(${file.filenumber})">
            <i class="fas fa-eye"></i>
            View File
        </button>
    </div>
`;
```

---

## 🔧 Step 4: Deploy the Web App

### 4.1 Option A: Local Testing

1. **Open the HTML file** in your browser:
   - Double-click `index.html` or drag it into your browser
   - Or use a local server: `python -m http.server 8000` then visit `http://localhost:8000`

### 4.2 Option B: Deploy to Web Server

1. **Upload files** to your web hosting service:
   - `index.html`
   - `styles.css`
   - `script.js`

2. **Update the Apps Script URL** in `script.js` with your production URL

### 4.3 Option C: Deploy to GitHub Pages

1. **Create a GitHub repository**
2. **Upload the files** to the repository
3. **Enable GitHub Pages** in repository settings
4. **Update the Apps Script URL** in `script.js`

---

## 🔒 Step 5: Security Configuration

### 5.1 Google Sheets Permissions

1. **Share the Google Sheet** with authorized users:
   - Go to Share button in Google Sheets
   - Add email addresses with appropriate permissions
   - **Viewer**: Read-only access
   - **Editor**: Read-write access

### 5.2 Apps Script Permissions

1. **First-time access**:
   - When users first access the web app, they'll need to authorize it
   - They'll see a Google OAuth consent screen
   - Click "Advanced" → "Go to [Project Name] (unsafe)" → "Allow"

### 5.3 CORS Configuration

The Apps Script code includes CORS headers, but if you encounter issues:

1. **Add your domain** to the CORS headers in the Apps Script
2. **Or use a CORS proxy** for development

---

## 🧪 Step 6: Testing

### 6.1 Test the Setup

1. **Open the web app** in your browser
2. **Try creating a new file**:
   - Fill out the form with test data
   - Submit and check if it appears in Google Sheets
3. **Try marking a payment**:
   - Select an active file
   - Mark a payment and verify it appears in the transactions sheet
4. **Test file closing**:
   - Add enough payments to cover the principal amount
   - Try closing the file

### 6.2 Verify Data Integrity

1. **Check Google Sheets** after each operation
2. **Verify calculations** are correct
3. **Test validation rules** (amount limits, date validation, etc.)

---

## 🚨 Troubleshooting

### Common Issues

1. **"Access denied" error**:
   - Check if user email is in the access lists
   - Verify Google Sheets sharing permissions

2. **"Action parameter is required"**:
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

**🎉 Congratulations!** Your Loan Tracker web app is now deployed and ready to use. 