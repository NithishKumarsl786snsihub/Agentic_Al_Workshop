import os
import json
from typing import List, Dict, Any
from dotenv import load_dotenv
from pydantic import BaseModel, Field
# from crewai import Agent, Task, Crew, Process  # Temporarily disabled due to litellm issues
from crewai.tools import BaseTool
import google.generativeai as genai
import requests
import streamlit as st
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import HumanMessage, AIMessage
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime

# Load environment variables
load_dotenv()

# Set CrewAI to use specific LLM provider
os.environ["CREWAI_LLM_PROVIDER"] = "langchain"

# API Keys
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SERPER_API_KEY = os.getenv("SERPER_API_KEY")

# Configure Gemini
if GEMINI_API_KEY:
    # Configure for direct Gemini API calls
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-2.0-flash-exp")
    
    # Initialize Gemini LLM for CrewAI using langchain_google_genai
    # Use the latest Gemini 2.0 Flash model
    gemini_llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash-exp",
        google_api_key=GEMINI_API_KEY,
        temperature=0.7
    )

# Pydantic Models for Structured Outputs
class LearningMaterial(BaseModel):
    title: str = Field(description="Title of the learning material")
    link: str = Field(description="URL link to the material")
    type: str = Field(description="Type: video, article, or exercise")
    description: str = Field(description="Brief description of the content")

class QuizQuestion(BaseModel):
    question: str = Field(description="The quiz question")
    options: List[str] = Field(description="List of 4 multiple choice options")
    correct_answer: str = Field(description="The correct answer")
    explanation: str = Field(description="Explanation of why this is correct")

class ProjectIdea(BaseModel):
    title: str = Field(description="Project title")
    description: str = Field(description="Detailed project description")
    difficulty: str = Field(description="Difficulty level: beginner, intermediate, advanced")
    estimated_time: str = Field(description="Estimated completion time")
    skills_learned: List[str] = Field(description="List of skills that will be learned")

class LearningPath(BaseModel):
    topic: str = Field(description="The learning topic")
    materials: List[LearningMaterial] = Field(description="Curated learning materials")
    quiz: List[QuizQuestion] = Field(description="Quiz questions")
    projects: List[ProjectIdea] = Field(description="Project suggestions")

# Custom Tools
class ProjectSuggestionTool(BaseTool):
    name: str = "Project Suggestion Tool"
    description: str = "Generate project ideas tailored to user's expertise level and topics"
    
    def _run(self, topic: str, level: str) -> str:
        try:
            prompt = f"""
            Generate 3 practical project ideas for someone learning {topic} at {level} level.
            
            For each project, provide:
            - Title
            - Detailed description (2-3 sentences)
            - Estimated completion time
            - Key skills that will be learned
            
            Level guidelines:
            - Beginner: Simple, guided projects with clear steps
            - Intermediate: Projects requiring some independent problem-solving
            - Advanced: Complex projects requiring expertise and creativity
            
            Format as JSON array with objects containing: title, description, difficulty, estimated_time, skills_learned
            """
            
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            return json.dumps([{
                "title": f"Error generating projects: {str(e)}",
                "description": "Unable to generate project suggestions",
                "difficulty": level,
                "estimated_time": "N/A",
                "skills_learned": ["Error handling"]
            }])

# Helper Functions
def search_learning_materials(topic: str) -> List[LearningMaterial]:
    """Search for learning materials using Serper API"""
    if not SERPER_API_KEY:
        return [LearningMaterial(
            title="Serper API key required",
            link="",
            type="error",
            description="Please set SERPER_API_KEY to search for materials"
        )]
    
    try:
        url = "https://google.serper.dev/search"
        headers = {"X-API-KEY": SERPER_API_KEY}
        
        materials = []
        
        # Search for different types of content
        searches = [
            (f"{topic} tutorial video", "video"),
            (f"{topic} guide article", "article"),
            (f"{topic} practice exercises", "exercise")
        ]
        
        for query, content_type in searches:
            try:
                response = requests.post(url, json={"q": query}, headers=headers, timeout=10)
                results = response.json()
                
                for item in results.get("organic", [])[:2]:  # Get top 2 results
                    materials.append(LearningMaterial(
                        title=item.get('title', 'Untitled'),
                        link=item.get('link', ''),
                        type=content_type,
                        description=item.get('snippet', 'No description available')[:150]
                    ))
            except Exception as e:
                materials.append(LearningMaterial(
                    title=f"Search error for {content_type}",
                    link="",
                    type=content_type,
                    description=f"Error: {str(e)}"
                ))
        
        return materials
    except Exception as e:
        return [LearningMaterial(
            title=f"Error searching materials: {str(e)}",
            link="",
            type="error",
            description="Unable to search for learning materials"
        )]

