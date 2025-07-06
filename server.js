const express = require('express');
const { MatrixClient } = require('matrix-js-sdk');
const app = express();
app.use(express.json());

const client = new MatrixClient({
  baseUrl: 'https://matrix.org',
  accessToken: 'YOUR_ROKUUSER_ACCESS_TOKEN', // Replace with @rokuuser:matrix.org token
  userId: '@rokuuser:matrix.org'
});

// Import session key for E2EE (replace with actual key if needed)
client.importRoomKeys([{
  key: 'x+EaDfyNFcz7+8gBAqgKNzT4vDDI07yA5yWoIXv1bY0',
  session_id: 'j2CfuBG84R'
}]);

// Start the Matrix client
client.startClient();

// Store messages for polling
let messages = [];

// Send a message to the room
app.post('/send', async (req, res) => {
  const { text } = req.body;
  try {
    await client.sendEvent(
      '!eVdSvxuzrcXqbgxxqe:matrix.org',
      'm.room.message',
      { msgtype: 'm.text', body: text },
      ''
    );
    messages.push({ sender: '@rokuuser:matrix.org', text });
    res.sendStatus(200);
  } catch (error) {
    console.error('Error sending message:', error);
    res.sendStatus(500);
  }
});

// Fetch recent messages
app.get('/messages', async (req, res) => {
  try {
    const response = await client.roomInitialSync('!eVdSvxuzrcXqbgxxqe:matrix.org', 20);
    messages = response.messages.chunk
      .filter(event => event.type === 'm.room.message')
      .map(event => ({
        sender: event.sender,
        text: event.content.body
      }));
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.sendStatus(500);
  }
});

// Listen for new messages in real-time
client.on('Room.timeline', (event, room) => {
  if (event.getType() === 'm.room.message' && room.roomId === '!eVdSvxuzrcXqbgxxqe:matrix.org') {
    messages.push({
      sender: event.sender,
      text: event.getContent().body
    });
    if (messages.length > 20) messages.shift(); // Keep last 20 messages
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));