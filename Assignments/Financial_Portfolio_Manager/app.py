import streamlit as st
import json
import os
from dotenv import load_dotenv
from typing import Dict, Any, List
import time
import random
import google.generativeai as genai

# Load environment variables
load_dotenv()

# For this demo, we'll simulate the autogen functionality
# In a real implementation, you would use actual autogen agents

class MockAgent:
    """Mock agent class to simulate autogen behavior"""
    def __init__(self, name: str, system_message: str):
        self.name = name
        self.system_message = system_message
    
    def generate_response(self, message: str, user_data: Dict) -> str:
        """Generate mock responses based on agent type"""
        if self.name == "PortfolioAnalyst":
            return self._portfolio_analysis(user_data)
        elif self.name == "GrowthStrategist":
            return self._growth_recommendations(user_data)
        elif self.name == "ValueStrategist":
            return self._value_recommendations(user_data)
        elif self.name == "FinancialAdvisor":
            return self._financial_report(user_data)
        return "Response generated"
    
    def _portfolio_analysis(self, data: Dict) -> str:
        salary = float(data.get('salary', 0)) if data.get('salary') else 0
        age = int(data.get('age', 30)) if data.get('age') else 30
        risk = data.get('risk', 'Moderate')
        
        # Simple logic to determine strategy
        if age < 35 and risk == 'Aggressive' and salary > 1000000:
            strategy = "Growth"
            reason = "Young age, high risk tolerance, and good salary make you suitable for growth investments"
        elif risk == 'Conservative' or age > 50:
            strategy = "Value"
            reason = "Conservative risk profile or mature age suggests stable value investments"
        else:
            strategy = "Growth"
            reason = "Balanced profile with growth potential"
        
        return json.dumps({"strategy": strategy, "reason": reason})
    
    def _growth_recommendations(self, data: Dict) -> str:
        recommendations = [
            "Mid-cap mutual funds (SBI Midcap Fund)",
            "Technology ETFs (Nasdaq 100 ETF)",
            "Growth stocks (TCS, Infosys, Reliance)",
            "ELSS funds for tax saving",
            "International diversification funds"
        ]
        rationale = "Focus on high-growth potential investments for long-term wealth creation"
        return json.dumps({"recommendations": recommendations, "rationale": rationale})
    
    def _value_recommendations(self, data: Dict) -> str:
        recommendations = [
            "Large-cap mutual funds (HDFC Top 100 Fund)",
            "Government bonds and debt funds",
            "Blue-chip dividend stocks (ITC, HUL, HDFC Bank)",
            "PPF and EPF contributions",
            "Real estate investment trusts (REITs)"
        ]
        rationale = "Focus on stable, low-risk investments for steady returns"
        return json.dumps({"recommendations": recommendations, "rationale": rationale})
    
    def _financial_report(self, data: Dict) -> str:
        # This would compile all previous outputs into a comprehensive report
        return """
# 📊 Comprehensive Financial Portfolio Report

## 💼 Portfolio Analysis Summary
Based on your financial profile, our AI agents have conducted a thorough analysis of your current situation and future potential.

**Current Financial Position:**
- Annual Salary: ₹{salary}
- Annual Expenses: ₹{expenses}
- Age: {age} years
- Risk Tolerance: {risk}
- Savings Rate: {savings_rate}%

## 📈 Recommended Investment Strategy
**Strategy Type:** {strategy}

Our analysis indicates that a {strategy_lower} investment approach aligns best with your:
- Current age and career stage
- Risk tolerance level
- Financial goals and timeline
- Existing portfolio composition

## 🎯 Specific Investment Recommendations

### High Priority Investments
1. **Systematic Investment Plans (SIPs)**
   - Recommended monthly SIP: ₹{recommended_sip}
   - Suggested funds: {fund_recommendations}

2. **Emergency Fund**
   - Target amount: ₹{emergency_fund} (6 months of expenses)
   - Recommended instruments: High-yield savings account, liquid funds

3. **Tax-Saving Investments**
   - ELSS mutual funds: ₹1.5L per year (80C benefit)
   - PPF contribution: ₹1.5L per year

### Portfolio Diversification
- **Equity (60-70%):** {equity_recommendations}
- **Debt (20-30%):** Government bonds, corporate bonds, debt mutual funds
- **Alternative Investments (10-15%):** Real estate, gold, international funds

## 📋 Implementation Plan

### Immediate Actions (Next 30 days)
- [ ] Set up emergency fund in high-yield savings account
- [ ] Start monthly SIP of ₹{recommended_sip}
- [ ] Review and optimize existing investments
- [ ] Set up automatic investment transfers

### Medium-term Actions (3-6 months)
- [ ] Diversify into international funds
- [ ] Consider increasing SIP amount with salary increments
- [ ] Review insurance coverage
- [ ] Tax planning optimization

### Long-term Actions (1+ years)
- [ ] Annual portfolio review and rebalancing
- [ ] Increase investment allocation with income growth
- [ ] Consider real estate investment opportunities
- [ ] Plan for major financial goals (home, retirement)

## ⚠️ Risk Assessment

**Risk Factors:**
- Market volatility impact on equity investments
- Interest rate changes affecting debt instruments
- Inflation impact on long-term purchasing power

**Mitigation Strategies:**
- Diversified portfolio across asset classes
- Systematic investment approach (SIP)
- Regular review and rebalancing
- Adequate insurance coverage

## 📊 Expected Returns

**Conservative Estimates (Annual):**
- Equity investments: 10-12%
- Debt investments: 6-8%
- Overall portfolio: 8-10%

**Wealth Projection (10 years):**
With consistent monthly investment of ₹{recommended_sip}, your portfolio could potentially grow to ₹{projected_wealth} in 10 years.

## 🎯 Conclusion

Your financial profile shows {conclusion_summary}. By following this structured investment approach, you can work towards achieving your financial goals while maintaining appropriate risk levels.

**Next Steps:**
1. Review this report with a certified financial advisor
2. Start implementing high-priority recommendations
3. Set up monthly review schedule
4. Adjust strategy based on life changes

*This report is generated by AI agents and should be considered as guidance. Please consult with a qualified financial advisor for personalized advice.*
        """.format(
            salary=data.get('salary', 'Not provided'),
            expenses=data.get('expenses', 'Not provided'),
            age=data.get('age', 'Not provided'),
            risk=data.get('risk', 'Not provided'),
            savings_rate=self._calculate_savings_rate(data),
            strategy="Growth" if self._determine_strategy(data) == "Growth" else "Value",
            strategy_lower="growth" if self._determine_strategy(data) == "Growth" else "value",
            recommended_sip=self._calculate_recommended_sip(data),
            fund_recommendations=self._get_fund_recommendations(data),
            emergency_fund=self._calculate_emergency_fund(data),
            equity_recommendations=self._get_equity_recommendations(data),
            projected_wealth=self._calculate_projected_wealth(data),
            conclusion_summary=self._get_conclusion_summary(data)
        )
    
    def _calculate_savings_rate(self, data: Dict) -> int:
        try:
            salary = float(data.get('salary', 0)) if data.get('salary') else 0
            expenses = float(data.get('expenses', 0)) if data.get('expenses') else 0
            if salary > 0:
                return int(((salary - expenses) / salary) * 100)
        except:
            pass
        return 20
    
    def _determine_strategy(self, data: Dict) -> str:
        age = int(data.get('age', 30)) if data.get('age') else 30
        risk = data.get('risk', 'Moderate')
        if age < 35 and risk == 'Aggressive':
            return "Growth"
        return "Value" if risk == 'Conservative' else "Growth"
    
    def _calculate_recommended_sip(self, data: Dict) -> str:
        try:
            salary = float(data.get('salary', 0)) if data.get('salary') else 0
            if salary > 0:
                recommended = int((salary * 0.15) / 12)  # 15% of salary for investments
                return f"{recommended:,}"
        except:
            pass
        return "15,000"
    
    def _get_fund_recommendations(self, data: Dict) -> str:
        strategy = self._determine_strategy(data)
        if strategy == "Growth":
            return "Mid-cap funds, Technology ETFs, ELSS funds"
        return "Large-cap funds, Hybrid funds, Debt funds"
    
    def _calculate_emergency_fund(self, data: Dict) -> str:
        try:
            expenses = float(data.get('expenses', 0)) if data.get('expenses') else 0
            if expenses > 0:
                emergency = int(expenses * 0.5)  # 6 months of expenses
                return f"{emergency:,}"
        except:
            pass
        return "3,00,000"
    
    def _get_equity_recommendations(self, data: Dict) -> str:
        strategy = self._determine_strategy(data)
        if strategy == "Growth":
            return "Mid-cap funds, small-cap funds, international equity funds"
        return "Large-cap funds, dividend yield funds, blue-chip stocks"
    
    def _calculate_projected_wealth(self, data: Dict) -> str:
        try:
            sip = float(data.get('salary', 1200000)) * 0.15 / 12 if data.get('salary') else 15000
            # Simple compound interest calculation for 10 years at 10% annual return
            months = 10 * 12
            monthly_rate = 0.10 / 12
            future_value = sip * (((1 + monthly_rate) ** months - 1) / monthly_rate)
            return f"{int(future_value):,}"
        except:
            pass
        return "25,00,000"
    
    def _get_conclusion_summary(self, data: Dict) -> str:
        age = int(data.get('age', 30)) if data.get('age') else 30
        risk = data.get('risk', 'Moderate')
        
        if age < 30:
            return "strong potential for long-term wealth creation with aggressive investment strategy"
        elif age < 40:
            return "good balance between growth and stability requirements"
        else:
            return "focus on wealth preservation with steady growth opportunities"


