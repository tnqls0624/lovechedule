#!/bin/bash

# 작업 디렉토리 확인 및 설정
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(dirname "$SCRIPT_DIR")"
echo "✅ 작업 디렉토리: $WORKSPACE_DIR"

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

# Docker 이미지 빌드 및 푸시 함수
build_and_push_image() {
    local image_name="$1"
    local registry="$2"

    # 서비스별 이미지 처리
    case "$image_name" in
        "traefik")
            echo "✅ traefik은 Docker Hub에서 Pull만 하고 빌드하지 않습니다."
            ;;
        "redis")
            echo "✅ redis는 Docker Hub에서 Pull만 하고 빌드하지 않습니다."
            ;;
        "lovechedule-server")
            echo "🚀 서버 애플리케이션을 빌드합니다..."
            # 태그 설정
            local tag="lovechedule"
            # 이미지 빌드 전 기존 이미지 제거 (오류 무시)
            docker rmi "${registry}:${tag}" 2>/dev/null || true
            docker rmi "${registry}:${tag}-$(date +%Y%m%d)*" 2>/dev/null || true
            
            # EC2 환경에서는 npm이 설치되어 있지 않을 수 있으므로 Docker 내에서만 빌드
            echo "🔨 Docker 이미지 빌드 중..."
            docker build --no-cache --pull -t "${registry}:${tag}" "${WORKSPACE_DIR}/server/app"
            
            # 타임스탬프 태그도 함께 생성
            local timestamp=$(date +%Y%m%d%H%M%S)
            docker tag "${registry}:${tag}" "${registry}:${tag}-${timestamp}"
            echo "🐳 Docker 이미지를 푸시합니다: ${registry}:${tag}"
            docker push "${registry}:${tag}"
            # 타임스탬프 태그도 푸시
            docker push "${registry}:${tag}-${timestamp}"
            echo "✅ 서버 이미지 빌드 및 푸시 완료!"
            ;;
        "notification-server")
            echo "🚀 알림 서버 애플리케이션을 빌드합니다..."
            # 태그 설정
            local tag="notification"
            # 이미지 빌드 전 기존 이미지 제거 (오류 무시)
            docker rmi "${registry}:${tag}" 2>/dev/null || true
            docker rmi "${registry}:${tag}-$(date +%Y%m%d)*" 2>/dev/null || true
            
            # EC2 환경에서는 npm이 설치되어 있지 않을 수 있으므로 Docker 내에서만 빌드
            echo "🔨 Docker 이미지 빌드 중..."
            docker build --no-cache --pull -t "${registry}:${tag}" "${WORKSPACE_DIR}/server/notification"
            
            # 타임스탬프 태그도 함께 생성
            local timestamp=$(date +%Y%m%d%H%M%S)
            docker tag "${registry}:${tag}" "${registry}:${tag}-${timestamp}"
            echo "🐳 Docker 이미지를 푸시합니다: ${registry}:${tag}"
            docker push "${registry}:${tag}"
            # 타임스탬프 태그도 푸시
            docker push "${registry}:${tag}-${timestamp}"
            echo "✅ 알림 서버 이미지 빌드 및 푸시 완료!"
            ;;
        *)
            echo "⚠️ 알 수 없는 서비스입니다: $image_name"
            ;;
    esac
}

# Docker Compose 디렉토리 확인 및 생성
check_compose_dir() {
    # docker-compose 디렉토리가 존재하는지 확인
    if [ ! -d "${SCRIPT_DIR}/docker-compose" ]; then
        echo "⚠️ docker-compose 디렉토리가 없습니다. 생성합니다..."
        mkdir -p "${SCRIPT_DIR}/docker-compose"
    fi
    
    # base.yaml 파일이 존재하는지 확인
    if [ ! -f "${SCRIPT_DIR}/docker-compose/base.yaml" ]; then
        echo "⚠️ base.yaml 파일이 없습니다. 생성합니다..."
        create_base_yaml
    fi
    
    # syslog-linux.yaml 파일이 존재하는지 확인
    if [ ! -f "${SCRIPT_DIR}/docker-compose/syslog-linux.yaml" ]; then
        echo "⚠️ syslog-linux.yaml 파일이 없습니다. 생성합니다..."
        create_syslog_yaml
    fi
}

