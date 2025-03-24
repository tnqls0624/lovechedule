FROM node:18-alpine

WORKDIR /usr/src/app

# 의존성 파일 복사 및 설치 (개발 의존성 포함)
COPY package*.json ./

# 의존성 설치 (캐시 활용 및 속도 개선)
RUN npm ci --legacy-peer-deps --no-audit --prefer-offline

# 소스 코드 복사
COPY . .

# 빌드 실행 (병렬 처리로 속도 개선)
RUN npm run build --max-old-space-size=2048

# 프로덕션 의존성만 남기기 (더 작은 이미지 크기)
RUN npm prune --production --no-audit --legacy-peer-deps

ENV NODE_ENV=production
ENV TZ=Asia/Seoul

# 환경변수 설정
ENV NODE_ENV=production \
    TZ=Asia/Seoul \
    PORT=3100 \
    NOTIFICATION_GRPC_URL=0.0.0.0:9000 \
    NOTIFICATION_SERVER_URL=http://notification-server:3100


# 포트 노출
EXPOSE 3100
EXPOSE 9000

# 애플리케이션 실행
CMD ["npm", "run", "start:prod"] 