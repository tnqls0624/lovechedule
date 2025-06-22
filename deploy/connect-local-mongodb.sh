#!/bin/bash

# 로컬 MongoDB 접속 스크립트
echo "🔗 로컬 MongoDB에 접속합니다..."

# MongoDB 컨테이너가 실행 중인지 확인
if ! docker ps --format "table {{.Names}}" | grep -q "lovechedule-mongodb-local"; then
    echo "❌ MongoDB 컨테이너가 실행되지 않았습니다."
    echo "🚀 먼저 MongoDB를 시작해주세요: ./run-local-mongodb.sh"
    exit 1
fi

echo "🐳 MongoDB Shell에 접속합니다..."
echo "💡 데이터베이스 확인: show dbs"
echo "💡 컬렉션 확인: show collections"
echo "💡 사용자 목록: db.users.find().pretty()"
echo "💡 워크스페이스 목록: db.workspaces.find().pretty()"
echo "💡 종료: exit"
echo ""

# MongoDB Shell 실행
docker exec -it lovechedule-mongodb-local mongosh \
    --host localhost \
    --port 27017 \
    -u root \
    -p 1234 \
    --authenticationDatabase admin \
    lovechedule 