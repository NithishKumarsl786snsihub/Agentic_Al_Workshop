import os
import ast
import re
from typing import Dict, List, Tuple
from dotenv import load_dotenv
import google.generativeai as genai

class CodeAnalysisEngine:
    """Advanced code analysis engine using Gemini AI"""
    
    def __init__(self):
        load_dotenv()
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-1.5-flash")
    
    def analyze_code_structure(self, code: str) -> Dict:
        """Analyze code structure and identify potential issues"""
        try:
            # Parse AST
            tree = ast.parse(code)
            
            analysis = {
                'syntax_valid': True,
                'issues': [],
                'suggestions': [],
                'complexity_score': 0,
                'line_count': len(code.split('\n')),
                'function_count': 0,
                'class_count': 0,
                'import_count': 0
            }
            
            # Count different elements
            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef):
                    analysis['function_count'] += 1
                elif isinstance(node, ast.ClassDef):
                    analysis['class_count'] += 1
                elif isinstance(node, ast.Import) or isinstance(node, ast.ImportFrom):
                    analysis['import_count'] += 1
            
            # Check for common issues
            self._check_code_issues(code, analysis)
            
            return analysis
            
        except SyntaxError as e:
            return {
                'syntax_valid': False,
                'error': f"Syntax Error: {e.msg} at line {e.lineno}",
                'issues': [],
                'suggestions': []
            }
    
    def _check_code_issues(self, code: str, analysis: Dict):
        """Check for common code issues"""
        lines = code.split('\n')
        
        for i, line in enumerate(lines, 1):
            # Check for print statements
            if 'print(' in line:
                analysis['issues'].append(f"Line {i}: Consider using logging instead of print()")
            
            # Check for bare except
            if 'except:' in line and 'except Exception:' not in line:
                analysis['issues'].append(f"Line {i}: Bare except clause - specify exception type")
            
            # Check for unused imports (basic check)
            if line.strip().startswith('import ') or line.strip().startswith('from '):
                import_name = line.split()[1].split('.')[0]
                if import_name not in code.replace(line, ''):
                    analysis['suggestions'].append(f"Line {i}: Potentially unused import '{import_name}'")
            
            # Check line length
            if len(line) > 79:
                analysis['suggestions'].append(f"Line {i}: Line too long ({len(line)} characters)")
    
    def get_ai_improvements(self, code: str, analysis: Dict) -> str:
        """Get AI-powered code improvements"""
        prompt = f"""
        Analyze this Python code and provide improvements:
        
        Code:
        {code}
        
        Current Analysis:
        - Functions: {analysis.get('function_count', 0)}
        - Classes: {analysis.get('class_count', 0)}
        - Lines: {analysis.get('line_count', 0)}
        - Issues: {len(analysis.get('issues', []))}
        
        Please provide:
        1. Improved version of the code
        2. Summary of changes made
        3. Best practices applied
        4. Performance optimizations (if any)
        
        Return the improved code with comments explaining changes.
        """
        
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Error generating improvements: {str(e)}"

class CodeReviewAgent:
    """Agent for comprehensive code review"""
    
    def __init__(self):
        self.analyzer = CodeAnalysisEngine()
    
    def review_code(self, code: str) -> Dict:
        """Perform comprehensive code review"""
        if not code.strip():
            return {'error': 'No code provided'}
        
        # Basic analysis
        analysis = self.analyzer.analyze_code_structure(code)
        
        # Get AI improvements
        improvements = self.analyzer.get_ai_improvements(code, analysis)
        
        return {
            'analysis': analysis,
            'improvements': improvements,
            'summary': self._generate_summary(analysis)
        }
    
    def _generate_summary(self, analysis: Dict) -> str:
        """Generate a summary of the analysis"""
        if not analysis.get('syntax_valid', True):
            return f"❌ {analysis.get('error', 'Syntax error detected')}"
        
        issues_count = len(analysis.get('issues', []))
        suggestions_count = len(analysis.get('suggestions', []))
        
        summary = f"✅ Code is syntactically valid\n"
        summary += f"📊 Statistics: {analysis.get('function_count', 0)} functions, "
        summary += f"{analysis.get('class_count', 0)} classes, {analysis.get('line_count', 0)} lines\n"
        
        if issues_count > 0:
            summary += f"⚠️ {issues_count} issues found\n"
        
        if suggestions_count > 0:
            summary += f"💡 {suggestions_count} suggestions for improvement\n"
        
        return summary 