import os
import streamlit as st
from dotenv import load_dotenv
from agents import BillManagementAgents
import json
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd

# Load environment variables
load_dotenv()

# Page Configuration
st.set_page_config(
    page_title="🧾 AI Bill Management Agent", 
    layout="wide",
    initial_sidebar_state="expanded",
    page_icon="🧾"
)

# Custom CSS for Modern Dark Theme UI
st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
    
    /* Global Styles */
    .stApp {
        background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
        font-family: 'Poppins', sans-serif;
    }
    
    /* Header Section */
    .main-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 3rem 2rem;
        border-radius: 25px;
        margin-bottom: 2rem;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        text-align: center;
        position: relative;
        overflow: hidden;
    }
    
    .main-header::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 100%);
        pointer-events: none;
    }
    
    .main-header h1 {
        font-size: 3.5rem;
        font-weight: 700;
        color: white;
        margin-bottom: 1rem;
        text-shadow: 0 4px 8px rgba(0,0,0,0.3);
        position: relative;
        z-index: 1;
    }
    
    .main-header p {
        font-size: 1.3rem;
        color: rgba(255,255,255,0.9);
        font-weight: 300;
        position: relative;
        z-index: 1;
    }
    
    /* Cards and Containers */
    .glass-card {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 20px;
        padding: 2rem;
        box-shadow: 0 15px 35px rgba(0,0,0,0.3);
        margin: 1.5rem 0;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    .glass-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 20px 45px rgba(0,0,0,0.4);
    }
    
    /* Upload Section */
    .upload-section {
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
        border: 2px dashed #667eea;
        border-radius: 20px;
        padding: 3rem;
        text-align: center;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
    }
    
    .upload-section::before {
        content: '📤';
        font-size: 4rem;
        position: absolute;
        top: 20px;
        right: 20px;
        opacity: 0.3;
    }
    
    .upload-section:hover {
        border-color: #764ba2;
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
        transform: scale(1.02);
    }
    
    /* Category Cards */
    .category-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 20px;
        padding: 2rem;
        margin: 1rem 0;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
    }
    
    .category-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 100%);
        pointer-events: none;
    }
    
    .category-card:hover {
        transform: translateY(-8px) scale(1.02);
        box-shadow: 0 15px 40px rgba(0,0,0,0.4);
    }
    
    .category-title {
        font-size: 1.4rem;
        font-weight: 600;
        color: white;
        margin-bottom: 1.5rem;
        display: flex;
        align-items: center;
        gap: 0.8rem;
        position: relative;
        z-index: 1;
    }
    
    .expense-item {
        background: rgba(255,255,255,0.2);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.3);
        border-radius: 15px;
        padding: 1rem;
        margin: 0.8rem 0;
        transition: all 0.3s ease;
        position: relative;
        z-index: 1;
    }
    
    .expense-item:hover {
        background: rgba(255,255,255,0.25);
        transform: translateX(10px);
    }
    
    /* Summary Section */
    .summary-card {
        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
        border-radius: 25px;
        padding: 3rem;
        text-align: center;
        box-shadow: 0 20px 50px rgba(255,107,107,0.3);
        margin: 2rem 0;
        position: relative;
        overflow: hidden;
    }
    
    .summary-card::before {
        content: '💰';
        font-size: 6rem;
        position: absolute;
        top: 20px;
        right: 30px;
        opacity: 0.2;
    }
    
    .total-amount {
        font-size: 4rem;
        font-weight: 800;
        color: white;
        text-shadow: 0 4px 8px rgba(0,0,0,0.3);
        margin: 1rem 0;
        position: relative;
        z-index: 1;
    }
    
    .summary-title {
        font-size: 1.8rem;
        font-weight: 600;
        color: white;
        margin-bottom: 1rem;
        position: relative;
        z-index: 1;
    }
    
    /* Chat Section */
    .chat-container {
        background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 25px;
        padding: 2rem;
        margin: 2rem 0;
    }
    
    .chat-message {
        margin: 1.5rem 0;
        padding: 1.5rem;
        border-radius: 20px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
    }
    
    .chat-message:hover {
        transform: translateY(-3px);
        box-shadow: 0 12px 35px rgba(0,0,0,0.3);
    }
    
    .user-message {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-left: 5px solid #00d2ff;
    }
    
    .agent-message {
        background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.1) 100%);
        backdrop-filter: blur(15px);
        border-left: 5px solid #ff6b6b;
    }
    
    .manager-message {
        background: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%);
        border-left: 5px solid #ffa726;
    }
    
    .message-sender {
        font-weight: 700;
        font-size: 1.1rem;
        color: white;
        margin-bottom: 0.8rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .message-content {
        color: white;
        line-height: 1.6;
        font-size: 1rem;
    }
    
    /* Badges and Alerts */
    .success-badge {
        background: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%);
        color: white;
        padding: 1rem 2rem;
        border-radius: 50px;
        font-weight: 600;
        display: inline-block;
        margin: 1rem 0;
        box-shadow: 0 8px 25px rgba(86,171,47,0.3);
        animation: pulse 2s infinite;
    }
    
    .warning-badge {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        color: white;
        padding: 1rem 2rem;
        border-radius: 50px;
        font-weight: 600;
        display: inline-block;
        margin: 1rem 0;
        box-shadow: 0 8px 25px rgba(245,87,108,0.3);
    }
    
    .info-badge {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        color: white;
        padding: 1rem 2rem;
        border-radius: 50px;
        font-weight: 600;
        display: inline-block;
        margin: 1rem 0;
        box-shadow: 0 8px 25px rgba(79,172,254,0.3);
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    
    /* Sidebar Customization */
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
        width: 10px;
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
            <h1>🧾 AI Bill Management Agent</h1>
            <p>Upload your bills and let AI agents collaborate to categorize and analyze your expenses with intelligent insights</p>
        </div>
    """, unsafe_allow_html=True)
    
    # Sidebar Configuration
    with st.sidebar:
        st.markdown("### ⚙️ Configuration")
        
        # API Key Input
        gemini_api_key = st.text_input(
            "Gemini API Key", 
            type="password",
            value=os.getenv("GEMINI_API_KEY", ""),
            help="Enter your Google Gemini API key"
        )
        
        if not gemini_api_key:
            st.error("Please enter your Gemini API key to continue")
            st.info("Get your API key from: https://makersuite.google.com/app/apikey")
            return
        
        # Agent Status
        st.markdown("### 🤖 Agent Status")
        st.success("✅ UserProxy Agent - Ready")
        st.success("✅ Bill Processing Agent - Ready") 
        st.success("✅ Expense Summarization Agent - Ready")
        st.success("✅ Group Chat Manager - Ready")
        
        # Statistics (if session state exists)
        if 'processed_bills' in st.session_state:
            st.markdown("### 📊 Session Statistics")
            st.metric("Bills Processed", st.session_state.processed_bills)
            st.metric("Total Categories", len(st.session_state.get('all_categories', [])))
    
    # Initialize agents
    if 'agents' not in st.session_state:
        st.session_state.agents = BillManagementAgents(gemini_api_key)
        st.session_state.processed_bills = 0
        st.session_state.all_categories = set()
    
    # Main Content Area
    col1, col2 = st.columns([2, 1])
    
    with col1:
        # File Upload Section
        st.markdown("""
            <div class="glass-card">
                <h3 style="color: white; text-align: center; margin-bottom: 2rem;">📤 Upload Your Bill</h3>
                <div class="upload-section">
                    <h4 style="color: white;">Drop your bill image here</h4>
                    <p style="color: rgba(255,255,255,0.7);">Supported formats: JPG, JPEG, PNG</p>
                </div>
            </div>
        """, unsafe_allow_html=True)
        
        uploaded_file = st.file_uploader("", type=["jpg", "jpeg", "png"], label_visibility="collapsed")
    
    with col2:
        # Quick Stats or Instructions
        st.markdown("""
            <div class="glass-card">
                <h4 style="color: white; text-align: center;">🎯 How it Works</h4>
                <div style="color: rgba(255,255,255,0.8); line-height: 1.6;">
                    <p>1. 📸 Upload your bill image</p>
                    <p>2. 🤖 AI agents collaborate to process</p>
                    <p>3. 📊 Get categorized expenses</p>
                    <p>4. 💡 Receive spending insights</p>
                </div>
            </div>
        """, unsafe_allow_html=True)
    
    # Process uploaded file
    if uploaded_file is not None:
        st.markdown('<div class="success-badge">✅ File uploaded successfully! Processing your bill...</div>', unsafe_allow_html=True)
        
        # Create processing columns
        process_col1, process_col2 = st.columns(2)
        
        with process_col1:
            with st.spinner("🔍 Extracting expenses with Gemini AI..."):
                categorized_data, raw_response = st.session_state.agents.process_bill_with_gemini(uploaded_file)
        
        if categorized_data is None:
            st.markdown(f'''
                <div class="glass-card" style="background: rgba(255,107,107,0.2); border-color: #ff6b6b;">
                    <h4 style="color: #ff6b6b;">❌ Processing Failed</h4>
                    <p style="color: white;">Failed to extract expenses from the image. Please try with a clearer image.</p>
                    <details>
                        <summary style="color: white; cursor: pointer;">View Error Details</summary>
                        <pre style="color: rgba(255,255,255,0.8); margin-top: 1rem;">{raw_response}</pre>
                    </details>
                </div>
            ''', unsafe_allow_html=True)
        else:
            # Update session statistics
            st.session_state.processed_bills += 1
            st.session_state.all_categories.update([cat for cat, items in categorized_data.items() if items])
            
            with process_col2:
                with st.spinner("🤖 Starting agent collaboration..."):
                    chat_log = st.session_state.agents.start_agent_collaboration(categorized_data)
            
            # Display Results
            display_results(categorized_data, chat_log)

def display_results(categorized_data, chat_log):
    """Display the processed results with modern UI"""
    
    # Calculate totals and insights
    category_totals = {}
    total_expenditure = 0
    
    for category, items in categorized_data.items():
        if items:
            category_total = sum(float(item['cost']) for item in items)
            category_totals[category] = category_total
            total_expenditure += category_total
    
    # Category icons mapping
    category_icons = {
        "Groceries": "🛒",
        "Dining": "🍽️", 
        "Utilities": "⚡",
        "Shopping": "🛍️",
        "Entertainment": "🎬",
        "Others": "📦"
    }
    
    # Main Results Container
    st.markdown("## 📊 Expense Analysis Results")
    
    # Summary Card - Top Section
    if total_expenditure > 0:
        highest_category = max(category_totals, key=category_totals.get) if category_totals else "None"
        highest_amount = category_totals.get(highest_category, 0)
        
        st.markdown(f"""
            <div class="summary-card">
                <div class="summary-title">💰 Total Expenditure</div>
                <div class="total-amount">₹{total_expenditure:.2f}</div>
                <div style="color: white; font-size: 1.2rem; margin-top: 1rem; position: relative; z-index: 1;">
                    <strong>Highest Spending:</strong> {highest_category} (₹{highest_amount:.2f})
                </div>
            </div>
        """, unsafe_allow_html=True)
        
        # Create two columns for charts and categories
        chart_col, detail_col = st.columns([1, 1])
        
        with chart_col:
            # Pie Chart for spending distribution
            if category_totals:
                st.markdown("""
                    <div class="glass-card">
                        <h4 style="color: white; text-align: center; margin-bottom: 1rem;">📈 Spending Distribution</h4>
                    </div>
                """, unsafe_allow_html=True)
                
                # Create pie chart data
                chart_data = []
                colors = []
                color_map = {
                    "Groceries": "#FF6B6B",
                    "Dining": "#4ECDC4", 
                    "Utilities": "#45B7D1",
                    "Shopping": "#96CEB4",
                    "Entertainment": "#FFEAA7",
                    "Others": "#DDA0DD"
                }
                
                for category, amount in category_totals.items():
                    chart_data.append({'Category': category, 'Amount': amount})
                    colors.append(color_map.get(category, "#DDA0DD"))
                
                # Create plotly pie chart
                fig = px.pie(
                    values=[item['Amount'] for item in chart_data],
                    names=[item['Category'] for item in chart_data],
                    title="",
                    color_discrete_sequence=colors
                )
                
                fig.update_traces(
                    textposition='inside', 
                    textinfo='percent+label',
                    textfont=dict(color='white', size=12)
                )
                
                fig.update_layout(
                    paper_bgcolor='rgba(0,0,0,0)',
                    plot_bgcolor='rgba(0,0,0,0)',
                    font=dict(color='white'),
                    showlegend=True,
                    legend=dict(
                        font=dict(color='white'),
                        bgcolor='rgba(255,255,255,0.1)'
                    ),
                    height=400
                )
                
                st.plotly_chart(fig, use_container_width=True)
        
        with detail_col:
            # Bar chart for category comparison
            st.markdown("""
                <div class="glass-card">
                    <h4 style="color: white; text-align: center; margin-bottom: 1rem;">📊 Category Breakdown</h4>
                </div>
            """, unsafe_allow_html=True)
            
            if category_totals:
                # Create bar chart
                sorted_categories = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)
                
                fig_bar = go.Figure(data=[
                    go.Bar(
                        x=[cat for cat, amt in sorted_categories],
                        y=[amt for cat, amt in sorted_categories],
                        marker_color=['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'][:len(sorted_categories)],
                        text=[f'₹{amt:.0f}' for cat, amt in sorted_categories],
                        textposition='auto',
                    )
                ])
                
                fig_bar.update_layout(
                    paper_bgcolor='rgba(0,0,0,0)',
                    plot_bgcolor='rgba(0,0,0,0)',
                    font=dict(color='white'),
                    xaxis=dict(color='white', gridcolor='rgba(255,255,255,0.2)'),
                    yaxis=dict(color='white', gridcolor='rgba(255,255,255,0.2)'),
                    height=400,
                    margin=dict(t=20, b=40)
                )
                
                st.plotly_chart(fig_bar, use_container_width=True)
    
    # Detailed Category Cards
    st.markdown("## 📂 Detailed Category Breakdown")
    
    # Create responsive columns for categories
    if any(items for items in categorized_data.values()):
        categories_with_data = [(cat, items) for cat, items in categorized_data.items() if items]
        
        # Display categories in rows of 2
        for i in range(0, len(categories_with_data), 2):
            cols = st.columns(2)
            
            for j, col in enumerate(cols):
                if i + j < len(categories_with_data):
                    category, items = categories_with_data[i + j]
                    icon = category_icons.get(category, "📦")
                    category_total = sum(float(item['cost']) for item in items)
                    
                    with col:
                        st.markdown(f"""
                            <div class="category-card">
                                <div class="category-title">
                                    {icon} {category}
                                    <span style="margin-left: auto; font-size: 1.2rem;">₹{category_total:.2f}</span>
                                </div>
                        """, unsafe_allow_html=True)
                        
                        # Display items in this category
                        for item in items:
                            st.markdown(f"""
                                <div class="expense-item">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span style="font-weight: 500; color: white;">{item['item']}</span>
                                        <span style="font-weight: 600; color: #FFD700; font-size: 1.1rem;">₹{float(item['cost']):.2f}</span>
                                    </div>
                                </div>
                            """, unsafe_allow_html=True)
                        
                        # Category summary
                        avg_cost = category_total / len(items)
                        st.markdown(f"""
                                <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.3); color: rgba(255,255,255,0.9); position: relative; z-index: 1;">
                                    <div style="display: flex; justify-content: space-between;">
                                        <span>Items: {len(items)}</span>
                                        <span>Avg: ₹{avg_cost:.2f}</span>
                                    </div>
                                </div>
                            </div>
                        """, unsafe_allow_html=True)
    
    # Insights and Recommendations Section
    st.markdown("## 💡 AI Insights & Recommendations")
    
    insight_col1, insight_col2 = st.columns(2)
    
    with insight_col1:
        st.markdown("""
            <div class="glass-card">
                <h4 style="color: white; margin-bottom: 1rem;">🎯 Spending Insights</h4>
            </div>
        """, unsafe_allow_html=True)
        
        # Generate insights
        insights = []
        if category_totals:
            highest_cat = max(category_totals, key=category_totals.get)
            highest_pct = (category_totals[highest_cat] / total_expenditure) * 100
            
            if highest_pct > 50:
                insights.append(f"⚠️ **High Concentration**: {highest_cat} represents {highest_pct:.1f}% of total spending")
            elif highest_pct > 30:
                insights.append(f"📊 **Major Category**: {highest_cat} is your primary expense ({highest_pct:.1f}%)")
            
            if len(category_totals) == 1:
                insights.append("📌 **Single Category**: All expenses in one category - consider expense diversification")
            elif len(category_totals) >= 4:
                insights.append("✅ **Balanced**: Good spending distribution across multiple categories")
            
            if total_expenditure > 5000:
                insights.append("💰 **High Spending**: Consider setting monthly budget limits")
            
            # Find most expensive single item
            all_items = []
            for items in categorized_data.values():
                all_items.extend(items)
            
            if all_items:
                most_expensive = max(all_items, key=lambda x: float(x['cost']))
                insights.append(f"💎 **Highest Item**: {most_expensive['item']} (₹{float(most_expensive['cost']):.2f})")
        
        for insight in insights:
            st.markdown(f"""
                <div style="background: rgba(255,255,255,0.1); padding: 1rem; border-radius: 10px; margin: 0.5rem 0; border-left: 4px solid #4ECDC4;">
                    <p style="color: white; margin: 0;">{insight}</p>
                </div>
            """, unsafe_allow_html=True)
    
    with insight_col2:
        st.markdown("""
            <div class="glass-card">
                <h4 style="color: white; margin-bottom: 1rem;">🎯 Smart Recommendations</h4>
            </div>
        """, unsafe_allow_html=True)
        
        # Generate recommendations
        recommendations = []
        if category_totals:
            if 'Dining' in category_totals and category_totals['Dining'] > total_expenditure * 0.3:
                recommendations.append("🍽️ Consider meal planning to reduce dining expenses")
            
            if 'Entertainment' in category_totals and category_totals['Entertainment'] > 2000:
                recommendations.append("🎬 Look for free entertainment alternatives")
            
            if 'Shopping' in category_totals and category_totals['Shopping'] > total_expenditure * 0.4:
                recommendations.append("🛍️ Create a shopping list to avoid impulse purchases")
            
            if len(category_totals) <= 2:
                recommendations.append("📊 Track more expense categories for better budgeting")
            
            recommendations.append("📱 Consider using expense tracking apps for daily monitoring")
            recommendations.append("💡 Set weekly spending limits for each category")
        
        for rec in recommendations:
            st.markdown(f"""
                <div style="background: rgba(255,255,255,0.1); padding: 1rem; border-radius: 10px; margin: 0.5rem 0; border-left: 4px solid #96CEB4;">
                    <p style="color: white; margin: 0;">{rec}</p>
                </div>
            """, unsafe_allow_html=True)
    
    # Agent Collaboration Chat Logs
    st.markdown("## 🤖 AI Agent Collaboration")
    
    st.markdown("""
        <div class="chat-container">
            <div style="text-align: center; margin-bottom: 2rem;">
                <h4 style="color: white;">💬 Multi-Agent Processing Timeline</h4>
                <p style="color: rgba(255,255,255,0.7);">Watch how our AI agents collaborated to process your bill</p>
            </div>
    """, unsafe_allow_html=True)
    
    # Display chat messages with enhanced styling
    for i, (sender, message) in enumerate(chat_log):
        # Determine message style based on sender
        if "UserProxy" in sender:
            style_class = "user-message"
            icon = "👤"
        elif "BillProcessingAgent" in sender:
            style_class = "agent-message"
            icon = "🔍"
        elif "ExpenseSummarizationAgent" in sender:
            style_class = "agent-message"
            icon = "📊"
        elif "GroupChatManager" in sender:
            style_class = "manager-message"
            icon = "🎯"
        else:
            style_class = "agent-message"
            icon = "🤖"
        
        # Add animation delay for staggered appearance
        animation_delay = i * 0.2
        
        st.markdown(f"""
            <div class="chat-message {style_class}" style="animation-delay: {animation_delay}s;">
                <div class="message-sender">
                    {icon} {sender}
                </div>
                <div class="message-content">
                    {message}
                </div>
            </div>
        """, unsafe_allow_html=True)
    
    st.markdown("</div>", unsafe_allow_html=True)
    
    # Export Options
    st.markdown("## 📤 Export Options")
    
    export_col1, export_col2, export_col3 = st.columns(3)
    
    with export_col1:
        if st.button("📊 Export to CSV", key="csv_export"):
            # Create CSV data
            csv_data = []
            for category, items in categorized_data.items():
                for item in items:
                    csv_data.append({
                        'Category': category,
                        'Item': item['item'],
                        'Cost': float(item['cost'])
                    })
            
            if csv_data:
                df = pd.DataFrame(csv_data)
                csv_string = df.to_csv(index=False)
                st.download_button(
                    label="⬇️ Download CSV",
                    data=csv_string,
                    file_name=f"expense_report_{pd.Timestamp.now().strftime('%Y%m%d_%H%M%S')}.csv",
                    mime="text/csv"
                )
    
    with export_col2:
        if st.button("📄 Export Summary", key="summary_export"):
            # Create summary report
            summary_text = f"""