# Load Gemini API key from environment
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

class GeminiAgent:
    """Real AI agent using Gemini 1.5 Flash"""
    def __init__(self, name: str, system_message: str):
        self.name = name
        self.system_message = system_message
        self.model = genai.GenerativeModel("gemini-1.5-flash")

    def generate_response(self, message: str, user_data: Dict) -> str:
        prompt = f"""
You are an AI financial assistant agent. Your role: {self.name}.
System message: {self.system_message}
User message: {message}
User data (JSON): {json.dumps(user_data, ensure_ascii=False)}
Respond as a professional financial advisor. If you are the PortfolioAnalyst, analyze the user's financial profile and suggest a strategy (Growth or Value) and reasoning. If you are a strategist, give investment recommendations. If you are the FinancialAdvisor, generate a comprehensive, actionable financial report in markdown.
"""
        response = self.model.generate_content(prompt)
        return response.text if hasattr(response, 'text') else str(response)

# Example usage (replace MockAgent with GeminiAgent for real AI):
# portfolio_analyst = GeminiAgent("PortfolioAnalyst", "Portfolio analysis agent")

# StateFlow for dynamic workflow management
class StateFlow:
    def __init__(self):
        self.current_state = "INIT"
        self.user_data = {}
        self.analysis_result = None
        self.strategy = None
        self.recommendations = None
        self.workflow_history = []
    
    def set_user_data(self, data: Dict[str, Any]):
        self.user_data = data
        self.current_state = "USER_DATA_LOADED"
        self.workflow_history.append(f"✅ User data loaded - {len(data)} fields")
    
    def set_analysis_result(self, result: str):
        self.analysis_result = result
        self.current_state = "ANALYSIS_COMPLETE"
        self.workflow_history.append("✅ Portfolio analysis complete")
        
        # Extract strategy from analysis result
        try:
            if result.startswith('{') and result.endswith('}'):
                parsed = json.loads(result)
                self.strategy = parsed.get('strategy', 'Growth')
            else:
                self.strategy = 'Growth'  # Default
        except:
            self.strategy = 'Growth'  # Default fallback
    
    def set_recommendations(self, recommendations: str):
        self.recommendations = recommendations
        self.current_state = "RECOMMENDATIONS_READY"
        self.workflow_history.append(f"✅ {self.strategy} strategy recommendations generated")
    
    def get_next_agent(self):
        if self.current_state == "USER_DATA_LOADED":
            return "PortfolioAnalyst"
        elif self.current_state == "ANALYSIS_COMPLETE":
            return "GrowthStrategist" if self.strategy == "Growth" else "ValueStrategist"
        elif self.current_state == "RECOMMENDATIONS_READY":
            return "FinancialAdvisor"
        else:
            return None


