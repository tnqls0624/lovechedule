#!/bin/bash

# Swarm Compose 파일 설정 함수
set_compose_file() {
    local env="$1"

    case "$env" in
        dev | stg | prd)
            COMPOSE_FILE="./docker-compose/syslog-linux.yaml"
            ;;
        *)
            echo "지원하지 않는 환경입니다: $env"
            echo "사용 가능한 환경: dev, stg, prd"
            exit 1
            ;;
    esac

    echo "$env 환경을 사용하여 $COMPOSE_FILE 파일을 설정합니다."
}

# Docker 이미지 빌드 및 푸시 함수
build_and_push_image() {
    local image_name="$1"
    local tag="$2"
    local registry="$3"

    echo "Docker 이미지를 빌드합니다: ${registry}/${image_name}:${tag}"
    docker build -t "${registry}/${image_name}:${tag}" ../server

    echo "Docker 이미지를 푸시합니다: ${registry}/${image_name}:${tag}"
    docker push "${registry}/${image_name}:${tag}"
}

# Swarm 서비스 상태 확인 및 배포 시간 출력 함수
print_service_status() {
    local stack_name="$1"
    echo ""
    echo "================================="
    echo "Docker Swarm 서비스 상태 및 배포 시간 확인: $stack_name"
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
}

# Swarm 서비스 상태 확인 및 필요 시 업데이트 함수
update_service_if_needed() {
    local service_name="$1"
    local stack_service_name="$2"
    local image="$3"

    echo "$service_name 상태를 확인 중..."

    # Swarm 서비스 상태 확인
    local replicas=$(docker service ls --filter "name=${stack_service_name}" --format "{{.Replicas}}" | awk -F '/' '{print $1}')
    if [[ "$replicas" -ge 1 ]]; then
        echo "$service_name가 이미 실행 중입니다. 업데이트를 건너뜁니다."
    else
        echo "$service_name를 업데이트합니다."
        docker service update --force --image "$image" "$stack_service_name"
    fi
}

# 환경 변수 체크 및 설정
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "사용법: $0 <스택 이름> <환경> [--deploy]"
    echo "예: $0 lovechedule prd --deploy"
    exit 1
fi

STACK_NAME="$1"  # 첫 번째 인수는 스택 이름
ENV="$2"         # 두 번째 인수는 환경 이름
shift 2          # 첫 두 개의 인수 제거

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

# 이미지 이름 및 레지스트리 설정
IMAGE_NAME="project"
IMAGE_TAG="latest"
REGISTRY="soomumu"  # Docker Hub 사용자명 입력

# 이미지 빌드 및 푸시
build_and_push_image "$IMAGE_NAME" "$IMAGE_TAG" "$REGISTRY"

# Compose 파일 설정
set_compose_file "$ENV"

# MongoDB와 Redis 서비스 업데이트 확인 및 처리
update_service_if_needed "MongoDB" "mongodb"
update_service_if_needed "Redis" "redis"

# 스크립트 옵션 처리
if [ "$DEPLOY" = true ]; then
    echo "Docker Swarm 스택을 배포합니다..."
    docker stack deploy -c "$COMPOSE_FILE" "$STACK_NAME"
    print_service_status "$STACK_NAME"
else
    echo "배포 없이 Swarm 상태를 확인합니다."
    print_service_status "$STACK_NAME"
fi
