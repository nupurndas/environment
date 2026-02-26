# TMS Developer Testing Guide

**Last Updated**: Thursday, 2026-02-26 15:57 UTC

---

## Quick Start

### Prerequisites
- Web browser (Chrome, Firefox, Safari, Edge)
- Terminal/Command line (for API testing)
- Internet connection

### Test Credentials
- **Username**: `admin`
- **Password**: `admin123`

---

## 1. Frontend Application Testing

### Access the Application
**URL**: http://ai-ops-alb-1019992774.us-west-2.elb.amazonaws.com

### Test Case 1: Login Flow
1. Open the application URL in your browser
2. You should see a login page with gradient background
3. Enter credentials:
   - Username: `admin`
   - Password: `admin123`
4. Click "Login" button
5. **Expected**: Redirects to timesheet page

**✅ Pass Criteria**: Successfully redirected to timesheet form

### Test Case 2: Create Timesheet Entry
1. After login, fill out the timesheet form:
   - **Date**: Select today's date
   - **Project**: Enter "TMS Development"
   - **Task**: Enter "Testing Application"
   - **Hours**: Enter "8"
   - **Description**: Enter "End-to-end testing"
2. Click "Insert" button
3. **Expected**: 
   - Green success message appears
   - Form clears
   - New entry appears in the table below

**✅ Pass Criteria**: Entry visible in timesheet list

### Test Case 3: View Timesheet List
1. Scroll down below the form
2. **Expected**: Table displays with columns:
   - Date
   - Project
   - Task
   - Hours
   - Description
3. Your newly created entry should be visible

**✅ Pass Criteria**: All entries display correctly with proper formatting

### Test Case 4: Generate PDF Report
1. Click "Get Timesheet Reports" button (between Insert and Logout)
2. **Expected**:
   - Modal overlay appears with dark background
   - PDF viewer displays in the center
   - PDF shows:
     - Header: "Timesheet Report"
     - User info: "Admin User (admin@example.com)"
     - Generated date
     - Table with all timesheet entries
     - Total hours at bottom
3. Verify PDF content is readable

**✅ Pass Criteria**: PDF displays correctly in modal

### Test Case 5: Download PDF Report
1. With PDF modal open, click "Download PDF" button
2. **Expected**:
   - PDF file downloads to your computer
   - Filename: `timesheet-report-1.pdf`
3. Open downloaded PDF
4. Verify content matches what was displayed in modal

**✅ Pass Criteria**: PDF downloads and opens successfully

### Test Case 6: Close PDF Modal
1. Click "Close" button in modal
2. **Expected**:
   - Modal disappears
   - Returns to timesheet page
   - Form and list still visible

**✅ Pass Criteria**: Modal closes cleanly

### Test Case 7: Logout
1. Click "Logout" button
2. **Expected**:
   - Redirects to login page
   - Cannot access timesheet page without logging in again

**✅ Pass Criteria**: Successfully logged out

---

## 2. API Testing

### Base URL
```
http://ai-ops-alb-1019992774.us-west-2.elb.amazonaws.com:3002
```

### Test Case 8: Get Users API

**Endpoint**: `GET /api/users`

**Using Browser**:
```
http://ai-ops-alb-1019992774.us-west-2.elb.amazonaws.com:3002/api/users
```

**Using curl**:
```bash
curl http://ai-ops-alb-1019992774.us-west-2.elb.amazonaws.com:3002/api/users
```

**Expected Response**:
```json
[
  {
    "Id": 1,
    "Uid": "admin",
    "Name": "Admin User",
    "Email": "admin@example.com"
  }
]
```

**✅ Pass Criteria**: Returns JSON array with user object

### Test Case 9: Get All Timesheet Entries

**Endpoint**: `GET /api/timesheet`

**Using Browser**:
```
http://ai-ops-alb-1019992774.us-west-2.elb.amazonaws.com:3002/api/timesheet
```

**Using curl**:
```bash
curl http://ai-ops-alb-1019992774.us-west-2.elb.amazonaws.com:3002/api/timesheet
```