def generate_quiz_questions(topic: str, num_questions: int = 3) -> List[QuizQuestion]:
    """Generate quiz questions using Gemini"""
    try:
        prompt = f"""
        Create {num_questions} multiple-choice questions about {topic}.
        
        For each question, provide:
        - A clear, educational question
        - 4 plausible answer choices
        - The correct answer
        - A brief explanation of why it's correct
        
        Make the questions test understanding, not just memorization.
        Format as JSON array with objects containing: question, options (array), correct_answer, explanation
        """
        
        response = model.generate_content(prompt)
        
        # Try to parse JSON response
        try:
            questions_data = json.loads(response.text)
            questions = []
            
            for q_data in questions_data[:num_questions]:
                questions.append(QuizQuestion(
                    question=q_data.get('question', 'Question not available'),
                    options=q_data.get('options', ['A', 'B', 'C', 'D']),
                    correct_answer=q_data.get('correct_answer', 'A'),
                    explanation=q_data.get('explanation', 'No explanation available')
                ))
            
            return questions
        except json.JSONDecodeError:
            # Fallback parsing if JSON format fails
            return [QuizQuestion(
                question=f"What is a key concept in {topic}?",
                options=["Option A", "Option B", "Option C", "Option D"],
                correct_answer="Option A",
                explanation="This is a sample question due to parsing error."
            )]
            
    except Exception as e:
        return [QuizQuestion(
            question=f"Error generating quiz for {topic}",
            options=["Error"]*4,
            correct_answer="Error",
            explanation=f"Unable to generate quiz: {str(e)}"
        )]

# CrewAI Agents
def create_agents():
    learning_agent = Agent(
        role="Learning Material Curator",
        goal="Find and curate the best learning resources for any given topic",
        backstory="""You are an expert educational researcher with 10+ years of experience in 
        curriculum development. You excel at finding diverse, high-quality learning materials 
        including videos, articles, and interactive exercises. You have access to web search 
        capabilities and can identify the most effective resources for different learning styles.""",
        llm=gemini_llm,
        verbose=True,
        allow_delegation=False
    )
    
    quiz_agent = Agent(
        role="Quiz Creator Specialist",
        goal="Create engaging and educational assessment quizzes for any topic",
        backstory="""You are a master of educational assessment with expertise in cognitive 
        science and learning theory. You create quizzes that not only test knowledge but also 
        promote deeper understanding. Your questions are carefully crafted to be challenging 
        yet fair, and you always provide clear explanations for answers.""",
        llm=gemini_llm,
        verbose=True,
        allow_delegation=False
    )
    
    project_agent = Agent(
        role="Project Mentor and Advisor",
        goal="Design practical, hands-on projects that match learners' skill levels",
        backstory="""You are an experienced project-based learning specialist and mentor. 
        You have guided thousands of learners through practical projects that build real-world 
        skills. You understand how to scale project complexity based on skill level and create 
        projects that are both challenging and achievable.""",
        llm=gemini_llm,
        verbose=True,
        allow_delegation=False,
        tools=[ProjectSuggestionTool()]
    )
    
    return learning_agent, quiz_agent, project_agent

