#!/bin/bash

# MongoDB 백업 복원 스크립트
# 백업된 데이터를 MongoDB에 복원합니다.

# 설정 변수
BACKUP_DIR="/home/ec2-user/mongodb-backups"
LOG_FILE="/home/ec2-user/mongodb-backups/restore.log"
MONGO_HOST="localhost"
MONGO_PORT="27017"
MONGO_USERNAME="root"
MONGO_PASSWORD="1234"
MONGO_DATABASE="lovechedule"

# 색상 코드 (로그용)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} [$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} [$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} [$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} [$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 사용법 출력
usage() {
    echo "사용법: $0 [OPTIONS] <백업파일명>"
    echo ""
    echo "OPTIONS:"
    echo "  -h, --help           이 도움말 표시"
    echo "  -l, --list           사용 가능한 백업 파일 목록 표시"
    echo "  -f, --force          확인 없이 강제 복원"
    echo ""
    echo "예시:"
    echo "  $0 -l                               # 백업 파일 목록 보기"
    echo "  $0 lovechedule_backup_20250622_000000.tar.gz  # 특정 백업 복원"
    echo "  $0 -f latest                        # 최신 백업 강제 복원"
    echo ""
}

# 백업 파일 목록 표시
list_backups() {
    log_info "사용 가능한 백업 파일 목록:"
    echo "=================================================="
    
    if [ ! -d "$BACKUP_DIR" ]; then
        log_error "백업 디렉토리가 존재하지 않습니다: $BACKUP_DIR"
        return 1
    fi
    
    # 백업 파일 목록 (최신 순)
    find "$BACKUP_DIR" -name "lovechedule_backup_*.tar.gz" -type f -printf '%T@ %p\n' | sort -nr | while read timestamp file; do
        filename=$(basename "$file")
        filesize=$(du -h "$file" | cut -f1)
        filedate=$(date -d @"${timestamp%.*}" '+%Y-%m-%d %H:%M:%S')
        echo "  $filename (크기: $filesize, 날짜: $filedate)"
    done
    
    echo "=================================================="
    echo ""
    echo "복원하려면: $0 <백업파일명>"
    echo "최신 백업 복원: $0 latest"
}

# 최신 백업 파일 찾기
find_latest_backup() {
    find "$BACKUP_DIR" -name "lovechedule_backup_*.tar.gz" -type f -printf '%T@ %p\n' | sort -nr | head -1 | cut -d' ' -f2
}

# MongoDB 연결 테스트
test_mongodb_connection() {
    log "MongoDB 연결 테스트 중..."
    
    # Docker Swarm 환경에서 MongoDB 컨테이너 확인
    if ! docker service ls | grep -q "lovechedule_mongodb.*1/1"; then
        log_error "MongoDB 서비스가 실행되지 않았습니다."
        return 1
    fi
    
    # MongoDB 컨테이너 ID 가져오기
    MONGO_CONTAINER=$(docker ps --filter "name=lovechedule_mongodb" --format "{{.ID}}" | head -1)
    if [ -z "$MONGO_CONTAINER" ]; then
        log_error "MongoDB 컨테이너를 찾을 수 없습니다."
        return 1
    fi
    
    # MongoDB 연결 테스트
    docker exec "$MONGO_CONTAINER" mongosh --host "$MONGO_HOST" --port "$MONGO_PORT" \
        --username "$MONGO_USERNAME" --password "$MONGO_PASSWORD" \
        --authenticationDatabase admin \
        --eval "db.adminCommand('ping')" >/dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        log_success "MongoDB 연결 성공"
        return 0
    else
        log_error "MongoDB 연결 실패"
        return 1
    fi
}

# 현재 데이터베이스 백업 (복원 전 안전 백업)
backup_current_data() {
    log "현재 데이터베이스 안전 백업 중..."
    
    SAFETY_BACKUP_NAME="safety_backup_$(date +"%Y%m%d_%H%M%S")"
    MONGO_CONTAINER=$(docker ps --filter "name=lovechedule_mongodb" --format "{{.ID}}" | head -1)
    
    docker exec "$MONGO_CONTAINER" mongodump \
        --host "$MONGO_HOST:$MONGO_PORT" \
        --username "$MONGO_USERNAME" \
        --password "$MONGO_PASSWORD" \
        --authenticationDatabase admin \
        --db "$MONGO_DATABASE" \
        --out "/tmp/$SAFETY_BACKUP_NAME" >/dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        docker cp "$MONGO_CONTAINER:/tmp/$SAFETY_BACKUP_NAME" "$BACKUP_DIR/"
        docker exec "$MONGO_CONTAINER" rm -rf "/tmp/$SAFETY_BACKUP_NAME"
        
        cd "$BACKUP_DIR"
        tar -czf "${SAFETY_BACKUP_NAME}.tar.gz" "$SAFETY_BACKUP_NAME" >/dev/null 2>&1
        rm -rf "$SAFETY_BACKUP_NAME"
        
        log_success "안전 백업 완료: ${SAFETY_BACKUP_NAME}.tar.gz"
        return 0
    else
        log_warning "안전 백업 실패 (계속 진행)"
        return 1
    fi
}

