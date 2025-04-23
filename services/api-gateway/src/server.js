import express from 'express';
import axios from 'axios';
import cors from 'cors';
const app = express();
app.use(cors());
app.use(express.json());

// Route to vocabulary service
app.post('/vocabulary', async (req, res) => {
  const { word, context } = req.body;
  try {
    const response = await axios.post('http://vocabulary-service:3000/api/vocabulary', { word, context})
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Error reaching vocabulary service' });
  }
});

// Route to sentence service
app.post('/sentence', async (req, res) => {
  const { sentence, context } = req.body;
  try {
    const response = await axios.post('http://sentence-service:4000/api/sentence', { sentence, context })
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Error reaching sentence service' });
  }
});

app.listen(1000, () => console.log('API Gateway on port 1000'));