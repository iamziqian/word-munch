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
      prompt: `Analyze the following sentence: "${sentence}" in the context: "${context}". Respond in the following structured format:
      Main idea: [Extract the main structure of the sentence]
      Key word: [List the key concepts or keywords]
      Exp: [Provide a concise explanation of the sentence]
      e.g.: [Provide a practical example to explain it]`,
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