# Long Term Hire - V2 Features Documentation

**Date:** October 14, 2025
**Version:** 2.0
**Estimated Implementation Time:** 8 hours total

---

## Overview

This document outlines the new features added in Version 2 of the Long Term Hire application. All changes are **backward compatible** and do not break existing functionality.

---

## Features Implemented

### 1. Equipment Unavailability Due Months (1 hour)

**Description:** Equipment can now show expected availability dates (e.g., "Available January 2026") when marked as unavailable.

#### Database Changes:
- **Table:** `longtermhire_equipment_item`
- **New Field:** `unavailability_due_month` VARCHAR(50) NULL
  - Stores month/year strings like "January 2026", "March 2025"
  - NULL when equipment is currently available
  - Optional field, backward compatible

#### API Changes:

**Admin Equipment Endpoints:**
- `POST /v1/api/longtermhire/super_admin/equipment`
  - New field: `unavailability_due_month` (optional)
  - Example: `{ "unavailability_due_month": "January 2026" }`

- `PUT /v1/api/longtermhire/super_admin/equipment/:id`
  - New field: `unavailability_due_month` (optional)
  - Can be set to `null` to clear the field

- `GET /v1/api/longtermhire/super_admin/equipment`
  - Returns `unavailability_due_month` in response

**Client Equipment Endpoints:**
- `GET /v1/api/longtermhire/client/equipment`
  - Returns `unavailability_due_month` for all equipment
  - Frontend can display: "Available {unavailability_due_month}" when availability is false

- `GET /v1/api/longtermhire/client/equipment/:equipmentId`
  - Returns `unavailability_due_month` in equipment details

#### Usage Example:
```json
{
  "equipment_name": "Excavator 320",
  "availability": false,
  "unavailability_due_month": "February 2026"
}
// Frontend displays: "Available February 2026"
```

---

### 2. Equipment Availability Across Companies (No changes needed)

**Description:** Same equipment can be shown to multiple companies.

**Implementation:**
- Already supported by existing database structure!
- `longtermhire_equipment_item` stores equipment (one record per equipment)
- `longtermhire_client_equipment` assigns equipment to clients (many-to-many relationship)
- Same `equipment_id` can be assigned to multiple `client_user_id` values

**No code changes required** - this feature already works as designed.

---

### 3. PDF and Image Support in Chat (5 hours)

**Description:** Users can now send images, PDFs, and other file attachments via chat.

#### Database Changes:
- **Table:** `longtermhire_chat_messages`
- **New Fields:**
  - `attachment_url` VARCHAR(512) NULL - URL to uploaded file
  - `attachment_type` VARCHAR(100) NULL - MIME type (e.g., 'application/pdf', 'image/jpeg')
  - `attachment_name` VARCHAR(255) NULL - Original filename
  - `attachment_size` INT NULL - File size in bytes

- **Updated Field:**
  - `message_type` - Now supports: 'text', 'equipment_request', 'system', 'image', 'pdf', 'file'

- **New Index:**
  - `idx_message_type` on `message_type` column for better query performance

#### API Changes:

**New Upload Endpoint:**
```
POST /v1/api/longtermhire/chat/upload
Authorization: Bearer {token}
Role: super_admin, member

Request: multipart/form-data
- file: File upload (image, PDF, etc.)

Response:
{
  "error": false,
  "message": "File uploaded successfully",
  "data": {
    "url": "https://...",
    "type": "image|pdf|file",
    "mimetype": "image/jpeg",
    "size": 1024567,
    "filename": "document.pdf"
  }
}
```

**Updated Send Message Endpoint:**
```
POST /v1/api/longtermhire/chat/send

Request Body:
{
  "to_user_id": 123,
  "message": "Check out this document",
  "message_type": "pdf",  // NEW: can be 'text', 'image', 'pdf', 'file'
  "attachment_url": "https://...",  // NEW
  "attachment_type": "application/pdf",  // NEW
  "attachment_name": "report.pdf",  // NEW
  "attachment_size": 1024567  // NEW
}
```

