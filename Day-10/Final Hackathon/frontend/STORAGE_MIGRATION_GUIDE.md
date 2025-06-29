# 💾 Storage Migration Guide

## 🎯 Overview

This guide shows how to **completely replace localStorage** with our new **MongoDB-based storage system** that includes:

- ✅ **Persistent Storage** - Data saved to MongoDB
- ✅ **Auto-save** - Automatic background saves every 30 seconds  
- ✅ **Exit Warnings** - Smart prompts before losing unsaved work
- ✅ **State Management** - Zustand replacing localStorage
- ✅ **Session Recovery** - Restore work after browser crash

---

## 🚀 Quick Start

### 1. Import the Hook & Components

```jsx
import useStoragePersistence from '../hooks/useStoragePersistence';
import useEditorStore from '../store/editorStore';
import ExitWarningModal from '../components/ExitWarningModal';
```

### 2. Replace localStorage Logic

**❌ OLD WAY (localStorage):**
```jsx
// DON'T DO THIS ANYMORE
const [content, setContent] = useState(() => {
  return localStorage.getItem('website-content') || '';
});

useEffect(() => {
  localStorage.setItem('website-content', content);
}, [content]);
```

**✅ NEW WAY (Zustand + MongoDB):**
```jsx
// DO THIS INSTEAD
const { htmlContent, setHtmlContent } = useEditorStore();
const { saveProject, showExitWarning } = useStoragePersistence();

const handleContentChange = (newContent) => {
  setHtmlContent(newContent); // Auto-tracks unsaved changes
};

const handleSave = async () => {
  await saveProject({
    projectName: 'My Website',
    description: 'Created with voice commands'
  });
};
```

### 3. Add Exit Warning Modal

```jsx
function MyComponent() {
  const {
    showExitWarning,
    handleExitWarningSave,
    handleExitWarningDiscard,
    handleExitWarningCancel,
    getUnsavedChangesCount
  } = useStoragePersistence();

  return (
    <>
      {/* Your component content */}
      
      <ExitWarningModal
        isOpen={showExitWarning}
        onSave={handleExitWarningSave}
        onDiscard={handleExitWarningDiscard}
        onCancel={handleExitWarningCancel}
        unsavedChangesCount={getUnsavedChangesCount()}
      />
    </>
  );
}
```

---

## 🔧 Detailed Migration Steps

### Step 1: Update State Management

**Replace localStorage state with Zustand:**

```jsx
// OLD: useState + localStorage
const [htmlContent, setHtmlContent] = useState(() => 
  localStorage.getItem('html-content') || ''
);

// NEW: Zustand store
const { htmlContent, setHtmlContent } = useEditorStore();
```

### Step 2: Add Storage Hook

```jsx
function EditorComponent() {
  const {
    saveProject,
    loadProject,
    handleExitAttempt,
    interceptNavigation,
    hasUnsavedChanges
  } = useStoragePersistence({
    enableAutoSave: true,      // Auto-save every 30 seconds
    enableExitWarning: true,   // Show modal on exit
    enableBeforeUnload: true   // Browser warning on refresh
  });

  // Your component logic...
}
```

### Step 3: Handle Navigation

**Intercept navigation to show exit warnings:**

```jsx
const handleNavigation = (href) => {
  const canNavigate = interceptNavigation(href);
  if (!canNavigate) {
    console.log('Navigation blocked - showing save dialog');
  }
};

// For back button or custom navigation
const handleBackButton = () => {
  handleExitAttempt(() => {
    router.back();
  });
};
```

### Step 4: Update Save/Load Logic

```jsx
// Save project
const handleSave = async () => {
  try {
    const result = await saveProject({
      projectName: 'My Project',
      description: 'Project description',
      metadata: { tags: ['react', 'website'] }
    });
    console.log('Saved with ID:', result.projectId);
  } catch (error) {
    console.error('Save failed:', error.message);
  }
};

// Load project
const handleLoad = async (projectId) => {
  try {
    const project = await loadProject({ projectId });
    console.log('Loaded project:', project.project_name);
  } catch (error) {
    console.error('Load failed:', error.message);
  }
};
```

---

## 🎨 UI Integration Examples

### Save Button with Status

```jsx
function SaveButton() {
  const { isSaving, hasUnsavedChanges, lastSaved } = useEditorStore();
  const { saveProject } = useStoragePersistence();

  return (
    <button
      onClick={() => saveProject()}
      disabled={isSaving || !hasUnsavedChanges}
      className={`px-4 py-2 rounded ${
        isSaving ? 'bg-gray-400' : 
        hasUnsavedChanges ? 'bg-blue-600 hover:bg-blue-700' : 
        'bg-green-600'
      } text-white`}
    >
      {isSaving ? (
        <>
          <Spinner className="w-4 h-4 mr-2" />
          Saving...
        </>
      ) : hasUnsavedChanges ? (
        'Save Changes'
      ) : (
        <>
          <CheckIcon className="w-4 h-4 mr-2" />
          Saved
        </>
      )}
    </button>
  );
}
```

### Auto-save Indicator

