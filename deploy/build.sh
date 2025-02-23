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

# Docker 이미지 빌드 및 푸시 함수 (타겟 추가)
build_and_push_image() {
    local image_name="$1"
    local tag="$2"
    local registry="$3"
    local target="$4"

    # MongoDB, Redis, Traefik은 빌드 없이 Docker Hub에서 Pull
    if [[ "$target" == "mongodb" || "$target" == "redis" || "$target" == "traefik" ]]; then
        echo "✅ ${target}는 Docker Hub에서 Pull만 하고 빌드하지 않습니다."
        return
    fi

    if [ -n "$target" ]; then
        echo "🎯 타겟 빌드: ${target}"
        docker build --no-cache -t "${registry}/${image_name}:${tag}-${target}" --target "${target}" ../server
        echo "🐳 Docker 이미지를 푸시합니다: ${registry}/${image_name}:${tag}-${target}"
        docker push "${registry}/${image_name}:${tag}-${target}"
    else
        echo "🚀 전체 빌드: ${image_name}:${tag}"
        docker build --no-cache -t "${registry}/${image_name}:${tag}" ../server
        echo "🐳 Docker 이미지를 푸시합니다: ${registry}/${image_name}:${tag}"
        docker push "${registry}/${image_name}:${tag}"
    fi
}

# Docker Swarm 스택 배포 함수
deploy_stack() {
    local stack_name="$1"
    echo "🚀 Docker Swarm 스택을 배포합니다..."
    docker stack deploy -c ./docker-compose/base.yaml $(printf -- '-c %s ' "${COMPOSE_FILE[@]}") "$stack_name"
    echo "✅ Docker Swarm 스택 배포가 완료되었습니다."
}

# 컨테이너 상태 확인 함수 (Swarm 환경)
check_services() {
    local stack_name="$1"
    echo ""
    echo "================================="
    echo "🐳 Docker Swarm 서비스 상태 확인: $stack_name"
    echo "================================="

    docker stack services "$stack_name" | tail -n +2 | while read -r line; do
        service_id=$(echo "$line" | awk '{print $1}')
        service_name=$(echo "$line" | awk '{print $2}')
        replicas=$(echo "$line" | awk '{print $4}')
        image=$(echo "$line" | awk '{print $5}')

        # 배포 시간 확인
        updated_at=$(docker service inspect "$service_id" --format '{{.UpdatedAt}}')
        if [[ -n "$updated_at" ]]; then
            # UTC 시간을 KST로 변환
            deploy_time=$(date -d "$(echo "$updated_at" | sed 's/ +0000 UTC//')" +"%Y-%m-%d %H:%M:%S" --utc --date '+9 hours')
        else
            deploy_time="Unknown"
        fi

        echo "서비스: $service_name"
        echo " - 이미지: $image"
        echo " - 상태: $replicas"
        echo " - 최근 배포 시간: $deploy_time"
        echo ""
    done

    echo "================================="
    echo ""
}

# 환경 변수 체크 및 설정
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "사용법: $0 <스택 이름> <환경> [타겟] [--deploy]"
    echo "예: $0 lovechedule prd mongodb --deploy"
    echo "예: $0 lovechedule prd --deploy  (전체 빌드 및 배포)"
    exit 1
fi

STACK_NAME="$1"  # 첫 번째 인수는 스택 이름
ENV="$2"         # 두 번째 인수는 환경 이름
TARGET="${3:-}"  # 세 번째 인수는 타겟 이름 (옵션), 없으면 전체 빌드
shift 3          # 첫 세 개의 인수 제거

# '--deploy' 여부 확인
DEPLOY=false
for arg in "$@"; do
    if [[ "$arg" == "--deploy" ]]; then
        DEPLOY=true
    fi
done

# Swarm 초기화 확인 및 설정
if ! docker info | grep -q "Swarm: active"; then
    echo "🚀 Swarm이 활성화되지 않았습니다. Swarm을 초기화합니다..."
    docker swarm init
fi

# 이미지 이름 및 레지스트리 설정
IMAGE_NAME="project"
IMAGE_TAG="latest"
REGISTRY="soomumu" # Docker Hub 사용자명 입력

# 이미지 빌드 및 푸시 (타겟 지정)
build_and_push_image "$IMAGE_NAME" "$IMAGE_TAG" "$REGISTRY" "$TARGET"

# Compose 파일 설정
set_compose_file "$ENV"

# 스크립트 옵션 처리
if [ "$DEPLOY" = true ]; then
    deploy_stack "$STACK_NAME"
    check_services "$STACK_NAME"
else
    echo "✅ 배포 없이 Swarm 상태를 확인합니다."
    check_services "$STACK_NAME"
fi