**Get Messages Endpoint (Updated):**
```
GET /v1/api/longtermhire/chat/messages/:conversationId

Response now includes attachment fields:
{
  "id": 456,
  "message": "Check out this document",
  "message_type": "pdf",
  "attachment_url": "https://...",
  "attachment_type": "application/pdf",
  "attachment_name": "report.pdf",
  "attachment_size": 1024567,
  ...
}
```

#### Implementation Flow:
1. **Upload File:**
   - Frontend: Call `POST /v1/api/longtermhire/chat/upload` with file
   - Backend: Uploads to S3 or local storage, returns file URL and metadata

2. **Send Message with Attachment:**
   - Frontend: Call `POST /v1/api/longtermhire/chat/send` with message + attachment data
   - Backend: Saves message with attachment metadata to database

3. **Display Messages:**
   - Frontend: Fetch messages, render based on `message_type`
   - `text`: Show text message
   - `image`: Show image preview
   - `pdf`: Show PDF icon + filename
   - `file`: Show file icon + filename

#### Supported File Types:
- **Images:** jpg, jpeg, png, gif, webp
- **Documents:** pdf, doc, docx, xls, xlsx
- **Other:** Any file type supported by your upload configuration

---

### 4. Message Text in Email Notifications (2 hours)

**Description:** Email notifications now include a preview of the message text (for text messages only).

#### Changes:
- **ChatNotificationService.js** updated to accept message text and type
- Email templates updated to show message preview
- **Important:** Attachments (images, PDFs, files) are NOT shown in email - only text messages

#### Email Template Updates:

**For Text Messages:**
```
💬 New Client Message

From Client: John Doe
Time: Oct 14, 2025 10:30 AM

Message Preview:
"Hi, I'd like to inquire about the excavator availability..."

[Login to View Message Button]
```

**For Attachments:**
```
💬 New Client Message

From Client: John Doe
Time: Oct 14, 2025 10:30 AM
Type: PDF Document

[Login to View Message Button]
```

#### Service Method Updated:
```javascript
sendChatNotification(
  fromUserId,
  toUserId,
  senderData,
  recipientData,
  sdk,
  messageText,     // NEW parameter
  messageType      // NEW parameter
)
```

#### Logic:
- If `message_type === 'text'`: Show first 200 characters of message in email
- If `message_type === 'image'|'pdf'|'file'`: Show "Type: Image/PDF/File Attachment" (no message text)
- This prevents large images or file content from being included in emails

---

## Database Migration Instructions

### Step 1: Run Migration SQL
Execute the migration file to add new fields:

```bash
mysql -u your_username -p your_database < migration_v2_features.sql
```

Or run manually:
```sql
-- Add unavailability_due_month to equipment
ALTER TABLE `longtermhire_equipment_item`
ADD COLUMN `unavailability_due_month` VARCHAR(50) NULL DEFAULT NULL
AFTER `availability`;

-- Add attachment fields to chat messages
ALTER TABLE `longtermhire_chat_messages`
ADD COLUMN `attachment_url` VARCHAR(512) NULL DEFAULT NULL,
ADD COLUMN `attachment_type` VARCHAR(100) NULL DEFAULT NULL,
ADD COLUMN `attachment_name` VARCHAR(255) NULL DEFAULT NULL,
ADD COLUMN `attachment_size` INT NULL DEFAULT NULL;

-- Add index for performance
ALTER TABLE `longtermhire_chat_messages`
ADD INDEX `idx_message_type` (`message_type`);
```

### Step 2: Verify Schema
Check that all fields were added successfully:
```sql
DESCRIBE longtermhire_equipment_item;
DESCRIBE longtermhire_chat_messages;
```

### Step 3: Restart Application
```bash
# Restart your Node.js application
pm2 restart longtermhire-backend
# or
npm restart
```

---

## Testing Checklist

