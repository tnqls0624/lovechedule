FROM node:18-alpine

WORKDIR /usr/src/app

# 패키지 캐싱 최적화를 위해 package.json과 package-lock.json만 먼저 복사
COPY package*.json ./

# 의존성 설치 (캐시 활용 및 속도 개선)
RUN npm ci --legacy-peer-deps --no-audit --prefer-offline

# 소스 코드 복사 전에 asset 디렉토리 생성
RUN mkdir -p src/asset dist/asset

# 소스 코드 복사
COPY . .

# Firebase 키 파일 확인 및 처리
RUN if [ ! -f src/asset/lovechedule-firebase-adminsdk-fbsvc-96c78810d7.json ]; then \
    echo "WARNING: Firebase key file is missing! Creating placeholder..."; \
    echo "{}" > src/asset/lovechedule-firebase-adminsdk-fbsvc-96c78810d7.json; \
    fi

# 빌드 실행 (병렬 처리로 속도 개선)
RUN npm run build --max-old-space-size=2048


# 프로덕션 의존성만 남기기 (더 작은 이미지 크기)
RUN npm prune --production --no-audit

# 환경설정
ENV NODE_ENV=production \
    TZ=Asia/Seoul \
    PORT=3000 \
    NOTIFICATION_GRPC_URL=notification-server:9000 \
    NOTIFICATION_SERVER_URL=http://notification-server:3100

# 포트 노출
EXPOSE 3000

# 애플리케이션 실행
CMD ["npm", "run", "start:prod"]