// Configuration
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // Replace with your sheet ID
const READ_ONLY_EMAILS = ['readonly@example.com']; // Add read-only email addresses
const READ_WRITE_EMAILS = ['admin@example.com']; // Add read-write email addresses

// Email verification required for security
const BYPASS_EMAIL_VERIFICATION = false;

// Spreadsheet access - only this specific spreadsheet
const SPREADSHEET_NAME = 'Loan Tracker Database'; // Your spreadsheet name

// Get spreadsheet with basic permissions
function getSpreadsheet() {
    try {
        const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);

        // Verify it's the correct spreadsheet
        if (spreadsheet.getName() !== SPREADSHEET_NAME) {
            throw new Error(`Expected spreadsheet: ${SPREADSHEET_NAME}, Found: ${spreadsheet.getName()}`);
        }

        return spreadsheet;
    } catch (error) {
        console.error('Spreadsheet access failed:', error);
        throw new Error('Unable to access the loan tracker spreadsheet. Please check permissions.');
    }
}

// Validate spreadsheet access
function validateSpreadsheetAccess() {
    try {
        const spreadsheet = getSpreadsheet();

        // Check if required sheets exist
        const filesSheet = spreadsheet.getSheetByName('files');
        const transactionsSheet = spreadsheet.getSheetByName('transactions');

        if (!filesSheet) {
            throw new Error('Required sheet "files" not found');
        }

        if (!transactionsSheet) {
            throw new Error('Required sheet "transactions" not found');
        }

        return true;
    } catch (error) {
        console.error('Spreadsheet validation failed:', error);
        throw new Error('Invalid or inaccessible spreadsheet. Please check the spreadsheet ID and permissions.');
    }
}

// Main function to handle web requests
function doGet(e) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    // Serve the main web app interface
    return HtmlService.createHtmlOutputFromFile('index')
        .setTitle('Loan Tracker')
        .addMetaTag('Access-Control-Allow-Origin', '*')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
    // Set CORS headers for all responses
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
    };

    // Handle preflight OPTIONS request
    if (e.parameter.method === 'OPTIONS') {
        return ContentService.createTextOutput('')
            .setMimeType(ContentService.MimeType.TEXT)
            .setHeaders(headers);
    }
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

        // Check user permissions - email verification required
        const userEmail = Session.getActiveUser().getEmail();
        const hasReadAccess = READ_ONLY_EMAILS.includes(userEmail) || READ_WRITE_EMAILS.includes(userEmail);
        const hasWriteAccess = READ_WRITE_EMAILS.includes(userEmail);

        if (!hasReadAccess) {
            return createResponse(403, { error: `Access denied. Email ${userEmail} not authorized.` }, headers);
        }

        // Validate spreadsheet access first
        try {
            validateSpreadsheetAccess();
        } catch (error) {
            return createResponse(403, { error: error.message }, headers);
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
    // Ensure CORS headers are always included
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  // Merge with any additional headers
  const finalHeaders = { ...corsHeaders, ...headers };

  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(finalHeaders);
}

function getFiles() {
    try {
        const spreadsheet = getSpreadsheet();
        const sheet = spreadsheet.getSheetByName('files');

        if (!sheet) {
            throw new Error('Files sheet not found');
        }

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
    } catch (error) {
        console.error('Error accessing spreadsheet:', error);
        throw new Error('Unable to access the loan tracker spreadsheet. Please check permissions.');
    }
}

function getTransactions(fileNumber) {
    try {
        const spreadsheet = getSpreadsheet();
        const sheet = spreadsheet.getSheetByName('transactions');

        if (!sheet) {
            throw new Error('Transactions sheet not found');
        }

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
    } catch (error) {
        console.error('Error accessing transactions:', error);
        throw new Error('Unable to access transaction data. Please check permissions.');
    }
}

function createFile(fileData) {
    try {
        const spreadsheet = getSpreadsheet();
        const sheet = spreadsheet.getSheetByName('files');

        if (!sheet) {
            throw new Error('Files sheet not found');
        }

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
            fileData.fileStartDate,
            fileData.fileEndDate,
            'ACTIVE',
            'DAILY'
        ];

        sheet.appendRow(rowData);

        return { success: true, fileNumber: nextFileNumber };
    } catch (error) {
        console.error('Error creating file:', error);
        throw new Error('Unable to create file. Please check permissions.');
    }
}

function addTransaction(transactionData) {
    try {
        const spreadsheet = getSpreadsheet();
        const sheet = spreadsheet.getSheetByName('transactions');

        if (!sheet) {
            throw new Error('Transactions sheet not found');
        }

        const rowData = [
            transactionData.fileNumber,
            transactionData.date,
            transactionData.amount,
            transactionData.mode
        ];

        sheet.appendRow(rowData);

        return { success: true };
    } catch (error) {
        console.error('Error adding transaction:', error);
        throw new Error('Unable to add transaction. Please check permissions.');
    }
}

function updateFileStatus(statusData) {
    try {
        const spreadsheet = getSpreadsheet();
        const sheet = spreadsheet.getSheetByName('files');

        if (!sheet) {
            throw new Error('Files sheet not found');
        }

        const data = sheet.getDataRange().getValues();

        for (let i = 1; i < data.length; i++) {
            if (data[i][0] == statusData.fileNumber) {
                sheet.getRange(i + 1, 12).setValue(statusData.status); // Status column (L)
                break;
            }
        }

        return { success: true };
    } catch (error) {
        console.error('Error updating file status:', error);
        throw new Error('Unable to update file status. Please check permissions.');
    }
} 