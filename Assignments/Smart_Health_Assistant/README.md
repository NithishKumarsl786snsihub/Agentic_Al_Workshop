# 🤖 Smart Health Assistant

> **A multi-agent AI system that generates personalized health, diet, and fitness plans using Google Gemini and AutoGen, with an interactive UI for user input and plan delivery.**

## 🌟 Overview

The Smart Health Assistant is an advanced AI-powered tool designed to provide users with tailored health recommendations, meal plans, and workout schedules. Leveraging Google's Gemini AI and the AutoGen multi-agent framework, the system simulates collaboration between specialized agents (BMI specialist, nutritionist, fitness trainer) to deliver a comprehensive, actionable health plan.

### Key Innovation
- **Multi-Agent Collaboration**: Specialized agents for BMI analysis, diet planning, and workout scheduling
- **Personalized Recommendations**: Plans are tailored to user input (weight, height, age, gender, diet)
- **Interactive UI**: User-friendly interface built with ipywidgets for seamless data entry and results display
- **Automated Plan Generation**: End-to-end workflow from input to downloadable health plan

## 🎯 Core Features

### 🏗️ **Intelligent Agent System**
- **BMI Agent**: Calculates BMI, categorizes it, and provides health risk/benefit analysis
- **Diet Planner Agent**: Designs meal plans based on BMI, dietary preference, and user profile
- **Workout Scheduler Agent**: Creates a 7-day workout schedule tailored to user needs and agent recommendations
- **User Proxy Agent**: Manages user data and function calls between agents

### 🎨 **Enhanced User Experience**
- **Modern UI**: Gradient headers, sliders, dropdowns, and styled result cards
- **Input Summary**: Visual feedback of user data before plan generation
- **Downloadable Plan**: Saves the final health plan as a text file for easy access
- **Error Handling**: Friendly error messages for API or connection issues

### 🔒 **Security & Configuration**
- **API Key Management**: Enter Gemini API key via input box or environment variable
- **Local & Colab Support**: Designed for local Jupyter and Colab (with minor adjustments)

## 🚀 Quick Start Guide

### Prerequisites
- Google Gemini API key ([Get your API key](https://ai.google.dev))
- Python 3.8+
- Jupyter Notebook or Google Colab

### Step-by-Step Setup

#### 1. **Environment Preparation**
```python
# Install required dependencies (run in a notebook cell)
!pip install pyautogen google-generativeai ipywidgets
```

#### 2. **API Key Configuration**
- **Locally**: Enter your Gemini API key in the input box when prompted, or set the environment variable `GEMINI_API_KEY`.
- **Colab**: Add your API key as a secret (see Colab instructions if needed).

#### 3. **Run the Notebook**
- Open `Smart_Health_Assistant.ipynb` in Jupyter or Colab
- Run all cells
- Enter your health details in the UI and click **Generate Health Plan**

#### 4. **Get Your Plan**
- View agent responses and your complete plan in the notebook
- Download the generated `personalized_health_plan.txt` file

## 🏛️ System Architecture

### Agent Framework
```
┌──────────────┐   ┌───────────────┐   ┌────────────────────┐
│  BMI Agent   │   │ Diet Planner  │   │ Workout Scheduler  │
├──────────────┤   ├───────────────┤   ├────────────────────┤
│ BMI Analysis │→→│ Meal Planning │→→│ 7-Day Workout Plan │
│ Health Recs  │   │ Calorie Target│   │ Cardio/Strength   │
└──────────────┘   └───────────────┘   └────────────────────┘
         ↑                ↑                     ↑
         └─────User Proxy Agent (data flow)─────┘
```

### Conversation Flow
1. **User Input**: Enter weight, height, age, gender, diet
2. **BMI Agent**: Calculates BMI and provides analysis
3. **Diet Planner**: Designs meal plan based on BMI and preferences
4. **Workout Scheduler**: Creates workout plan based on previous agent outputs
5. **Results Display**: All agent responses shown in styled cards
6. **Download**: Final plan saved as a text file

## 📊 Technical Specifications

### Dependencies
```python
pyautogen>=0.2.0
google-generativeai>=0.3.2
ipywidgets>=8.0.0
IPython>=8.0.0
```

### System Requirements
- **Platform**: Jupyter Notebook, JupyterLab, or Google Colab
- **Python Version**: 3.8+
- **Memory**: 2GB RAM minimum
- **API**: Google Gemini API access

## 💡 Use Cases

### 🏥 **Personal Health Management**
- Get a personalized health, diet, and fitness plan in seconds
- Understand your BMI and health risks
- Receive actionable meal and workout suggestions

### 🏢 **Professional/Wellness Coaching**
- Rapidly generate plans for clients or groups
- Use as a template for further customization

### 🎓 **Educational Purposes**
- Demonstrate multi-agent AI collaboration
- Teach health, nutrition, and fitness planning concepts

## 🛠️ Advanced Configuration

### Customizing Agent Behavior
```python
# Edit system prompts in the init_agents() function for each agent
# Example:
BMI_AGENT_PROMPT = """
You are a BMI specialist. ...
"""
```

### UI Customization
```python
# Modify color schemes and widget styles in the create_ui() function
```

## 📈 Performance Optimization

### Best Practices
1. **Accurate Input**: Enter correct health details for best results
2. **API Management**: Monitor Gemini API usage to avoid rate limiting
3. **Restart Kernel**: If you encounter memory or import errors, restart the notebook kernel

### Troubleshooting
| Issue | Solution |
|-------|----------|
| API Key Error | Ensure your API key is valid and entered correctly |
| Import Errors | Re-run installation cell and restart kernel |
| No Output | Check for errors in the notebook output |

## 🤝 Contributing

We welcome improvements to the Smart Health Assistant! Suggestions include:
- **Agent Enhancement**: Add new health metrics or agent roles
- **UI/UX Improvements**: Enhance the interface and result presentation
- **Performance Optimization**: Speed up plan generation
- **Documentation**: Expand usage examples and troubleshooting

## 🙏 Acknowledgments

- **Google AI**: For the Gemini API
- **AutoGen**: For multi-agent orchestration
- **Open Source Community**: For inspiration and support

--- 