```jsx
function AutoSaveStatus() {
  const { isAutoSaving, lastSaved, hasUnsavedChanges } = useEditorStore();

  if (isAutoSaving) {
    return (
      <div className="flex items-center text-blue-600">
        <ClockIcon className="w-4 h-4 mr-1 animate-spin" />
        Auto-saving...
      </div>
    );
  }

  if (hasUnsavedChanges) {
    return (
      <div className="flex items-center text-amber-600">
        <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
        Unsaved changes
      </div>
    );
  }

  return (
    <div className="flex items-center text-green-600">
      <CheckCircleIcon className="w-4 h-4 mr-1" />
      Saved {lastSaved ? new Date(lastSaved).toLocaleTimeString() : ''}
    </div>
  );
}
```

### Project List

```jsx
function ProjectList() {
  const [projects, setProjects] = useState([]);
  const { loadProject } = useStoragePersistence();

  useEffect(() => {
    async function fetchProjects() {
      const result = await storageService.listProjects({ limit: 20 });
      setProjects(result.projects);
    }
    fetchProjects();
  }, []);

  return (
    <div className="space-y-2">
      {projects.map(project => (
        <div 
          key={project.project_id}
          onClick={() => loadProject({ projectId: project.project_id })}
          className="p-3 border rounded hover:bg-gray-50 cursor-pointer"
        >
          <h3 className="font-medium">{project.project_name}</h3>
          <p className="text-sm text-gray-500">
            {new Date(project.last_modified).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
}
```

---

## ⚡ Advanced Features

### Custom Auto-save Configuration

```jsx
const { saveProject } = useStoragePersistence({
  enableAutoSave: true,
  autoSaveInterval: 15000,  // Save every 15 seconds
  enableExitWarning: true,
  enableBeforeUnload: true
});
```

### Project Search

```jsx
const searchProjects = async (query) => {
  const result = await storageService.listProjects({
    search: query,
    limit: 50
  });
  return result.projects;
};
```

### State Restoration

```jsx
const { restoreAutoSavedState } = useStoragePersistence();

useEffect(() => {
  // Restore auto-saved state on component mount
  restoreAutoSavedState();
}, []);
```

### Custom Exit Handling

```jsx
const { handleExitAttempt } = useStoragePersistence();

const handleCustomExit = () => {
  handleExitAttempt(() => {
    // Custom exit logic here
    window.location.href = '/dashboard';
  });
};
```

---

## 🐛 Troubleshooting

### Common Issues

**1. "Please log in to save" Error**
```jsx
// Check authentication status
const { isAuthenticated } = useEditorStore();
if (!isAuthenticated) {
  // Redirect to login
  router.push('/auth/login');
}
```

**2. Auto-save Not Working**
```jsx
// Ensure session ID is set
useEffect(() => {
  if (!sessionId) {
    const newSessionId = `session_${Date.now()}`;
    setSessionId(newSessionId);
  }
}, [sessionId]);
```

**3. Exit Warning Not Showing**
```jsx
// Make sure unsaved changes are tracked
const handleContentChange = (content) => {
  setHtmlContent(content); // This automatically sets hasUnsavedChanges
};
```

### Debugging

```jsx
// Add logging to debug storage issues
import useEditorStore from '../store/editorStore';

function DebugPanel() {
  const store = useEditorStore();
  
  return (
    <div className="p-4 bg-gray-100 rounded text-xs">
      <pre>{JSON.stringify({
        sessionId: store.sessionId,
        projectId: store.projectId,
        hasUnsavedChanges: store.hasUnsavedChanges,
        isAuthenticated: store.isAuthenticated,
        contentLength: store.htmlContent.length
      }, null, 2)}</pre>
    </div>
  );
}
```

---

## 🎯 Best Practices

### 1. Always Handle Errors

```jsx
const handleSave = async () => {
  try {
    await saveProject();
    showSuccessNotification('Project saved!');
  } catch (error) {
    showErrorNotification(error.message);
  }
};
```

### 2. Provide User Feedback

```jsx
// Show loading states
{isSaving && <Spinner />}
{isAutoSaving && <AutoSaveIndicator />}
{hasUnsavedChanges && <UnsavedChangesWarning />}
```

### 3. Validate Before Save

```jsx
const handleSave = async () => {
  if (!htmlContent.trim()) {
    alert('Please add some content before saving');
    return;
  }
  
  await saveProject();
};
```

### 4. Clear Legacy Data

```jsx
useEffect(() => {
  // Clear old localStorage data on app start
  storageService.clearLegacyLocalStorage();
}, []);
```

---

## 🚀 Performance Tips

1. **Debounce Content Changes** for auto-save
2. **Use React.memo** for editor components
3. **Lazy load** project lists
4. **Cache** frequently accessed projects
5. **Batch** multiple content updates

---

## 📦 Complete Example

See `src/components/EditorWithStorage.jsx` for a complete implementation example that shows all features working together.

---

## 🆘 Need Help?

- Check the console for error messages
- Verify backend endpoints are running
- Ensure user is authenticated
- Test with a fresh session ID

**Happy coding! 🎉** 