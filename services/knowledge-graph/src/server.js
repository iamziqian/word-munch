const express = require('express');
const app = express();
const PORT = 9000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Knowledge Graph Service is running!');
});

app.get('/node/:id', (req, res) => {
  const nodeId = req.params.id;
  res.json({ id: nodeId, name: `Node ${nodeId}`, description: 'This is a sample node.' });
});

app.post('/node', (req, res) => {
  const newNode = req.body;
  res.status(201).json({ message: 'Node created successfully!', node: newNode });
});

app.listen(PORT, () => {
  console.log(`Knowledge Graph Service is running on http://localhost:${PORT}`);
});