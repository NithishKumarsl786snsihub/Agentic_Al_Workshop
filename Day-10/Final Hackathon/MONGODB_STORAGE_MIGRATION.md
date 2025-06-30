# MongoDB Storage Migration Guide

## Overview

This document outlines the migration from local file storage to MongoDB-only storage for the Voice-Based Website Customizer application. The changes ensure better scalability, security, and cloud compatibility.

## Changes Made

### 🔧 Backend Changes

#### 1. Updated Save Endpoint (`/save`)
- **Before**: Saved HTML files to local `user_files` directory
- **After**: Saves content to MongoDB using `storage_service`
- **Security**: Now requires authentication via `get_current_active_user`
- **Response**: Returns virtual path indicating MongoDB storage

#### 2. New Enhanced Save Endpoint (`/editor/save`)
- **Purpose**: Dedicated endpoint for editor saves with enhanced validation
- **Features**:
  - Input validation (empty content, size limits)
  - Project name sanitization
  - Comprehensive metadata storage
  - Error logging and monitoring
- **Security**: Full authentication and authorization
- **Scalability**: Designed for high-volume usage

#### 3. Updated Download Endpoint (`/download/{session_id}/{filename}`)
- **Before**: Served files directly from local filesystem
- **After**: Retrieves content from MongoDB and creates temporary files
- **Security**: Requires user authentication
- **Cleanup**: Automatic temporary file cleanup after download

#### 4. Session Manager Updates
- **Removed**: `save_html_file()`, `load_html_file()`, `list_session_files()`
- **Updated**: `get_session_stats()` and `cleanup_old_sessions()`
- **Focus**: In-memory session management only

#### 5. Storage Service Updates
- **Removed**: `_save_to_file_system()` method
- **Enhanced**: MongoDB-only storage with better error handling
- **Performance**: Optimized for database operations

### 🌐 Frontend Changes

#### 1. New API Interfaces
```typescript
interface EditorSaveRequest {
  session_id: string;
  html_content: string;
  project_name?: string;
  description?: string;
  auto_save?: boolean;
}

interface EditorSaveResponse {
  success: boolean;
  message: string;
  project_id: string;
  project_name: string;
  saved_at: string;
  version: number;
}
```

#### 2. Enhanced Save Functionality
- **Method**: `saveFromEditor()` in `ApiService`
- **Features**: Better error handling, user feedback
- **Security**: No database credentials exposed to frontend

#### 3. Updated Editor Page
- **Save Button**: Now uses MongoDB-based save
- **Save & Exit**: Enhanced with proper project naming
- **User Feedback**: Improved success/error messages

## Security Features

### 🔐 Authentication & Authorization
- All save/load operations require valid JWT token
- User-specific data isolation
- Session validation on every request

### 🛡️ Input Validation
- HTML content size limits (10MB max)
- Project name sanitization
- XSS prevention through proper encoding

### 📊 Monitoring & Logging
- Comprehensive operation logging
- Error tracking and debugging
- Performance metrics collection

## Database Schema

### Collections Used

#### `user_projects`
```javascript
{
  _id: ObjectId,
  project_id: String (UUID),
  user_id: String,
  session_id: String,
  project_name: String,
  description: String,
  html_content: String,
  css_content: String,
  js_content: String,
  metadata: Object,
  created_at: Date,
  last_modified: Date,
  version: Number,
  status: String,
  file_size: Number,
  tags: Array
}
```

#### Indexes
- `user_id + created_at` (compound, descending)
- `project_id` (unique)
- `session_id`

## Migration Benefits

### ✅ Scalability
- No local disk storage limitations
- Cloud-native architecture
- Horizontal scaling support

### ✅ Security
- Centralized access control
- Encrypted data at rest
- Audit trail capabilities

### ✅ Reliability
- Database backup and recovery
- Transaction support
- Data consistency guarantees

### ✅ Performance
- Optimized database queries
- Efficient data retrieval
- Reduced I/O operations

## Testing

### 🧪 Test Script
Run the included test script to verify functionality:

```bash
cd backend
python test_mongodb_save.py
```

### 🔍 Test Coverage
- Save operations
- Load operations
- Project listing
- Content verification
- Error handling

## Environment Variables

Ensure these are set in your backend environment:

```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=voice_website_generator
```

**Note**: These credentials are ONLY used in the backend. The frontend has no access to database credentials.

## API Endpoints Summary

### Updated Endpoints
- `POST /save` - MongoDB save with authentication
- `POST /editor/save` - Enhanced save with validation
- `GET /download/{session_id}/{filename}` - MongoDB-based download

### Existing Endpoints (Unchanged)
- `POST /projects/save` - Project management
- `POST /projects/load` - Project loading
- `GET /projects` - Project listing

## Error Handling

### Common Error Scenarios
1. **Authentication Failure**: 401 Unauthorized
2. **Content Too Large**: 400 Bad Request
3. **Database Connection**: 500 Internal Server Error
4. **Project Not Found**: 404 Not Found

### Error Response Format
```json
{
  "detail": "Error message",
  "status_code": 400
}
```

## Performance Considerations

### 🚀 Optimizations Implemented
- Connection pooling for MongoDB
- Efficient query patterns
- Proper indexing strategy
- Temporary file cleanup

### 📈 Monitoring Points
- Save operation latency
- Database connection health
- Memory usage patterns
- Error rates

## Future Enhancements

### 🔮 Planned Features
- Automatic backup scheduling
- Content versioning system
- Real-time collaboration
- Advanced search capabilities

## Troubleshooting

### Common Issues
1. **Save Fails**: Check MongoDB connection and authentication
2. **Download Issues**: Verify user permissions and project existence
3. **Performance**: Monitor database indexes and query performance

### Debug Commands
```bash
# Check MongoDB connection
python -c "from core.database import connect_to_mongo; import asyncio; asyncio.run(connect_to_mongo())"

# Test storage service
python test_mongodb_save.py

# Check logs
tail -f backend.log
```

## Conclusion

The migration to MongoDB-only storage provides a robust, scalable, and secure foundation for the Voice-Based Website Customizer. All local file dependencies have been removed, making the application cloud-ready and production-suitable.

For any issues or questions, refer to the troubleshooting section or check the application logs. 