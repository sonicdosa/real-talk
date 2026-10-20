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

## 원어민 음성 (edge-tts)

기본 대화는 `public/audio/*.mp3`에 미리 만든 AI 음성으로 재생됩니다. 클립이 없는 문장(직접 추가한 대화 등)은 기기 음성으로 읽어요.
대사나 표현을 고쳤다면 음성을 다시 만드세요. 이미 있는 클립은 건너뛰고, 안 쓰는 클립은 지웁니다.

```bash
node scripts/export-tts.mjs
python scripts/gen_audio.py
```

- 목소리 배정과 성별 구분은 `scripts/export-tts.mjs`, 문자 줄임말을 읽는 방식은 `src/lib/clips.ts`의 `TEXTING_SAY`에서 바꿉니다.
- `gen_audio.py`를 실행하려면 `pip install edge-tts`가 필요하고, `--force`를 붙이면 전부 다시 만듭니다.

## 대화 추가 규칙

표현의 `match`는 대사에 있는 문자열과 **정확히 같아야** 밑줄 강조와 퀴즈에 쓰입니다.
개발 모드에서는 기본 데이터의 `match`가 대사에 없으면 콘솔에 경고가 나옵니다.
