import dotenv from "dotenv";
import { spawn } from "child_process";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

async function testGemini() {
  console.log("Testing Gemini...");
  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY missing");
    return;
  }
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const result = await model.generateContent("Hello");
    console.log(
      "✅ Gemini Connected:",
      result.response.text().slice(0, 20) + "..."
    );
  } catch (e) {
    console.error("❌ Gemini Failed:", e.message);
  }
}

async function testPythonBridge() {
  console.log("Testing Python Bridge...");
  return new Promise((resolve) => {
    const p = spawn("python", ["--version"]);
    p.stdout.on("data", (d) =>
      console.log("✅ Python stdout:", d.toString().trim())
    );
    p.stderr.on("data", (d) =>
      console.log("Start python:", d.toString().trim())
    );
    p.on("close", (code) => {
      if (code === 0) console.log("✅ Python Bridge Operational");
      else console.error("❌ Python Bridge Failed with code", code);
      resolve();
    });
  });
}

async function testAgentLabImports() {
  console.log("Testing Agent Lab Imports...");
  return new Promise((resolve) => {
    // We are in backend/, so ai-researcher is ./ai-researcher
    const p = spawn(
      "python",
      ["-c", 'import openai; import flask; import pypdf2; print("Imports OK")'],
      {
        cwd: "./ai-researcher",
      }
    );
    p.stdout.on("data", (d) =>
      console.log("✅ Agent Lab Imports:", d.toString().trim())
    );
    p.stderr.on("data", (d) =>
      console.error("❌ Import Error:", d.toString().trim())
    );
    p.on("close", resolve);
  });
}

async function run() {
  await testGemini();
  await testPythonBridge();
  await testAgentLabImports();
}

run();
