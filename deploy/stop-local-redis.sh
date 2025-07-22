#!/bin/bash

# 로컬 Redis 중지 스크립트
echo "🛑 로컬 Redis를 중지합니다..."

# Redis 컨테이너 상태 확인
if docker ps --format "table {{.Names}}" | grep -q "lovechedule-redis-local"; then
    echo "🐳 Redis 컨테이너를 중지합니다..."
    docker stop lovechedule-redis-local
    echo "✅ Redis가 중지되었습니다."
    
    # 선택지 제공
    echo ""
    read -p "🗑️ 컨테이너를 완전히 삭제하시겠습니까? (데이터는 유지됩니다) [y/N]: " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker rm lovechedule-redis-local
        echo "✅ 컨테이너가 삭제되었습니다."
        echo "💾 데이터 볼륨은 유지되어 다음에 다시 실행하면 데이터가 그대로 남아있습니다."
    else
        echo "📦 컨테이너는 중지 상태로 유지됩니다."
        echo "🔄 다시 시작하려면: docker start lovechedule-redis-local"
    fi
else
    echo "⚠️ 실행 중인 Redis 컨테이너가 없습니다."
    
    # 중지된 컨테이너 확인
    if docker ps -a --format "table {{.Names}}" | grep -q "lovechedule-redis-local"; then
        echo "📦 중지된 컨테이너를 발견했습니다."
        read -p "🗑️ 중지된 컨테이너를 삭제하시겠습니까? [y/N]: " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker rm lovechedule-redis-local
            echo "✅ 컨테이너가 삭제되었습니다."
        fi
    fi
fi

echo ""
echo "📋 유용한 명령어들:"
echo "🚀 Redis 시작: ./run-local-redis.sh"
echo "🔍 로그 확인: docker logs lovechedule-redis-local"
echo "🗄️ 데이터 볼륨 삭제: docker volume rm lovechedule_redis_data" 