# Streamlit App Configuration
st.set_page_config(
    page_title="AI Financial Portfolio Manager",
    page_icon="💼",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
<style>
    .main-header {
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        padding: 2rem;
        border-radius: 15px;
        margin-bottom: 2rem;
        color: white;
        text-align: center;
    }
    
    .metric-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 1.5rem;
        border-radius: 10px;
        color: white;
        margin: 1rem 0;
    }
    
    .form-container {
        background: #f8f9fa;
        padding: 2rem;
        border-radius: 15px;
        border: 1px solid #e9ecef;
        margin: 1rem 0;
    }
    
    .section-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1rem;
        border-radius: 10px;
        margin: 1rem 0;
        text-align: center;
    }
    
    .stButton > button {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 25px;
        padding: 0.75rem 2rem;
        font-weight: bold;
        font-size: 1.1rem;
        transition: all 0.3s ease;
        width: 100%;
    }
    
    .stButton > button:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    }
    
    .report-container {
        background: white;
        padding: 2rem;
        border-radius: 15px;
        border: 1px solid #e9ecef;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        margin: 1rem 0;
    }
    
    .status-indicator {
        display: inline-block;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-weight: bold;
        margin: 0.5rem;
    }
    
    .status-processing {
        background: #ffc107;
        color: #000;
    }
    
    .status-success {
        background: #28a745;
        color: white;
    }
    
    .workflow-step {
        background: #e3f2fd;
        border-left: 4px solid #2196f3;
        padding: 1rem;
        margin: 0.5rem 0;
        border-radius: 5px;
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state
if 'state_flow' not in st.session_state:
    st.session_state.state_flow = StateFlow()

# Header
st.markdown("""
<div class="main-header">
    <h1>💼 AI Financial Portfolio Manager</h1>
    <p style="font-size: 1.2rem; opacity: 0.9;">Intelligent Investment Analysis with Multi-Agent Collaboration</p>
</div>
""", unsafe_allow_html=True)

# Sidebar
with st.sidebar:
    st.markdown("### 📊 How It Works")
    st.markdown("""
    **1. Data Collection** 📝
    - Personal financial information
    - Current portfolio details
    
    **2. AI Agent Analysis** 🤖
    - Portfolio Analyst evaluates your situation
    - StateFlow determines optimal path
    
    **3. Strategy Selection** 🎯
    - Growth Agent: High-growth investments
    - Value Agent: Stable, long-term options
    
    **4. Comprehensive Report** 📊
    - Financial Advisor compiles final recommendations
    - Personalized investment roadmap
    """)
    
    st.markdown("### 🔧 Agent Status")
    current_state = st.session_state.state_flow.current_state
    st.write(f"**Current State:** {current_state}")
    
    if st.session_state.state_flow.workflow_history:
        st.markdown("**Workflow Progress:**")
        for step in st.session_state.state_flow.workflow_history:
            st.markdown(f"- {step}")

# Main Application
col1, col2 = st.columns([2, 1])

with col1:
    st.markdown('<div class="form-container">', unsafe_allow_html=True)
    st.markdown('<div class="section-header"><h3>👤 Personal Financial Profile</h3></div>', unsafe_allow_html=True)
    
    with st.form("financial_form"):
        # Personal Information
        col1_1, col1_2 = st.columns(2)
        with col1_1:
            salary = st.text_input("💰 Annual Salary (₹)", placeholder="1200000", help="Enter your annual salary in rupees")
            age = st.number_input("🎂 Your Age", min_value=18, max_value=100, value=30, step=1)
        with col1_2:
            expenses = st.text_input("💸 Annual Expenses (₹)", placeholder="500000", help="Your annual expenses in rupees")
            risk = st.selectbox("⚖️ Risk Tolerance", ["Conservative", "Moderate", "Aggressive"])
        
        goals = st.text_area("🎯 Financial Goals", 
                           placeholder="Retirement planning, home purchase, children's education...", 
                           help="Describe your financial goals and timeline")
        
        # Portfolio Details
        st.markdown('<div class="section-header"><h3>💼 Current Portfolio Details</h3></div>', unsafe_allow_html=True)
        
        col2_1, col2_2 = st.columns(2)
        with col2_1:
            mutual_funds = st.text_area("📈 Mutual Funds", 
                                      placeholder="HDFC Top 100 - ₹2,00,000\nSBI Blue Chip - ₹1,50,000")
            stocks = st.text_area("📊 Individual Stocks", 
                                 placeholder="Infosys - 10 shares\nTCS - 5 shares")
        with col2_2:
            real_estate = st.text_area("🏠 Real Estate", 
                                     placeholder="Residential property - ₹50,00,000\nCommercial plot - ₹25,00,000")
            fixed_deposit = st.text_input("🏦 Fixed Deposits (₹)", placeholder="500000")
        
        # Submit button
        st.markdown("<br>", unsafe_allow_html=True)
        submit = st.form_submit_button("🚀 Generate AI Financial Report")
    
    st.markdown('</div>', unsafe_allow_html=True)

with col2:
    st.markdown('<div class="metric-card">', unsafe_allow_html=True)
    st.markdown("### 🤖 AI Agent Pipeline")
    st.markdown("""
    **1. User Proxy Agent** 🎯
    *Initiates the workflow*
    
    **2. Portfolio Analyst** 📊
    *Analyzes current portfolio*
    
    **3. StateFlow Manager** ⚡
    *Dynamic workflow routing*
    
    **4. Strategy Agent** 📈
    *Growth or Value recommendations*
    
    **5. Financial Advisor** 💼
    *Comprehensive report generation*
    """)
    st.markdown("</div>", unsafe_allow_html=True)
    
    st.markdown('<div class="metric-card">', unsafe_allow_html=True)
    st.markdown("### 📊 Portfolio Analysis")
    if salary and expenses:
        try:
            annual_salary = float(salary) if salary else 0
            annual_expenses = float(expenses) if expenses else 0
            if annual_salary > 0:
                savings_rate = ((annual_salary - annual_expenses) / annual_salary) * 100
                st.markdown(f"**Savings Rate:** {savings_rate:.1f}%")
                st.markdown(f"**Annual Savings:** ₹{annual_salary - annual_expenses:,.0f}")
                
                # Quick assessment
                if savings_rate > 30:
                    st.success("🟢 Excellent savings rate!")
                elif savings_rate > 15:
                    st.info("🟡 Good savings potential")
                else:
                    st.warning("🔴 Consider reducing expenses")
        except:
            st.markdown("**Ready for analysis**")
    else:
        st.markdown("**Enter your financial details**")
    st.markdown("</div>", unsafe_allow_html=True)

# Process form submission
if submit:
    if not salary or not expenses or not age:
        st.error("❌ Please fill in all required fields (Salary, Expenses, Age)")
    else:
        # Initialize agents (now using GeminiAgent for real AI)
        portfolio_analyst = GeminiAgent("PortfolioAnalyst", "Portfolio analysis agent")
        growth_strategist = GeminiAgent("GrowthStrategist", "Growth investment agent")
        value_strategist = GeminiAgent("ValueStrategist", "Value investment agent")
        financial_advisor = GeminiAgent("FinancialAdvisor", "Financial advisor agent")
        
        # Prepare user data
        user_data = {
            "age": age,
            "salary": salary,
            "expenses": expenses,
            "goals": goals,
            "risk": risk,
            "mutual_funds": mutual_funds,
            "stocks": stocks,
            "real_estate": real_estate,
            "fixed_deposit": fixed_deposit
        }
        
        # Progress tracking
        progress_container = st.container()
        with progress_container:
            progress_bar = st.progress(0)
            status_text = st.empty()
        
        # StateFlow workflow execution
        state_flow = st.session_state.state_flow
        state_flow.set_user_data(user_data)
        
        try:
            # Step 1: User Proxy Agent (simulated)
            progress_bar.progress(10)
            status_text.markdown('<div class="status-indicator status-processing">🎯 User Proxy Agent: Initiating workflow...</div>', unsafe_allow_html=True)
            time.sleep(1)
            
            # Step 2: Portfolio Analysis
            progress_bar.progress(30)
            status_text.markdown('<div class="status-indicator status-processing">📊 Portfolio Analyst: Analyzing your portfolio...</div>', unsafe_allow_html=True)
            time.sleep(1.5)
            
            analysis_result = portfolio_analyst.generate_response("Analyze portfolio", user_data)
            state_flow.set_analysis_result(analysis_result)
            
            # Step 3: StateFlow determines next agent
            progress_bar.progress(50)
            status_text.markdown('<div class="status-indicator status-processing">⚡ StateFlow: Determining investment strategy...</div>', unsafe_allow_html=True)
            time.sleep(1)
            
            next_agent = state_flow.get_next_agent()
            
            # Step 4: Strategy Agent (Growth or Value)
            progress_bar.progress(70)
            if next_agent == "GrowthStrategist":
                status_text.markdown('<div class="status-indicator status-processing">📈 Growth Strategist: Generating growth recommendations...</div>', unsafe_allow_html=True)
                recommendations = growth_strategist.generate_response("Generate growth recommendations", user_data)
            else:
                status_text.markdown('<div class="status-indicator status-processing">💎 Value Strategist: Generating value recommendations...</div>', unsafe_allow_html=True)
                recommendations = value_strategist.generate_response("Generate value recommendations", user_data)
            
            time.sleep(1.5)
            state_flow.set_recommendations(recommendations)
            
            # Step 5: Financial Advisor
            progress_bar.progress(90)
            status_text.markdown('<div class="status-indicator status-processing">💼 Financial Advisor: Compiling comprehensive report...</div>', unsafe_allow_html=True)
            time.sleep(2)
            
            final_report = financial_advisor.generate_response("Generate final report", user_data)
            
            # Complete
            progress_bar.progress(100)
            status_text.markdown('<div class="status-indicator status-success">✅ Analysis Complete! Report Generated Successfully</div>', unsafe_allow_html=True)
            
            # Display Results
            st.markdown('<div class="report-container">', unsafe_allow_html=True)
            st.markdown('<div class="section-header"><h2>📊 Your Personalized Financial Report</h2></div>', unsafe_allow_html=True)
            
            # Show the comprehensive report
            st.markdown(final_report)
            st.markdown('</div>', unsafe_allow_html=True)
            
            # Workflow Summary
            with st.expander("🔍 Detailed Workflow Summary", expanded=False):
                col1, col2, col3 = st.columns(3)
                
                with col1:
                    st.markdown("### 🤖 Agent Execution Flow")
                    st.markdown('<div class="workflow-step">', unsafe_allow_html=True)
                    st.markdown("**1. User Proxy Agent**")
                    st.markdown("✅ Workflow initiated successfully")
                    st.markdown("</div>", unsafe_allow_html=True)
                    
                    st.markdown('<div class="workflow-step">', unsafe_allow_html=True)
                    st.markdown("**2. Portfolio Analyst**")
                    st.markdown("✅ Portfolio analysis completed")
                    try:
                        analysis_data = json.loads(analysis_result)
                        st.markdown(f"📊 Strategy: **{analysis_data.get('strategy', 'N/A')}**")
                        st.markdown(f"💡 Reason: {analysis_data.get('reason', 'N/A')}")
                    except:
                        st.markdown("📊 Analysis completed successfully")
                    st.markdown("</div>", unsafe_allow_html=True)
                
                with col2:
                    st.markdown("### ⚡ StateFlow Management")
                    st.markdown('<div class="workflow-step">', unsafe_allow_html=True)
                    st.markdown("**Dynamic Routing:**")
                    st.markdown(f"🎯 Current State: {state_flow.current_state}")
                    st.markdown(f"📈 Strategy Selected: {state_flow.strategy}")
                    st.markdown(f"🤖 Active Agent: {next_agent}")
                    st.markdown("</div>", unsafe_allow_html=True)
                    
                    st.markdown('<div class="workflow-step">', unsafe_allow_html=True)
                    st.markdown("**3. Strategy Agent**")
                    st.markdown(f"✅ {next_agent} executed successfully")
                    try:
                        rec_data = json.loads(recommendations)
                        st.markdown(f"📝 Recommendations: {len(rec_data.get('recommendations', []))} items")
                    except:
                        st.markdown("📝 Recommendations generated")
                    st.markdown("</div>", unsafe_allow_html=True)
                
                with col3:
                    st.markdown("### 📊 Final Compilation")
                    st.markdown('<div class="workflow-step">', unsafe_allow_html=True)
                    st.markdown("**4. Financial Advisor**")
                    st.markdown("✅ Comprehensive report generated")
                    st.markdown(f"📄 Report length: {len(final_report.split())} words")
                    st.markdown("🎯 Personalized recommendations included")
                    st.markdown("</div>", unsafe_allow_html=True)
                    
                    st.markdown('<div class="workflow-step">', unsafe_allow_html=True)
                    st.markdown("**Workflow History:**")
                    for step in state_flow.workflow_history:
                        st.markdown(f"- {step}")
                    st.markdown("</div>", unsafe_allow_html=True)
            
            # Additional Features
            with st.expander("💡 Next Steps & Actions", expanded=False):
                col1, col2 = st.columns(2)
                
                with col1:
                    st.markdown("### 📋 Immediate Actions")
                    immediate_actions = [
                        "📱 Download this report for reference",
                        "🏦 Contact your bank for SIP setup",
                        "📊 Review existing investment allocations",
                        "💰 Set up emergency fund account",
                        "📞 Consult with a certified financial advisor"
                    ]
                    for action in immediate_actions:
                        st.markdown(f"- {action}")
                
                with col2:
                    st.markdown("### 🔄 Regular Reviews")
                    review_schedule = [
                        "📅 Monthly: Track investment performance",
                        "📈 Quarterly: Rebalance portfolio if needed",
                        "🎯 Semi-annually: Review financial goals",
                        "📊 Annually: Comprehensive portfolio review",
                        "🔧 As needed: Adjust for life changes"
                    ]
                    for review in review_schedule:
                        st.markdown(f"- {review}")
            
            # Save report option
            if st.button("💾 Save Report Summary"):
                report_summary = f"""
Financial Portfolio Analysis Report
Generated on: {time.strftime('%Y-%m-%d %H:%M:%S')}

User Profile:
- Age: {age}
- Annual Salary: ₹{salary}
- Annual Expenses: ₹{expenses}
- Risk Tolerance: {risk}

Strategy Determined: {state_flow.strategy}
Agent Used: {next_agent}

Key Recommendations:
{recommendations}

This report was generated using AI agents for portfolio analysis.
Please consult with a certified financial advisor for personalized advice.
"""
                st.success("📄 Report summary prepared! Copy the text below:")
                st.text_area("Report Summary", report_summary, height=200)
        
        except Exception as e:
            st.error(f"❌ Error during analysis: {str(e)}")
            st.info("💡 Please try again with different inputs or contact support.")

# Footer
st.markdown("---")
st.markdown("""
<div style="text-align: center; opacity: 0.7; padding: 2rem;">
    <p>🤖 Powered by Multi-Agent AI System with StateFlow Management</p>
    <p>⚠️ This is a demonstration system. Please consult with qualified financial advisors for actual investment decisions.</p>
</div>
""", unsafe_allow_html=True)