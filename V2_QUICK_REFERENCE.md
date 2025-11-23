# V2 Features - Quick Reference Guide

## 🚀 Quick Start

### 1. Run Database Migration
```bash
cd mtpbk/custom/longtermhire_backend
mysql -u username -p database_name < migration_v2_features.sql
```

### 2. Verify Changes
```sql
DESCRIBE longtermhire_equipment_item;  -- Should see unavailability_due_month
DESCRIBE longtermhire_chat_messages;   -- Should see attachment_* fields
```

### 3. Restart Application
```bash
pm2 restart longtermhire-backend
```

---

## 📋 New API Endpoints

### Upload Chat File
```http
POST /v1/api/longtermhire/chat/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [binary file data]

Response:
{
  "error": false,
  "data": {
    "url": "https://...",
    "type": "image|pdf|file",
    "mimetype": "image/jpeg",
    "size": 1024567,
    "filename": "document.pdf"
  }
}
```

---

## 🔧 Updated API Endpoints

### Create/Update Equipment (Now with unavailability_due_month)
```http
POST /v1/api/longtermhire/super_admin/equipment
PUT /v1/api/longtermhire/super_admin/equipment/:id

New Field:
{
  "unavailability_due_month": "January 2026"  // Optional, can be null
}
```

### Send Chat Message (Now with attachments)
```http
POST /v1/api/longtermhire/chat/send

New Fields:
{
  "to_user_id": 123,
  "message": "Check this out",
  "message_type": "pdf",              // NEW: text|image|pdf|file
  "attachment_url": "https://...",    // NEW
  "attachment_type": "application/pdf", // NEW
  "attachment_name": "report.pdf",    // NEW
  "attachment_size": 1024567          // NEW
}
```

---

## 📊 Database Schema Changes

### longtermhire_equipment_item
```sql
unavailability_due_month VARCHAR(50) NULL  -- e.g., "January 2026"
```

### longtermhire_chat_messages
```sql
attachment_url VARCHAR(512) NULL           -- File URL
attachment_type VARCHAR(100) NULL          -- MIME type
attachment_name VARCHAR(255) NULL          -- Original filename
attachment_size INT NULL                   -- File size in bytes
message_type ENUM('text', 'equipment_request', 'system', 'image', 'pdf', 'file')
INDEX idx_message_type (message_type)     -- New index
```

---

## 💻 Code Examples

### Frontend: Upload and Send File
```javascript
// 1. Upload file
const formData = new FormData();
formData.append('file', file);

const uploadRes = await fetch('/v1/api/longtermhire/chat/upload', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
const { data } = await uploadRes.json();

// 2. Send message with attachment
await fetch('/v1/api/longtermhire/chat/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to_user_id: toUserId,
    message: "Check this out",
    message_type: data.type,
    attachment_url: data.url,
    attachment_type: data.mimetype,
    attachment_name: data.filename,
    attachment_size: data.size
  })
});
```

### Frontend: Display Equipment Unavailability
```javascript
const getAvailabilityText = (equipment) => {
  if (!equipment.availability) {
    if (equipment.unavailability_due_month) {
      return `Available ${equipment.unavailability_due_month}`;
    }
    return "Unavailable";
  }
  return "Available";
};
```

### Frontend: Render Chat Messages
```javascript
const renderMessage = (msg) => {
  switch (msg.message_type) {
    case 'text':
      return <p>{msg.message}</p>;

    case 'image':
      return <img src={msg.attachment_url} alt={msg.attachment_name} />;

    case 'pdf':
      return (
        <a href={msg.attachment_url} target="_blank">
          📄 {msg.attachment_name} ({formatSize(msg.attachment_size)})
        </a>
      );

    case 'file':
      return (
        <a href={msg.attachment_url} download>
          📎 {msg.attachment_name} ({formatSize(msg.attachment_size)})
        </a>
      );
  }
};
```

---

## 📧 Email Notification Behavior

