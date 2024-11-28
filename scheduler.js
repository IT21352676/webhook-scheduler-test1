const axios = require('axios');
const schedule = require('node-schedule');

// Replace with your webhook URL
const webhookUrl = 'https://discord.com/api/webhooks/1310665985182928918/pP53mLOWeVwZwbNXY9FWO3svA1eDOWhLqMzt6otSOH58CrBe-Xg5oOC4j28UpSKfAz4J';

// Function to send a message via webhook
const sendMessage = async (message) => {
    try {
        await axios.post(webhookUrl, { content: message });
        console.log(`[${new Date().toLocaleTimeString()}] Message sent: ${message}`);
    } catch (error) {
        console.error(`Failed to send message: ${error.response.status} - ${error.response.data}`);
    }
};

// Schedule a good morning message at 8:00 AM every day
schedule.scheduleJob('0 8 * * *', () => {
    sendMessage('Good morning! ☀️ Hope you have a wonderful day!');
});

// Schedule a weekly reminder at 12:00 PM every Monday
schedule.scheduleJob('0 12 * * 1', () => {
    sendMessage('Hey team! Just a reminder to check your weekly goals! 🚀');
});

// Function for sending a message dynamically (e.g., join message)
const sendJoinMessage = (username) => {
    sendMessage(`Welcome to the server, ${username}! 🎉`);
};

// Example of sending a dynamic join message
sendJoinMessage('NewUser123');

// Schedule "Just Reminding" message every 2 minutes
schedule.scheduleJob('*/2 * * * *', () => {
    sendMessage('Just Reminding! 🕑 Don’t forget to stay awesome!');
});

// Keep the script running
console.log('Webhook Scheduler is running...');
