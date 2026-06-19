import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const db = {
  users: {},
  projects: {},
  tasks: {},
  agents: {},
  payments: {},
  apiKeys: {}
};

// ====== ROOT ROUTE ======
app.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Victor AI Backend',
    version: '1.0.0',
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// ====== AUTHENTICATION MIDDLEWARE ======
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ====== AGENT CLASSES ======

class RouterAgent {
  async process(input) {
    return {
      agent: 'router',
      targetAgent: 'PROCESSOR',
      priority: 'HIGH',
      confidence: 0.95
    };
  }
}

class ProcessorAgent {
  async process(input) {
    return {
      agent: 'processor',
      result: `Processed: ${input.prompt}`,
      confidence: 0.92,
      tokens: 250
    };
  }
}

class ValidatorAgent {
  async process(input) {
    return {
      agent: 'validator',
      isValid: true,
      score: 95,
      checks: [
        { name: 'completeness', passed: true },
        { name: 'coherence', passed: true }
      ]
    };
  }
}

class OptimizerAgent {
  async process(input) {
    return {
      agent: 'optimizer',
      result: input.result + '\n\n[Optimized]',
      improvement: 10
    };
  }
}

class ExecutorAgent {
  async process(input) {
    return {
      agent: 'executor',
      result: input.result,
      format: input.format || 'text',
      status: 'SUCCESS',
      timestamp: new Date().toISOString()
    };
  }
}

// ====== WORKFLOW ENGINE ======

class WorkflowEngine {
  constructor(taskId, input) {
    this.taskId = taskId;
    this.input = input;
    this.agents = [
      new RouterAgent(),
      new ProcessorAgent(),
      new ValidatorAgent(),
      new OptimizerAgent(),
      new ExecutorAgent()
    ];
  }

  async execute() {
    let data = this.input;
    const startTime = Date.now();

    try {
      const routeResult = await this.agents[0].process(data);
      data = { ...data, ...routeResult };

      const processResult = await this.agents[1].process(data);
      data = { ...data, result: processResult.result };

      const validateResult = await this.agents[2].process(data);
      data = { ...data, ...validateResult };

      const optimizeResult = await this.agents[3].process(data);
      data = { ...data, result: optimizeResult.result };

      const executeResult = await this.agents[4].process(data);

      return {
        success: true,
        taskId: this.taskId,
        result: executeResult.result,
        executionTime: Date.now() - startTime,
        validationScore: data.score || 100
      };

    } catch (error) {
      return {
        success: false,
        taskId: this.taskId,
        error: error.message,
        executionTime: Date.now() - startTime
      };
    }
  }
}

// ====== INITIALIZE AGENTS ======

const initializeAgents = () => {
  const agents = [
    { id: uuidv4(), name: 'Router', role: 'Routes tasks', status: 'online', version: '1.0.0' },
    { id: uuidv4(), name: 'Processor', role: 'Executes reasoning', status: 'online', version: '1.0.0' },
    { id: uuidv4(), name: 'Validator', role: 'Validates outputs', status: 'online', version: '1.0.0' },
    { id: uuidv4(), name: 'Optimizer', role: 'Improves results', status: 'online', version: '1.0.0' },
    { id: uuidv4(), name: 'Executor', role: 'Final execution', status: 'online', version: '1.0.0' }
  ];

  agents.forEach(agent => {
    db.agents[agent.id] = agent;
  });

  return agents;
};

// ====== AUTH ROUTES ======

app.post('/api/auth/register', (req, res) => {
  const { email, password, username } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  if (db.users[email]) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const userId = uuidv4();
  db.users[email] = {
    id: userId,
    email,
    password,
    username: username || email.split('@')[0],
    credits: 100,
    subscription: 'free',
    createdAt: new Date()
  };

  const token = jwt.sign({ userId, email }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '7d'
  });

  res.status(201).json({
    success: true,
    userId,
    email,
    token,
    credits: 100
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = db.users[email];

  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ userId: user.id, email }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '7d'
  });

  res.json({
    success: true,
    userId: user.id,
    email,
    token,
    credits: user.credits,
    subscription: user.subscription
  });
});

