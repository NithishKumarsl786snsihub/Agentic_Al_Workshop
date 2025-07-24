import ast

def static_code_review(source: str) -> str:
    """Performs static checks on Python code without running it."""
    try:
        parsed = ast.parse(source)
        findings = []
        # Detect print usage
        if any(isinstance(n, ast.Call) and getattr(n.func, 'id', None) == 'print' for n in ast.walk(parsed)):
            findings.append("⚠️ Usage of print() detected. Consider using logging instead.")
        # Detect bare except
        for n in ast.walk(parsed):
            if isinstance(n, ast.ExceptHandler) and n.type is None:
                findings.append("⚠️ Bare except: found. Specify the exception type explicitly.")
        if findings:
            return "Static review issues found:\n" + "\n".join(findings)
        return "✅ No static issues detected."
    except SyntaxError as err:
        return f"❌ Syntax error: {err.msg} (Line {err.lineno})" 