const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const { Gpio } = require('onoff');
app.use(cors()); // 모든 도메인에서의 접근 허용


const greenLight = new Gpio(12, 'out'); // 초록불
const redLight = new Gpio(8, 'out'); // 빨간불

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/green', (req, res) => {
    greenLight.writeSync(1); // 초록불 ON
    redLight.writeSync(0);   // 빨간불 OFF
    res.send('초록불 켜짐');
});

// 빨간불 켜기
app.post('/red', (req, res) => {
    redLight.writeSync(1);   // 빨간불 ON
    greenLight.writeSync(0); // 초록불 OFF
    res.send('빨간불 켜짐');
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});

process.on('SIGINT', () => {
    greenLight.unexport();
    redLight.unexport();
    process.exit();
});
