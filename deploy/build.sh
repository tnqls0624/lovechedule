#!/bin/bash

# 환경에 따른 docker-compose 파일 설정
set_compose_file() {
    local env="$1"

    COMPOSE_FILE=()

    case "$env" in
        dev)
            COMPOSE_FILE=("./docker-compose/syslog-linux.yml")
            ;;
        stg)
            COMPOSE_FILE=("./docker-compose/syslog-linux.yml")
            ;;
        prd)
            COMPOSE_FILE=("./docker-compose/syslog-linux.yml")
            ;;
        *)
            echo "지원하지 않는 환경입니다: $env"
            echo "사용 가능한 환경: dev, stg, prd"
            exit 1
            ;;
    esac
    echo "$env 환경을 사용하여 ${COMPOSE_FILE[*]} 파일을 설정합니다."
}

# 빌드 함수
build() {
    local services=("$@") # 모든 전달된 서비스 이름을 배열로 처리
    echo "빌드를 시작합니다..."
    if [ ${#services[@]} -gt 0 ]; then
        # 여러 서비스가 지정되면 해당 서비스들만 빌드
        docker-compose -f ./docker-compose/base.yml $(printf -- '-f %s ' "${COMPOSE_FILE[@]}") build "${services[@]}"
    else
        # 서비스가 지정되지 않으면 모든 서비스 빌드
        docker-compose -f ./docker-compose/base.yml $(printf -- '-f %s ' "${COMPOSE_FILE[@]}") build
    fi
    echo "빌드가 완료되었습니다."
}

# 배포 함수
deploy() {
    local services=("$@") # 모든 전달된 서비스 이름을 배열로 처리
    echo "배포를 시작합니다..."
    if [ ${#services[@]} -gt 0 ]; then
        # 여러 서비스가 지정되면 해당 서비스들만 배포
        docker-compose -f ./docker-compose/base.yml $(printf -- '-f %s ' "${COMPOSE_FILE[@]}") up -d "${services[@]}"
    else
        # 서비스가 지정되지 않으면 모든 서비스 배포
        docker-compose -f ./docker-compose/base.yml $(printf -- '-f %s ' "${COMPOSE_FILE[@]}") up -d
    fi
    echo "배포가 완료되었습니다."
}

# 컨테이너 상태 및 버전 확인 함수
check_containers() {
    echo ""
    echo "================================="
    echo ""

    SERVER_NODE_VERSION=$(grep "^FROM node:" ../server/Dockerfile | awk '{print $2}')
    echo "SERVER_NODE_VERSION: $API_NODE_VERSION"

    # MongoDB 버전 확인
    MONGO_CONTAINER=$(docker ps --filter "ancestor=mongo" --format "{{.ID}}")
    if [ -n "$MONGO_CONTAINER" ]; then
        MONGO_VERSION=$(docker exec $MONGO_CONTAINER mongod --version | grep "db version" | awk '{print $3}')
        echo "MongoDB_VERSION: $MONGO_VERSION"
    else
        echo "MongoDB를 배포하지 않습니다."
    fi

    # Redis 버전 확인
    REDIS_CONTAINER=$(docker ps --filter "ancestor=redis" --format "{{.ID}}")
    if [ -n "$REDIS_CONTAINER" ]; then
        REDIS_VERSION=$(docker exec $REDIS_CONTAINER redis-server --version | awk '{print $3}' | cut -d'=' -f2)
        echo "REDIS_VERSION: $REDIS_VERSION"
    else
        echo "Redis를 배포하지 않습니다."
    fi

    echo ""
    BUILD_VERSION=$(git rev-parse --short HEAD)
    echo "BUILD VERSION: $BUILD_VERSION"
    CURRENT_TIME=$(date +"%Y-%m-%d %H:%M:%S")
    echo "배포 및 빌드 시간: $CURRENT_TIME"
    echo ""
    echo "================================="
    echo ""
    docker ps
}

# 환경 변수 체크 및 설정
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "사용법: $0 <타입> <환경> [서비스명 ...] [--deploy]"
    echo "예: $0 stg lovechedule-server --deploy"
    echo "예: $0 stg --deploy"
    exit 1
fi

TYPE="$1"
ENV="$2"
shift 2 # 첫 두 개의 인수 (타입과 환경)을 제거하고 나머지 인수만 남김

# 남은 인수에서 '--deploy' 여부 확인
SERVICES=()
DEPLOY=false
for arg in "$@"; do
    if [[ "$arg" == "--deploy" ]]; then
        DEPLOY=true
    else
        SERVICES+=("$arg") # 서비스 이름을 배열에 추가
    fi
done

set_compose_file "$TYPE" "$ENV"

# 스크립트 옵션 처리
if [ "$DEPLOY" = true ]; then
    build "${SERVICES[@]}"
    deploy "${SERVICES[@]}"
    check_containers
else
    build "${SERVICES[@]}"
    check_containers
fi