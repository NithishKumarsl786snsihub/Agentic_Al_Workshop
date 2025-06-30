#!/usr/bin/env python3
"""
Script to fix indentation issues in langgraph_agents.py
"""

def fix_indentation():
    # Read the original file with UTF-8 encoding
    with open('services/langgraph_agents.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split into lines
    lines = content.splitlines(keepends=True)
    
    # Manual fix of problematic sections
    fixed_content = []
    
    for line in lines:
        # Fix the specific indentation issues
        if '                style_tag = soup.find(' in line:
            fixed_content.append('        style_tag = soup.find(\'style\') or soup.new_tag(\'style\')\n')
        elif '                if not soup.find(' in line:
            fixed_content.append('        if not soup.find(\'style\'):\n')
        elif '                    if soup.head:' in line:
            fixed_content.append('            if soup.head:\n')
        elif '                        soup.head.append(style_tag)' in line:
            fixed_content.append('                soup.head.append(style_tag)\n')
        elif '            if content_updates.get("text"):' in line:
            fixed_content.append('        if content_updates.get("text"):\n')
        elif '                h1_tag = soup.find(\'h1\')' in line:
            fixed_content.append('            h1_tag = soup.find(\'h1\')\n')
        elif '                if h1_tag:' in line:
            fixed_content.append('            if h1_tag:\n')
        elif '                    h1_tag.string = content_updates["text"]' in line:
            fixed_content.append('                h1_tag.string = content_updates["text"]\n')
        elif '            prompt = self.prompt_template.format_messages(' in line:
            fixed_content.append('                    prompt = self.prompt_template.format_messages(\n')
        elif 'voice_input=voice_input,' in line and '                voice_input' not in line:
            fixed_content.append('                        voice_input=voice_input,\n')
        elif 'format_instructions=self.output_parser.get_format_instructions()' in line and '                format_instructions' not in line:
            fixed_content.append('                        format_instructions=self.output_parser.get_format_instructions()\n')
        elif '            )' == line.strip() and 'try:' in str(fixed_content[-5:]):
            fixed_content.append('                    )\n')
        elif '                        return {' in line and '**state,' in content[content.find(line):content.find(line)+200]:
            fixed_content.append('                        return {\n')
        elif '            # Get chat history from memory' in line:
            fixed_content.append('                    # Get chat history from memory\n')
        elif 'chat_history = self.memory.chat_memory.messages' in line and '            chat_history' in line:
            fixed_content.append('                    chat_history = self.memory.chat_memory.messages if self.memory.chat_memory else []\n')
        elif '            # Use LangChain prompt template' in line:
            fixed_content.append('                    # Use LangChain prompt template\n')
        elif '            prompt = self.prompt_template.format_messages(' in line:
            fixed_content.append('                    prompt = self.prompt_template.format_messages(\n')
        elif '                return {' in line and '"intent_type": intent,' in content[content.find(line):content.find(line)+300]:
            fixed_content.append('            return {\n')
        else:
            fixed_content.append(line)
    
    # Write the fixed file with UTF-8 encoding
    with open('services/langgraph_agents.py', 'w', encoding='utf-8') as f:
        f.writelines(fixed_content)
    
    print("Fixed indentation issues in langgraph_agents.py")

if __name__ == '__main__':
    fix_indentation() 