# CrewAI Tasks
def create_tasks(topic: str, level: str, learning_agent, quiz_agent, project_agent):
    learning_task = Task(
        description=f"""Search for and curate comprehensive learning materials about '{topic}'.
        Find a diverse mix of:
        1. Educational videos and tutorials (2-3 high-quality sources)
        2. Articles, guides, and documentation (2-3 comprehensive sources)
        3. Interactive exercises and practice materials (2-3 hands-on resources)
        
        Focus on materials that are:
        - Up-to-date and relevant
        - Suitable for {level} level learners
        - From reputable sources
        - Covering different aspects of the topic
        
        For each material, provide the title, link, type, and a brief description.""",
        agent=learning_agent,
        expected_output=f"""A curated list of 6-9 learning materials for {topic} including:
        - Videos: Educational videos with titles, links, and descriptions
        - Articles: Comprehensive guides with titles, links, and descriptions
        - Exercises: Practice materials with titles, links, and descriptions
        All materials should be appropriate for {level} level learners."""
    )
    
    quiz_task = Task(
        description=f"""Create an educational quiz about '{topic}' with 3 well-crafted multiple-choice questions.
        
        Requirements for each question:
        - Test important concepts and understanding (not just memorization)
        - Include 4 plausible answer choices
        - Provide the correct answer
        - Include a clear explanation of why the answer is correct
        - Be appropriate for {level} level learners
        
        Focus on questions that:
        - Encourage critical thinking
        - Cover different aspects of the topic
        - Are clearly worded and unambiguous
        - Have educational value""",
        agent=quiz_agent,
        expected_output=f"""A high-quality quiz with 3 multiple-choice questions about {topic}, each containing:
        - Clear question text
        - 4 answer options
        - Correct answer identified
        - Explanation of the correct answer
        All questions should be appropriate for {level} level learners."""
    )
    
    project_task = Task(
        description=f"""Design 3 practical project ideas about '{topic}' for {level} level learners.
        
        Use the Project Suggestion Tool to generate projects that:
        - Match the {level} skill level appropriately
        - Provide hands-on experience with {topic}
        - Build practical, real-world skills
        - Have clear learning objectives
        
        For each project, specify:
        - Engaging title
        - Detailed description (what they'll build/create)
        - Estimated completion time
        - Key skills that will be developed
        - Why it's suitable for {level} level
        
        Ensure projects progress from foundational to more complex concepts.""",
        agent=project_agent,
        expected_output=f"""3 well-designed project ideas for {level} level learners studying {topic}, each with:
        - Project title
        - Detailed description
        - Estimated completion time
        - List of skills to be learned
        - Appropriate difficulty level"""
    )
    
    return learning_task, quiz_task, project_task

# Main CrewAI orchestration function
def generate_learning_path(topic: str, level: str) -> Dict[str, Any]:
    """Generate complete learning path using CrewAI sequential process"""
    try:
        # For now, let's bypass CrewAI and use direct Gemini calls
        # This will avoid the litellm provider issue
        
        # Generate actual structured data using helper functions
        materials = search_learning_materials(topic)
        quiz = generate_quiz_questions(topic)
        
        # Parse project suggestions
        project_tool = ProjectSuggestionTool()
        project_data = project_tool._run(topic, level)
        
        try:
            projects_json = json.loads(project_data)
            projects = [ProjectIdea(**proj) for proj in projects_json[:3]]
        except:
            projects = [ProjectIdea(
                title=f"Hands-on {topic} Project",
                description=f"A practical project to apply {topic} concepts at {level} level",
                difficulty=level.lower(),
                estimated_time="1-2 weeks",
                skills_learned=[topic, "Problem solving"]
            )]
        
        return {
            "success": True,
            "learning_path": LearningPath(
                topic=topic,
                materials=materials,
                quiz=quiz,
                projects=projects
            ),
            "crew_output": "Using direct Gemini API calls (CrewAI bypassed due to litellm compatibility issues)"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "learning_path": None
        }

