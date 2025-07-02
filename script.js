const socket = new WebSocket('ws://localhost:3000');
let userId = null;

function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const message = { type: 'login', username, password };

    socket.send(JSON.stringify(message));
}

function register() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const message = { type: 'register', username, password };

    socket.send(JSON.stringify(message));
}

function sendMessage() {
    const message = document.getElementById('message').value;
    const receiverId = prompt('Enter the receiver ID:');

    const data = {
        type: 'send_message',
        message,
        receiverId
    };

    socket.send(JSON.stringify(data));
    document.getElementById('message').value = '';
}

socket.onmessage = function(event) {
    const data = JSON.parse(event.data);

    if (data.success) {
        alert(data.success);
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('chat-container').style.display = 'block';
        document.getElementById('username-display').textContent = data.username;
    } else if (data.error) {
        alert(data.error);
    } else if (data.senderId && data.message) {
        const chatBox = document.getElementById('chat-box');
        chatBox.innerHTML += `<div><b>User ${data.senderId}</b>: ${data.message}</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}
