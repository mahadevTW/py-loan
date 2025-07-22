## **📄 Web App Requirement Document: Loan Tracker Web App using google sheet only**

### **📌 Overview**

This is a **single-page web application (SPA)** that uses **Google Sheets as the backend database**. The app is **mobile-friendly** and is **accessible only to users who have access to the private Google Sheet**.

---

## **📁 Data Model** we can treat this 1 model as 1 sheet

### **1\. files**

Represents an individual loan file.

| Field | Type | Description | Validation |
| ----- | ----- | ----- | ----- |
| File Number | Auto Number | Unique ID starting from 1 (auto-incremented) | Sequential: 1, 2, 3... |
| Person Full Name | String | Borrower's full name | Required |
| Person Mobile | String | Borrower's mobile number | Required |
| Reference Mobile | String | Reference person's mobile number | Required |
| Address | String | Borrower's residential address | Required |
| Business Name | String | Name of borrower's business | Required |
| Business Address | String | Business location | Required |
| Principal Amount | Number | Total amount borrowed | Required, positive, max 500,000 |
| Installment | Number | Daily installment amount | Required, positive |
| File Start Date | Date | Loan start date | Required, can be past date |
| File End Date | Date | Scheduled loan end date | Required, future date |
| Status | Enum | One of: `ACTIVE`, `CLOSED`, `DELAYED` | Default: ACTIVE |
| Installment Type | Enum | Only `DAILY` is currently supported | Default: DAILY |

**Business Rules:**
- Principal Amount must be positive and cannot exceed ₹500,000
- Daily Installment must be positive
- File End Date must be in the future
- Closed files do not appear in active files list
- Closed files cannot have new transactions added

---

### **2\. transactions**

Represents daily payments received.

| Field | Type | Description | Validation |
| ----- | ----- | ----- | ----- |
| File Number | Foreign Key | Refers to the File entity | Required, must exist in files |
| Date | Date | Defaults to today; user-selectable | Required |
| Amount | Number | Payment amount | Required, positive |
| Mode | Enum | Default is `ONLINE`. Can be changed to other types | Default: ONLINE |

**Business Rules:**
- No grace period for payments - if no transaction on a day, it's marked as "BOUNCE"
- Bounce is absence of transaction - no database entry for bounce
- Multiple transactions per day are allowed
- Amount should be positive

---

## **🖥️ Application Features**

### **🏠 Home Page (Active Files List)**

* Lists all `ACTIVE` files only (CLOSED files excluded).

* Each file shows:

  * File Number (small text)

  * Person Full Name (larger/bold text)

* **For each file**, there is a **"Mark Payment Received"** button:

  * Clicking it opens a **confirmation popup**:

    * **Default amount**: file's daily installment

    * **Default mode**: online

    * **Default date**: today

    * Allows changing:

      * Date (prev, next, or custom calendar picker)

      * Amount and Mode (optional "Custom" toggle)

* **Upon confirmation:**

  * A new entry is added to the **Transactions sheet**

  * UI shows confirmation toast/snackbar

* Each row also has a **"View File"** button:

  * Opens the File Details page

* **Navigation**: Separate section to view historic/closed files

---

### **📄 File Details Page**

For the selected file, display:

#### **🔹 File Information**

* All file fields (name, address, mobile, principal, installment, etc.)

#### **🔹 Transactions Table**

* One row for **each day from file start to today** (for active files) or **file end date** (for closed files)

* If no transaction exists for a day → show **"BOUNCE"** status (no database entry)

* Columns:

  * Date

  * Status: Received / Bounce (with color coding)

  * Amount (if received)

  * Mode (if received)

#### **🔹 Summary Section**

* **Total Received Amount**

* **Total Pending Amount** = Principal - Total Received

* **File End Date**

* **Days Left** until file end date

* **Number of Bounces** (count of days without transactions)

* **Mark File as Closed** button (Only enabled if total received ≥ expected amount)

---

### **➕ Create File**

Accessible from Home Page:

* A simple form to enter all File fields with validation:

  * All required fields must be filled

  * Principal Amount: positive, max ₹500,000

  * Daily Installment: positive

  * File End Date: future date

* On submit:

  * Adds a new entry to the Files sheet

  * Automatically assigns the next available file number (sequential: 1, 2, 3...)

---

## **🎨 UI/UX Specifications**

### **Color Coding**
- **ACTIVE**: Green
- **CLOSED**: Gray
- **DELAYED**: Orange
- **BOUNCE**: Red
- **Received**: Blue

### **Mobile Responsiveness**
- Base screen size: iPhone 16 Pro
- Responsive design for tablets and larger screens
- Touch-friendly buttons and interactions

---

## **🔐 Access Control**

* The Google Sheet is **private**

* **2-level access control**:

  * **Read-only emails**: Can view data only

  * **Read-write emails**: Can view and modify data

* Email addresses are hardcoded in the application

* Web app will use **OAuth + Google Sheets API** to access data

---

## **📱 Technical Requirements**

### **Validation Rules**
- Principal Amount: Positive number, maximum ₹500,000
- Daily Installment: Positive number
- File End Date: Must be in the future
- All required fields must be filled

### **Business Logic**
- No grace period for payments
- Bounce = absence of transaction (no database entry)
- Closed files cannot have new transactions
- File numbers are sequential (1, 2, 3...)
- Multiple transactions per day allowed  

## Deployment
- Add should not need any deployment outside of google script
- everything should be manager via appScript google