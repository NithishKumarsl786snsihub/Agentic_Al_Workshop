# Streamlining Exploratory Data Analysis (EDA) with a Multi-Agent System using Autogen

## Overview
Exploratory Data Analysis (EDA) is a crucial step in data science, involving the understanding of a dataset’s structure, characteristics, and insights before applying advanced models. This project simplifies and automates the EDA process using a multi-agent system built with [Autogen](https://github.com/microsoft/autogen). Each agent is designed for a specific role, ensuring modularity, specialization, and high-quality results.

## Key Features
- **Multi-Agent System**: Modular agents for data preparation, analysis, reporting, critique, execution, and administration.
- **Interactive UI**: Button-based interface with secure API key input, drag-and-drop file upload, and real-time progress updates.
- **Comprehensive Analysis**: Automated data cleaning, statistical insights, visualizations, and professional report generation.
- **Quality Assurance**: Critic and Executor agents review and validate outputs for accuracy and clarity.

## Agent Architecture
- **Data Preparation Agent**: Handles data cleaning and preprocessing.
- **EDA Agent**: Performs statistical summarization, generates insights, and creates visualizations (histograms, heatmaps, bar charts).
- **Report Generator Agent**: Produces a well-structured EDA report with clear findings and visualizations.
- **Critic Agent**: Reviews outputs, providing feedback to improve clarity, accuracy, and actionability.
- **Executor Agent**: Validates code and ensures the accuracy of results.
- **Admin Agent**: Oversees workflow, coordinates agents, and maintains project alignment.

Agents communicate and collaborate using Autogen, iteratively refining the analysis and report based on feedback.

## How to Use
1. **Run the Notebook**: Open and execute all cells in `Streamlining_Exploratory_Data_Analysis_(EDA)_with_a_Multi_Agent_System_using_Autogen.ipynb`. Required packages will be installed automatically.
2. **Setup API Key**: Enter your Gemini API key (obtainable from [Google AI Studio](https://aistudio.google.com/app/apikey)). The UI provides a secure password field for input.
3. **Upload Dataset**: Use the drag-and-drop interface to upload your CSV file.
4. **Run Analysis**: Click the button to start the multi-agent workflow.

The system will automatically:
- Analyze your data structure
- Suggest cleaning steps
- Generate statistical insights
- Create visualizations
- Produce a professional EDA report
- Provide quality feedback and validation

## Output
The final output is a comprehensive EDA report that includes:
- An overview of the data
- Key insights and findings
- Detailed visualizations
- A summary of conclusions, incorporating feedback from the Critic Agent

## Benefits
- **Efficiency**: Automates repetitive EDA tasks
- **Reproducibility**: Ensures consistent, high-quality analysis
- **Collaboration**: Modular agent design supports feedback and iterative improvement
- **Professional Reporting**: Generates ready-to-use EDA reports for stakeholders


## Requirements
- Python 3.8+
- [Autogen](https://github.com/microsoft/autogen)
- Gemini API key (for LLM-powered agents)
- All other dependencies are installed automatically via the notebook