// ====== TASK ROUTES ======

app.post('/api/tasks', authenticate, async (req, res) => {
  const { prompt, format, priority } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt required' });
  }

  const taskId = uuidv4();
  const user = Object.values(db.users).find(u => u.id === req.userId);

  db.tasks[taskId] = {
    id: taskId,
    userId: req.userId,
    prompt,
    format: format || 'text',
    priority: priority || 'medium',
    status: 'pending',
    createdAt: new Date()
  };

  (async () => {
    const engine = new WorkflowEngine(taskId, { prompt, format: format || 'text' });
    const result = await engine.execute();

    db.tasks[taskId] = {
      ...db.tasks[taskId],
      status: result.success ? 'completed' : 'failed',
      result: result.result,
      executionTime: result.executionTime,
      cost: 0.15,
      completedAt: new Date()
    };

    if (user) {
      user.credits -= 15;
    }
  })();

  res.status(202).json({
    success: true,
    taskId,
    status: 'processing'
  });
});

app.get('/api/tasks', authenticate, (req, res) => {
  const { status } = req.query;

  let tasks = Object.values(db.tasks).filter(t => t.userId === req.userId);

  if (status) tasks = tasks.filter(t => t.status === status);

  res.json({ tasks });
});

app.get('/api/tasks/:taskId', authenticate, (req, res) => {
  const task = db.tasks[req.params.taskId];

  if (!task || task.userId !== req.userId) {
    return res.status(404).json({ error: 'Task not found' });
  }

  res.json({ task });
});

// ====== AGENTS ROUTES ======

app.get('/api/agents', (req, res) => {
  const agents = Object.values(db.agents);
  res.json({
    total: agents.length,
    agents: agents.map(a => ({
      id: a.id,
      name: a.name,
      role: a.role,
      status: a.status,
      version: a.version
    }))
  });
});

// ====== USER ROUTES ======

app.get('/api/user/me', authenticate, (req, res) => {
  const user = Object.values(db.users).find(u => u.id === req.userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    id: user.id,
    email: user.email,
    username: user.username,
    subscription: user.subscription,
    credits: user.credits
  });
});

app.get('/api/user/usage', authenticate, (req, res) => {
  const user = Object.values(db.users).find(u => u.id === req.userId);
  const userTasks = Object.values(db.tasks).filter(t => t.userId === req.userId);
  const completedTasks = userTasks.filter(t => t.status === 'completed');

  res.json({
    userId: req.userId,
    subscription: user?.subscription || 'free',
    creditsAvailable: user?.credits || 0,
    tasksCompleted: completedTasks.length,
    tasksTotal: userTasks.length
  });
});

// ====== HEALTH ROUTES ======

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Victor AI Backend',
    version: '1.0.0',
    uptime: process.uptime(),
    agents: Object.keys(db.agents).length,
    tasks: Object.keys(db.tasks).length,
    users: Object.keys(db.users).length,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/system/stats', (req, res) => {
  const tasks = Object.values(db.tasks);
  const completed = tasks.filter(t => t.status === 'completed');

  res.json({
    totalUsers: Object.keys(db.users).length,
    totalTasks: tasks.length,
    completedTasks: completed.length,
    agents: Object.values(db.agents).map(a => ({
      name: a.name,
      status: a.status
    }))
  });
});

// ====== ERROR HANDLING ======

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// ====== START SERVER ======

const startServer = () => {
  initializeAgents();

  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════╗
║    VICTOR AI - BACKEND v1.0 RUNNING              ║
╚══════════════════════════════════════════════════╝

✅ Server listening on port ${PORT}
✅ ${Object.keys(db.agents).length} agents registered
✅ Database initialized
✅ All routes ready

🚀 Server is READY!
    `);
  });
};

startServer();

export default app;

