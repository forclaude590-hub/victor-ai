app.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Victor AI Backend',
    version: '1.0.0',
    message: 'API is running',
    endpoints: {
      health: '/api/health',
      register: '/api/auth/register',
      login: '/api/auth/login',
      agents: '/api/agents'
    },
    timestamp: new Date().toISOString()
  });
});
