import streamlit as st
from analyzer import static_code_review
from agents import get_llm, build_agents, setup_crew

st.set_page_config(page_title="AI Python Code Inspector", page_icon="🤖", layout="wide")

st.title("🤖 AI Python Code Inspector")
st.caption("A smarter way to review and auto-fix Python code using static analysis and LLMs.")

with st.sidebar:
    st.header("Instructions")
    st.markdown("""
    1. Paste your Python code in the input area.
    2. Click **Review & Auto-Fix** to get instant feedback and corrections.
    3. Review the static analysis and improved code side by side.
    """)
    st.markdown("---")
    st.markdown("<div style='color: #888;'>Powered by Streamlit & CrewAI</div>", unsafe_allow_html=True)

col1, col2 = st.columns([1, 1])

with col1:
    user_code = st.text_area("Your Python Code", height=260, key="user_code")
    review_btn = st.button("Review & Auto-Fix", use_container_width=True)

with col2:
    st.markdown("### Static Review Result")
    review_output = st.empty()
    st.markdown("### Auto-Fixed Code")
    fixed_code_output = st.empty()

if review_btn:
    if not user_code.strip():
        review_output.warning("Please provide Python code for analysis.")
    else:
        with st.spinner("Running static review and auto-fix..."):
            # Local static review
            static_result = static_code_review(user_code)
            review_output.write(static_result)
            # CrewAI LLM review & fix
            llm = get_llm()
            agents = build_agents(llm)
            crew, review_task, fix_task = setup_crew(user_code, llm, agents)
            results = crew.kickoff()
            # Handle CrewAI output
            if isinstance(results, (list, tuple)) and len(results) == 2:
                review_res, fix_res = results
            elif isinstance(results, dict):
                review_res = results.get('analysis', '')
                fix_res = results.get('correction', '')
            else:
                review_res = "(Unable to extract review result)"
                fix_res = results
            fixed_code_output.code(fix_res, language="python")