FROM node:18-alpine

WORKDIR /usr/src/app

# 의존성 파일 복사 및 설치 (개발 의존성 포함)
COPY package*.json ./
RUN npm ci

# 소스 코드 복사 전에 asset 디렉토리 생성
RUN mkdir -p src/asset

# 소스 코드 복사
COPY . .

# Firebase 키 파일 확인 및 경고 출력 (빌드는 계속 진행)
RUN if [ ! -f src/asset/lovechedule-firebase-adminsdk-fbsvc-96c78810d7.json ]; then \
    echo "WARNING: Firebase key file is missing! Create a file at src/asset/lovechedule-firebase-adminsdk-fbsvc-96c78810d7.json"; \
    echo "Creating empty placeholder file..."; \
    echo "{}" > src/asset/lovechedule-firebase-adminsdk-fbsvc-96c78810d7.json; \
    fi

# NestJS 빌드 전 dist 디렉토리 생성 (asset 복사 위치 확보)
RUN mkdir -p dist/asset

# 빌드 실행
RUN npm run build

# Firebase 키 파일을 dist/asset 디렉토리로 복사
RUN cp src/asset/lovechedule-firebase-adminsdk-fbsvc-96c78810d7.json dist/asset/

# 빌드 후 asset 디렉토리 확인 (디버깅용)
RUN ls -la dist/asset || echo "Warning: dist/asset directory not found or empty"

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