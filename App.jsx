// ====== VICTOR AI - COMPLETE USER INTERFACE FRONTEND ======
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

  // Fully connected to your live hosted Railway backend production environment
  const API_URL = 'https://victor-ai-production.up.railway.app/api';

  useEffect(() => {
    initializePlatformSession();
  }, []);

  const initializePlatformSession = async () => {
    try {
      const authResponse = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `mobile-developer-${Date.now()}@victor.ai`,
          password: 'production_pass_2026',
          username: 'System Architect'
        })
      });
      const authData = await authResponse.json();
      
      if (authData.token) {
        setToken(authData.token);
        setCredits(authData.credits);

        const projectResponse = await fetch(`${API_URL}/projects`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authData.token}`
          },
          body: JSON.stringify({ name: 'Automated Micro Cluster Workspace' })
        });
        const projectData = await projectResponse.json();
        if (projectData.success) {
          setProjectId(projectData.projectId);
        }
      }
    } catch (error) {
      console.error('❌ Network Interface Error connecting to Railway:', error);
    }
  };

  const executePipelineWorkflow = async (e) => {
    e.preventDefault();
    if (!currentTask.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/tasks`, {
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

      const data = await response.json();
      if (data.success) {
        setTasks((prev) => [data, ...prev]);
        if (data.creditsRemaining !== undefined) {
          setCredits(data.creditsRemaining);
        }
        setCurrentTask('');
      } else {
        alert(`Engine Alert: ${data.error || 'Pipeline Processing Failed'}`);
      }
    } catch (error) {
      alert(`Connection to Cloud Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="victor-ai-container">
      <header className="victor-header">
        <h1>🌿 VICTOR AI</h1>
        <p>Production Multi-Agent Pipeline Gateway Core</p>
      </header>

      <nav className="victor-nav">
        <button className={`nav-btn ${activeTab === 'submit' ? 'active' : ''}`} onClick={() => setActiveTab('submit')}>
          📝 Workspace Interface
        </button>
        <button className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          📊 Cluster Dashboard
        </button>
      </nav>

      <main className="victor-main">
        {activeTab === 'submit' && (
          <div className="panel task-panel">
            <h2>📝 Execute Autonomous Multi-Agent Pipeline</h2>
            <form onSubmit={executePipelineWorkflow}>
              <textarea
                value={currentTask}
                onChange={(e) => setCurrentTask(e.target.value)}
                placeholder="Submit prompt variables to the swarm cluster (e.g., 'Analyze operational logs')..."
                rows={4}
              />
              
              <div className="format-selector">
                <label>Target Delivery Structure Compilation: </label>
                <select value={deliveryFormat} onChange={(e) => setDeliveryFormat(e.target.value)}>
                  <option value="text">📄 Plain Unified Text String</option>
                  <option value="json">📊 Structured Key-Value JSON Object</option>
                  <option value="markdown">📝 Markdown Structural Document</option>
                  <option value="html">🌐 Rendered Micro-HTML Block</option>
                </select>
              </div>

              <button type="submit" disabled={loading || !currentTask.trim()} className="submit-btn">
                {loading ? '⏳ Computing Active Swarm Chains...' : '🚀 Ignite Multi-Agent Orchestration'}
              </button>
            </form>

            {tasks.length > 0 && (
              <div className="recent-results">
                <h3>📊 Multi-Agent Swarm Realtime Responses</h3>
                {tasks.map((task, index) => (
                  <div key={index} className="result-card">
                    <div className="result-status">
                      State Indicator: <span className="badge-completed">{task.status.toUpperCase()}</span>
                    </div>
                    <div className="result-id">Execution Reference ID: {task.taskId || task.id}</div>
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
            <h2>📊 Realtime System Metrics Control</h2>
            <div className="dashboard-grid">
              <div className="stat-card">
                <div className="stat-label">💵 Active Operational Wallet Balance</div>
                <div className="stat-value">{credits} Credits</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">✅ Threads Executed This Session</div>
                <div className="stat-value">{tasks.length} Pipelines</div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="victor-footer">
        <p>Victor AI Production Swarm Cloud Gateway Platform v1.0.0 © 2026</p>
      </footer>
    </div>
  );
};

export default VictorAI;
