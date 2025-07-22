#!/bin/bash

# 로컬 Redis 실행 스크립트
echo "🚀 로컬 Redis를 시작합니다..."

# 작업 디렉토리 설정
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Redis 컨테이너가 이미 실행 중인지 확인
if docker ps --format "table {{.Names}}" | grep -q "lovechedule-redis-local"; then
    echo "⚠️ Redis가 이미 실행 중입니다."
    echo "📍 컨테이너 이름: lovechedule-redis-local"
    echo "🔗 연결 정보: redis://localhost:6379"
    exit 0
fi

# 기존 컨테이너가 중지되어 있다면 제거
docker rm lovechedule-redis-local 2>/dev/null || true

# Redis 컨테이너 실행
echo "🐳 Redis 컨테이너를 생성하고 실행합니다..."
docker run -d \
    --name lovechedule-redis-local \
    -p 6379:6379 \
    -v lovechedule_redis_data:/data \
    redis:7-alpine redis-server --appendonly yes

# 잠시 대기 (Redis 초기화 시간)
echo "⏳ Redis 초기화를 기다리는 중..."
sleep 3

# 연결 확인
echo "🔍 Redis 연결 상태를 확인합니다..."
if docker exec lovechedule-redis-local redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis가 성공적으로 실행되었습니다!"
    echo ""
    echo "📋 연결 정보:"
    echo "🔗 URI: redis://localhost:6379"
    echo "🏠 Host: localhost"
    echo "🚪 Port: 6379"
    echo "📂 Database: 0 (기본값)"
    echo ""
    echo "🛑 중지하려면: docker stop lovechedule-redis-local"
    echo "🗑️ 완전 삭제하려면: docker rm lovechedule-redis-local"
    echo "🔗 접속하려면: ./connect-local-redis.sh"
else
    echo "❌ Redis 연결에 실패했습니다."
    echo "📋 로그 확인: docker logs lovechedule-redis-local"
fi 