**Expected Response**:
```json
[
  {
    "Id": 1,
    "UserId": 1,
    "Date": "2026-02-26",
    "Project": "TMS Development",
    "Task": "Testing Application",
    "Hours": "8.00",
    "Description": "End-to-end testing"
  }
]
```

**✅ Pass Criteria**: Returns JSON array with timesheet entries

### Test Case 10: Get Timesheet by User ID

**Endpoint**: `GET /api/timesheet?userId=1`

**Using Browser**:
```
http://ai-ops-alb-1019992774.us-west-2.elb.amazonaws.com:3002/api/timesheet?userId=1
```

**Using curl**:
```bash
curl "http://ai-ops-alb-1019992774.us-west-2.elb.amazonaws.com:3002/api/timesheet?userId=1"
```

**Expected Response**: Same as Test Case 9 (filtered by userId=1)

**✅ Pass Criteria**: Returns only entries for user ID 1

### Test Case 11: Get Timesheet by Date

**Endpoint**: `GET /api/timesheet?date=2026-02-26`

**Using Browser**:
```
http://ai-ops-alb-1019992774.us-west-2.elb.amazonaws.com:3002/api/timesheet?date=2026-02-26
```

**Using curl**:
```bash
curl "http://ai-ops-alb-1019992774.us-west-2.elb.amazonaws.com:3002/api/timesheet?date=2026-02-26"
```

**Expected Response**: Entries filtered by specified date

**✅ Pass Criteria**: Returns only entries for specified date

### Test Case 12: Generate PDF Report API

**Endpoint**: `GET /api/report?userId=1`

**Using Browser**:
```
http://ai-ops-alb-1019992774.us-west-2.elb.amazonaws.com:3002/api/report?userId=1
```

**Using curl** (download to file):
```bash
curl -o timesheet-report.pdf "http://ai-ops-alb-1019992774.us-west-2.elb.amazonaws.com:3002/api/report?userId=1"
```

**Expected Response**:
- Content-Type: `application/pdf`
- PDF file downloads
- Contains timesheet report for user

**✅ Pass Criteria**: PDF file downloads successfully

---

## 3. Error Testing

### Test Case 13: Invalid Login Credentials
1. Go to login page
2. Enter invalid credentials:
   - Username: `wronguser`
   - Password: `wrongpass`
3. Click "Login"
4. **Expected**: Error message displays

**✅ Pass Criteria**: Login fails with appropriate error

### Test Case 14: Empty Form Submission
1. Login successfully
2. Leave all form fields empty
3. Click "Insert"
4. **Expected**: Browser validation prevents submission

**✅ Pass Criteria**: Form validation works

### Test Case 15: API Error - Missing User ID
**Endpoint**: `GET /api/report` (without userId parameter)

**Using curl**:
```bash
curl "http://ai-ops-alb-1019992774.us-west-2.elb.amazonaws.com:3002/api/report"
```

**Expected Response**:
```json
{
  "error": "userId is required"
}
```

**✅ Pass Criteria**: Returns 400 error with message

### Test Case 16: API Error - Invalid User ID
**Endpoint**: `GET /api/report?userId=999`

**Using curl**:
```bash
curl "http://ai-ops-alb-1019992774.us-west-2.elb.amazonaws.com:3002/api/report?userId=999"
```

**Expected Response**:
```json
{
  "error": "User not found"
}
```

**✅ Pass Criteria**: Returns 404 error with message

---

## 4. Performance Testing

### Test Case 17: Page Load Time
1. Open browser developer tools (F12)
2. Go to Network tab
3. Load application URL
4. **Expected**: Page loads in < 3 seconds

**✅ Pass Criteria**: Acceptable load time

### Test Case 18: API Response Time
**Using curl with timing**:
```bash
curl -w "\nTime: %{time_total}s\n" http://ai-ops-alb-1019992774.us-west-2.elb.amazonaws.com:3002/api/users
```

**Expected**: Response time < 1 second

**✅ Pass Criteria**: Fast API response

