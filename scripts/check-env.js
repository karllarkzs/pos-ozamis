#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🔍 OCT POS Environment Check\n");

const envPath = path.join(__dirname, "..", ".env");
const templatePath = path.join(__dirname, "..", "env.template");

console.log("📁 Checking environment files...");

if (!fs.existsSync(envPath)) {
  console.log("❌ .env file not found");
  if (fs.existsSync(templatePath)) {
    console.log("💡 Found env.template - run: cp env.template .env");
  }
  process.exit(1);
} else {
  console.log("✅ .env file found");
}

dotenv.config({ path: envPath });

console.log("\n🔧 Environment Variables:");

const requiredVars = [
  "VITE_API_URL",
  "VITE_NODE_ENV",
  "VITE_APP_NAME",
  "VITE_APP_VERSION",
];

const optionalVars = ["VITE_DEBUG", "VITE_ENABLE_DEVTOOLS"];

let hasErrors = false;

requiredVars.forEach((varName) => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: Missing (required)`);
    hasErrors = true;
  } else {
    console.log(`✅ ${varName}: ${value}`);
  }
});

optionalVars.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    console.log(`ℹ️  ${varName}: ${value}`);
  } else {
    console.log(`⚪ ${varName}: Not set (optional)`);
  }
});

const apiUrl = process.env.VITE_API_URL;
if (apiUrl) {
  console.log("\n🌐 API Configuration:");

  try {
    const url = new URL(apiUrl);
    console.log(`✅ Protocol: ${url.protocol}`);
    console.log(
      `✅ Host: ${url.hostname}:${
        url.port || (url.protocol === "https:" ? "443" : "80")
      }`
    );
    console.log(`✅ Path: ${url.pathname}`);

    if (url.protocol === "http:" && !url.hostname.includes("localhost")) {
      console.log("⚠️  Warning: Using HTTP in production is not recommended");
    }
  } catch (error) {
    console.log(`❌ Invalid API URL format: ${apiUrl}`);
    hasErrors = true;
  }
}

console.log("\n📦 Build Information:");

const distPath = path.join(__dirname, "..", "dist");
if (fs.existsSync(distPath)) {
  console.log("✅ Built successfully (dist/ folder exists)");
} else {
  console.log("⚪ Not built yet (run: yarn build)");
}

console.log("\n" + "=".repeat(50));
if (hasErrors) {
  console.log("❌ Environment setup has errors - please fix the issues above");
  process.exit(1);
} else {
  console.log("✅ Environment setup looks good!");
  console.log("\n🚀 Ready to deploy:");
  console.log("   Local development: yarn dev");
  console.log("   Build for production: yarn build");
  console.log("   Deploy to Netlify: Push to your connected repository");
}
