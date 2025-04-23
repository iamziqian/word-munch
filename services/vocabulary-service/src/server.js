import express from 'express';
import axios from 'axios';
import cors from 'cors';
const app = express();
app.use(cors());
app.use(express.json());

// route to handle word action
app.post('/api/vocabulary', async (req, res) => {
  const { word, context } = req.body;

  if (!word) {
    return res.status(400).json({ error: 'Word is required' });
  }

  try {
    const isSpecializedResponse = await axios.post('http://host.docker.internal:11434/api/generate', {
      model: 'llama3.2',
      prompt: `Is the word "${word}" in the following context "${context}" an academic or professional term? Only respond with "yes" or "no".`,
      stream: false
    });

    console.log('Ollama API Response:', isSpecializedResponse.data.response);

    const isSpecialized = isSpecializedResponse.data.response?.trim().toLowerCase() === 'yes';

    console.log("Is the word specialized?", isSpecialized);

    if (isSpecialized) {
      const explanationResponse = await axios.post('http://host.docker.internal:11434/api/generate', {
        model: 'llama3.2',
        prompt: `Explain the word "${word}" in the following context: "${context}". Use simple and easy-to-understand language. Provide a concise explanation and include a practical example.`,
        stream: false
      });

      console.log('Ollama API Exp Response:', explanationResponse.data.response); //debug

      return res.json({
        definition: explanationResponse.data.response
      });
    } else {
      const synonymResponse = await axios.post('http://host.docker.internal:11434/api/generate', {
        model: 'llama3.2',
        prompt: `Provide only a single-word simpler and more commonly used synonym for the word "${word}" in the following context: "${context}". Respond with only one word.`,
        stream: false
      });

      console.log('Ollama API Syn Response:', synonymResponse.data.response); // debug

      return res.json({
        definition: synonymResponse.data.response?.trim().toLowerCase()
      });
    }
  } catch (error) {
    console.error('Error communicating with Ollama:', error.message, error.response?.data);
    res.status(500).json({ error: 'Failed to process the word action' });
  }
});

app.listen(3000, () => {
  console.log('Vocabulary Service is running on port 3000');
});