### Text Messages
```
Subject: New Message from John Doe

Message Preview:
"Hi, I'd like to inquire about equipment..."

[Login to View Message]
```

### Attachments (Image/PDF/File)
```
Subject: New Message from John Doe

Type: PDF Document
(No message preview shown)

[Login to View Message]
```

---

## ✅ Testing Commands

### Test Equipment Unavailability
```bash
# Create equipment with unavailability
curl -X POST http://localhost:3000/v1/api/longtermhire/super_admin/equipment \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "categoryId": "CAT001",
    "category": "Excavators",
    "equipmentId": "EQ001",
    "equipmentName": "Excavator 320",
    "basePrice": "5000",
    "minimumDuration": "3",
    "availability": false,
    "unavailability_due_month": "February 2026"
  }'
```

### Test File Upload
```bash
# Upload file
curl -X POST http://localhost:3000/v1/api/longtermhire/chat/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/document.pdf"
```

### Test Send Message with Attachment
```bash
curl -X POST http://localhost:3000/v1/api/longtermhire/chat/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to_user_id": 123,
    "message": "Check this document",
    "message_type": "pdf",
    "attachment_url": "https://...",
    "attachment_type": "application/pdf",
    "attachment_name": "report.pdf",
    "attachment_size": 1024567
  }'
```

---

## 🐛 Troubleshooting

### Issue: File upload fails
**Check:**
- File size limits in configuration
- Upload directory permissions (if local storage)
- S3 credentials (if S3 storage)
- `upload_type` in config

### Issue: Attachment not showing in chat
**Check:**
- `message_type` is set correctly
- `attachment_url` is valid
- Database has attachment fields
- Frontend is rendering attachment types

### Issue: Email not showing message text
**Check:**
- `message_type === 'text'` (only text messages show preview)
- Message text is being passed to ChatNotificationService
- Email template includes message preview section

### Issue: Equipment unavailability not showing
**Check:**
- Database migration ran successfully
- `unavailability_due_month` field exists
- Equipment has `availability = false`
- Frontend is checking for unavailability_due_month field

---

## 📁 Important File Locations

### Backend Files:
- Routes: `mtpbk/custom/longtermhire_backend/routes/`
- Services: `mtpbk/custom/longtermhire_backend/services/`
- Models: `mtpbk/custom/longtermhire_backend/models/`
- Migration: `mtpbk/custom/longtermhire_backend/migration_v2_features.sql`

### Documentation:
- Full Docs: `V2_FEATURES_DOCUMENTATION.md`
- Summary: `V2_IMPLEMENTATION_SUMMARY.md`
- Quick Ref: `V2_QUICK_REFERENCE.md` (this file)

---

## 🔐 Security Notes

### File Upload Security:
- ✅ Authentication required
- ✅ Role-based access (super_admin, member only)
- ⚠️ Consider adding: File size limits, file type whitelist, virus scanning

### API Security:
- ✅ All endpoints use TokenMiddleware
- ✅ SQL injection protected (parameterized queries)
- ✅ Role-based access control enforced

---

## 📞 Support

### Common Questions:

**Q: Do I need to update frontend?**
A: Yes, to use new features. But existing functionality works without changes.

**Q: Will this break existing messages?**
A: No, all changes are backward compatible.

**Q: Can I rollback if needed?**
A: Yes, rollback SQL provided in migration_v2_features.sql (at bottom)

**Q: What file types are supported?**
A: Any file type your upload configuration allows. Common: images, PDFs, docs.

**Q: Do emails show images/PDFs?**
A: No, only text messages show previews. Attachments show "Type: Image/PDF" only.

---

## 🎯 Key Points to Remember

1. ✅ All features are **backward compatible**
2. ✅ Existing logic is **untouched**
3. ✅ Database migration is **required**
4. ✅ New fields are **optional** (NULL by default)
5. ✅ Email notifications **exclude** image/PDF content (as requested)
6. ✅ Equipment availability across companies **already works** (no changes needed)

---

**Quick Reference v2.0**
**Last Updated:** October 14, 2025
