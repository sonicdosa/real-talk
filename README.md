# Real Talk

원어민이 실제로 쓰는 일상 대화로 공부하는 영어회화 웹앱 (PWA, 미국식 영어)

## 실행

```bash
npm install
npm run dev        # http://localhost:5173 (같은 Wi-Fi의 폰에서는 http://<PC IP>:5173)
npm run build      # dist/ 에 배포용 파일 생성
```

## 구조

- `src/data/*.ts`: 기본 대화 30개 (상황별 파일)
- `src/db.ts`: IndexedDB (저장한 표현과 복습 일정, 진도, 학습 기록, 직접 추가한 대화)
- `src/lib/srs.ts`: 간격 반복 복습 (SM-2를 단순화한 방식)
- `src/lib/quiz.ts`: 대화 데이터로 퀴즈 자동 생성
- `src/lib/speech.ts`: 브라우저 음성 읽기 (Web Speech API, en-US)
- `src/pages/Import.tsx`: ChatGPT/Gemini용 프롬프트 생성과 JSON 가져오기

## 대화 추가 규칙

표현의 `match`는 대사에 있는 문자열과 **정확히 같아야** 밑줄 강조와 퀴즈에 쓰입니다.
개발 모드에서는 기본 데이터의 `match`가 대사에 없으면 콘솔에 경고가 나옵니다.
