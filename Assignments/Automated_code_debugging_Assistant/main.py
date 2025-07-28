import streamlit as st
import time
import json
from agents import CodeReviewAgent

# Page Configuration
st.set_page_config(
    page_title="🔍 Smart Code Analyzer Pro",
    page_icon="🔍",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for Modern Dark Theme
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

/* Global Styles */
.stApp {
    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
    font-family: 'Inter', sans-serif;
}

/* Header Styling */
.main-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 2rem;
    border-radius: 20px;
    margin-bottom: 2rem;
    text-align: center;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.main-header h1 {
    color: white;
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
}

.main-header p {
    color: rgba(255,255,255,0.9);
    font-size: 1.1rem;
    font-weight: 300;
}

/* Code Input Area */
.code-input-container {
    background: rgba(255,255,255,0.05);
    border: 2px solid rgba(255,255,255,0.1);
    border-radius: 15px;
    padding: 1.5rem;
    margin: 1rem 0;
    backdrop-filter: blur(10px);
}

/* Analysis Cards */
.analysis-card {
    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 15px;
    padding: 1.5rem;
    margin: 1rem 0;
    backdrop-filter: blur(15px);
    transition: transform 0.3s ease;
}

.analysis-card:hover {
    transform: translateY(-5px);
}

/* Status Indicators */
.status-success {
    background: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 25px;
    font-weight: 600;
    display: inline-block;
    margin: 0.5rem 0;
}

.status-warning {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 25px;
    font-weight: 600;
    display: inline-block;
    margin: 0.5rem 0;
}

.status-info {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 25px;
    font-weight: 600;
    display: inline-block;
    margin: 0.5rem 0;
}

/* Metrics Cards */
.metric-card {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
    border: 1px solid rgba(102, 126, 234, 0.3);
    border-radius: 15px;
    padding: 1rem;
    text-align: center;
    margin: 0.5rem;
}

.metric-value {
    font-size: 2rem;
    font-weight: 700;
    color: #667eea;
    margin-bottom: 0.5rem;
}

.metric-label {
    color: rgba(255,255,255,0.8);
    font-size: 0.9rem;
    font-weight: 500;
}

/* Sidebar Styling */
.css-1d391kg {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

/* Text Colors */
.stMarkdown, .stText, p, span, div {
    color: white !important;
}

/* Hide Streamlit Elements */
#MainMenu, footer, header {visibility: hidden;}

/* Custom Scrollbar */
::-webkit-scrollbar {
    width: 8px;
}

::-webkit-scrollbar-track {
    background: rgba(255,255,255,0.1);
    border-radius: 10px;
}

::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
}
</style>
""", unsafe_allow_html=True)

def main():
    # Header
    st.markdown("""
        <div class="main-header">
            <h1>🔍 Smart Code Analyzer Pro</h1>
            <p>Advanced AI-powered code analysis with intelligent suggestions and improvements</p>
        </div>
    """, unsafe_allow_html=True)
    
    # Sidebar
    with st.sidebar:
        st.markdown("### ⚙️ Configuration")
        
        # API Key Check
        try:
            agent = CodeReviewAgent()
            st.success("✅ Gemini API Connected")
        except Exception as e:
            st.error("❌ API Key Error")
            st.info("Please set GEMINI_API_KEY in your environment variables")
            st.code("GEMINI_API_KEY=your_key_here", language="bash")
            return
        
        st.markdown("### 📊 Features")
        st.markdown("""
        - 🔍 **Static Code Analysis**
        - 🤖 **AI-Powered Improvements**
        - 📈 **Code Metrics Dashboard**
        - 💡 **Smart Suggestions**
        - 🎯 **Best Practices Detection**
        """)
        
        st.markdown("### 🎯 How to Use")
        st.markdown("""
        1. **Paste** your Python code
        2. **Click** Analyze Code
        3. **Review** the analysis results
        4. **Apply** suggested improvements
        """)
    
    # Main Content
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.markdown("### 📝 Code Input")
        st.markdown("""
        <div class="code-input-container">
            <p style="color: rgba(255,255,255,0.8); margin-bottom: 1rem;">
                Paste your Python code below for comprehensive analysis
            </p>
        </div>
        """, unsafe_allow_html=True)
        
        # Code input with syntax highlighting
        code_input = st.text_area(
            "Your Python Code",
            height=300,
            placeholder="""# Example code
def calculate_sum(numbers):
    total = 0
    for num in numbers:
        total += num
    print(total)
    return total""",
            key="code_input"
        )
        
        # Analysis button
        analyze_btn = st.button(
            "🔍 Analyze Code",
            use_container_width=True,
            type="primary"
        )
    
    with col2:
        st.markdown("### 📊 Quick Stats")
        
        if code_input.strip():
            # Basic stats
            lines = len(code_input.split('\n'))
            chars = len(code_input)
            words = len(code_input.split())
            
            col_a, col_b = st.columns(2)
            
            with col_a:
                st.markdown(f"""
                <div class="metric-card">
                    <div class="metric-value">{lines}</div>
                    <div class="metric-label">Lines of Code</div>
                </div>
                """, unsafe_allow_html=True)
                
                st.markdown(f"""
                <div class="metric-card">
                    <div class="metric-value">{chars}</div>
                    <div class="metric-label">Characters</div>
                </div>
                """, unsafe_allow_html=True)
            
            with col_b:
                st.markdown(f"""
                <div class="metric-card">
                    <div class="metric-value">{words}</div>
                    <div class="metric-label">Words</div>
                </div>
                """, unsafe_allow_html=True)
                
                st.markdown(f"""
                <div class="metric-card">
                    <div class="metric-value">{code_input.count('def')}</div>
                    <div class="metric-label">Functions</div>
                </div>
                """, unsafe_allow_html=True)
    
    # Analysis Results
    if analyze_btn and code_input.strip():
        with st.spinner("🔍 Analyzing your code..."):
            try:
                # Perform analysis
                results = agent.review_code(code_input)
                
                # Display results
                display_analysis_results(results, code_input)
                
            except Exception as e:
                st.error(f"❌ Analysis failed: {str(e)}")
    
    elif analyze_btn and not code_input.strip():
        st.warning("⚠️ Please enter some code to analyze")

def display_analysis_results(results, original_code):
    """Display comprehensive analysis results"""
    
    # Summary Section
    st.markdown("## 📋 Analysis Summary")
    
    if 'error' in results:
        st.error(f"❌ {results['error']}")
        return
    
    analysis = results['analysis']
    summary = results['summary']
    
    # Status indicators
    if analysis.get('syntax_valid', False):
        st.markdown('<div class="status-success">✅ Syntax Valid</div>', unsafe_allow_html=True)
    else:
        st.markdown('<div class="status-warning">⚠️ Syntax Error</div>', unsafe_allow_html=True)
    
    # Metrics Dashboard
    st.markdown("### 📊 Code Metrics")
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-value">{analysis.get('function_count', 0)}</div>
            <div class="metric-label">Functions</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-value">{analysis.get('class_count', 0)}</div>
            <div class="metric-label">Classes</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col3:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-value">{analysis.get('import_count', 0)}</div>
            <div class="metric-label">Imports</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col4:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-value">{analysis.get('line_count', 0)}</div>
            <div class="metric-label">Lines</div>
        </div>
        """, unsafe_allow_html=True)
    
    # Issues and Suggestions
    col_left, col_right = st.columns(2)
    
    with col_left:
        st.markdown("### ⚠️ Issues Found")
        issues = analysis.get('issues', [])
        
        if issues:
            for issue in issues:
                st.markdown(f"""
                <div class="analysis-card">
                    <p style="color: #ff6b6b; margin: 0;">{issue}</p>
                </div>
                """, unsafe_allow_html=True)
        else:
            st.markdown('<div class="status-success">✅ No critical issues found</div>', unsafe_allow_html=True)
    
    with col_right:
        st.markdown("### 💡 Suggestions")
        suggestions = analysis.get('suggestions', [])
        
        if suggestions:
            for suggestion in suggestions:
                st.markdown(f"""
                <div class="analysis-card">
                    <p style="color: #4ecdc4; margin: 0;">{suggestion}</p>
                </div>
                """, unsafe_allow_html=True)
        else:
            st.markdown('<div class="status-info">💡 No suggestions at this time</div>', unsafe_allow_html=True)
    
    # AI Improvements
    st.markdown("## 🤖 AI-Powered Improvements")
    
    improvements = results.get('improvements', '')
    
    if improvements and 'Error' not in improvements:
        st.markdown("""
        <div class="analysis-card">
            <h4 style="color: white; margin-bottom: 1rem;">✨ Enhanced Code Version</h4>
        </div>
        """, unsafe_allow_html=True)
        
        st.code(improvements, language="python")
        
        # Download option
        st.download_button(
            label="📥 Download Improved Code",
            data=improvements,
            file_name="improved_code.py",
            mime="text/plain"
        )
    else:
        st.warning("⚠️ Could not generate improvements. Please check your API key and try again.")
    
    # Code Comparison
    st.markdown("## 🔄 Code Comparison")
    
    col_orig, col_improved = st.columns(2)
    
    with col_orig:
        st.markdown("### 📝 Original Code")
        st.code(original_code, language="python")
    
    with col_improved:
        st.markdown("### ✨ Improved Code")
        if improvements and 'Error' not in improvements:
            st.code(improvements, language="python")
        else:
            st.info("Improvements not available")

if __name__ == "__main__":
    main()