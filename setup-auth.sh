#!/bin/bash

echo "================================"
echo "Jury AI - Authentication Setup"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "jury-ai-app" ]; then
    echo -e "${RED}Error: Please run this script from the JURY-AI-main directory${NC}"
    exit 1
fi

echo "Step 1: Checking Backend Setup..."
echo "--------------------------------"

cd jury-ai-app/backend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    npm install
else
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Warning: .env file not found. Creating from .env.example...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${YELLOW}Please edit backend/.env with your configuration${NC}"
    else
        echo -e "${RED}Error: .env.example not found${NC}"
    fi
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

# Check for required env variables
if grep -q "JWT_SECRET=your-super-secret" .env 2>/dev/null; then
    echo -e "${YELLOW}⚠ Warning: Please change the JWT_SECRET in backend/.env${NC}"
else
    echo -e "${GREEN}✓ JWT_SECRET appears to be configured${NC}"
fi

# Build backend
echo -e "${YELLOW}Building backend...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend built successfully${NC}"
else
    echo -e "${RED}✗ Backend build failed${NC}"
    exit 1
fi

cd ../..

echo ""
echo "Step 2: Checking Frontend Setup..."
echo "--------------------------------"

cd jury-ai-app/frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
else
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating frontend .env file...${NC}"
    echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
    echo -e "${GREEN}✓ Created .env with default API URL${NC}"
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

cd ../..

echo ""
echo "Step 3: MongoDB Check..."
echo "--------------------------------"

# Try to check if MongoDB is running
if command -v mongosh &> /dev/null; then
    if mongosh --eval "db.version()" --quiet &> /dev/null; then
        echo -e "${GREEN}✓ MongoDB is running${NC}"
    else
        echo -e "${RED}✗ MongoDB is not running${NC}"
        echo -e "${YELLOW}Please start MongoDB before running the application${NC}"
    fi
elif command -v mongo &> /dev/null; then
    if mongo --eval "db.version()" --quiet &> /dev/null; then
        echo -e "${GREEN}✓ MongoDB is running${NC}"
    else
        echo -e "${RED}✗ MongoDB is not running${NC}"
        echo -e "${YELLOW}Please start MongoDB before running the application${NC}"
    fi
else
    echo -e "${YELLOW}⚠ MongoDB client not found. Cannot verify if MongoDB is running${NC}"
    echo -e "${YELLOW}Please make sure MongoDB is installed and running${NC}"
fi

echo ""
echo "================================"
echo "Setup Complete!"
echo "================================"
echo ""
echo -e "${GREEN}Authentication system is ready to use!${NC}"
echo ""
echo "Next steps:"
echo "1. Make sure MongoDB is running"
echo "2. Start the backend:"
echo -e "   ${YELLOW}cd jury-ai-app/backend && npm run dev${NC}"
echo ""
echo "3. In a new terminal, start the frontend:"
echo -e "   ${YELLOW}cd jury-ai-app/frontend && npm start${NC}"
echo ""
echo "4. Open http://localhost:3000 in your browser"
echo "5. Click 'Register' to create a new account"
echo ""
echo "For more information, see:"
echo "  - AUTHENTICATION_GUIDE.md"
echo "  - QUICK_START_AUTH.md"
echo ""
