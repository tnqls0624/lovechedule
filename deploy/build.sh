#!/bin/bash

# 환경에 따른 docker-compose 파일 설정
set_compose_file() {
    local env="$1"

    COMPOSE_FILE=()

    case "$env" in
        dev)
            COMPOSE_FILE=("./docker-compose/syslog-linux.yaml")
            ;;
        stg)
            COMPOSE_FILE=("./docker-compose/syslog-linux.yaml")
            ;;
        prd)
            COMPOSE_FILE=("./docker-compose/syslog-linux.yaml")
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
    local services=("$@")
    echo "빌드를 시작합니다..."
    if [ ${#services[@]} -gt 0 ]; then
        docker-compose -f ./docker-compose/base.yaml $(printf -- '-f %s ' "${COMPOSE_FILE[@]}") build "${services[@]}"
    else
        docker-compose -f ./docker-compose/base.yaml $(printf -- '-f %s ' "${COMPOSE_FILE[@]}") build
    fi
    echo "빌드가 완료되었습니다."
}

# 배포 함수
deploy() {
    local services=("$@")
    echo "배포를 시작합니다..."
    if [ ${#services[@]} -gt 0 ]; then
        docker-compose -f ./docker-compose/base.yaml $(printf -- '-f %s ' "${COMPOSE_FILE[@]}") up -d "${services[@]}"
    else
        docker-compose -f ./docker-compose/base.yaml $(printf -- '-f %s ' "${COMPOSE_FILE[@]}") up -d
    fi
    echo "배포가 완료되었습니다."
}

# 컨테이너 상태 확인 및 필요 시 배포 함수
check_and_deploy() {
    local service="$1"
    local image="$2"
    echo "$service 상태를 확인 중..."

    # 컨테이너 실행 여부 확인
    local container_id=$(docker ps --filter "ancestor=$image" --format "{{.ID}}")
    if [ -z "$container_id" ]; then
        echo "$service가 실행 중이지 않습니다. 배포를 시작합니다."
        deploy "$service"
    else
        echo "$service는 이미 실행 중입니다. 배포하지 않습니다."
    fi
}

# 컨테이너 상태 및 버전 확인 함수
check_containers() {
    echo ""
    echo "================================="
    echo ""

    SERVER_NODE_VERSION=$(grep "^FROM node:" ../server/Dockerfile | awk '{print $2}')
    echo "SERVER_NODE_VERSION: $SERVER_NODE_VERSION"

    # MongoDB 확인 및 배포
    check_and_deploy "mongodb" "mongo"

    # Redis 확인 및 배포
    check_and_deploy "redis" "redis"

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
        SERVICES+=("$arg")
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