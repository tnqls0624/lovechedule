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

# Docker Swarm 스택 배포 함수
deploy_stack() {
    local stack_name="$1"
    echo "Docker Swarm 스택을 배포합니다..."
    docker stack deploy -c ./docker-compose/base.yaml $(printf -- '-c %s ' "${COMPOSE_FILE[@]}") "$stack_name"
    echo "Docker Swarm 스택 배포가 완료되었습니다."
}

# 컨테이너 상태 확인 함수 (Swarm 환경)
check_services() {
    local stack_name="$1"
    echo ""
    echo "================================="
    echo "Docker Swarm 서비스 상태 확인: $stack_name"
    echo "================================="
    docker stack services "$stack_name"
    echo ""
    echo "Docker Swarm 서비스 상태 확인 완료"
    echo ""
}

# 환경 변수 체크 및 설정
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "사용법: $0 <스택 이름> <환경> [--deploy]"
    echo "예: $0 lovechedule stg --deploy"
    exit 1
fi

STACK_NAME="$1"
ENV="$2"
shift 2 # 첫 두 개의 인수 (스택 이름과 환경)을 제거하고 나머지 인수만 남김

# '--deploy' 여부 확인
DEPLOY=false
for arg in "$@"; do
    if [[ "$arg" == "--deploy" ]]; then
        DEPLOY=true
    fi
done

# Swarm 초기화 확인 및 설정
if ! docker info | grep -q "Swarm: active"; then
    echo "Swarm이 활성화되지 않았습니다. Swarm을 초기화합니다..."
    docker swarm init
fi

set_compose_file "$ENV"

# 스크립트 옵션 처리
if [ "$DEPLOY" = true ]; then
    deploy_stack "$STACK_NAME"
    check_services "$STACK_NAME"
else
    echo "배포 없이 Swarm 상태를 확인합니다."
    check_services "$STACK_NAME"
fi