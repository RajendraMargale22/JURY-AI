const http = require('http');

async function testApis() {
  console.log("🧪 Starting API Tests...\n");

  // 1. Test Login
  try {
    const loginData = JSON.stringify({ email: "adityajare2004@gmail.com", password: "Aditya@2004" });
    const loginRes = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Origin": "http://localhost:3000" // Required to bypass CSRF check
      },
      body: loginData
    });
    const loginResult = await loginRes.json();
    console.log("🔑 Login API: " + (loginRes.ok ? "✅ SUCCESS" : "❌ FAILED"));
    if (loginRes.ok) {
      console.log(`   User: ${loginResult.user.email} (Role: ${loginResult.user.role})`);
      console.log(`   Token received: ${loginResult.token ? "Yes" : "No"}`);
    } else {
      console.log(`   Error: ${JSON.stringify(loginResult)}`);
    }
  } catch (e) {
    console.log("🔑 Login API: ❌ ERROR", e.message);
  }

  console.log("\n-----------------------------------\n");

  // 2. Test Contract Review
  try {
    const formData = new FormData();
    formData.append("contract_text", "This Employment Agreement (the 'Agreement') is made and entered into as of this day. The Employee shall work for 40 hours a week. The Employee shall not disclose any confidential information.");
    
    const crRes = await fetch("http://localhost:8001/contract-review/analyze", {
      method: "POST",
      headers: {
        "X-API-Key": "wnrgargg7ag9e9geergerig8ugy74th384t7w8efbw8f7e4t" // Required by Contract Review API
      },
      body: formData
    });
    const crResult = await crRes.json();
    console.log("📄 Contract Review API: " + (crRes.ok ? "✅ SUCCESS" : "❌ FAILED"));
    if (crRes.ok) {
      console.log(`   Risk Level: ${crResult.risk_level}`);
      console.log(`   Risk Score: ${crResult.risk_score}`);
      console.log(`   High Risk Clauses: ${crResult.high_risk_clauses}`);
      console.log(`   Summary: ${crResult.summary}`);
    } else {
      console.log(`   Error: ${JSON.stringify(crResult)}`);
    }
  } catch (e) {
    console.log("📄 Contract Review API: ❌ ERROR", e.message);
  }

  console.log("\n-----------------------------------\n");

  // 3. Test Chatbot API
  try {
    const chatData = new FormData();
    chatData.append("question", "what is marriage law?");
    chatData.append("user_id", "test_user_admin");
    
    const chatRes = await fetch("http://localhost:8000/ask/", {
      method: "POST",
      body: chatData
    });
    const chatResult = await chatRes.json();
    console.log("🤖 Chatbot API: " + (chatRes.ok ? "✅ SUCCESS" : "❌ FAILED"));
    if (chatRes.ok) {
      console.log(`   Answer snippet: ${chatResult.data?.answer?.substring(0, 100)}...`);
      console.log(`   Processing Time: ${chatResult.data?.processingMs}ms`);
    } else {
      console.log(`   Error: ${JSON.stringify(chatResult)}`);
    }
  } catch (e) {
    console.log("🤖 Chatbot API: ❌ ERROR", e.message);
  }
}

testApis();