# Streamlit UI
def main():
    st.set_page_config(
        page_title="AI Learning Path Generator",
        page_icon="🎯",
        layout="wide",
        initial_sidebar_state="expanded"
    )
    
    # Custom CSS for modern UI
    st.markdown("""
    <style>
    .main {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    }
    .block-container {
        padding-top: 1rem;
        padding-bottom: 0rem;
        padding-left: 5rem;
        padding-right: 5rem;
    }
    .sidebar .sidebar-content {
        background: linear-gradient(180deg, #2C3E50 0%, #34495E 100%);
        color: white;
    }
    .stButton > button {
        background: linear-gradient(90deg, #FF6B6B 0%, #4ECDC4 100%);
        color: white;
        border: none;
        border-radius: 25px;
        padding: 0.75rem 2rem;
        font-weight: bold;
        font-size: 1.1rem;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }
    .stButton > button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.3);
    }
    .metric-card {
        background: rgba(255,255,255,0.1);
        padding: 1rem;
        border-radius: 15px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.2);
        margin: 0.5rem 0;
    }
    .quiz-card {
        background: rgba(255,255,255,0.05);
        padding: 1.5rem;
        border-radius: 15px;
        border-left: 4px solid #4ECDC4;
        margin: 1rem 0;
    }
    .project-card {
        background: rgba(255,255,255,0.05);
        padding: 1.5rem;
        border-radius: 15px;
        border-left: 4px solid #FF6B6B;
        margin: 1rem 0;
    }
    .material-card {
        background: rgba(255,255,255,0.05);
        padding: 1rem;
        border-radius: 10px;
        margin: 0.5rem 0;
        border: 1px solid rgba(255,255,255,0.1);
    }
    .stTabs [data-baseweb="tab-list"] {
        gap: 2rem;
    }
    .stTabs [data-baseweb="tab"] {
        font-size: 1.2rem;
        font-weight: 600;
        color: rgba(255,255,255,0.7);
        background: rgba(255,255,255,0.1);
        border-radius: 15px 15px 0 0;
        padding: 1rem 2rem;
    }
    .stTabs [aria-selected="true"] {
        color: white;
        background: rgba(255,255,255,0.2);
    }
    .header-container {
        text-align: center;
        padding: 2rem 0;
        margin-bottom: 2rem;
    }
    .header-title {
        font-size: 3.5rem;
        font-weight: 800;
        background: linear-gradient(90deg, #FFD93D 0%, #FF6B6B 50%, #4ECDC4 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0.5rem;
    }
    .header-subtitle {
        font-size: 1.3rem;
        color: rgba(255,255,255,0.8);
        margin-bottom: 1rem;
    }
    .progress-container {
        background: rgba(255,255,255,0.1);
        border-radius: 25px;
        padding: 0.5rem;
        margin: 1rem 0;
    }
    </style>
    """, unsafe_allow_html=True)
    
    # Header
    st.markdown("""
    <div class="header-container">
        <h1 class="header-title">🎯 AI Learning Path Generator</h1>
        <p class="header-subtitle">Personalized education powered by CrewAI & Gemini 1.5 Flash</p>
        <div style="text-align: center;">
            <span style="background: rgba(255,255,255,0.2); padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.9rem;">
                🤖 Sequential AI Agents • 📚 Curated Materials • 📝 Smart Quizzes • 🚀 Project Ideas
            </span>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Sidebar
    with st.sidebar:
        st.markdown("<h2 style='color: white; margin-bottom: 1rem;'>🎛️ Learning Configuration</h2>", unsafe_allow_html=True)
        
        topic = st.text_input(
            "📚 What do you want to learn?",
            placeholder="e.g., Machine Learning, Python, Data Science",
            help="Enter any topic you'd like to explore"
        )
        
        level = st.selectbox(
            "📊 Your current skill level:",
            ["Beginner", "Intermediate", "Advanced"],
            help="This helps tailor the content difficulty"
        )
        
        st.markdown("---")
        
        generate_btn = st.button("🚀 Generate Learning Path", type="primary")
        
        st.markdown("---")
        
        # API Status
        st.markdown("<h3 style='color: white;'>🔧 API Status</h3>", unsafe_allow_html=True)
        
        gemini_status = "✅ Connected" if GEMINI_API_KEY else "❌ Missing"
        serper_status = "✅ Connected" if SERPER_API_KEY else "❌ Missing"
        
        st.markdown(f"""
        <div style='color: white; font-size: 0.9rem;'>
            <div>🤖 Gemini API: {gemini_status}</div>
            <div>🔍 Serper API: {serper_status}</div>
        </div>
        """, unsafe_allow_html=True)
        
        if not GEMINI_API_KEY or not SERPER_API_KEY:
            st.warning("Please set your API keys in environment variables or .env file")
        
        st.markdown("---")
        st.markdown("""
        <div style='color: rgba(255,255,255,0.7); font-size: 0.8rem; text-align: center;'>
            <p>Powered by:</p>
            <p>🔥 Google Gemini 1.5 Flash</p>
            <p>🤖 CrewAI Framework</p>
            <p>🔍 Serper Search API</p>
        </div>
        """, unsafe_allow_html=True)
    
    # Main content
    if not GEMINI_API_KEY:
        st.error("🚨 Gemini API key is required. Please set GEMINI_API_KEY in your environment variables.")
        st.info("💡 Get your API key from: https://makersuite.google.com/app/apikey")
        return
    
    if not SERPER_API_KEY:
        st.warning("⚠️ Serper API key is missing. Web search functionality will be limited.")
        st.info("💡 Get your API key from: https://serper.dev/")
    
    if generate_btn:
        if not topic.strip():
            st.error("Please enter a topic to learn about!")
            return
        
        # Progress tracking
        progress_bar = st.progress(0)
        status_text = st.empty()
        
        status_text.text("🤖 Initializing AI agents...")
        progress_bar.progress(20)
        
        with st.spinner("🔍 Generating your personalized learning path..."):
            status_text.text("📚 Curating learning materials...")
            progress_bar.progress(40)
            
            result = generate_learning_path(topic, level)
            
            status_text.text("📝 Creating quiz questions...")
            progress_bar.progress(70)
            
            status_text.text("🚀 Designing project ideas...")
            progress_bar.progress(90)
            
            progress_bar.progress(100)
            status_text.text("✅ Learning path generated successfully!")
        
        if result["success"]:
            learning_path = result["learning_path"]
            
            # Success message with metrics
            col1, col2, col3, col4 = st.columns(4)
            
            with col1:
                st.markdown(f"""
                <div class="metric-card">
                    <h3>📚 Materials</h3>
                    <h2>{len(learning_path.materials)}</h2>
                </div>
                """, unsafe_allow_html=True)
            
            with col2:
                st.markdown(f"""
                <div class="metric-card">
                    <h3>📝 Quiz Questions</h3>
                    <h2>{len(learning_path.quiz)}</h2>
                </div>
                """, unsafe_allow_html=True)
            
            with col3:
                st.markdown(f"""
                <div class="metric-card">
                    <h3>🚀 Projects</h3>
                    <h2>{len(learning_path.projects)}</h2>
                </div>
                """, unsafe_allow_html=True)
            
            with col4:
                st.markdown(f"""
                <div class="metric-card">
                    <h3>🎯 Level</h3>
                    <h2>{level}</h2>
                </div>
                """, unsafe_allow_html=True)
            
            st.markdown("---")
            
            # Tabs for different sections
            tab1, tab2, tab3, tab4 = st.tabs(["📚 Learning Materials", "📝 Knowledge Quiz", "🚀 Project Ideas", "🔍 AI Insights"])
            
            with tab1:
                st.markdown("### 📚 Curated Learning Materials")
                
                # Group materials by type
                videos = [m for m in learning_path.materials if m.type == "video"]
                articles = [m for m in learning_path.materials if m.type == "article"]
                exercises = [m for m in learning_path.materials if m.type == "exercise"]
                
                col1, col2, col3 = st.columns(3)
                
                with col1:
                    st.markdown("#### 🎥 Videos")
                    for video in videos:
                        st.markdown(f"""
                        <div class="material-card">
                            <h4>{video.title}</h4>
                            <p style="font-size: 0.9rem; opacity: 0.8;">{video.description}</p>
                            <a href="{video.link}" target="_blank" style="color: #4ECDC4;">🔗 Watch Now</a>
                        </div>
                        """, unsafe_allow_html=True)
                
                with col2:
                    st.markdown("#### 📄 Articles")
                    for article in articles:
                        st.markdown(f"""
                        <div class="material-card">
                            <h4>{article.title}</h4>
                            <p style="font-size: 0.9rem; opacity: 0.8;">{article.description}</p>
                            <a href="{article.link}" target="_blank" style="color: #FF6B6B;">🔗 Read Now</a>
                        </div>
                        """, unsafe_allow_html=True)
                
                with col3:
                    st.markdown("#### 💪 Exercises")
                    for exercise in exercises:
                        st.markdown(f"""
                        <div class="material-card">
                            <h4>{exercise.title}</h4>
                            <p style="font-size: 0.9rem; opacity: 0.8;">{exercise.description}</p>
                            <a href="{exercise.link}" target="_blank" style="color: #FFD93D;">🔗 Practice Now</a>
                        </div>
                        """, unsafe_allow_html=True)
            
            with tab2:
                st.markdown("### 📝 Knowledge Assessment Quiz")
                
                for i, question in enumerate(learning_path.quiz, 1):
                    st.markdown(f"""
                    <div class="quiz-card">
                        <h4>Question {i}: {question.question}</h4>
                        <div style="margin: 1rem 0;">
                    """, unsafe_allow_html=True)
                    
                    for j, option in enumerate(question.options):
                        st.markdown(f"**{chr(65+j)})** {option}")
                    
                    st.markdown(f"""
                        </div>
                        <div style="background: rgba(76, 205, 196, 0.2); padding: 1rem; border-radius: 10px; margin-top: 1rem;">
                            <strong>✅ Correct Answer:</strong> {question.correct_answer}<br>
                            <strong>💡 Explanation:</strong> {question.explanation}
                        </div>
                    </div>
                    """, unsafe_allow_html=True)
            
            with tab3:
                st.markdown("### 🚀 Hands-on Project Ideas")
                
                for i, project in enumerate(learning_path.projects, 1):
                    # Create difficulty color
                    difficulty_colors = {
                        "beginner": "#4ECDC4",
                        "intermediate": "#FFD93D", 
                        "advanced": "#FF6B6B"
                    }
                    color = difficulty_colors.get(project.difficulty.lower(), "#4ECDC4")
                    
                    st.markdown(f"""
                    <div class="project-card">
                        <h4>🎯 Project {i}: {project.title}</h4>
                        <p style="font-size: 1rem; margin: 1rem 0;">{project.description}</p>
                        <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin: 1rem 0;">
                            <span style="background: {color}; color: black; padding: 0.3rem 0.8rem; border-radius: 15px; font-size: 0.8rem; font-weight: bold;">
                                📊 {project.difficulty.title()}
                            </span>
                            <span style="background: rgba(255,255,255,0.2); padding: 0.3rem 0.8rem; border-radius: 15px; font-size: 0.8rem;">
                                ⏱️ {project.estimated_time}
                            </span>
                        </div>
                        <div>
                            <strong>🎯 Skills You'll Learn:</strong><br>
                            <div style="margin-top: 0.5rem;">
                    """, unsafe_allow_html=True)
                    
                    for skill in project.skills_learned:
                        st.markdown(f"""
                        <span style="background: rgba(255,255,255,0.1); padding: 0.2rem 0.6rem; margin: 0.2rem; border-radius: 10px; font-size: 0.8rem; display: inline-block;">
                            {skill}
                        </span>
                        """, unsafe_allow_html=True)
                    
                    st.markdown("</div></div></div>", unsafe_allow_html=True)
            
            with tab4:
                st.markdown("### 🔍 AI Generation Insights")
                
                # Create a simple visualization
                fig = go.Figure()
                
                categories = ['Materials', 'Quiz Questions', 'Projects']
                values = [len(learning_path.materials), len(learning_path.quiz), len(learning_path.projects)]
                colors = ['#4ECDC4', '#FFD93D', '#FF6B6B']
                
                fig.add_trace(go.Bar(
                    x=categories,
                    y=values,
                    marker_color=colors,
                    text=values,
                    textposition='auto',
                    hovertemplate='<b>%{x}</b><br>Count: %{y}<extra></extra>'
                ))
                
                fig.update_layout(
                    title=f"Generated Content Overview for {topic}",
                    xaxis_title="Content Type",
                    yaxis_title="Count",
                    plot_bgcolor='rgba(0,0,0,0)',
                    paper_bgcolor='rgba(0,0,0,0)',
                    font=dict(color='white'),
                    title_font_size=16
                )
                
                st.plotly_chart(fig, use_container_width=True)
                
                # Show crew execution details
                with st.expander("🤖 View AI Agent Execution Details"):
                    st.code(result.get("crew_output", "No execution details available"), language="text")
                
                # Generation timestamp
                st.info(f"🕒 Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        else:
            st.error(f"❌ Failed to generate learning path: {result.get('error', 'Unknown error')}")
            st.info("Please check your API keys and try again.")

if __name__ == "__main__":
    if not GEMINI_API_KEY:
        st.error("🚨 Please set your GEMINI_API_KEY environment variable")
        st.stop()
    
    main()