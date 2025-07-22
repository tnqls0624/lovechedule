#!/bin/bash

# 로컬 Redis 접속 스크립트
echo "🔗 로컬 Redis에 접속합니다..."

# Redis 컨테이너가 실행 중인지 확인
if ! docker ps --format "table {{.Names}}" | grep -q "lovechedule-redis-local"; then
    echo "❌ Redis 컨테이너가 실행되지 않았습니다."
    echo "🚀 먼저 Redis를 시작해주세요: ./run-local-redis.sh"
    exit 1
fi

echo "🐳 Redis CLI에 접속합니다..."
echo "💡 모든 키 확인: KEYS *"
echo "💡 키 값 확인: GET key_name"
echo "💡 키 설정: SET key_name value"
echo "💡 키 삭제: DEL key_name"
echo "💡 현재 DB 확인: SELECT 0"
echo "💡 메모리 사용량: INFO memory"
echo "💡 종료: exit"
echo ""

# Redis CLI 실행
docker exec -it lovechedule-redis-local redis-cli 