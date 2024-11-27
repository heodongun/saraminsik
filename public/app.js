const videoElement = document.getElementById('webcam');
const canvas = document.getElementById('overlay');
const ctx = canvas.getContext('2d');
const actionBtn = document.getElementById('actionBtn');
const timerDisplay = document.getElementById('timer');
const statusDisplay = document.getElementById('status');

let timer = 20; // 기본 타이머 시간
let timerInterval = null;
let isGreenLightOn = false;
let isSystemActive = false; // 버튼을 눌러야 시작
let personDetected = false;

async function init() {
    // COCO-SSD 모델 로드
    const model = await cocoSsd.load();
    console.log('COCO-SSD 모델 로드 완료!');

    // 웹캠 설정
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoElement.srcObject = stream;

    videoElement.addEventListener('loadeddata', async () => {
        console.log('웹캠 데이터 로드 완료!');
        detect(model);
    });

    // 버튼 클릭 이벤트
    actionBtn.addEventListener('click', () => {
        if (!isSystemActive) {
            isSystemActive = true; // 시스템 활성화
            startTimer(); // 타이머 시작
            changeLight('green'); // 초록불로 변경
        }
    });
}

async function detect(model) {
    while (true) {
        // 모델로 영상 분석
        const predictions = await model.detect(videoElement);

        // 사람 존재 여부 확인
        const personDetectedInFrame = predictions.some(prediction => prediction.class === 'person');

        if (isSystemActive) {
            if (personDetectedInFrame) {
                if (!personDetected&&timer<=5) {
                    personDetected = true; // 사람이 인식됨
                    console.log('사람 인식됨 - 타이머 멈춤');
                    stopTimer(); // 타이머 멈추기
                }
            } else if (personDetected) {
                personDetected = false; // 사람이 사라짐
                console.log('사람 없음 - 타이머 재시작');
                startTimer(); // 타이머 재시작
            }
        }

        // 캔버스 초기화
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        // 탐지된 객체들 표시
        predictions.forEach(prediction => {
            if (prediction.class === 'person') {
                const [x, y, width, height] = prediction.bbox;

                // 사람 탐지 사각형 그리기
                ctx.strokeStyle = 'red';
                ctx.lineWidth = 4;
                ctx.strokeRect(x, y, width, height);
            }
        });

        await tf.nextFrame();
    }
}

function startTimer() {
    if (timerInterval || timer <= 0) return; // 이미 실행 중이거나 타이머가 끝났으면 실행하지 않음

    console.log('타이머 시작');
    timerInterval = setInterval(() => {
        if (timer > 0) {
            timer--;
            timerDisplay.innerText = timer;

            if (timer === 0) {
                console.log('타이머 종료 - 빨간불로 변경');
                changeLight('red'); // 빨간불로 변경
                clearInterval(timerInterval);
                timerInterval = null;
                isSystemActive = false; // 시스템 비활성화
            }
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        console.log('타이머 멈춤');
        clearInterval(timerInterval); // 현재 실행 중인 타이머 중지
        timerInterval = null;
    }
}

// 초록불과 빨간불 상태 변경
function changeLight(color) {
    const url = color === 'green' ? 'http://localhost:3000/green' : 'http://localhost:3000/red';

    // POST 요청 보내기
    fetch(url, {
        method: 'POST', // POST 방식
        headers: {
            'Content-Type': 'application/json', // JSON 데이터 전송
        },
        body: JSON.stringify({ status: color }) // 요청 본문에 색상 상태 전달
    })
    .then(response => response.text())
    .then(data => console.log(data));

    // 웹 페이지의 상태 표시 변경
    if (color === 'green') {
        statusDisplay.style.backgroundColor = 'green';
        isGreenLightOn = true;
    } else if (color === 'red') {
        statusDisplay.style.backgroundColor = 'red';
        isGreenLightOn = false;
    }
}


init();
