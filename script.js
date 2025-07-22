// Mock data for local testing
const mockFiles = [
    {
        id: 1,
        personName: "Rahul Sharma",
        personMobile: "9876543210",
        referenceMobile: "8765432109",
        businessName: "Sharma Electronics",
        address: "123 Main Street, Mumbai",
        businessAddress: "456 Business Park, Mumbai",
        principalAmount: 100000,
        installment: 2000,
        fileStartDate: "2024-01-01",
        fileEndDate: "2024-03-31",
        status: "ACTIVE",
        totalReceived: 6000,
        bounces: 2,
        transactions: 3
    },
    {
        id: 2,
        personName: "Priya Patel",
        personMobile: "8765432109",
        referenceMobile: "7654321098",
        businessName: "Patel Textiles",
        address: "789 Oak Avenue, Delhi",
        businessAddress: "321 Market Street, Delhi",
        principalAmount: 150000,
        installment: 3000,
        fileStartDate: "2024-01-15",
        fileEndDate: "2024-04-15",
        status: "ACTIVE",
        totalReceived: 6000,
        bounces: 1,
        transactions: 2
    },
    {
        id: 3,
        personName: "Amit Kumar",
        personMobile: "7654321098",
        referenceMobile: "6543210987",
        businessName: "Kumar Foods",
        address: "456 Pine Road, Bangalore",
        businessAddress: "789 Food Court, Bangalore",
        principalAmount: 80000,
        installment: 1500,
        fileStartDate: "2023-12-01",
        fileEndDate: "2024-02-29",
        status: "CLOSED",
        totalReceived: 80000,
        bounces: 0,
        transactions: 53
    }
];

const mockTransactions = {
    1: [
        { id: 1, date: "2024-01-01", amount: 2000, mode: "CASH", status: "Received" },
        { id: 2, date: "2024-01-02", amount: 2000, mode: "UPI", status: "Received" },
        { id: 3, date: "2024-01-03", amount: 2000, mode: "CASH", status: "Received" }
    ],
    2: [
        { id: 4, date: "2024-01-15", amount: 3000, mode: "CASH", status: "Received" },
        { id: 5, date: "2024-01-16", amount: 3000, mode: "UPI", status: "Received" }
    ],
    3: [
        { id: 6, date: "2023-12-01", amount: 1500, mode: "CASH", status: "Received" },
        { id: 7, date: "2023-12-02", amount: 1500, mode: "UPI", status: "Received" }
    ]
};

// Global variables
let currentView = 'active';
let currentFile = null;
let currentTransaction = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Set up navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const view = this.getAttribute('data-view');
            console.log('Navigation clicked:', view);
            console.log('Button clicked:', this.textContent);
            showView(view);
        });
    });
    
    // Debug: Check if buttons exist
    console.log('Navigation buttons found:', document.querySelectorAll('.nav-btn').length);
    document.querySelectorAll('.nav-btn').forEach(btn => {
        console.log('Button:', btn.textContent, 'data-view:', btn.getAttribute('data-view'));
    });

    // Set up form submissions
    const createFileForm = document.getElementById('create-file-form');
    const paymentForm = document.getElementById('payment-form');
    const editTransactionForm = document.getElementById('edit-transaction-form');
    
    if (createFileForm) {
        console.log('Create file form found, adding event listener');
        createFileForm.addEventListener('submit', handleCreateFile);
    } else {
        console.error('Create file form not found!');
    }
    
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePayment);
    }
    
    if (editTransactionForm) {
        editTransactionForm.addEventListener('submit', handleEditTransaction);
    }

    // Set up payment modal
    const markPaymentBtn = document.getElementById('mark-payment-btn');
    if (markPaymentBtn) {
        markPaymentBtn.addEventListener('click', openPaymentModal);
    }

    // Set up close file button
    const closeFileBtn = document.getElementById('close-file-btn');
    if (closeFileBtn) {
        closeFileBtn.addEventListener('click', closeFile);
    }

    // Set default dates for file start and end dates
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const fileStartDateEl = document.getElementById('fileStartDate');
    if (fileStartDateEl) {
        // Allow past dates for start date (no min restriction)
        fileStartDateEl.value = today.toISOString().split('T')[0];
    }
    
    const fileEndDateEl = document.getElementById('fileEndDate');
    if (fileEndDateEl) {
        fileEndDateEl.min = tomorrow.toISOString().split('T')[0];
        fileEndDateEl.value = tomorrow.toISOString().split('T')[0];
    }

    // Load initial data after a short delay to ensure DOM is ready
    setTimeout(() => {
        loadFiles();
    }, 100);
}

