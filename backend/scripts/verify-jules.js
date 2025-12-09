// import fetch from "node-fetch"; // Native fetch used

const BASE_URL = "http://localhost:3000/api/jules";

async function verifyJules() {
  console.log("🔍 Verifying Jules Integration...");

  // 1. Check Health
  try {
    console.log("Testing Health Check...");
    const healthRes = await fetch(`${BASE_URL}/health`);
    if (!healthRes.ok)
      throw new Error(`Health check failed: ${healthRes.statusText}`);
    const healthData = await healthRes.json();
    console.log("✅ Health Check Passed:", healthData);
  } catch (error) {
    console.error("❌ Health Check Failed:", error.message);
    process.exit(1);
  }

  // 2. Test Chat
  try {
    console.log("Testing Chat...");
    const chatRes = await fetch(`${BASE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Hello Jules, are you online?",
        context: { test: true },
      }),
    });

    if (!chatRes.ok) throw new Error(`Chat failed: ${chatRes.statusText}`);
    const chatData = await chatRes.json();
    console.log("✅ Chat Response Received:", chatData.response);
  } catch (error) {
    console.error("❌ Chat Failed:", error.message);
    process.exit(1);
  }

  console.log("🎉 Jules is successfully deployed and integrated!");
}

verifyJules();
