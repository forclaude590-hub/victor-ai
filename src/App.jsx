import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [activeTab, setActiveTab] = useState('login')
  const [tasks, setTasks] = useState([])
  const [taskPrompt, setTaskPrompt] = useState('')
  const [taskFormat, setTaskFormat] = useState('text')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [agents, setAgents] = useState([])
  const [systemStats, setSystemStats] = useState(null)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000/api'

  // Auto-check authentication on load
  useEffect(() => {
    if (token) {
      checkAuth()
    }
    fetchAgents()
    fetchSystemStats()
  }, [])

  // Fetch agents list
  const fetchAgents = async () => {
    try {
      const res = await axios.get(`${API_URL}/agents`)
      setAgents(res.data.agents)
    } catch (err) {
      console.error('Error fetching agents:', err)
    }
  }

  // Fetch system stats
  const fetchSystemStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/system/stats`)
      setSystemStats(res.data)
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  // Check if token is valid
  const checkAuth = async () => {
    try {
      const res = await axios.get(`${API_URL}/user/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(res.data)
      setIsAuthenticated(true)
      fetchUserTasks()
    } catch (err) {
      console.error('Token invalid:', err)
      setToken('')
      localStorage.removeItem('token')
      setIsAuthenticated(false)
    }
  }

  // Fetch user's tasks
  const fetchUserTasks = async () => {
    try {
      const res = await axios.get(`${API_URL}/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setTasks(res.data.tasks)
    } catch (err) {
      console.error('Error fetching tasks:', err)
    }
  }

  // Register
  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await axios.post(`${API_URL}/auth/register`, {
        email,
        password
      })

      setToken(res.data.token)
      localStorage.setItem('token', res.data.token)
      setUser({ email })
      setIsAuthenticated(true)
      setSuccess('Registration successful!')
      setEmail('')
      setPassword('')
      setActiveTab('tasks')
      checkAuth()
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  // Login
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      })

      setToken(res.data.token)
      localStorage.setItem('token', res.data.token)
      setUser({ email })
      setIsAuthenticated(true)
      setSuccess('Login successful!')
      setEmail('')
      setPassword('')
      setActiveTab('tasks')
      checkAuth()
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  // Submit task
  const handleSubmitTask = async (e) => {
    e.preventDefault()
    if (!taskPrompt.trim()) {
      setError('Please enter a task prompt')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await axios.post(
        `${API_URL}/tasks`,
        {
          projectId: 'default',
          prompt: taskPrompt,
          format: taskFormat,
          priority: 'high'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      setSuccess(`Task submitted! ID: ${res.data.taskId}`)
      setTaskPrompt('')
      setTimeout(() => fetchUserTasks(), 1000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit task')
    } finally {
      setLoading(false)
    }
  }

  // Logout
  const handleLogout = () => {
    setToken('')
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('token')
  }

  if (!isAuthenticated) {
    return (
      <div className="container">
        <div className="auth-box">
          <div className="header">
            <h1>🤖 Victor AI</h1>
            <p>Multi-Agent AI Orchestration Platform</p>
          </div>

          <div className="tabs">
            <button
              className={`tab ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              Login
            </button>
            <button
              className={`tab ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => setActiveTab('register')}
            >
              Register
            </button>
          </div>

          <form onSubmit={activeTab === 'login' ? handleLogin : handleRegister}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Processing...' : activeTab === 'login' ? 'Login' : 'Register'}
            </button>
          </form>

          <div className="stats-preview">
            <h3>System Status</h3>
            {systemStats && (
              <div className="stats-grid">
                <div className="stat">
                  <div className="stat-value">{systemStats.totalUsers}</div>
                  <div className="stat-label">Users</div>
                </div>
                <div className="stat">
                  <div className="stat-value">{systemStats.completedTasks}</div>
                  <div className="stat-label">Tasks Completed</div>
                </div>
                <div className="stat">
                  <div className="stat-value">{agents.length}</div>
                  <div className="stat-label">AI Agents</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="navbar">
        <div className="navbar-left">
          <h1>🤖 Victor AI Dashboard</h1>
        </div>
        <div className="navbar-right">
          <span className="user-email">{user?.email}</span>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </div>

      <div className="main-content">
        <div className="tabs-container">
          <button
            className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            📋 Submit Task
          </button>
          <button
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📊 Task History
          </button>
          <button
            className={`tab-btn ${activeTab === 'agents' ? 'active' : ''}`}
            onClick={() => setActiveTab('agents')}
          >
            🤖 Agents
          </button>
        </div>

        {/* Submit Task Tab */}
        {activeTab === 'tasks' && (
          <div className="tab-content">
            <h2>Submit New Task</h2>
            <form onSubmit={handleSubmitTask}>
              <div className="form-group">
                <label>Task Prompt</label>
                <textarea
                  value={taskPrompt}
                  onChange={(e) => setTaskPrompt(e.target.value)}
                  placeholder="Enter your task prompt here... (e.g., 'Generate a marketing email')"
                  rows="6"
                  required
                />
              </div>

              <div className="form-group">
                <label>Output Format</label>
                <select value={taskFormat} onChange={(e) => setTaskFormat(e.target.value)}>
                  <option value="text">Text</option>
                  <option value="json">JSON</option>
                  <option value="markdown">Markdown</option>
                  <option value="html">HTML</option>
                </select>
              </div>

              {error && <div className="error">{error}</div>}
              {success && <div className="success">{success}</div>}

              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Processing...' : 'Submit Task'}
              </button>
            </form>
          </div>
        )}

        {/* Task History Tab */}
        {activeTab === 'history' && (
          <div className="tab-content">
            <h2>Task History</h2>
            {tasks.length === 0 ? (
              <p className="empty-state">No tasks yet. Submit one above!</p>
            ) : (
              <div className="tasks-list">
                {tasks.map((task) => (
                  <div key={task.id} className="task-card">
                    <div className="task-header">
                      <div className="task-status" data-status={task.status}>
                        {task.status.toUpperCase()}
                      </div>
                      <div className="task-time">
                        {new Date(task.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="task-prompt">{task.prompt}</div>
                    {task.result && (
                      <div className="task-result">
                        <strong>Result:</strong>
                        <p>{task.result.substring(0, 200)}...</p>
                      </div>
                    )}
                    {task.executionTime && (
                      <div className="task-meta">
                        ⏱️ {(task.executionTime / 1000).toFixed(2)}s | 💰 ${task.cost?.toFixed(2)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Agents Tab */}
        {activeTab === 'agents' && (
          <div className="tab-content">
            <h2>AI Agents ({agents.length})</h2>
            <div className="agents-grid">
              {agents.map((agent) => (
                <div key={agent.id} className="agent-card">
                  <div className="agent-name">{agent.name}</div>
                  <div className="agent-role">{agent.role}</div>
                  <div className="agent-status" data-status={agent.status}>
                    {agent.status}
                  </div>
                  <div className="agent-meta">
                    <div>Version: {agent.version}</div>
                    <div>Cost: ${agent.cost}</div>
                    <div>Max Concurrent: {agent.maxConcurrent}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App

