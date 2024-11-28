const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files (e.g., the HTML file)
app.use(express.static(path.join(__dirname)));

// Endpoint to send JSON data to a webhook
app.post('/send-json', async (req, res) => {
    const { webhookUrl, jsonData } = req.body;

    console.log(jsonData);

    if (!webhookUrl || !jsonData) {
        return res.status(400).json({ error: 'Webhook URL and JSON data are required.' });
    }

    try {
        await axios.post(webhookUrl, jsonData);
        res.json({ success: true });
    } catch (error) {
        console.error('Failed to send webhook:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to send webhook. Please check the URL or JSON data.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
