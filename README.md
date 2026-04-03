<div align="center">
  <img src="https://img.shields.io/badge/Auth0_Token_Vault-Activated-66fcf1?style=for-the-badge&logo=auth0" />
  <img src="https://img.shields.io/badge/Gemini_2.5_Flash-AI_Agent-818cf8?style=for-the-badge&logo=google" />
</div>

<br/>

<div align="center">
  <h1>🛡️ Aegis Sentinel</h1>
  <p><b>An Autonomous Cloud Security Auditor with Zero-Trust Permission Boundaries.</b></p>
  <p><i>Built for the "Authorized to Act: Auth0 for AI Agents" Hackathon.</i></p>
</div>

---

## 🎯 The Vision
AI Agents shouldn't have permanent, unchecked access to your infrastructure. **Aegis Sentinel** is a premium, autonomous security orchestrator that identifies critical vulnerabilities in your cloud and kubernetes environments. 

However, it operates strictly under a **Zero-Trust paradigm**: it can *detect* anything, but it can *fix* nothing without explicit human consent. By leveraging the **Auth0 for AI Agents Token Vault**, Aegis Sentinel ensures that high-privilege credentials (like GitHub PATs or AWS Keys) are held securely by Auth0 and only released to the agent after the user completes a Step-Up Authentication challenge.

## 🔑 Core Hackathon Integrations
- **Explicit Permission Boundary**: The Gemini 2.5 Agent operates in a read-only "sandbox". It proposes remediation actions but requires human authorization to execute them.
- **Auth0 Step-Up Authentication**: Triggers the Auth0 `/login` gateway when the user attempts an "Authorized Action". 
- **Auth0 Token Vault SDK Simulation**: Securely retrieves the scoped credential specifically deposited by the user, ensuring the LLM never sees the keys until execution time.

## 🚀 How It Works
1. **Continuous Scan**: The Agent initiates an audit of the connected cloud environment.
2. **Detection**: It discovers a vulnerability (e.g., *Public S3 Bucket, Hardcoded Credentials*).
3. **Agent Proposal**: The Gemini LLM analyzes the blast radius and generates a JSON payload detailing the required remediation action.
4. **Step-Up Challenge**: The UI blocks the Agent. The user must explicitly click "Grant Access", redirecting them to Auth0 to verify their identity.
5. **Secure Execution**: Upon successful Auth0 validation, the backend requests the vaulted token and uses it to automatically push a security issue and remediation log to the mapped GitHub repository.

## 🛠️ Local Setup & Testing

To run Aegis Sentinel locally and test the Token Vault boundary:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ThryLox/aegis-sentinel.git
   cd aegis-sentinel
   npm install
   ```

2. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add the following keys:
   ```env
   GEMINI_API_KEY=your_gemini_key
   GITHUB_TOKEN=your_github_pat
   AUTH0_DOMAIN=your_auth0_domain
   AUTH0_CLIENT_ID=your_auth0_client_id
   AUTH0_CLIENT_SECRET=your_auth0_client_secret
   AUTH0_BASE_URL=http://localhost:3000
   SECRET=a_long_randomly_generated_string_for_auth0
   ```

3. **Start the Zero-Trust Environment:**
   ```bash
   node server.js
   ```
4. Navigate to `http://localhost:3000` to interact with the Sentinel Dashboard.

## 🎨 Architecture & UI
The frontend features a fully custom, vanilla HTML/CSS "Experience Architect" dark mode, proving that highly secure authentication tools do not have to compromise on visual fidelity or premium user experience. It utilizes glassmorphism, contextual SVG iconography, and dual-sync terminal logging to represent sophisticated Agent tasks.

---

<div align="center">
  <p>Engineered securely for the 2026 DevPost Hackathon.</p>
</div>
