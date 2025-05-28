# Session Management Configuration

## Overview
This document outlines the session management configuration for the QR code based menu ordering and restaurant/hotel management SaaS platform.

## Current Configuration

### Token Expiry Settings
- **Access Token**: 30 minutes (`JWT_EXPIRATION=30m`)
- **Refresh Token**: 30 days (`JWT_REFRESH_EXPIRATION=30d`)
- **Session Expiry**: 30 days (`SESSION_EXPIRATION=30d`)

### Session Management Settings
- **Session Renewal Threshold**: 7 days (`SESSION_RENEWAL_THRESHOLD=7d`)
- **Inactivity Timeout**: 4 hours (`SESSION_INACTIVITY_TIMEOUT=4h`)
- **Cleanup Interval**: 1 hour (`SESSION_CLEANUP_INTERVAL=1h`)

## Environment Variables

### JWT Configuration
```env
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRATION=30m
JWT_REFRESH_SECRET=your-jwt-refresh-secret-key
JWT_REFRESH_EXPIRATION=30d
JWT_RESET_SECRET=your-jwt-reset-secret-key
```

### Session Management
```env
SESSION_EXPIRATION=30d
SESSION_RENEWAL_THRESHOLD=7d
SESSION_INACTIVITY_TIMEOUT=4h
SESSION_CLEANUP_INTERVAL=1h
```

## Security Features

### Three-Tier Authentication System
1. **Access Tokens**: Short-lived (30 minutes) for API requests
2. **Refresh Tokens**: Medium-lived (30 days) for token renewal
3. **Sessions**: Long-lived (30 days) with sliding expiration

### Session Management
- **Device Tracking**: Each session tracks device information
- **Sliding Sessions**: Sessions auto-renew when within 7 days of expiry
- **Inactivity Timeout**: Sessions marked as revoked after 4 hours of inactivity
- **Automatic Cleanup**: Expired sessions cleaned up every hour

### Security Benefits for SaaS Platform
- **Restaurant Staff**: Can stay logged in for extended periods
- **Customers**: Secure QR code ordering with automatic logout
- **Multi-device Support**: Users can be logged in on multiple devices
- **Session Revocation**: Individual or all sessions can be revoked

## Recommended Settings by User Type

### Restaurant Owners/Managers
- Current settings are optimal for management tasks
- 30-day sessions allow for continuous access
- 4-hour inactivity timeout for security

### Restaurant Staff
- Current settings work well for daily operations
- Access tokens refresh automatically
- Sessions persist across shifts

### Customers (QR Code Orders)
- Consider shorter sessions for public devices
- Current 4-hour inactivity timeout is appropriate
- 30-minute access tokens provide good security

## Customization Options

### For Higher Security Environments
```env
JWT_EXPIRATION=15m
SESSION_INACTIVITY_TIMEOUT=2h
SESSION_RENEWAL_THRESHOLD=3d
```

### For Better User Experience
```env
JWT_EXPIRATION=1h
SESSION_INACTIVITY_TIMEOUT=8h
SESSION_RENEWAL_THRESHOLD=14d
```

## Implementation Details

### Configurable Components
- All hardcoded values have been removed
- Session cleanup uses configurable timeouts
- Token renewal thresholds are environment-driven
- Fallback values match production recommendations

### Monitoring and Logging
- Session creation and renewal are logged
- Cleanup tasks report statistics
- Failed authentication attempts are tracked
- Device information is captured for security

## Best Practices

1. **Production Secrets**: Use strong, unique JWT secrets
2. **HTTPS Only**: Always use HTTPS in production
3. **Regular Monitoring**: Monitor session cleanup logs
4. **Security Audits**: Regularly review active sessions
5. **Rate Limiting**: Implement rate limiting for auth endpoints

## Migration Notes

### From Previous Configuration
- Access token expiry reduced from 1h to 30m
- Refresh token expiry increased from 7d to 30d
- All hardcoded values replaced with environment variables
- Session cleanup now uses configurable timeouts

### Backward Compatibility
- Existing sessions will continue to work
- New sessions will use updated configuration
- No breaking changes to API endpoints
