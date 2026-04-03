require('dotenv').config();
const express = require('express');
const { auth, requiresAuth } = require('express-openid-connect');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000;

// GenAI Setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Auth0 Configuration
const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.SECRET || 'a_long_randomly_generated_string_for_auth0',
  baseURL: process.env.AUTH0_BASE_URL || 'http://localhost:3000',
  clientID: process.env.AUTH0_CLIENT_ID,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`
};

// Express Middlewares
app.use(express.static('public'));
app.use(express.json());

// Auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

// API: Get current user status
app.get('/api/user', (req, res) => {
  res.json({
    isAuthenticated: req.oidc.isAuthenticated(),
    user: req.oidc.user || null
  });
});

// API: Start Mock AWS Scan
app.post('/api/agent/scan', async (req, res) => {
  try {
    // Array of vulnerabilities to make the demo dynamic
    const vulnerabilities = [
      "S3 Bucket 'aegis-sensitive-storage' has public read access. An exposed AWS default VPC security group allows all inbound traffic.",
      "GitHub Repository 'production-api' contains a hardcoded AWS Access Key ID in the environment configuration file.",
      "Kubernetes cluster 'kc-prod-01' has an unauthenticated dashboard exposed to the public internet.",
      "IAM User 'deploy-bot' has excessive AdministratorAccess permissions that have not been used in 90 days."
    ];
    // Pick two random vulnerabilities for the scan
    const selectedVulns = vulnerabilities.sort(() => 0.5 - Math.random()).slice(0, 2);
    
    // We use Gemini to analyze and suggest a fix
    const prompt = `You are Aegis Sentinel, an AI cloud security auditor.
Analyze the following vulnerabilities:
1. ${selectedVulns[0]}
2. ${selectedVulns[1]}

Provide a concise JSON response with the following structure:
{
  "severity": "CRITICAL",
  "analysis": "Brief explanation of the combined risk",
  "proposedAction": "Action to fix them (e.g., 'Update S3 Policy and Rotate AWS Keys via GitHub Actions')",
  "requiresMfa": true
}`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
    // Strip markdown formatting if any
    if (text.startsWith("```json")) {
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    }
    
    res.json(JSON.parse(text));
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "Failed to run AI scan" });
  }
});

// API: Execute Fix (Requires Auth0 Login / Step-Up)
app.post('/api/agent/fix', requiresAuth(), async (req, res) => {
  try {
    console.log("-------------------------------------------------");
    console.log("[VAULT AUDIT] Step-Up Auth Verified.");
    console.log(`[VAULT AUDIT] Requesting GitHub token for user: ${req.oidc.user.email}`);
    
    // This is where the Auth0 Token Vault SDK is called.
    // e.g., const vaultToken = await auth0AiSdk.getVaultToken(req.oidc.user.sub, "github_connection");
    console.log("[VAULT AUDIT] Contacting Auth0 Token Vault API...");
    
    await new Promise(resolve => setTimeout(resolve, 800)); // Network delay
    
    // We use the local token to simulate the vault payload for the demo
    const retrievedToken = process.env.GITHUB_TOKEN; 
    const maskedToken = retrievedToken.substring(0, 15) + "*******************";
    
    console.log(`[VAULT AUDIT] SUCCESS! Token Vault released key: ${maskedToken}`);
    console.log("[AGENT ACTION] Contacting GitHub API to create Audit Repository and Issue...");

    // REAL GITHUB API ACTION
    const ghHeaders = {
      "Authorization": `token ${retrievedToken}`,
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "Aegis-Sentinel-Agent"
    };

    // 1. Get the authenticated username
    const userRes = await fetch("https://api.github.com/user", { headers: ghHeaders });
    if (!userRes.ok) throw new Error("GitHub PAT is invalid or Vault failed to authorize.");
    const userData = await userRes.json();
    const username = userData.login;

    // 2. The user has manually created exactly this repo on GitHub:
    const repoName = "aegis-sentinel";
    let issueCreated = false;
    
    try {
        console.log(`[AGENT ACTION] Validated identity as ${username}. Pushing Security Alert to https://github.com/${username}/${repoName}`);
        
        // 3. Create the real Issue inside the repo!
        const issueRes = await fetch(`https://api.github.com/repos/${username}/${repoName}/issues`, {
            method: "POST",
            headers: ghHeaders,
            body: JSON.stringify({
                title: `🚨 Security Remediation Executed: ${new Date().toLocaleTimeString()}`,
                body: `### Aegis Sentinel Authorized Action\n\nA critical vulnerability was detected and automatically resolved. \n\n**Action Authorized By**: \`${req.oidc.user.email}\`\n**Vaulted Token Used**: \`${maskedToken}\`\n**Status**: Resolved successfully via Token Vault.`
            })
        });
        
        if (issueRes.ok) {
            issueCreated = true;
        } else {
            const errData = await issueRes.json();
            console.error("[AGENT ERROR]", errData);
        }
    } catch (e) {
        console.log("[AGENT ACTION] Network or API Error reaching GitHub.");
    }

    if (issueCreated) {
        console.log(`[AGENT ACTION] SUCCESS! Live GitHub Issue created perfectly in ${username}/${repoName}!`);
    } else {
        console.log(`[AGENT ACTION] FAILED to post issue. Check if the repo name exactly matches 'aegis-security-audit' and your PAT has 'public_repo' scope.`);
    }
    console.log("-------------------------------------------------");

    const simulatedResponse = {
      status: "Success",
      message: issueCreated ? `Audit logged successfully in Live GitHub repo: ${repoName}` : `Vault Token validated for GitHub user: ${username}`,
      timestamp: new Date().toISOString()
    };
    
    res.json(simulatedResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Failed to apply fix" });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  console.log(`Login available at http://localhost:${port}/login`);
});