// View management
function showView(viewName) {
    console.log('showView called with:', viewName);
    
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
        console.log('Hiding view:', view.id);
    });

    // Show selected view
    let targetView;
    if (viewName === 'active') {
        targetView = document.getElementById('active-files-view');
    } else if (viewName === 'history') {
        targetView = document.getElementById('history-view');
    } else {
        targetView = document.getElementById(`${viewName}-view`);
    }
    
    console.log('Target view found:', targetView ? 'YES' : 'NO');
    if (targetView) {
        targetView.classList.add('active');
        console.log('Added active class to:', targetView.id);
        console.log('View classes now:', targetView.className);
    }

    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeNavBtn = document.querySelector(`[data-view="${viewName}"]`);
    if (activeNavBtn) {
        activeNavBtn.classList.add('active');
    }

    currentView = viewName;
    
    // Only load files for views that need them
    if (viewName === 'active' || viewName === 'history') {
        loadFiles();
    }
}

// Load and display files
function loadFiles() {
    console.log('loadFiles called, currentView:', currentView);
    console.log('Total mockFiles:', mockFiles.length);
    
    const activeFiles = mockFiles.filter(file => file.status === 'ACTIVE');
    const closedFiles = mockFiles.filter(file => file.status === 'CLOSED');
    
    console.log('Active files:', activeFiles.length);
    console.log('Closed files:', closedFiles.length);

    // Update stats
    const activeCountEl = document.getElementById('active-count');
    const closedCountEl = document.getElementById('closed-count');
    const totalPendingEl = document.getElementById('total-pending');
    
    if (activeCountEl) {
        activeCountEl.textContent = activeFiles.length;
    }
    
    if (closedCountEl) {
        closedCountEl.textContent = closedFiles.length;
    }
    
    const totalPending = activeFiles.reduce((sum, file) => {
        return sum + (file.principalAmount - file.totalReceived);
    }, 0);
    
    if (totalPendingEl) {
        totalPendingEl.textContent = `₹${totalPending.toLocaleString()}`;
    }

    // Render files based on current view
    const filesGrid = currentView === 'history' ? 
        document.getElementById('history-files-grid') : 
        document.getElementById('active-files-grid');
    
    if (filesGrid) {
        filesGrid.innerHTML = '';

        const filesToShow = currentView === 'history' ? closedFiles : activeFiles;
        
        filesToShow.forEach(file => {
            const fileCard = createFileCard(file);
            filesGrid.appendChild(fileCard);
        });
    }
    

}

// Create file card element
function createFileCard(file) {
    const card = document.createElement('div');
    card.className = 'file-card';
    
    const pendingAmount = file.principalAmount - file.totalReceived;
    
    card.innerHTML = `
        <div class="file-header">
            <div>
                <div class="file-name">${file.personName}</div>
                <div class="file-mobile">${file.personMobile}</div>
            </div>
            <span class="file-number">#${file.id}</span>
        </div>
        
        <div class="file-details">
            <div class="file-detail">
                <div class="file-detail-label">Principal</div>
                <div class="file-detail-value">₹${file.principalAmount.toLocaleString()}</div>
            </div>
            <div class="file-detail">
                <div class="file-detail-label">Daily</div>
                <div class="file-detail-value">₹${file.installment.toLocaleString()}</div>
            </div>
            <div class="file-detail">
                <div class="file-detail-label">Received</div>
                <div class="file-detail-value">₹${file.totalReceived.toLocaleString()}</div>
            </div>
            <div class="file-detail">
                <div class="file-detail-label">Pending</div>
                <div class="file-detail-value">₹${pendingAmount.toLocaleString()}</div>
            </div>
        </div>
        
        <div class="file-actions">
            <button class="btn btn-primary view-details-btn" data-file-id="${file.id}">
                <i class="fas fa-eye"></i>
                View Details
            </button>
            ${file.status === 'ACTIVE' ? `
                <button class="btn btn-success mark-payment-btn" data-file-id="${file.id}">
                    <i class="fas fa-plus"></i>
                    Mark Payment
                </button>
            ` : ''}
        </div>
    `;
    
    // Add event listeners
    const viewDetailsBtn = card.querySelector('.view-details-btn');
    if (viewDetailsBtn) {
        viewDetailsBtn.addEventListener('click', function() {
            const fileId = parseInt(this.getAttribute('data-file-id'));
            viewFile(fileId);
        });
    }
    
    const markPaymentBtn = card.querySelector('.mark-payment-btn');
    if (markPaymentBtn) {
        markPaymentBtn.addEventListener('click', function() {
            const fileId = parseInt(this.getAttribute('data-file-id'));
            openPaymentModal(fileId);
        });
    }
    
    return card;
}