# MongoDB 복원 실행
perform_restore() {
    local backup_file="$1"
    local backup_path="$BACKUP_DIR/$backup_file"
    
    if [ ! -f "$backup_path" ]; then
        log_error "백업 파일을 찾을 수 없습니다: $backup_path"
        return 1
    fi
    
    log "MongoDB 복원 시작: $backup_file"
    
    # MongoDB 컨테이너 ID 가져오기
    MONGO_CONTAINER=$(docker ps --filter "name=lovechedule_mongodb" --format "{{.ID}}" | head -1)
    
    # 백업 파일 압축 해제
    cd "$BACKUP_DIR"
    EXTRACT_DIR="${backup_file%.tar.gz}"
    tar -xzf "$backup_file" 2>&1 | tee -a "$LOG_FILE"
    
    if [ $? -ne 0 ]; then
        log_error "백업 파일 압축 해제 실패"
        return 1
    fi
    
    # 백업 파일을 컨테이너로 복사
    docker cp "$EXTRACT_DIR" "$MONGO_CONTAINER:/tmp/"
    
    if [ $? -ne 0 ]; then
        log_error "백업 파일 복사 실패"
        rm -rf "$EXTRACT_DIR"
        return 1
    fi
    
    # 기존 데이터베이스 삭제 (선택사항)
    log_warning "기존 데이터베이스 삭제 중..."
    docker exec "$MONGO_CONTAINER" mongosh --host "$MONGO_HOST" --port "$MONGO_PORT" \
        --username "$MONGO_USERNAME" --password "$MONGO_PASSWORD" \
        --authenticationDatabase admin \
        --eval "db.getSiblingDB('$MONGO_DATABASE').dropDatabase()" 2>&1 | tee -a "$LOG_FILE"
    
    # mongorestore 실행
    log "데이터 복원 중..."
    docker exec "$MONGO_CONTAINER" mongorestore \
        --host "$MONGO_HOST:$MONGO_PORT" \
        --username "$MONGO_USERNAME" \
        --password "$MONGO_PASSWORD" \
        --authenticationDatabase admin \
        --db "$MONGO_DATABASE" \
        "/tmp/$EXTRACT_DIR/$MONGO_DATABASE" 2>&1 | tee -a "$LOG_FILE"
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        log_success "MongoDB 복원 완료"
        
        # 임시 파일 정리
        docker exec "$MONGO_CONTAINER" rm -rf "/tmp/$EXTRACT_DIR"
        rm -rf "$EXTRACT_DIR"
        
        # 복원 검증
        verify_restore
        
        return 0
    else
        log_error "MongoDB 복원 실패"
        docker exec "$MONGO_CONTAINER" rm -rf "/tmp/$EXTRACT_DIR"
        rm -rf "$EXTRACT_DIR"
        return 1
    fi
}

# 복원 검증
verify_restore() {
    log "복원 검증 중..."
    
    MONGO_CONTAINER=$(docker ps --filter "name=lovechedule_mongodb" --format "{{.ID}}" | head -1)
    
    # 컬렉션 목록 확인
    COLLECTIONS=$(docker exec "$MONGO_CONTAINER" mongosh --host "$MONGO_HOST" --port "$MONGO_PORT" \
        --username "$MONGO_USERNAME" --password "$MONGO_PASSWORD" \
        --authenticationDatabase admin \
        --eval "db.getSiblingDB('$MONGO_DATABASE').getCollectionNames()" --quiet 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$COLLECTIONS" ]; then
        log_success "복원 검증 성공"
        log_info "복원된 컬렉션: $COLLECTIONS"
        
        # 문서 수 확인
        docker exec "$MONGO_CONTAINER" mongosh --host "$MONGO_HOST" --port "$MONGO_PORT" \
            --username "$MONGO_USERNAME" --password "$MONGO_PASSWORD" \
            --authenticationDatabase admin \
            --eval "
                db.getSiblingDB('$MONGO_DATABASE').getCollectionNames().forEach(function(collection) {
                    var count = db.getSiblingDB('$MONGO_DATABASE').getCollection(collection).countDocuments();
                    print(collection + ': ' + count + ' documents');
                });
            " --quiet 2>/dev/null | tee -a "$LOG_FILE"
    else
        log_warning "복원 검증 실패 - 수동 확인 필요"
    fi
}

# 메인 실행 함수
main() {
    local backup_file=""
    local force_restore=false
    
    # 인자 파싱
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                usage
                exit 0
                ;;
            -l|--list)
                list_backups
                exit 0
                ;;
            -f|--force)
                force_restore=true
                shift
                ;;
            *)
                backup_file="$1"
                shift
                ;;
        esac
    done
    
    # 백업 파일 지정이 없으면 사용법 출력
    if [ -z "$backup_file" ]; then
        usage
        exit 1
    fi
    
    log "========================================="
    log "MongoDB 데이터 복원 시작"
    log "========================================="
    
    # 'latest' 키워드 처리
    if [ "$backup_file" = "latest" ]; then
        backup_file=$(basename "$(find_latest_backup)")
        if [ -z "$backup_file" ]; then
            log_error "백업 파일을 찾을 수 없습니다."
            exit 1
        fi
        log_info "최신 백업 파일 선택: $backup_file"
    fi
    
    # MongoDB 연결 테스트
    if ! test_mongodb_connection; then
        log_error "복원 중단: MongoDB 연결 실패"
        exit 1
    fi
    
    # 복원 확인
    if [ "$force_restore" = false ]; then
        echo ""
        log_warning "⚠️  데이터베이스 복원을 진행하면 현재 데이터가 모두 삭제됩니다!"
        log_info "복원할 백업 파일: $backup_file"
        echo ""
        read -p "정말로 복원하시겠습니까? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "복원 취소됨"
            exit 0
        fi
    fi
    
    # 현재 데이터 안전 백업
    backup_current_data
    
    # 복원 실행
    if perform_restore "$backup_file"; then
        log_success "MongoDB 데이터 복원 완료"
        log_info "복원된 백업: $backup_file"
    else
        log_error "MongoDB 데이터 복원 실패"
        exit 1
    fi
    
    log "========================================="
    log "복원 작업 종료"
    log "========================================="
}

# 스크립트 실행
main "$@" 