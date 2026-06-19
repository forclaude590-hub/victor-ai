import React, { useState, useEffect } from 'react';
import './App.css';

const VictorAI = () => {
  const [tasks, setTasks] = useState([]);
  const [currentTask, setCurrentTask] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('submit');
  const [deliveryFormat, setDeliveryFormat] = useState('text');
  
  const [token, setToken] = useState('');
  const [projectId, setProjectId] = useState('');
  const [credits, setCredits] = useState(0);

  const API_URL = 'http://localhost:8000/api';

  useEffect(() => {
    setupSession();
  }, []);

  const setupSession = async () => {
    try {
      const authRes = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `dev-${Date.now()}@victor.ai`,
          password: 'password123',
          username: 'Developer'
        })
      });
      const authData = await authRes.json();
      
      if (authData.token) {
        setToken(authData.token);
        setCredits(authData.credits);

        const projectRes = await fetch(`${API_URL}/projects`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authData.token}`
          },
          body: JSON.stringify({ name: 'Automated Workspace Cluster' })
        });
        const projectData = await projectRes.json();
        if (projectData.success) {
          setProjectId(projectData.projectId);
        }
      }
    } catch (error) {
      console.error('❌ Frontend failed to connect with backend server:', error);
    }
  };

  const submitTask = async (e) => {
    e.preventDefault();
    if (!currentTask.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId: projectId,
          prompt: currentTask,
          format: deliveryFormat
        })
      });

      const data = await res.json();
      if (data.success) {
        setTasks((prevTasks) => [data, ...prevTasks]);
        if (data.creditsRemaining !== undefined) {
          setCredits(data.creditsRemaining);
        }
        setCurrentTask('');
      } else {
        alert(`❌ Engine Error: ${data.error || 'Failed to process task'}`);
      }
    } catch (error) {
      alert(`❌ Connection failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="victor-ai-container">
      <header className="victor-header">
        <h1>🌿 VICTOR AI</h1>
        <p>Multi-Agent AI Orchestration Swarm Engine Platform</p>
      </header>

      <nav className="victor-nav">
        <button className={`nav-btn ${activeTab === 'submit' ? 'active' : ''}`} onClick={() => setActiveTab('submit')}>
          📝 New Orchestration Prompt
        </button>
        <button className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          📊 Node Performance Metrics
        </button>
      </nav>

      <main className="victor-main">
        {activeTab === 'submit' && (
          <div className="panel task-panel">
            <h2>📝 Submit New Autonomous Task</h2>
            <form onSubmit={submitTask}>
              <textarea
                value={currentTask}
                onChange={(e) => setCurrentTask(e.target.value)}
                placeholder="Type a workflow query (e.g., 'generate core layout', 'analyze data streams')..."
                rows={4}
              />
              
              <div className="format-selector">
                <label>Target Delivery Compilation Format: </label>
                <select value={deliveryFormat} onChange={(e) => setDeliveryFormat(e.target.value)}>
                  <option value="text">📄 Plain String Text</option>
                  <option value="json">📊 Nested Raw JSON</option>
                  <option value="markdown">📝 Markdown Structural File</option>
                  <option value="html">🌐 Sanitized HTML Div Document</option>
                </select>
              </div>

              <button type="submit" disabled={loading || !currentTask.trim()} className="submit-btn">
                {loading ? '⏳ Computing Orchestrated Agent Chains...' : '🚀 Launch Multi-Agent Workflow'}
              </button>
            </form>

            {tasks.length > 0 && (
              <div className="recent-results">
                <h3>📊 Execution Swarm Outputs</h3>
                {tasks.map((task, idx) => (
                  <div key={idx} className="result-card">
                    <div className="result-status">
                      Status: <span className="badge-completed">{task.status.toUpperCase()}</span>
                    </div>
                    <div className="result-id">ID: {task.taskId || task.id}</div>
                    {task.result && (
                      <pre className="result-output-block">
                        <code>{task.result}</code>
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="panel dashboard-panel">
            <h2>📊 Orchestration Cluster Nodes Dashboard</h2>
            <div className="dashboard-grid">
              <div className="stat-card">
                <div className="stat-label">💵 Active System Wallet Balance</div>
                <div className="stat-value">{credits} Credits</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">✅ Task Submissions Sent This Cycle</div>
                <div className="stat-value">{tasks.length} Threads</div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="victor-footer">
        <p>Victor AI Multi-Agent Gateway Ecosystem Engine v1.0.0 © 2026</p>
      </footer>
    </div>
  );
};

export default VictorAI;
