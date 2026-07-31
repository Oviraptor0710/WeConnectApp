import { WebSocketServer } from 'ws';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Tạo HTTP server để phục vụ file index.html
const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading index.html');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(data);
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

// 2. Khởi tạo WebSocket Server đính kèm vào HTTP server
const wss = new WebSocketServer({ server });

console.log('Vui lòng mở trình duyệt và truy cập vào địa chỉ: http://localhost:8080');

// Lắng nghe sự kiện khi có một client kết nối tới
wss.on('connection', function connection(ws) {
  console.log('Một client mới đã kết nối!');

  // Gửi một tin nhắn chào mừng ngay khi kết nối
  ws.send(JSON.stringify({
    type: 'system',
    message: 'Chào mừng bạn đến với WebSocket Server!'
  }));

  // Lắng nghe sự kiện khi nhận được tin nhắn từ client
  ws.on('message', function message(data) {
    const textData = data.toString('utf-8');
    console.log('Nhận được tin nhắn từ client: %s', textData);

    // Phát sóng (Broadcast) tin nhắn này tới tất cả các client đang kết nối
    wss.clients.forEach(function each(client) {
      if (client.readyState === 1 /* WebSocket.OPEN */) {
        client.send(textData);
      }
    });
  });

  // Xử lý khi client ngắt kết nối
  ws.on('close', () => {
    console.log('Client đã ngắt kết nối.');
  });
});

// Chạy server ở cổng 8080
server.listen(8080);