### Equipment Unavailability Testing:
- [ ] Create new equipment with `unavailability_due_month`
- [ ] Update existing equipment to add `unavailability_due_month`
- [ ] Update existing equipment to clear `unavailability_due_month` (set to null)
- [ ] Verify client sees unavailability date in equipment list
- [ ] Verify unavailability date appears in equipment details

### Equipment Cross-Company Testing:
- [ ] Assign same equipment to multiple clients
- [ ] Verify each client can see the equipment
- [ ] Verify equipment updates reflect for all clients

### Chat File Upload Testing:
- [ ] Upload image file (jpg, png)
- [ ] Upload PDF file
- [ ] Upload other file types (docx, xlsx)
- [ ] Send message with image attachment
- [ ] Send message with PDF attachment
- [ ] Verify attachments appear in chat history
- [ ] Verify attachment files are accessible

### Email Notification Testing:
- [ ] Send text message - verify email includes message preview
- [ ] Send image message - verify email shows "Type: Image" (no message text)
- [ ] Send PDF message - verify email shows "Type: PDF Document" (no message text)
- [ ] Verify rate limiting still works (1 email per 24h for admin→client)
- [ ] Verify client→admin emails are not rate limited

### Backward Compatibility Testing:
- [ ] Verify existing equipment without `unavailability_due_month` still works
- [ ] Verify existing text messages still display correctly
- [ ] Verify existing equipment requests still work
- [ ] Verify all existing API endpoints return successfully

---

## Files Modified

### Database:
- ✅ `create_tables.sql` - Updated equipment table schema
- ✅ `models/chat_tables.sql` - Updated chat messages table
- ✅ `migration_v2_features.sql` - NEW migration file

### Routes:
- ✅ `routes/equipment.js` - Added `unavailability_due_month` support
- ✅ `routes/chat.js` - Added file upload endpoint and attachment support
- ✅ `routes/clientequipment.js` - No changes (automatically includes new field via JOIN)

### Services:
- ✅ `services/ChatNotificationService.js` - Added message text/type parameters

### Documentation:
- ✅ `V2_FEATURES_DOCUMENTATION.md` - This file

---

## API Endpoint Summary

| Endpoint | Method | Changes | Status |
|----------|--------|---------|--------|
| `/v1/api/longtermhire/super_admin/equipment` | POST | Added `unavailability_due_month` field | ✅ Updated |
| `/v1/api/longtermhire/super_admin/equipment/:id` | PUT | Added `unavailability_due_month` field | ✅ Updated |
| `/v1/api/longtermhire/super_admin/equipment` | GET | Returns `unavailability_due_month` | ✅ Updated |
| `/v1/api/longtermhire/client/equipment` | GET | Returns `unavailability_due_month` | ✅ Updated |
| `/v1/api/longtermhire/client/equipment/:id` | GET | Returns `unavailability_due_month` | ✅ Updated |
| `/v1/api/longtermhire/chat/upload` | POST | **NEW** - Upload files for chat | ✅ Created |
| `/v1/api/longtermhire/chat/send` | POST | Added attachment fields | ✅ Updated |
| `/v1/api/longtermhire/chat/messages/:conversationId` | GET | Returns attachment data | ✅ Updated |

---

## Backward Compatibility

### ✅ All v2 features are backward compatible:

1. **Equipment Fields:**
   - `unavailability_due_month` is NULL by default
   - Existing equipment continues to work without this field
   - Old API requests without this field still succeed

2. **Chat Messages:**
   - All attachment fields are NULL by default
   - Existing text messages work unchanged
   - `message_type` defaults to 'text' if not provided

3. **Email Notifications:**
   - Existing email functionality preserved
   - New parameters are optional (defaults: messageText=null, messageType='text')
   - If not provided, emails work as before (no message preview)

4. **Equipment Availability:**
   - No schema changes - existing functionality unchanged

---

## Rollback Instructions

If you need to rollback these changes:

