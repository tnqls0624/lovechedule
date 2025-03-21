FROM node:18-alpine

WORKDIR /usr/src/app

# 의존성 파일 복사 및 설치 (개발 의존성 포함)
COPY package*.json ./
RUN npm ci

# 소스 코드 복사
COPY . .

# 빌드 실행
RUN npm run build

# 프로덕션 의존성만 남기기
RUN npm prune --production

ENV NODE_ENV=production
ENV TZ=Asia/Seoul

# 환경변수 설정
ENV PORT=3000

# 포트 노출
EXPOSE 3000

# 애플리케이션 실행
CMD ["npm", "run", "start:prod"]