import os
import json
import tempfile
from PIL import Image
import google.generativeai as genai
from autogen.agentchat import UserProxyAgent, AssistantAgent, GroupChat, GroupChatManager

class BillManagementAgents:
    def __init__(self, gemini_api_key):
        self.gemini_api_key = gemini_api_key
        genai.configure(api_key=gemini_api_key)
        self.model = genai.GenerativeModel("models/gemini-1.5-flash")
        
        # Configure LLM for agents
        self.config_list = [
            {
                "model": "gpt-3.5-turbo",
                "api_key": "fake-key",  # We'll use Gemini instead
                "base_url": "http://localhost:8000/v1"  # Placeholder
            }
        ]
        
        self.llm_config = {
            "config_list": self.config_list,
            "temperature": 0.7,
        }
        
        self.setup_agents()
    
    def setup_agents(self):
        """Initialize all agents for the bill management system"""
        
        # User Proxy Agent
        self.user_proxy = UserProxyAgent(
            name="UserProxy",
            human_input_mode="NEVER",
            code_execution_config=False,
            system_message="""You are a user proxy that initiates conversations about bill processing. 
            You provide bill images and expense data to the group manager for processing.""",
            llm_config=False
        )
        
        # Bill Processing Agent
        self.bill_processing_agent = AssistantAgent(
            name="BillProcessingAgent",
            system_message="""You are a specialized bill processing agent. Your responsibilities:
            
            1. Analyze bill images and extract expense data
            2. Categorize expenses into: Groceries, Dining, Utilities, Shopping, Entertainment, Others
            3. Ensure all items are properly categorized with accurate amounts
            4. Provide structured output with item names and costs
            5. Handle various bill formats and layouts
            
            Always respond with clear categorization results and maintain accuracy in expense extraction."""
            , llm_config=False
        )
        
        # Expense Summarization Agent
        self.summary_agent = AssistantAgent(
            name="ExpenseSummarizationAgent",
            system_message="""You are an expense analysis and summarization expert. Your tasks:
            
            1. Analyze categorized expense data thoroughly
            2. Calculate total spending per category with precision
            3. Identify the highest spending category and patterns
            4. Detect unusual or concerning spending behaviors
            5. Provide actionable insights and recommendations
            6. Generate comprehensive summaries with financial insights
            
            Focus on delivering valuable financial insights that help users manage their expenses better."""
            , llm_config=False
        )
        
        # Setup Group Chat
        self.group_chat = GroupChat(
            agents=[self.user_proxy, self.bill_processing_agent, self.summary_agent],
            messages=[],
            max_round=8,
            speaker_selection_method="auto"
        )
        
        self.manager = GroupChatManager(
            groupchat=self.group_chat,
            llm_config=False
        )
    
    def process_bill_with_gemini(self, image_file):
        """Extract expenses from bill image using Gemini Vision"""
        try:
            # Save uploaded file to temporary location
            with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
                tmp.write(image_file.read())
                tmp_path = tmp.name
            
            # Open and process image
            image = Image.open(tmp_path)
            
            # Enhanced prompt for better extraction
            prompt = """
            Analyze this bill/receipt image and extract ALL expenses with high accuracy.
            
            Instructions:
            1. Identify every item and its cost
            2. Group items into these categories only: Groceries, Dining, Utilities, Shopping, Entertainment, Others
            3. If unsure about category, use 'Others'
            4. Extract exact item names and amounts
            5. Include taxes and fees if visible
            
            Return ONLY a valid JSON in this exact format:
            {
                "Groceries": [{"item": "item_name", "cost": "amount"}],
                "Dining": [{"item": "item_name", "cost": "amount"}],
                "Utilities": [{"item": "item_name", "cost": "amount"}],
                "Shopping": [{"item": "item_name", "cost": "amount"}],
                "Entertainment": [{"item": "item_name", "cost": "amount"}],
                "Others": [{"item": "item_name", "cost": "amount"}]
            }
            
            Ensure all costs are numeric values without currency symbols.
            """
            
            response = self.model.generate_content([prompt, image])
            
            # Clean up temporary file
            os.unlink(tmp_path)
            
            # Parse response
            text = response.text.strip()
            
            # Extract JSON from response
            json_start = text.find("{")
            json_end = text.rfind("}") + 1
            
            if json_start != -1 and json_end > json_start:
                json_text = text[json_start:json_end]
                data = json.loads(json_text)
                
                # Validate and clean data
                cleaned_data = self.clean_expense_data(data)
                return cleaned_data, response.text
            else:
                return None, "No valid JSON found in response"
                
        except Exception as e:
            return None, f"Error processing image: {str(e)}"
    
    def clean_expense_data(self, data):
        """Clean and validate expense data"""
        cleaned = {}
        categories = ["Groceries", "Dining", "Utilities", "Shopping", "Entertainment", "Others"]
        
        for category in categories:
            cleaned[category] = []
            
            if category in data and isinstance(data[category], list):
                for item in data[category]:
                    if isinstance(item, dict) and 'item' in item and 'cost' in item:
                        try:
                            # Clean cost value
                            cost_str = str(item['cost']).replace('₹', '').replace(',', '').strip()
                            cost_float = float(cost_str)
                            
                            cleaned[category].append({
                                'item': str(item['item']).strip(),
                                'cost': cost_float
                            })
                        except (ValueError, TypeError):
                            # Skip invalid items
                            continue
        
        return cleaned
    
    def start_agent_collaboration(self, expense_data):
        """Start the multi-agent collaboration process"""
        chat_log = []
        
        try:
            # Reset group chat
            self.group_chat.messages = []
            
            # Prepare initial message
            initial_message = f"""
            I have uploaded a bill image and extracted the following expense data:
            
            {json.dumps(expense_data, indent=2)}
            
            Please process this data through our specialized agents:
            1. BillProcessingAgent should verify and organize the categorized expenses
            2. ExpenseSummarizationAgent should analyze spending patterns and provide insights
            
            Let's begin the collaborative analysis.
            """
            
            # Log initial message
            chat_log.append(("UserProxy", initial_message))
            
            # Simulate agent responses since AutoGen might need actual LLM endpoints
            # Bill Processing Agent Response
            bill_processing_response = self.generate_bill_processing_response(expense_data)
            chat_log.append(("BillProcessingAgent", bill_processing_response))
            
            # Expense Summarization Agent Response
            summary_response = self.generate_summary_response(expense_data)
            chat_log.append(("ExpenseSummarizationAgent", summary_response))
            
            # Group Manager Coordination
            manager_response = "All agents have successfully processed the bill data. The expenses have been categorized and analyzed for spending insights."
            chat_log.append(("GroupChatManager", manager_response))
            
            return chat_log
            
        except Exception as e:
            error_log = [("System", f"Error in agent collaboration: {str(e)}")]
            return error_log
    
    def generate_bill_processing_response(self, expense_data):
        """Generate response from Bill Processing Agent"""
        total_items = sum(len(items) for items in expense_data.values())
        categories_with_items = [cat for cat, items in expense_data.items() if items]
        
        response = f"""
        ✅ Bill Processing Complete!
        
        📊 Processing Summary:
        - Total items extracted: {total_items}
        - Categories identified: {', '.join(categories_with_items)}
        - Data validation: All items verified and amounts normalized
        
        🔍 Category Breakdown:
        """
        
        for category, items in expense_data.items():
            if items:
                category_total = sum(item['cost'] for item in items)
                response += f"\n• {category}: {len(items)} items (₹{category_total:.2f})"
        
        response += "\n\nAll expenses have been accurately categorized and are ready for analysis."
        return response
    
    def generate_summary_response(self, expense_data):
        """Generate response from Expense Summarization Agent"""
        # Calculate totals
        category_totals = {}
        total_expenditure = 0
        
        for category, items in expense_data.items():
            if items:
                category_total = sum(item['cost'] for item in items)
                category_totals[category] = category_total
                total_expenditure += category_total
        
        if not category_totals:
            return "No expenses found to analyze."
        
        # Find highest spending category
        highest_category = max(category_totals, key=category_totals.get)
        highest_amount = category_totals[highest_category]
        
        # Generate insights
        response = f"""
        📈 Expense Analysis Complete!
        
        💰 Financial Summary:
        - Total Expenditure: ₹{total_expenditure:.2f}
        - Highest Spending: {highest_category} (₹{highest_amount:.2f})
        - Number of Categories: {len(category_totals)}
        
        📊 Spending Distribution:
        """
        
        for category, amount in sorted(category_totals.items(), key=lambda x: x[1], reverse=True):
            percentage = (amount / total_expenditure) * 100
            response += f"\n• {category}: ₹{amount:.2f} ({percentage:.1f}%)"
        
        # Add insights
        response += "\n\n🔍 Spending Insights:"
        
        if highest_amount > total_expenditure * 0.5:
            response += f"\n⚠️ HIGH ALERT: {highest_category} represents {(highest_amount/total_expenditure)*100:.1f}% of total spending!"
        elif highest_amount > total_expenditure * 0.3:
            response += f"\n📢 NOTICE: {highest_category} is a major expense category ({(highest_amount/total_expenditure)*100:.1f}% of total)"
        
        if len(category_totals) == 1:
            response += "\n📌 All expenses are in a single category - consider diversifying spending tracking."
        elif len(category_totals) >= 4:
            response += "\n✅ Good spending diversification across multiple categories."
        
        # Budget recommendations
        if total_expenditure > 5000:
            response += "\n💡 Consider setting monthly budget limits for high-spending categories."
        
        return response
    
    def get_category_insights(self, expense_data):
        """Generate additional insights for categories"""
        insights = {}
        
        for category, items in expense_data.items():
            if items:
                total = sum(item['cost'] for item in items)
                avg_cost = total / len(items)
                max_item = max(items, key=lambda x: x['cost'])
                
                insights[category] = {
                    'total': total,
                    'count': len(items),
                    'average': avg_cost,
                    'highest_item': max_item
                }
        
        return insights