### Test Case 19: PDF Generation Time
1. Click "Get Timesheet Reports"
2. Measure time until PDF displays
3. **Expected**: PDF appears in < 3 seconds

**✅ Pass Criteria**: Reasonable generation time

---

## 5. Browser Compatibility Testing

### Test Case 20: Cross-Browser Testing
Test the application in multiple browsers:

**Chrome**:
- [ ] Login works
- [ ] Form submission works
- [ ] PDF displays in modal
- [ ] PDF download works

**Firefox**:
- [ ] Login works
- [ ] Form submission works
- [ ] PDF displays in modal
- [ ] PDF download works

**Safari** (Mac only):
- [ ] Login works
- [ ] Form submission works
- [ ] PDF displays in modal
- [ ] PDF download works

**Edge**:
- [ ] Login works
- [ ] Form submission works
- [ ] PDF displays in modal
- [ ] PDF download works

**✅ Pass Criteria**: Works in all major browsers

---

## 6. Mobile Responsiveness Testing

### Test Case 21: Mobile View
1. Open application in browser
2. Open developer tools (F12)
3. Toggle device toolbar (Ctrl+Shift+M or Cmd+Shift+M)
4. Select mobile device (iPhone, Android)
5. Test all functionality:
   - [ ] Login page displays correctly
   - [ ] Form is usable on mobile
   - [ ] Buttons are tappable
   - [ ] Table scrolls horizontally if needed
   - [ ] PDF modal fits screen

**✅ Pass Criteria**: Usable on mobile devices

---

## 7. Data Validation Testing

### Test Case 22: Date Field Validation
1. Login to application
2. Try entering future dates
3. Try entering past dates
4. **Expected**: All valid dates accepted

**✅ Pass Criteria**: Date picker works correctly

### Test Case 23: Hours Field Validation
1. Try entering negative hours: `-5`
2. **Expected**: Browser validation prevents negative values
3. Try entering decimal hours: `7.5`
4. **Expected**: Decimal values accepted

**✅ Pass Criteria**: Hours validation works

### Test Case 24: Text Field Length
1. Enter very long text in Description field (>500 characters)
2. Submit form
3. **Expected**: Text is saved and displayed correctly

**✅ Pass Criteria**: Long text handled properly

---

## 8. Integration Testing

### Test Case 25: End-to-End Workflow
Complete workflow from start to finish:

1. [ ] Open application
2. [ ] Login with admin/admin123
3. [ ] Create 3 different timesheet entries
4. [ ] Verify all 3 entries appear in list
5. [ ] Generate PDF report
6. [ ] Verify PDF contains all 3 entries
7. [ ] Verify total hours is correct
8. [ ] Download PDF
9. [ ] Close modal
10. [ ] Logout
11. [ ] Verify cannot access timesheet without login

**✅ Pass Criteria**: Complete workflow works seamlessly

---

## 9. Database Testing

### Test Case 26: Data Persistence
1. Create a timesheet entry
2. Logout
3. Login again
4. **Expected**: Previously created entry still visible

**✅ Pass Criteria**: Data persists across sessions

### Test Case 27: Multiple Entries
1. Create 10 timesheet entries with different data
2. Verify all entries appear in list
3. Generate PDF report
4. **Expected**: All 10 entries in PDF

**✅ Pass Criteria**: Handles multiple entries correctly

---

## 10. Security Testing

### Test Case 28: Authentication Required
1. Try accessing timesheet page directly without login:
   ```
   http://ai-ops-alb-1019992774.us-west-2.elb.amazonaws.com/timesheet
   ```
2. **Expected**: Redirects to login page

**✅ Pass Criteria**: Protected routes require authentication

### Test Case 29: Session Management
1. Login to application
2. Close browser tab
3. Open new tab and navigate to application
4. **Expected**: May need to login again (depending on session timeout)

**✅ Pass Criteria**: Session handling works correctly

---

## Testing Checklist Summary

