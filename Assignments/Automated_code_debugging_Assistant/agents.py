from crewai import Agent, Task, Crew, Process, LLM
from crewai_tools import CodeInterpreterTool
import os

# LLM initialization
def get_llm():
    from dotenv import load_dotenv
    load_dotenv()
    return LLM(
        api_key=os.getenv("GEMINI_API_KEY"),
        model="gemini/gemini-2.0-pro",  # Use Gemini 2.0 for best results
        provider="gemini"
    )

# Agent definitions
def build_agents(llm):
    static_checker = Agent(
        role="Static Code Inspector",
        goal="Identify static issues in Python code without execution.",
        backstory="Expert in AST-based static analysis.",
        llm=llm,
        verbose=True,
        tools=[CodeInterpreterTool()]
    )
    code_repairer = Agent(
        role="Python Code Refiner",
        goal="Resolve detected issues while preserving code intent.",
        backstory="Experienced in Pythonic, PEP 8-compliant fixes.",
        llm=llm,
        verbose=True
    )
    coordinator = Agent(
        role="Review Coordinator",
        goal="Oversee the static review and correction workflow.",
        backstory="Ensures a smooth, high-quality review process.",
        llm=llm,
        verbose=True
    )
    return static_checker, code_repairer, coordinator

# Task and Crew setup
def setup_crew(code, llm, agents):
    static_checker, code_repairer, coordinator = agents
    review_task = Task(
        description=f"Perform static review on the following code:\n```python\n{code}\n```",
        agent=static_checker,
        expected_output="Enumerated list of static code issues."
    )
    fix_task = Task(
        description="Address all identified issues and provide improved code.",
        agent=code_repairer,
        expected_output="Revised Python code and a summary of changes.",
        context=[review_task]
    )
    crew = Crew(
        agents=[static_checker, code_repairer, coordinator],
        tasks=[review_task, fix_task],
        verbose=True,
        process=Process.sequential,
        planning=True
    )
    return crew, review_task, fix_task 