// View file details
function viewFile(fileId) {
    const file = mockFiles.find(f => f.id === fileId);
    if (!file) return;

    currentFile = file;
    
    // Populate file details
    const elements = {
        'file-details-title': file.personName,
        'file-person-name': file.personName,
        'file-number': `#${file.id}`,
        'file-principal': `₹${file.principalAmount.toLocaleString()}`,
        'file-installment': `₹${file.installment.toLocaleString()}`,
        'file-received': `₹${file.totalReceived.toLocaleString()}`,
        'file-pending': `₹${(file.principalAmount - file.totalReceived).toLocaleString()}`,
        'file-bounces': file.bounces,
        'file-transactions': file.transactions,
        'file-start-date': formatDate(file.fileStartDate),
        'file-details-end-date': formatDate(file.fileEndDate)
    };
    
    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = elements[id];
        }
    });

    // Show/hide close file button
    const closeBtn = document.getElementById('close-file-btn');
    if (closeBtn) {
        if (file.status === 'ACTIVE') {
            closeBtn.style.display = 'inline-flex';
        } else {
            closeBtn.style.display = 'none';
        }
    }

    // Load transactions
    loadTransactions(fileId);
    
    // Show file details view
    showView('file-details');
}

// Load transactions for a file
function loadTransactions(fileId) {
    const tbody = document.getElementById('transactions-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    const transactions = mockTransactions[fileId] || [];
    const file = mockFiles.find(f => f.id === fileId);
    
    if (!file) return;

    // Get date range
    const startDate = new Date(file.fileStartDate);
    const endDate = file.status === 'CLOSED' ? new Date(file.fileEndDate) : new Date();
    const today = new Date();

    // Create date range for transactions
    const dateRange = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        dateRange.push(new Date(d));
    }

    // Sort transactions by date (newest first)
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Display transactions in reverse chronological order
    sortedTransactions.forEach(transaction => {
        const row = createTransactionRow(transaction, file);
        tbody.appendChild(row);
    });

    // Add bounce entries for missing dates
    dateRange.forEach(date => {
        const dateStr = formatDate(date);
        const hasTransaction = transactions.some(t => t.date === dateStr);
        
        if (!hasTransaction) {
            const isPastDate = date <= today;
            const status = isPastDate ? 'BOUNCE' : 'PENDING';
            const statusClass = isPastDate ? 'status-bounce' : 'status-pending';
            
            const bounceRow = document.createElement('tr');
            bounceRow.innerHTML = `
                <td>${dateStr}</td>
                <td>-</td>
                <td>-</td>
                <td class="${statusClass}">${status}</td>
                <td>-</td>
            `;
            tbody.appendChild(bounceRow);
        }
    });
}

