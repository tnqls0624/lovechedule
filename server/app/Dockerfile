FROM node:18-alpine

WORKDIR /usr/src/app

# 의존성 파일 복사 및 설치 (개발 의존성 포함)
COPY package*.json ./
RUN npm ci

# 소스 코드 복사
COPY . .

# Firebase 키 파일 디렉토리 생성
RUN mkdir -p dist/asset

# 빌드 실행
RUN npm run build

# Firebase 키 파일이 위치한 디렉토리가 빌드 중에 유지되도록 확인
RUN if [ -f src/asset/lovechedule-firebase-adminsdk-fbsvc-96c78810d7.json ]; then \
    cp src/asset/lovechedule-firebase-adminsdk-fbsvc-96c78810d7.json dist/asset/; \
    fi

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