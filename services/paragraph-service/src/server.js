const express = require('express');
const app = express();
const PORT = 6000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Paragraph Service is running!');
});

app.post('/paragraph/stats', (req, res) => {
  const { paragraph } = req.body;

  if (!paragraph) {
    return res.status(400).json({ error: 'Paragraph is required' });
  }

  const wordCount = paragraph.split(/\s+/).length;
  const sentenceCount = paragraph.split(/[.!?]/).filter(Boolean).length;

  res.json({
    wordCount,
    sentenceCount,
    message: 'Paragraph statistics calculated successfully!',
  });
});

app.post('/paragraph/split', (req, res) => {
  const { paragraph } = req.body;

  if (!paragraph) {
    return res.status(400).json({ error: 'Paragraph is required' });
  }

  const sentences = paragraph.split(/[.!?]/).filter(Boolean).map(s => s.trim());

  res.json({
    sentences,
    message: 'Paragraph split into sentences successfully!',
  });
});

app.listen(PORT, () => {
  console.log(`Paragraph Service is running on http://localhost:${PORT}`);
});