// Create transaction row
function createTransactionRow(transaction, file) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${formatDate(transaction.date)}</td>
        <td>₹${transaction.amount.toLocaleString()}</td>
        <td>${transaction.mode}</td>
        <td class="status-received">${transaction.status}</td>
        <td>
            <div class="transaction-actions">
                <button class="transaction-edit-btn" onclick="editTransaction(${transaction.id})">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
        </td>
    `;
    return row;
}

// Payment modal functions
function openPaymentModal(fileId = null) {
    if (fileId) {
        currentFile = mockFiles.find(f => f.id === fileId);
    }
    
    if (!currentFile || currentFile.status !== 'ACTIVE') return;

    const paymentDateEl = document.getElementById('payment-date');
    const paymentAmountEl = document.getElementById('payment-amount');
    const paymentModalEl = document.getElementById('payment-modal');
    
    if (!paymentDateEl || !paymentAmountEl || !paymentModalEl) return;

    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    paymentDateEl.value = today;
    
    // Set max date to today and min date to file start date
    paymentDateEl.max = today;
    paymentDateEl.min = currentFile.fileStartDate;
    
    // Set default amount to daily installment
    paymentAmountEl.value = currentFile.installment;
    
    // Update date navigation buttons
    updateDateNavigationButtons();
    
    // Show modal
    paymentModalEl.classList.add('active');
}

function closePaymentModal() {
    const paymentModalEl = document.getElementById('payment-modal');
    const paymentFormEl = document.getElementById('payment-form');
    
    if (paymentModalEl) {
        paymentModalEl.classList.remove('active');
    }
    
    if (paymentFormEl) {
        paymentFormEl.reset();
    }
}

function changePaymentDate(direction) {
    const dateInput = document.getElementById('payment-date');
    if (!dateInput || !currentFile) return;
    
    const currentDate = new Date(dateInput.value);
    
    if (direction === 'prev') {
        currentDate.setDate(currentDate.getDate() - 1);
    } else {
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const newDate = currentDate.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    const fileStartDate = currentFile.fileStartDate;
    
    // Validate date range
    if (newDate <= today && newDate >= fileStartDate) {
        dateInput.value = newDate;
        updateDateNavigationButtons();
    }
}

function updateDateNavigationButtons() {
    const dateInput = document.getElementById('payment-date');
    if (!dateInput || !currentFile) return;
    
    const currentDate = new Date(dateInput.value);
    const today = new Date();
    const fileStartDate = new Date(currentFile.fileStartDate);
    
    const prevBtn = dateInput.parentElement.querySelector('button:first-child');
    const nextBtn = dateInput.parentElement.querySelector('button:last-child');
    
    if (prevBtn) {
        prevBtn.disabled = currentDate <= fileStartDate;
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentDate >= today;
    }
}

// Edit transaction modal functions
function editTransaction(transactionId) {
    // Find transaction
    const transaction = Object.values(mockTransactions)
        .flat()
        .find(t => t.id === transactionId);
    
    if (!transaction || !currentFile) return;
    
    currentTransaction = transaction;
    
    const editDateEl = document.getElementById('edit-transaction-date');
    const editAmountEl = document.getElementById('edit-transaction-amount');
    const editModeEl = document.getElementById('edit-transaction-mode');
    const editModalEl = document.getElementById('edit-transaction-modal');
    
    if (!editDateEl || !editAmountEl || !editModeEl || !editModalEl) return;
    
    // Populate form
    editDateEl.value = transaction.date;
    editAmountEl.value = transaction.amount;
    editModeEl.value = transaction.mode;
    
    // Set date constraints
    const fileStartDate = currentFile.fileStartDate;
    const today = new Date().toISOString().split('T')[0];
    
    editDateEl.min = fileStartDate;
    editDateEl.max = today;
    
    // Update date navigation
    updateEditTransactionDateNavigationButtons();
    
    // Show modal
    editModalEl.classList.add('active');
}

function closeEditTransactionModal() {
    const editModalEl = document.getElementById('edit-transaction-modal');
    const editFormEl = document.getElementById('edit-transaction-form');
    
    if (editModalEl) {
        editModalEl.classList.remove('active');
    }
    
    if (editFormEl) {
        editFormEl.reset();
    }
    
    currentTransaction = null;
}

function changeEditTransactionDate(direction) {
    const dateInput = document.getElementById('edit-transaction-date');
    if (!dateInput || !currentFile) return;
    
    const currentDate = new Date(dateInput.value);
    
    if (direction === 'prev') {
        currentDate.setDate(currentDate.getDate() - 1);
    } else {
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const newDate = currentDate.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    const fileStartDate = currentFile.fileStartDate;
    
    if (newDate <= today && newDate >= fileStartDate) {
        dateInput.value = newDate;
        updateEditTransactionDateNavigationButtons();
    }
}

function updateEditTransactionDateNavigationButtons() {
    const dateInput = document.getElementById('edit-transaction-date');
    if (!dateInput || !currentFile) return;
    
    const currentDate = new Date(dateInput.value);
    const today = new Date();
    const fileStartDate = new Date(currentFile.fileStartDate);
    
    const prevBtn = dateInput.parentElement.querySelector('button:first-child');
    const nextBtn = dateInput.parentElement.querySelector('button:last-child');
    
    if (prevBtn) {
        prevBtn.disabled = currentDate <= fileStartDate;
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentDate >= today;
    }
}

// Form handlers
function handleCreateFile(e) {
    e.preventDefault();
    
    console.log('Create file form submitted');
    
    const formData = new FormData(e.target);
    
    // Get form data with correct field names
    const fileData = {
        personFullName: formData.get('personFullName'),
        personMobile: formData.get('personMobile'),
        referenceMobile: formData.get('referenceMobile'),
        address: formData.get('address'),
        businessName: formData.get('businessName'),
        businessAddress: formData.get('businessAddress'),
        principalAmount: parseInt(formData.get('principalAmount')),
        installment: parseInt(formData.get('installment')),
        fileStartDate: formData.get('fileStartDate'),
        fileEndDate: formData.get('fileEndDate')
    };
    
    console.log('Form data:', fileData);
    
    // Validate required fields
    const requiredFields = ['personFullName', 'personMobile', 'referenceMobile', 'address', 'businessName', 'businessAddress', 'principalAmount', 'installment', 'fileStartDate', 'fileEndDate'];
    for (const field of requiredFields) {
        if (!fileData[field] || (typeof fileData[field] === 'string' && fileData[field].trim() === '')) {
            showToast(`${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`, 'error');
            return;
        }
    }
    
    // Validate amount
    if (fileData.principalAmount <= 0 || fileData.principalAmount > 500000) {
        showToast('Principal amount must be between ₹1 and ₹500,000', 'error');
        return;
    }
    
    // Validate installment
    if (fileData.installment <= 0) {
        showToast('Daily installment must be positive', 'error');
        return;
    }
    
    // Validate start date - can be past date (historic)
    const startDate = new Date(fileData.fileStartDate);
    // No validation needed for start date being in the past - it's allowed
    
    // Validate end date
    const endDate = new Date(fileData.fileEndDate);
    if (endDate <= startDate) {
        showToast('File end date must be after start date', 'error');
        return;
    }
    
    // Create new file with all required fields
    const newFile = {
        id: mockFiles.length + 1,
        personName: fileData.personFullName, // Map to the expected field name
        personMobile: fileData.personMobile,
        referenceMobile: fileData.referenceMobile,
        address: fileData.address,
        businessName: fileData.businessName,
        businessAddress: fileData.businessAddress,
        principalAmount: fileData.principalAmount,
        installment: fileData.installment,
        fileStartDate: fileData.fileStartDate, // Use user-provided start date
        fileEndDate: fileData.fileEndDate,
        status: 'ACTIVE',
        totalReceived: 0,
        bounces: 0,
        transactions: 0
    };
    
    console.log('Creating new file:', newFile);
    
    // Add to mock data
    mockFiles.push(newFile);
    mockTransactions[newFile.id] = [];
    
    console.log('New file added to mockFiles. Total files now:', mockFiles.length);
    
    // Reset form and show success
    e.target.reset();
    showToast(`File created successfully! File #${newFile.id}`, 'success');
    
    // Switch to active files view and reload data
    showView('active');
    
    // Add a small delay to ensure DOM is ready, then reload files
    setTimeout(() => {
        loadFiles(); // Explicitly reload files to show the new file
    }, 50);
}



