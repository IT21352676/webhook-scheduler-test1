const axios = require('axios');

const webhookUrl = 'https://discord.com/api/webhooks/1310665985182928918/pP53mLOWeVwZwbNXY9FWO3svA1eDOWhLqMzt6otSOH58CrBe-Xg5oOC4j28UpSKfAz4J';

const testWebhook = async () => {
    try {
        const payload = {
            content: 'Test message from Node.js!',
        };

        const response = await axios.post(webhookUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        console.log('Message sent successfully:', response.data);
    } catch (error) {
        console.error('Failed to send message:', error.response?.data || error.message);
    }
};

testWebhook();