```sql
-- Remove equipment unavailability field
ALTER TABLE `longtermhire_equipment_item`
DROP COLUMN `unavailability_due_month`;

-- Remove chat attachment fields
ALTER TABLE `longtermhire_chat_messages`
DROP COLUMN `attachment_url`,
DROP COLUMN `attachment_type`,
DROP COLUMN `attachment_name`,
DROP COLUMN `attachment_size`;

-- Remove index
ALTER TABLE `longtermhire_chat_messages`
DROP INDEX `idx_message_type`;
```

Then redeploy the previous version of the code.

---

## Security Considerations

### File Upload Security:
- ✅ Authentication required (TokenMiddleware)
- ✅ Role-based access control (super_admin, member only)
- ✅ Files uploaded to configured storage (S3 or local)
- ⚠️ **TODO:** Add file size limits (recommend max 10MB)
- ⚠️ **TODO:** Add file type validation/whitelist
- ⚠️ **TODO:** Add virus scanning for uploaded files

### Database Security:
- ✅ All queries use parameterized statements (SQL injection protected)
- ✅ New fields are properly typed and constrained
- ✅ Indexes added for performance

---

## Frontend Integration Guide

### 1. Equipment Unavailability Display:
```javascript
// When displaying equipment
if (!equipment.availability && equipment.unavailability_due_month) {
  displayText = `Available ${equipment.unavailability_due_month}`;
} else if (!equipment.availability) {
  displayText = "Unavailable";
} else {
  displayText = "Available";
}
```

### 2. Chat File Upload Flow:
```javascript
// Step 1: Upload file
const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/v1/api/longtermhire/chat/upload', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });

  return await response.json();
};

// Step 2: Send message with attachment
const sendMessageWithAttachment = async (toUserId, message, fileData) => {
  const response = await fetch('/v1/api/longtermhire/chat/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to_user_id: toUserId,
      message: message,
      message_type: fileData.type, // 'image', 'pdf', or 'file'
      attachment_url: fileData.url,
      attachment_type: fileData.mimetype,
      attachment_name: fileData.filename,
      attachment_size: fileData.size
    })
  });

  return await response.json();
};

// Complete flow
const handleFileSelect = async (file, toUserId, message) => {
  try {
    // Upload file first
    const uploadResult = await uploadFile(file);

    if (uploadResult.error) {
      console.error('Upload failed:', uploadResult.message);
      return;
    }

    // Send message with attachment
    const sendResult = await sendMessageWithAttachment(
      toUserId,
      message,
      uploadResult.data
    );

    if (sendResult.error) {
      console.error('Send failed:', sendResult.message);
      return;
    }

    console.log('Message sent successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### 3. Rendering Chat Messages:
```javascript
const renderMessage = (message) => {
  switch (message.message_type) {
    case 'text':
      return <TextMessage>{message.message}</TextMessage>;

    case 'image':
      return (
        <ImageMessage>
          <img src={message.attachment_url} alt={message.attachment_name} />
          <p>{message.message}</p>
        </ImageMessage>
      );

    case 'pdf':
      return (
        <PDFMessage>
          <PDFIcon />
          <a href={message.attachment_url} target="_blank">
            {message.attachment_name}
          </a>
          <p>{message.message}</p>
          <span>{formatFileSize(message.attachment_size)}</span>
        </PDFMessage>
      );

    case 'file':
      return (
        <FileMessage>
          <FileIcon />
          <a href={message.attachment_url} download>
            {message.attachment_name}
          </a>
          <p>{message.message}</p>
          <span>{formatFileSize(message.attachment_size)}</span>
        </FileMessage>
      );

    case 'equipment_request':
      return <EquipmentRequestMessage>{message.message}</EquipmentRequestMessage>;

    default:
      return <TextMessage>{message.message}</TextMessage>;
  }
};
```

---

## Support & Questions

For questions or issues with these v2 features, please contact the development team.

**Implementation Date:** October 14, 2025
**Developer:** Claude (AI Assistant)
**Approved By:** [Pending]

---

## Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-14 | 2.0 | Initial v2 features implementation | Claude |

---

**End of Documentation**