function handlePayment(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const paymentData = {
        date: formData.get('paymentDate'),
        amount: parseInt(formData.get('paymentAmount')),
        mode: formData.get('paymentMode')
    };
    
    // Validate date
    const paymentDate = new Date(paymentData.date);
    const today = new Date();
    const fileStartDate = new Date(currentFile.fileStartDate);
    
    if (paymentDate > today) {
        showToast('Payment date cannot be in the future', 'error');
        return;
    }
    
    if (paymentDate < fileStartDate) {
        showToast('Payment date cannot be before file start date', 'error');
        return;
    }
    
    // Check if transaction already exists for this date
    const existingTransaction = mockTransactions[currentFile.id]?.find(t => t.date === paymentData.date);
    if (existingTransaction) {
        showToast('Payment already recorded for this date', 'error');
        return;
    }
    
    // Add transaction
    const newTransaction = {
        id: Date.now(),
        ...paymentData,
        status: 'Received'
    };
    
    if (!mockTransactions[currentFile.id]) {
        mockTransactions[currentFile.id] = [];
    }
    mockTransactions[currentFile.id].push(newTransaction);
    
    // Update file stats
    currentFile.totalReceived += paymentData.amount;
    currentFile.transactions += 1;
    
    // Recalculate bounces
    currentFile.bounces = getBounceCount(currentFile);
    
    // Close modal and refresh
    closePaymentModal();
    viewFile(currentFile.id);
    showToast('Payment recorded successfully!', 'success');
}

