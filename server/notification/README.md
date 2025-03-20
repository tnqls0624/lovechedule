# 알림 서버

NestJS로 구현된 크론 작업 기반 알림 서버입니다.

## 설치

```bash
npm install
```

## 실행 방법

### 개발 모드

```bash
npm run start:dev
```

### 프로덕션 모드

```bash
npm run build
npm run start:prod
```

## 기능

- 매일 오전 9시에 실행되는 일일 알림
- 매 시간마다 실행되는 시간별 알림
- 10분마다 실행되는 주기적 상태 확인

## 환경 변수 설정

`.env` 파일을 생성하여 다음과 같은 환경 변수를 설정할 수 있습니다:

```
DATABASE_URL=your-database-url
API_KEY=your-api-key
``` 