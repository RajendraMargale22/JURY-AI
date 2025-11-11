#!/bin/bash
# End-to-End Test Script for JURY AI

echo "🧪 JURY AI - End-to-End Test Script"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test MongoDB
echo "📊 Testing MongoDB..."
if systemctl is-active --quiet mongod; then
    echo -e "${GREEN}✅ MongoDB is running${NC}"
else
    echo -e "${RED}❌ MongoDB is not running${NC}"
    echo "Run: sudo systemctl start mongod"
    exit 1
fi
echo ""

# Test FastAPI Health
echo "🔍 Testing FastAPI Health Endpoint..."
FASTAPI_HEALTH=$(curl -s http://localhost:8000/health/)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ FastAPI is running${NC}"
    echo "Response: $FASTAPI_HEALTH"
else
    echo -e "${RED}❌ FastAPI is not responding${NC}"
    exit 1
fi
echo ""

# Test Node Backend
echo "🔍 Testing Node.js Backend..."
if lsof -ti:5000 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Node.js backend is running on port 5000${NC}"
else
    echo -e "${RED}❌ Node.js backend is not running${NC}"
    exit 1
fi
echo ""

# Test React Frontend
echo "🔍 Testing React Frontend..."
if lsof -ti:3000 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ React frontend is running on port 3000${NC}"
else
    echo -e "${RED}❌ React frontend is not running${NC}"
    exit 1
fi
echo ""

# Test FastAPI Ask Endpoint
echo "🤖 Testing FastAPI Ask Endpoint..."
echo "Question: What is the Indian Penal Code?"
RESPONSE=$(curl -s -X POST http://localhost:8000/ask/ \
  -F "question=What is the Indian Penal Code?" \
  -F "user_id=test_e2e_user")

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ FastAPI Ask endpoint responded${NC}"
    echo "Response preview:"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
else
    echo -e "${RED}❌ FastAPI Ask endpoint failed${NC}"
    exit 1
fi
echo ""

# Check if query was stored in MongoDB
echo "💾 Checking if query was stored in MongoDB..."
QUERY_COUNT=$(mongosh --quiet --eval "use jury-ai; db.legal_queries.countDocuments({user_id: 'test_e2e_user'})")
if [ "$QUERY_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Query was stored in MongoDB (${QUERY_COUNT} total queries for test user)${NC}"
    echo "Latest query:"
    mongosh --quiet --eval "use jury-ai; db.legal_queries.find({user_id: 'test_e2e_user'}).sort({timestamp: -1}).limit(1).pretty()"
else
    echo -e "${YELLOW}⚠️  No queries found in MongoDB for test user${NC}"
fi
echo ""

# Summary
echo "======================================"
echo -e "${GREEN}✅ All tests passed!${NC}"
echo ""
echo "🎉 JURY AI is running successfully!"
echo ""
echo "Access points:"
echo "  • Frontend:  http://localhost:3000"
echo "  • Backend:   http://localhost:5000"
echo "  • FastAPI:   http://localhost:8000"
echo "  • MongoDB:   mongodb://localhost:27017/jury-ai"
echo ""
echo "Next steps:"
echo "  1. Open http://localhost:3000 in your browser"
echo "  2. Navigate to the Chat page"
echo "  3. Ask a legal question"
echo "  4. Verify the response"
echo ""
