# 빌드 단계
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# 패키지 파일 복사 및 의존성 설치
COPY package*.json ./
RUN npm ci

# 소스 코드 복사 및 빌드
COPY . .
RUN npm run build

# 실행 단계
FROM node:18-alpine AS production

WORKDIR /usr/src/app

# 프로덕션 의존성만 설치
COPY package*.json ./
RUN npm ci --only=production

# 빌드 단계에서 생성된 dist 디렉토리만 복사
COPY --from=builder /usr/src/app/dist ./dist

# 필요한 설정 파일만 복사 (환경 설정 파일이 있다면)
COPY --from=builder /usr/src/app/.env* ./

EXPOSE 3000

CMD ["node", "dist/main.js"]