FROM node:18-alpine

WORKDIR /usr/src/app

# 의존성 파일 복사 및 설치
COPY package*.json ./
RUN npm ci --only=production

# 소스 코드 복사
COPY . .

# 필요한 경우 빌드
RUN npm run build

ENV NODE_ENV=production
ENV TZ=Asia/Seoul

# 환경변수 설정
ENV PORT=3100

# 포트 노출
EXPOSE 3100

# 애플리케이션 실행
CMD ["npm", "run", "start:prod"] 