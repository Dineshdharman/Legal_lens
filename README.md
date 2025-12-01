# ⚖️ LegalLens - AI Consumer Protection Agent

**LegalLens** is a browser-based AI agent that protects users from predatory Terms of Service (ToS) agreements. It autonomously scans webpages, detects legal contracts, and uses **Google Gemini Flash** to audit them for "Red Flags" like AI training rights, data selling, and forced arbitration.

## 🌟 Features
* **Automatic Detection:** Smart heuristic engine detects legal documents automatically.
* **Safety Score (1-10):** Instantly grades the safety of a contract.
* **Red Flag Hunter:** Specifically identifies clauses where companies claim ownership of your content or data.
* **Observability:** Full backend tracing for every agent interaction.

## 🛠️ Tech Stack
* **AI Model:** Google Gemini 1.5 Flash
* **Backend:** Python, FastAPI, Pydantic (Structured Outputs)
* **Frontend:** Chrome Extension (HTML/CSS/JS Manifest V3)

## 🚀 How to Run Locally

### 1. Backend Setup (The Brain)
Navigate to the backend folder and set up the environment.

```bash
cd backend
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .\.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create a .env file and add your Google API Key
echo "GOOGLE_API_KEY=your_key_here" > .env

# Start the Server
uvicorn server:app --reload