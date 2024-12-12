const express = require('express');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const port = 3000;

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (like the HTML)
app.use(express.static(path.join(__dirname, 'public')));

// Data storage files (you can change this to a database later)
const webhooksFile = path.join(__dirname, 'webhooks.json');
const messagesFile = path.join(__dirname, 'messages.json');
const schedulesFile = path.join(__dirname, 'schedules.json');

// Load existing data
let webhooks = [];
let messages = [];
let schedules = [];

const loadData = () => {
    if (fs.existsSync(webhooksFile)) {
        webhooks = JSON.parse(fs.readFileSync(webhooksFile));
    }
    if (fs.existsSync(messagesFile)) {
        messages = JSON.parse(fs.readFileSync(messagesFile));
    }
    if (fs.existsSync(schedulesFile)) {
        schedules = JSON.parse(fs.readFileSync(schedulesFile));
    }
};

const saveData = () => {
    fs.writeFileSync(webhooksFile, JSON.stringify(webhooks, null, 2));
    fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));
    fs.writeFileSync(schedulesFile, JSON.stringify(schedules, null, 2));
};

// Load data on server start
loadData();

// API Endpoints

// Get all webhooks
app.get('/getWebhooks', (req, res) => {
    res.json(webhooks);
});

// Add a new webhook URL with a name
app.post('/addWebhook', (req, res) => {
    const { url, name } = req.body;
    if (!url || !name) {
        return res.status(400).json({ message: 'Webhook URL and name are required' });
    }

    const newWebhook = { url, name };
    webhooks.push(newWebhook);
    saveData();
    res.json({ message: 'Webhook URL added successfully' });
});

// Get all saved messages
app.get('/getMessages', (req, res) => {
    res.json(messages);
});

// Add a new message
app.post('/addMessage', (req, res) => {
    const { name,data } = req.body; // Accept JSON input
    if (!data) {
        return res.status(400).json({ message: 'Message data is required' });
    }

    const newMessage = {
        id: messages.length + 1,
        name,
        data // Store the entire JSON object
    };
    messages.push(newMessage);
    saveData();
    res.json({ message: 'Message saved successfully' });
});

// Get all scheduled messages
app.get('/getSchedules', (req, res) => {
    res.json(schedules);
});

const moment = require('moment-timezone');

// Schedule a message
app.post('/schedule', (req, res) => {
    const { messageId, selectedUrls, scheduledTime, repetitionType } = req.body;

    console.log(scheduledTime);

    if (!messageId || !selectedUrls || !scheduledTime) {
        return res.status(400).json({ message: 'Message, URLs, and scheduled time are required' });
    }

    const message = messages.find(msg => msg.id === parseInt(messageId));

    if (!message) {
        return res.status(404).json({ message: 'Message not found' });
    }

    console.log("Scheduling message: ", message.data); // Add this line to debug

    // Convert scheduledTime to a Date object
    let scheduledDate = new Date(scheduledTime);

    // Add +5 hours and +30 minutes
    scheduledDate.setHours(scheduledDate.getHours() );
    scheduledDate.setMinutes(scheduledDate.getMinutes() );

    // Create the schedule object with the updated scheduled time
    const schedule = {
        messageId: message.id,
        selectedUrls,
        scheduledTime: scheduledTime, // Store the updated time in UTC
        repetitionType,
        status: 'pending',
        nextRun: scheduledDate
    };

    schedules.push(schedule);
    saveData();

    console.log(scheduledDate)
    // Generate cron expression based on the updated scheduled time
    const cronTime = new Date(scheduledDate);
    const cronExpression = `${cronTime.getSeconds()} ${cronTime.getMinutes()} ${cronTime.getHours()} ${cronTime.getDate()} ${cronTime.getMonth() + 1} *`;

    // Schedule the cron job
    cron.schedule(cronExpression, () => sendScheduledMessage(schedule));

    res.json({ message: 'Message scheduled successfully' });
});


// Send scheduled message to webhooks
const sendScheduledMessage = (schedule) => {
    const message = messages.find(msg => msg.id === schedule.messageId);
    if (!message) {
        console.log('Message not found');
        return;
    }

    const messageData = { ...message.data }; // Clone the message data
    delete messageData.id; // Remove the `id` field

    schedule.selectedUrls.forEach(url => {
        axios.post(url, messageData)
            .then(() => {
                console.log(`Message sent to ${url}`);
                schedule.status = 'sent';
                saveData();
            })
            .catch(err => {
                console.error(`Error sending message to ${url}:`, err);
                schedule.status = 'failed';
                saveData();
            });
    });
};

// Update an existing webhook
app.put('/updateWebhook', (req, res) => {
    const { index, name, url } = req.body;

    if (index === undefined || !name || !url) {
        return res.status(400).json({ message: 'Index, name, and URL are required' });
    }

    if (index < 0 || index >= webhooks.length) {
        return res.status(404).json({ message: 'Webhook not found' });
    }

    webhooks[index] = { name, url }; // Update the webhook
    saveData(); // Save changes to file
    res.json({ message: 'Webhook updated successfully' });
});

// Update an existing message
app.put('/updateMessage', (req, res) => {
    const { id, name, data } = req.body;
    const actualid = id+1;

    if (id === undefined || !name || !data) {
        return res.status(400).json({ message: 'Index, name, and URL are required' });
    }

    if (id < 0 || id >= messages.length) {
        return res.status(404).json({ message: 'Message not found' });
    }

    messages[id] = { id:actualid, name, data }; // Update the webhook
    saveData(); // Save changes to file
    res.json({ message: 'Message updated successfully' });
});

// Delete webhook
app.post('/deleteWebhook', (req, res) => {
    const { index } = req.body;
    if (index >= 0 && index < webhooks.length) {
        webhooks.splice(index, 1); // Remove the webhook
        saveData();
        res.json({ message: 'Webhook deleted successfully' });
    } else {
        res.status(400).json({ message: 'Invalid webhook index' });
    }
});

// Delete message
app.post('/deleteMessage', (req, res) => {
    const { index } = req.body;
    if (index >= 0 && index < messages.length) {
        messages.splice(index, 1); // Remove the webhook
        saveData();
        res.json({ message: 'Message deleted successfully' });
    } else {
        res.status(400).json({ message: 'Invalid message index' });
    }
});

// Serve the index.html page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
