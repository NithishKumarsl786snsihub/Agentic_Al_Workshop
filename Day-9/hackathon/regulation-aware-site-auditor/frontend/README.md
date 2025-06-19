# 🔍 AI-Powered Website Compliance Auditor

A full-stack application that performs comprehensive website compliance auditing for GDPR, WCAG/ADA accessibility, SEO, and security standards using AI-powered analysis.

![Application Screenshot](C:\Users\Lenovo\Downloads\regulation-aware-site-auditor\frontend\public\localhost_3000_.png)

## ✨ Features

- **🛡️ GDPR Compliance**: Cookie consent, privacy policy checks, data collection validation
- **♿ Accessibility**: WCAG 2.1/ADA compliance, alt text, heading structure, form labels
- **📋 WCAG Guidelines**: Language attributes, page titles, focus indicators
- **🔍 SEO Optimization**: Meta descriptions, heading structure, search engine best practices
- **🔒 Security**: HTTPS implementation, mixed content detection
- **🤖 AI-Powered Insights**: Google Gemini integration for intelligent recommendations
- **📚 Regulatory Guidance**: RAG system with live regulatory content
- **📊 Interactive Reports**: Real-time results with priority matrix and roadmaps
 
## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **Python** 3.8+
- **Google Gemini API Key** (optional, for AI features)

### Backend Setup

1. **Clone and navigate to backend**:
```bash
cd backend
```

2. **Create virtual environment**:
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

3. **Install dependencies**:
```bash
pip install -r requirements.txt
```

4. **Environment configuration**:
```bash
# Copy environment template
cp env.example .env

# Edit .env file with your settings:
GEMINI_API_KEY=your_gemini_api_key_here
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
```

5. **Start the backend server**:
```bash
python main.py
```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to project root**:
```bash
cd .. # from backend directory
```

2. **Install dependencies**:
```bash
npm install
```

3. **Environment configuration**:
```bash
# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:3000/api
BACKEND_URL=http://localhost:8000" > .env.local
```

4. **Start development server**:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 📖 Usage

### Basic Audit

1. **Enter Website URL**: Input the website you want to audit
2. **Configure Settings**: Enable/disable AI insights and regulatory guidance
3. **Run Audit**: Click "Run Audit" to start the analysis
4. **View Results**: Browse compliance issues, AI insights, and implementation roadmap

### Advanced Features

#### AI-Powered Analysis
- Provide your Gemini API key for intelligent insights
- Get prioritized recommendations based on business impact
- Receive specific technical improvement suggestions

#### Compliance Categories
- **GDPR**: Data protection and privacy compliance
- **Accessibility**: ADA and WCAG 2.1 standards
- **SEO**: Search engine optimization best practices  
- **Security**: Basic security compliance checks

#### Results Interpretation
- **Score**: Overall compliance percentage (0-100%)
- **Risk Level**: 
  - ✅ Low Risk (80%+)
  - ⚠️ Medium Risk (60-79%)
  - 🚨 High Risk (<60%)
- **Issue Severity**:
  - 🔴 High: Critical issues requiring immediate attention
  - 🟡 Medium: Important issues for near-term resolution
  - 🟢 Low: Minor improvements for future consideration

## 🛠️ Development

### API Endpoints

#### Backend (FastAPI)
- `POST /api/v1/audit` - Run website compliance audit
- `GET /api/v1/health` - Health check
- `GET /api/v1/categories` - Get compliance categories
- `POST /api/v1/update-rag` - Update regulatory content

#### Frontend (Next.js Proxy)
- `POST /api/v1/audit` - Proxied audit endpoint

### Adding New Compliance Checks

1. **Update ComplianceChecker** (`backend/services/compliance.py`):
```python
def _check_new_compliance(self, data: WebsiteData) -> CategoryResults:
    issues = []
    recommendations = []
    passed = []
    
    # Add your compliance logic here
    
    return CategoryResults(issues=issues, recommendations=recommendations, passed=passed)
```

2. **Register the check**:
```python
self.compliance_rules['new_category'] = self._check_new_compliance
```

3. **Update models** if needed (`backend/api/models.py`)

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```bash
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Optional
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
DEBUG=False
REQUEST_TIMEOUT=10
MAX_CONTENT_LENGTH=5000
AI_MODEL=gemini-1.5-flash
CHROMA_DB_PATH=./chroma_db
```

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api
BACKEND_URL=http://localhost:8000
```

### Customization

#### Styling (globals.css)
- Modify CSS custom properties for theme colors
- Update gradient definitions
- Customize animation timings

#### Compliance Rules
- Add new categories in `ComplianceChecker`
- Modify severity levels and scoring logic
- Extend AI analysis prompts

## 🚀 Deployment

### Backend Deployment

**Using Docker**:
```bash
cd backend
docker build -t compliance-auditor-backend .
docker run -p 8000:8000 -e GEMINI_API_KEY=your_key compliance-auditor-backend
```

**Using Cloud Platforms**:
- **Railway**: Connect GitHub repo, set environment variables
- **Heroku**: `git push heroku main` with Procfile
- **DigitalOcean**: App Platform with Python buildpack

### Frontend Deployment

**Vercel** (Recommended):
```bash
npm run build
vercel --prod
```

**Netlify**:
```bash
npm run build
netlify deploy --prod --dir=.next
```

**Self-hosted**:
```bash
npm run build
npm start
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Development Guidelines

- Follow TypeScript best practices for frontend
- Use Python type hints for backend
- Write comprehensive tests for new features
- Update documentation for API changes
- Follow semantic commit messages

 
## 📞 Support
 
- **Email**: nithish.k.ihub@snsgroups.com

---

<div align="center">
  <strong>Built with ❤️ for better web compliance</strong>
</div>
