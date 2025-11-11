# Project Cleanup Plan

## Files to DELETE (Redundant Documentation)

### Duplicate/Redundant MongoDB Documentation:
- ❌ MONGODB_SETUP_GUIDE.md (redundant with MONGODB_COMPLETE_SETUP.md)
- ❌ MONGODB_SETUP_SUMMARY.md (redundant)
- ❌ README_MONGODB.md (redundant)
- ❌ MONGODB_QUICK_REFERENCE.md (redundant)
- ✅ KEEP: MONGODB_ARCHITECTURE.md (useful schema reference)
- ✅ KEEP: MONGODB_COMPLETE_SETUP.md (comprehensive guide)

### Redundant Setup/Bug Documentation:
- ❌ BUG_REPORT_AND_FIX.md (historical, bugs are fixed)
- ❌ SETUP_COMPLETE_SUMMARY.md (redundant)
- ❌ RUNNING_APP_GUIDE.md (redundant with HOW_TO_START.md)
- ❌ FIX_CONNECTION_ERROR.md (historical, issues fixed)
- ✅ KEEP: HOW_TO_START.md (main startup guide)

### Redundant UI Documentation:
- ❌ TEST_UI_IMPROVEMENTS.md (testing done)
- ❌ UI_FORMAT_COMPARISON.md (informational, no longer needed)
- ❌ UI_IMPROVEMENTS_FINAL_SUMMARY.md (redundant)
- ❌ TEXT_ALIGNMENT_FIX.md (issue fixed)
- ✅ KEEP: UI_IMPROVEMENTS.md (concise technical reference)

### Quick Reference Files:
- ❌ QUICK_REFERENCE.txt (redundant with HOW_TO_START.md)
- ❌ FINAL_STATUS_REPORT.txt (outdated)

### Log and PID Files (Runtime artifacts):
- ❌ backend.log (runtime artifact)
- ❌ backend.pid (runtime artifact)
- ❌ fastapi.log (runtime artifact)
- ❌ fastapi.pid (runtime artifact)

### Scripts:
- ❌ quick-setup-mongodb.sh (one-time use, setup done)
- ✅ KEEP: setup-mongodb.js (useful for database reset)
- ✅ KEEP: test-e2e.sh (useful for testing)

### Other:
- ❌ TODO.md (if empty or completed)

## Files to KEEP (Essential)

### Documentation:
- ✅ HOW_TO_START.md (main startup guide)
- ✅ UI_IMPROVEMENTS.md (technical reference)
- ✅ MONGODB_ARCHITECTURE.md (schema reference)
- ✅ MONGODB_COMPLETE_SETUP.md (comprehensive MongoDB guide)

### Scripts:
- ✅ setup-mongodb.js (database initialization)
- ✅ test-e2e.sh (end-to-end testing)
- ✅ chatbot-backend/start.sh (if exists)
- ✅ jury-ai-app/start-app.sh (if exists)

### Code:
- ✅ All Python code in chatbot-backend/
- ✅ All TypeScript/JavaScript code in jury-ai-app/

## Summary
Total files to delete: ~19 files
Total files to keep: ~4 documentation files + essential scripts + all code
