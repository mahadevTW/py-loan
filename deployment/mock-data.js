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
        { id: 1, fileNumber: 1, date: "2024-01-01", amount: 2000, mode: "CASH", status: "Received" },
        { id: 2, fileNumber: 1, date: "2024-01-02", amount: 2000, mode: "UPI", status: "Received" },
        { id: 3, fileNumber: 1, date: "2024-01-03", amount: 2000, mode: "CASH", status: "Received" }
    ],
    2: [
        { id: 4, fileNumber: 2, date: "2024-01-15", amount: 3000, mode: "CASH", status: "Received" },
        { id: 5, fileNumber: 2, date: "2024-01-16", amount: 3000, mode: "UPI", status: "Received" }
    ],
    3: [
        { id: 6, fileNumber: 3, date: "2023-12-01", amount: 1500, mode: "CASH", status: "Received" },
        { id: 7, fileNumber: 3, date: "2023-12-02", amount: 1500, mode: "UPI", status: "Received" }
    ]
};

// Mock API functions
const mockAPI = {
    // Get all files
    getFiles: async () => {
        console.log('Mock: Getting files');
        return mockFiles;
    },

    // Get transactions for a file
    getTransactions: async (fileNumber) => {
        console.log('Mock: Getting transactions for file', fileNumber);
        return mockTransactions[fileNumber] || [];
    },

    // Create a new file
    createFile: async (fileData) => {
        console.log('Mock: Creating file', fileData);
        
        // Create new file with all required fields
        const newFile = {
            id: mockFiles.length + 1,
            personName: fileData.personFullName,
            personMobile: fileData.personMobile,
            referenceMobile: fileData.referenceMobile,
            address: fileData.address,
            businessName: fileData.businessName,
            businessAddress: fileData.businessAddress,
            principalAmount: fileData.principalAmount,
            installment: fileData.installment,
            fileStartDate: fileData.fileStartDate,
            fileEndDate: fileData.fileEndDate,
            status: 'ACTIVE',
            totalReceived: 0,
            bounces: 0,
            transactions: 0
        };
        
        // Add to mock data
        mockFiles.push(newFile);
        mockTransactions[newFile.id] = [];
        
        return { fileNumber: newFile.id };
    },

    // Add a transaction
    addTransaction: async (transactionData) => {
        console.log('Mock: Adding transaction', transactionData);
        
        const fileId = transactionData.fileNumber;
        const newTransaction = {
            id: Date.now(),
            fileNumber: fileId,
            date: transactionData.date,
            amount: transactionData.amount,
            mode: transactionData.mode,
            status: 'Received'
        };
        
        if (!mockTransactions[fileId]) {
            mockTransactions[fileId] = [];
        }
        mockTransactions[fileId].push(newTransaction);
        
        // Update file stats
        const file = mockFiles.find(f => f.id === fileId);
        if (file) {
            file.totalReceived += transactionData.amount;
            file.transactions += 1;
            file.bounces = mockAPI.getBounceCount(file);
        }
        
        return { success: true };
    },

    // Update file status
    updateFileStatus: async (statusData) => {
        console.log('Mock: Updating file status', statusData);
        
        const file = mockFiles.find(f => f.id === statusData.fileNumber);
        if (file) {
            file.status = statusData.status;
        }
        
        return { success: true };
    },

    // Update transaction
    updateTransaction: async (transactionId, editData) => {
        console.log('Mock: Updating transaction', transactionId, editData);
        
        // Find transaction
        const transaction = Object.values(mockTransactions)
            .flat()
            .find(t => t.id === transactionId);
        
        if (!transaction) {
            throw new Error('Transaction not found');
        }
        
        // Update transaction
        const oldAmount = transaction.amount;
        transaction.date = editData.date;
        transaction.amount = editData.amount;
        transaction.mode = editData.mode;
        
        // Update file stats
        const file = mockFiles.find(f => f.id === transaction.fileNumber);
        if (file) {
            file.totalReceived = file.totalReceived - oldAmount + editData.amount;
            file.bounces = mockAPI.getBounceCount(file);
        }
        
        return { success: true };
    },

    // Delete transaction
    deleteTransaction: async (transactionId) => {
        console.log('Mock: Deleting transaction', transactionId);
        
        // Find and remove transaction
        let fileId = null;
        for (const [id, transactions] of Object.entries(mockTransactions)) {
            const index = transactions.findIndex(t => t.id === transactionId);
            if (index > -1) {
                const transaction = transactions[index];
                fileId = parseInt(id);
                transactions.splice(index, 1);
                
                // Update file stats
                const file = mockFiles.find(f => f.id === fileId);
                if (file) {
                    file.totalReceived -= transaction.amount;
                    file.transactions -= 1;
                    file.bounces = mockAPI.getBounceCount(file);
                }
                break;
            }
        }
        
        if (!fileId) {
            throw new Error('Transaction not found');
        }
        
        return { success: true };
    },

    // Utility function to calculate bounce count
    getBounceCount: (file) => {
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
};

// Utility function for date formatting
function formatDate(date) {
    if (typeof date === 'string') {
        date = new Date(date);
    }
    return date.toISOString().split('T')[0];
} 