EXPENSE ANALYSIS REPORT
Generated on: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}

SUMMARY:
Total Expenditure: ₹{total_expenditure:.2f}
Number of Categories: {len(category_totals)}
Total Items: {sum(len(items) for items in categorized_data.values())}

CATEGORY BREAKDOWN:
"""
            for category, amount in sorted(category_totals.items(), key=lambda x: x[1], reverse=True):
                percentage = (amount / total_expenditure) * 100 if total_expenditure > 0 else 0
                summary_text += f"- {category}: ₹{amount:.2f} ({percentage:.1f}%)\n"
            
            st.download_button(
                label="⬇️ Download Summary",
                data=summary_text,
                file_name=f"expense_summary_{pd.Timestamp.now().strftime('%Y%m%d_%H%M%S')}.txt",
                mime="text/plain"
            )
    
    with export_col3:
        if st.button("📈 Export Analysis", key="analysis_export"):
            # Create detailed analysis
            analysis_data = {
                'timestamp': pd.Timestamp.now().isoformat(),
                'total_expenditure': total_expenditure,
                'categories': category_totals,
                'detailed_items': categorized_data,
                'insights': {
                    'highest_category': max(category_totals, key=category_totals.get) if category_totals else None,
                    'category_count': len(category_totals),
                    'average_item_cost': total_expenditure / sum(len(items) for items in categorized_data.values()) if sum(len(items) for items in categorized_data.values()) > 0 else 0
                }
            }
            
            json_string = json.dumps(analysis_data, indent=2)
            st.download_button(
                label="⬇️ Download JSON",
                data=json_string,
                file_name=f"expense_analysis_{pd.Timestamp.now().strftime('%Y%m%d_%H%M%S')}.json",
                mime="application/json"
            )

if __name__ == "__main__":
    main()