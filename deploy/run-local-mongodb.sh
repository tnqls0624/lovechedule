#!/bin/bash

# 로컬 MongoDB 실행 스크립트
echo "🚀 로컬 MongoDB를 시작합니다..."

# 작업 디렉토리 설정
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# MongoDB 컨테이너가 이미 실행 중인지 확인
if docker ps --format "table {{.Names}}" | grep -q "lovechedule-mongodb-local"; then
    echo "⚠️ MongoDB가 이미 실행 중입니다."
    echo "📍 컨테이너 이름: lovechedule-mongodb-local"
    echo "🔗 연결 정보: mongodb://root:1234@localhost:27017/lovechedule?authSource=admin"
    exit 0
fi

# 기존 컨테이너가 중지되어 있다면 제거
docker rm lovechedule-mongodb-local 2>/dev/null || true

# MongoDB 컨테이너 실행
echo "🐳 MongoDB 컨테이너를 생성하고 실행합니다..."
docker run -d \
    --name lovechedule-mongodb-local \
    -p 27017:27017 \
    -e MONGO_INITDB_ROOT_USERNAME=root \
    -e MONGO_INITDB_ROOT_PASSWORD=1234 \
    -e MONGO_INITDB_DATABASE=lovechedule \
    -v "${SCRIPT_DIR}/docker-compose/mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro" \
    -v lovechedule_mongodb_data:/data/db \
    mongo:latest

# 잠시 대기 (MongoDB 초기화 시간)
echo "⏳ MongoDB 초기화를 기다리는 중..."
sleep 10

# 연결 확인
echo "🔍 MongoDB 연결 상태를 확인합니다..."
if docker exec lovechedule-mongodb-local mongosh --host localhost --port 27017 -u root -p 1234 --authenticationDatabase admin --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "✅ MongoDB가 성공적으로 실행되었습니다!"
    echo ""
    echo "📋 연결 정보:"
    echo "🔗 URI: mongodb://root:1234@localhost:27017/lovechedule?authSource=admin"
    echo "🏠 Host: localhost"
    echo "🚪 Port: 27017"
    echo "👤 Username: root"
    echo "🔑 Password: 1234"
    echo "📂 Database: lovechedule"
    echo ""
    echo "👥 테스트 계정:"
    echo "📧 testuser1@lovechedule.com"
    echo "📧 testuser2@lovechedule.com"
    echo ""
    echo "🛑 중지하려면: docker stop lovechedule-mongodb-local"
    echo "🗑️ 완전 삭제하려면: docker rm lovechedule-mongodb-local"
else
    echo "❌ MongoDB 연결에 실패했습니다."
    echo "📋 로그 확인: docker logs lovechedule-mongodb-local"
fi 