# base.yaml 파일 생성
create_base_yaml() {
    cat > "${SCRIPT_DIR}/docker-compose/base.yaml" << 'EOF'
version: "3.8"

services:
  # Traefik 리버스 프록시 서비스
  traefik:
    image: traefik:v2.10
    container_name: traefik
    command:
      - "--api.insecure=true" # 대시보드 활성화 (보안 없음)
      - "--providers.docker=true" # Docker 제공자 활성화
      - "--providers.docker.swarmMode=true" # Swarm 모드 지원
      - "--providers.docker.exposedbydefault=false" # 기본적으로 서비스 노출 방지
      - "--entrypoints.web.address=:80" # HTTP 엔트리포인트
    ports:
      - "80:80" # HTTP 포트
      - "8080:8080" # Traefik Dashboard
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock" # Docker 소켓
    deploy:
      replicas: 1
      restart_policy:
        condition: on-failure
      placement:
        constraints:
          - node.role == manager # Swarm 매니저 노드에서 실행
    networks:
      - lovechedule-network

  # Redis 서비스
  redis:
    image: redis:latest
    container_name: redis
    deploy:
      replicas: 1
      restart_policy:
        condition: on-failure
    networks:
      - lovechedule-network

  # lovechedule 애플리케이션
  lovechedule-server:
    image: soomumu/project:lovechedule
    environment:
      - MONGO_URL=mongodb://root:1234@mongodb:27017/lovechedule?authSource=admin
      - JWT_ACCESS_TOKEN_SECRET=secret
      - JWT_ACCESS_TOKEN_EXPIRATION_TIME=365d
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - REDIS_EXPIRED_AT=0
      - WEATHER_API_KEY=ec379cdcda47660851b8bd47f8432f8b
    deploy:
      replicas: 2
      restart_policy:
        condition: on-failure
      labels:
        # /app 경로 처리
        - "traefik.enable=true"
        - "traefik.http.routers.lovechedule.rule=Host(`lovechedule.com`) && PathPrefix(`/app`)"
        - "traefik.http.routers.lovechedule.entrypoints=web"
        # 내부 서비스 포트 지정
        - "traefik.http.services.lovechedule-service.loadbalancer.server.port=3000" # 내부 서비스 포트
    networks:
      - lovechedule-network

  # 알림 서버 애플리케이션
  notification-server:
    image: soomumu/project:notification
    environment:
      - API_URL=http://lovechedule-server:3000
      - API_KEY=your-api-key-here
      - NODE_ENV=production
    deploy:
      replicas: 1
      restart_policy:
        condition: on-failure
      labels:
        - "traefik.enable=true"
        - "traefik.http.routers.notification.rule=Host(`lovechedule.com`) && PathPrefix(`/notification`)"
        - "traefik.http.routers.notification.entrypoints=web"
        - "traefik.http.services.notification-service.loadbalancer.server.port=3100"
    networks:
      - lovechedule-network

networks:
  lovechedule-network:
    driver: overlay
EOF
}

# syslog-linux.yaml 파일 생성
create_syslog_yaml() {
    cat > "${SCRIPT_DIR}/docker-compose/syslog-linux.yaml" << 'EOF'
version: "3.8"

services:
  # 로깅 설정 추가
  traefik:
    logging:
      driver: "syslog"
      options:
        syslog-address: "udp://127.0.0.1:514"
        tag: "traefik"

  lovechedule-server:
    logging:
      driver: "syslog"
      options:
        syslog-address: "udp://127.0.0.1:514"
        tag: "lovechedule-server"

  notification-server:
    logging:
      driver: "syslog"
      options:
        syslog-address: "udp://127.0.0.1:514"
        tag: "notification-server"
EOF
}

# Docker Swarm 스택 배포 함수
deploy_stack() {
    local stack_name="$1"
    echo "🚀 Docker Swarm 스택을 배포합니다..."
    # 서비스 업데이트 전 이미지 강제 갱신
    docker service update --force --image-pull-policy always $(docker stack services -q "$stack_name") 2>/dev/null || true
    # 스택 배포
    docker stack deploy --prune --with-registry-auth -c "${SCRIPT_DIR}/docker-compose/base.yaml" $(printf -- '-c %s ' "${SCRIPT_DIR}/${COMPOSE_FILE[@]}") "$stack_name"
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
        updated_at=$(docker service inspect "$service_id" --format '{{.UpdatedAt}}' 2>/dev/null)
        if [[ -n "$updated_at" ]]; then
            # UTC 시간을 KST로 변환 (서버 환경에 따라 다를 수 있음)
            if command -v date > /dev/null 2>&1; then
                deploy_time=$(date -d "$(echo "$updated_at" | sed 's/ +0000 UTC//')" +"%Y-%m-%d %H:%M:%S" 2>/dev/null) || deploy_time="Unknown format"
            else
                deploy_time="$updated_at"
            fi
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
    echo "사용법: $0 <스택 이름> <환경> [서비스] [--deploy]"
    echo "예: $0 lovechedule prd lovechedule-server --deploy"
    echo "예: $0 lovechedule prd notification-server --deploy"
    echo "예: $0 lovechedule prd --deploy  (전체 배포)"
    exit 1
fi

STACK_NAME="$1"  # 첫 번째 인수는 스택 이름
ENV="$2"         # 두 번째 인수는 환경 이름
SERVICE="${3:-}"  # 세 번째 인수는 서비스 이름 (옵션)
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
    docker swarm init --advertise-addr $(hostname -i) || echo "⚠️ Swarm 초기화 실패. 이미 초기화되었거나 권한이 없을 수 있습니다."
fi

# Docker Compose 디렉토리 및 파일 확인
check_compose_dir

# 레지스트리 설정
REGISTRY="soomumu/project"

# 서비스별 이미지 빌드 및 푸시
if [ -n "$SERVICE" ]; then
    build_and_push_image "$SERVICE" "$REGISTRY"
else
    # 전체 서비스 빌드
    build_and_push_image "lovechedule-server" "$REGISTRY"
    build_and_push_image "notification-server" "$REGISTRY"
fi

# Compose 파일 설정
set_compose_file "$ENV"

# 스크립트 옵션 처리
if [ "$DEPLOY" = true ]; then
    # 배포 전 이미지 강제 갱신
    echo "🔄 Docker 이미지를 강제로 갱신합니다..."
    docker pull "${REGISTRY}:lovechedule" --quiet || echo "⚠️ 메인 서버 이미지 갱신 실패, 계속 진행합니다."
    
    if [ "$SERVICE" == "notification-server" ] || [ -z "$SERVICE" ]; then
        docker pull "${REGISTRY}:notification" --quiet || echo "⚠️ 알림 서버 이미지 갱신 실패, 계속 진행합니다."
    fi
    
    deploy_stack "$STACK_NAME"
    check_services "$STACK_NAME"
else
    echo "✅ 배포 없이 Swarm 상태를 확인합니다."
    check_services "$STACK_NAME"
fi
