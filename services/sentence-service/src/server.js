const axios = require('axios');
const express = require('express');
const app = express();
app.use(express.json());

// Route to handle sentence action
app.post('/api/sentence', async (req, res) => {
  const { sentence, context } = req.body;

  if (!sentence) {
    return res.status(400).json({ error: 'Sentence is required' });
  }

  try {
    const analysisResponse = await axios.post('http://host.docker.internal:11434/api/generate', {
      model: 'llama3.2',
      prompt: `Analyze the following sentence: "${sentence}" in the context: "${context}". Respond concisely in the following format:
      Main idea: [Briefly summarize the main idea in one sentence],
      Key word: [List 2-3 key concepts or keywords],
      Exp: [Provide a short explanation in one sentence],
      e.g.: [Give a simple example in one sentence]`,
      stream: false
    });

    const analysis = analysisResponse.data.response?.trim();

    if (analysis) {
      res.json({definition: analysis});
    } else {
      res.status(500).json({ error: 'Failed to get a valid response from Ollama.' });
    }
  } catch (error) {
    console.error('Error communicating with Ollama:', error.message);
    res.status(500).json({ error: 'Failed to process the sentence action' });
  }
});

app.listen(4000, () => {
  console.log('Sentence Service is running on port 4000');
});