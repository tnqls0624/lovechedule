#!/bin/bash

# MongoDB 자동 백업 스크립트
# 매일 정각에 실행되어 MongoDB 데이터를 백업합니다.

# 설정 변수
BACKUP_DIR="/home/ec2-user/mongodb-backups"
LOG_FILE="/home/ec2-user/mongodb-backups/backup.log"
MONGO_HOST="localhost"
MONGO_PORT="27017"
MONGO_USERNAME="root"
MONGO_PASSWORD="1234"
MONGO_DATABASE="lovechedule"
BACKUP_RETENTION_DAYS=30  # 30일간 백업 보관
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="lovechedule_backup_${DATE}"

# 색상 코드 (로그용)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# 백업 디렉토리 생성
create_backup_directory() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        log "백업 디렉토리 생성: $BACKUP_DIR"
    fi
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

# MongoDB 백업 실행
perform_backup() {
    log "MongoDB 백업 시작: $BACKUP_NAME"
    
    # MongoDB 컨테이너 ID 가져오기
    MONGO_CONTAINER=$(docker ps --filter "name=lovechedule_mongodb" --format "{{.ID}}" | head -1)
    
    # mongodump 실행
    docker exec "$MONGO_CONTAINER" mongodump \
        --host "$MONGO_HOST:$MONGO_PORT" \
        --username "$MONGO_USERNAME" \
        --password "$MONGO_PASSWORD" \
        --authenticationDatabase admin \
        --db "$MONGO_DATABASE" \
        --out "/tmp/$BACKUP_NAME" 2>&1 | tee -a "$LOG_FILE"
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        log_success "MongoDB 덤프 완료"
        
        # 백업 파일을 호스트로 복사
        docker cp "$MONGO_CONTAINER:/tmp/$BACKUP_NAME" "$BACKUP_DIR/"
        
        if [ $? -eq 0 ]; then
            log_success "백업 파일 복사 완료: $BACKUP_DIR/$BACKUP_NAME"
            
            # 컨테이너 내 임시 파일 삭제
            docker exec "$MONGO_CONTAINER" rm -rf "/tmp/$BACKUP_NAME"
            
            # 백업 파일 압축
            cd "$BACKUP_DIR"
            tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME" 2>&1 | tee -a "$LOG_FILE"
            
            if [ $? -eq 0 ]; then
                rm -rf "$BACKUP_NAME"
                log_success "백업 파일 압축 완료: ${BACKUP_NAME}.tar.gz"
                
                # 백업 파일 크기 확인
                BACKUP_SIZE=$(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)
                log "백업 파일 크기: $BACKUP_SIZE"
                
                return 0
            else
                log_error "백업 파일 압축 실패"
                return 1
            fi
        else
            log_error "백업 파일 복사 실패"
            return 1
        fi
    else
        log_error "MongoDB 덤프 실패"
        return 1
    fi
}

# 오래된 백업 파일 정리
cleanup_old_backups() {
    log "오래된 백업 파일 정리 시작 (${BACKUP_RETENTION_DAYS}일 이상)"
    
    find "$BACKUP_DIR" -name "lovechedule_backup_*.tar.gz" -type f -mtime +$BACKUP_RETENTION_DAYS -print0 | while IFS= read -r -d '' file; do
        log_warning "삭제: $(basename "$file")"
        rm -f "$file"
    done
    
    log_success "오래된 백업 파일 정리 완료"
}

# 백업 통계 출력
print_backup_stats() {
    log "=== 백업 통계 ==="
    TOTAL_BACKUPS=$(find "$BACKUP_DIR" -name "lovechedule_backup_*.tar.gz" -type f | wc -l)
    TOTAL_SIZE=$(find "$BACKUP_DIR" -name "lovechedule_backup_*.tar.gz" -type f -exec du -ch {} + 2>/dev/null | tail -1 | cut -f1)
    log "총 백업 파일 수: $TOTAL_BACKUPS"
    log "총 백업 크기: $TOTAL_SIZE"
    log "=================="
}

# S3 업로드 함수 (선택사항)
upload_to_s3() {
    # AWS CLI가 설치되어 있고 S3 버킷이 설정되어 있는 경우에만 실행
    if command -v aws >/dev/null 2>&1 && [ -n "$S3_BUCKET" ]; then
        log "S3 업로드 시작..."
        
        aws s3 cp "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" "s3://$S3_BUCKET/mongodb-backups/" 2>&1 | tee -a "$LOG_FILE"
        
        if [ $? -eq 0 ]; then
            log_success "S3 업로드 완료"
        else
            log_error "S3 업로드 실패"
        fi
    else
        log "S3 업로드 건너뜀 (AWS CLI 미설치 또는 S3_BUCKET 미설정)"
    fi
}

# 메인 실행 함수
main() {
    log "========================================="
    log "MongoDB 자동 백업 시작"
    log "========================================="
    
    # 백업 디렉토리 생성
    create_backup_directory
    
    # MongoDB 연결 테스트
    if ! test_mongodb_connection; then
        log_error "백업 중단: MongoDB 연결 실패"
        exit 1
    fi
    
    # 백업 실행
    if perform_backup; then
        log_success "백업 성공: ${BACKUP_NAME}.tar.gz"
        
        # S3 업로드 (선택사항)
        upload_to_s3
        
        # 오래된 백업 정리
        cleanup_old_backups
        
        # 백업 통계 출력
        print_backup_stats
        
        log_success "MongoDB 자동 백업 완료"
    else
        log_error "백업 실패"
        exit 1
    fi
    
    log "========================================="
    log "백업 작업 종료"
    log "========================================="
}

# 스크립트 실행
main "$@" 