function handleEditTransaction(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const editData = {
        date: formData.get('editTransactionDate'),
        amount: parseInt(formData.get('editTransactionAmount')),
        mode: formData.get('editTransactionMode')
    };
    
    // Validate date
    const editDate = new Date(editData.date);
    const today = new Date();
    const fileStartDate = new Date(currentFile.fileStartDate);
    
    if (editDate > today) {
        showToast('Transaction date cannot be in the future', 'error');
        return;
    }
    
    if (editDate < fileStartDate) {
        showToast('Transaction date cannot be before file start date', 'error');
        return;
    }
    
    // Check if another transaction exists for the new date (if date changed)
    if (editData.date !== currentTransaction.date) {
        const existingTransaction = mockTransactions[currentFile.id]?.find(t => t.date === editData.date);
        if (existingTransaction) {
            showToast('Another transaction already exists for this date', 'error');
            return;
        }
    }
    
    // Update transaction
    const oldAmount = currentTransaction.amount;
    currentTransaction.date = editData.date;
    currentTransaction.amount = editData.amount;
    currentTransaction.mode = editData.mode;
    
    // Update file stats
    currentFile.totalReceived = currentFile.totalReceived - oldAmount + editData.amount;
    currentFile.bounces = getBounceCount(currentFile);
    
    // Close modal and refresh
    closeEditTransactionModal();
    viewFile(currentFile.id);
    showToast('Transaction updated successfully!', 'success');
}

function deleteTransaction() {
    if (!currentTransaction) return;
    
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    
    // Remove transaction
    const fileTransactions = mockTransactions[currentFile.id];
    const index = fileTransactions.findIndex(t => t.id === currentTransaction.id);
    if (index > -1) {
        fileTransactions.splice(index, 1);
    }
    
    // Update file stats
    currentFile.totalReceived -= currentTransaction.amount;
    currentFile.transactions -= 1;
    currentFile.bounces = getBounceCount(currentFile);
    
    // Close modal and refresh
    closeEditTransactionModal();
    viewFile(currentFile.id);
    showToast('Transaction deleted successfully!', 'success');
}

function closeFile() {
    if (!currentFile || currentFile.status !== 'ACTIVE') return;
    
    if (!confirm('Are you sure you want to close this file?')) return;
    
    // Close the file
    currentFile.status = 'CLOSED';
    
    // Refresh and go back to active files
    showView('active');
    showToast('File closed successfully!', 'success');
}

// Utility functions
function getBounceCount(file) {
    const transactions = mockTransactions[file.id] || [];
    const startDate = new Date(file.fileStartDate);
    const endDate = file.status === 'CLOSED' ? new Date(file.fileEndDate) : new Date();
    const today = new Date();
    
    let bounceCount = 0;
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = formatDate(d);
        const hasTransaction = transactions.some(t => t.date === dateStr);
        
        // Only count bounces for past dates
        if (!hasTransaction && d <= today) {
            bounceCount++;
        }
    }
    
    return bounceCount;
}

function formatDate(date) {
    if (typeof date === 'string') {
        date = new Date(date);
    }
    return date.toISOString().split('T')[0];
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    const container = document.getElementById('toast-container');
    if (container) {
        container.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 3000);
    }
}

// Close modals when clicking outside
window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

    // Prevent form submission on Enter key in date inputs
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.target.type === 'date') {
        e.preventDefault();
    }
});


    
    // Update end date minimum when start date changes
    const fileStartDateEl = document.getElementById('fileStartDate');
    const fileEndDateEl = document.getElementById('fileEndDate');
    
    if (fileStartDateEl && fileEndDateEl) {
        fileStartDateEl.addEventListener('change', function() {
            const startDate = new Date(this.value);
            const nextDay = new Date(startDate);
            nextDay.setDate(nextDay.getDate() + 1);
            
            // Set minimum end date to day after start date
            fileEndDateEl.min = nextDay.toISOString().split('T')[0];
            
            // If current end date is before or equal to start date, update it
            const currentEndDate = new Date(fileEndDateEl.value);
            if (currentEndDate <= startDate) {
                fileEndDateEl.value = nextDay.toISOString().split('T')[0];
            }
        });
    } 