### Frontend Tests
- [ ] Test Case 1: Login Flow
- [ ] Test Case 2: Create Timesheet Entry
- [ ] Test Case 3: View Timesheet List
- [ ] Test Case 4: Generate PDF Report
- [ ] Test Case 5: Download PDF Report
- [ ] Test Case 6: Close PDF Modal
- [ ] Test Case 7: Logout

### API Tests
- [ ] Test Case 8: Get Users API
- [ ] Test Case 9: Get All Timesheet Entries
- [ ] Test Case 10: Get Timesheet by User ID
- [ ] Test Case 11: Get Timesheet by Date
- [ ] Test Case 12: Generate PDF Report API

### Error Tests
- [ ] Test Case 13: Invalid Login Credentials
- [ ] Test Case 14: Empty Form Submission
- [ ] Test Case 15: API Error - Missing User ID
- [ ] Test Case 16: API Error - Invalid User ID

### Performance Tests
- [ ] Test Case 17: Page Load Time
- [ ] Test Case 18: API Response Time
- [ ] Test Case 19: PDF Generation Time

### Compatibility Tests
- [ ] Test Case 20: Cross-Browser Testing
- [ ] Test Case 21: Mobile Responsiveness

### Validation Tests
- [ ] Test Case 22: Date Field Validation
- [ ] Test Case 23: Hours Field Validation
- [ ] Test Case 24: Text Field Length

### Integration Tests
- [ ] Test Case 25: End-to-End Workflow
- [ ] Test Case 26: Data Persistence
- [ ] Test Case 27: Multiple Entries

### Security Tests
- [ ] Test Case 28: Authentication Required
- [ ] Test Case 29: Session Management

---

## Troubleshooting

### Issue: Application Not Loading
**Solution**: 
- Check internet connection
- Verify URL is correct
- Try clearing browser cache
- Check if ECS tasks are running

### Issue: Login Fails
**Solution**:
- Verify credentials: `admin` / `admin123`
- Check browser console for errors (F12)
- Ensure cookies are enabled

### Issue: PDF Not Displaying
**Solution**:
- Check browser PDF viewer settings
- Try different browser
- Check browser console for errors
- Verify pop-up blocker is disabled

### Issue: API Returns Error
**Solution**:
- Check API endpoint URL
- Verify query parameters are correct
- Check network tab in browser developer tools
- Verify ECS services are running

---

## Quick Test Commands

### Test All API Endpoints
```bash
# Test users
curl http://ai-ops-alb-1019992774.us-west-2.elb.amazonaws.com:3002/api/users

# Test timesheet
curl http://ai-ops-alb-1019992774.us-west-2.elb.amazonaws.com:3002/api/timesheet

# Test timesheet with filter
curl "http://ai-ops-alb-1019992774.us-west-2.elb.amazonaws.com:3002/api/timesheet?userId=1"

# Download PDF report
curl -o report.pdf "http://ai-ops-alb-1019992774.us-west-2.elb.amazonaws.com:3002/api/report?userId=1"
```

### Check Service Health
```bash
# Check ECS services
aws ecs describe-services --cluster ecs-workshop --services ai-ops-frontend-ecs ai-ops-nextjs-ecs --region us-west-2

# Check RDS status
aws rds describe-db-instances --db-instance-identifier tms-postgres-db --region us-west-2 --query 'DBInstances[0].DBInstanceStatus'
```

---

## Test Report Template

```
Test Date: _______________
Tester Name: _______________
Browser: _______________
OS: _______________

Frontend Tests: ___/7 Passed
API Tests: ___/5 Passed
Error Tests: ___/4 Passed
Performance Tests: ___/3 Passed
Compatibility Tests: ___/2 Passed
Validation Tests: ___/3 Passed
Integration Tests: ___/3 Passed
Security Tests: ___/2 Passed

Total: ___/29 Passed

Issues Found:
1. _______________
2. _______________
3. _______________

Notes:
_______________
_______________
_______________
```

---

**End of Testing Guide**

For issues or questions, refer to TMS_DEPLOYMENT_SUMMARY.md
