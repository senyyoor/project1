const express = require('express');
const WebSocket = require('ws');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const server = app.listen(3000, () => console.log("Server running on port 3000"));

const wss = new WebSocket.Server({ server });
const db = new sqlite3.Database('chat.db');

// Ініціалізація бази даних
db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT)');
    db.run('CREATE TABLE IF NOT EXISTS contacts (user_id INTEGER, contact_id INTEGER, FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(contact_id) REFERENCES users(id))');
    db.run('CREATE TABLE IF NOT EXISTS blacklist (user_id INTEGER, contact_id INTEGER, FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(contact_id) REFERENCES users(id))');
    db.run('CREATE TABLE IF NOT EXISTS messages (sender_id INTEGER, receiver_id INTEGER, message TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(sender_id) REFERENCES users(id), FOREIGN KEY(receiver_id) REFERENCES users(id))');
});

// Підключення користувача
const clients = {}; // Підключені користувачі

wss.on('connection', (ws) => {
    let userId = null;

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'register') {
            // Реєстрація нового користувача
            db.get('SELECT * FROM users WHERE username = ?', [data.username], (err, row) => {
                if (row) {
                    // Якщо користувач вже існує
                    ws.send(JSON.stringify({ error: 'Username already exists!' }));
                } else {
                    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [data.username, data.password], function (err) {
                        if (err) {
                            ws.send(JSON.stringify({ error: 'Registration failed!' }));
                        } else {
                            ws.send(JSON.stringify({ success: 'Registration successful!' }));
                        }
                    });
                }
            });
        } else if (data.type === 'login') {
            // Логін користувача
            db.get('SELECT * FROM users WHERE username = ? AND password = ?', [data.username, data.password], (err, row) => {
                if (row) {
                    userId = row.id;
                    clients[userId] = ws;
                    ws.send(JSON.stringify({ success: 'Login successful', userId: userId }));
                } else {
                    ws.send(JSON.stringify({ error: 'Invalid credentials!' }));
                }
            });
        }
        // Логіка для надсилання повідомлень і інші функції тут...
    });

    ws.on('close', () => {
        if (userId) {
            delete clients[userId];
        }
    });
});
