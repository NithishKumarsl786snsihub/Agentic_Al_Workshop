# 💼 AI Financial Portfolio Manager

A modern, interactive Streamlit app for intelligent investment analysis and personalized financial planning using multi-agent collaboration and Google Gemini AI.

![App UI Screenshot](Financial%20Portfolio%20Manager.png)

## 🚀 Features
- Multi-agent workflow: Portfolio Analyst, Growth/Value Strategist, Financial Advisor
- Personalized financial report generation
- Real-time investment strategy and recommendations
- Beautiful, modern UI with progress tracking
- Uses Google Gemini (Generative AI) for advanced analysis

## 🏗️ How to Run (with venv)

1. **Clone or download this project** and open a terminal in the project directory.
2. **Create a virtual environment:**
   ```sh
   python -m venv venv
   ```
3. **Activate the virtual environment:**
   - On Windows:
     ```sh
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```sh
     source venv/bin/activate
     ```
4. **Upgrade pip (recommended):**
   ```sh
   python -m pip install --upgrade pip
   ```
5. **Install dependencies:**
   ```sh
   pip install -r requirements.txt
   ```
6. **Set up your environment variables:**
   - Copy `.env.example` to `.env` and add your Google Gemini API key:
     ```sh
     copy .env.example .env  # (or cp .env.example .env on macOS/Linux)
     ```
   - Edit `.env` and set:
     ```env
     GOOGLE_API_KEY=your_gemini_api_key_here
     ```
7. **Run the app:**
   ```sh
   streamlit run app.py
   ```
   The app will open in your browser (usually at http://localhost:8501).

## 🖼️ UI Overview
The screenshot above shows the app's main interface:
- **Sidebar:** Explains workflow, shows agent status and progress.
- **Personal Financial Profile:** Enter your salary, expenses, age, risk tolerance, and goals.
- **Current Portfolio Details:** Add mutual funds, stocks, real estate, and fixed deposits.
- **AI Agent Pipeline:** Visualizes the multi-agent workflow.
- **Portfolio Analysis:** Shows savings rate and quick assessment.
- **Report Section:** After submission, a comprehensive, personalized financial report is generated, including:
  - Portfolio analysis summary
  - Recommended investment strategy (Growth/Value)
  - Specific investment recommendations
  - Implementation plan (immediate, medium, long-term actions)
  - Risk assessment and expected returns
  - Conclusion and next steps

## ⚙️ .env Setup
Create a `.env` file in the project root with:
```
GOOGLE_API_KEY=your_gemini_api_key_here
```
Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey).

## 💡 Usage
1. Fill in your financial details and portfolio information.
2. Click **"Generate AI Financial Report"**.
3. The app will run a multi-agent workflow:
   - Portfolio Analyst reviews your profile
   - StateFlow determines the best strategy
   - Growth/Value Strategist generates recommendations
   - Financial Advisor compiles a detailed report
4. Review your personalized report and next steps.
5. Optionally, save or copy the report summary.

## 🔍 How It Works
- **Agents** (powered by Gemini or mock logic) analyze your data and collaborate to generate actionable insights.
- **StateFlow** manages the workflow, routing between agents based on your profile and analysis results.
- **Streamlit** provides a modern, interactive UI with real-time feedback and progress.

## 📦 Project Structure
- `app.py` — Main Streamlit app
- `requirements.txt` — Python dependencies
- `.env.example` — Example environment file
- `Financial Portfolio Manager.png` — UI screenshot

## 📝 Notes
- This is a demonstration system. For real investment decisions, consult a certified financial advisor.
- The app can use either real Gemini AI (with your API key) or mock agents for demo/testing.

---

**Empowering smarter financial decisions with AI and multi-agent collaboration!** 