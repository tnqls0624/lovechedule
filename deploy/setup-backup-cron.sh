#!/bin/bash

# MongoDB 백업 크론탭 설정 스크립트
# 매일 정각(00:00)에 MongoDB 백업이 실행되도록 크론탭을 설정합니다.

# 설정 변수
SCRIPT_DIR="/home/ec2-user/lovechedule/deploy"
BACKUP_SCRIPT="$SCRIPT_DIR/backup-mongodb.sh"
CRON_USER="ec2-user"
BACKUP_TIME="0 0"  # 매일 자정 (분 시간)

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} [$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} [$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} [$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} [$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# 사용법 출력
usage() {
    echo "MongoDB 백업 크론탭 설정 스크립트"
    echo ""
    echo "사용법: $0 [OPTIONS]"
    echo ""
    echo "OPTIONS:"
    echo "  -h, --help           이 도움말 표시"
    echo "  -s, --status         현재 크론탭 상태 확인"
    echo "  -r, --remove         백업 크론탭 제거"
    echo "  -t, --time TIME      백업 시간 설정 (기본: '0 0' = 매일 자정)"
    echo "                       형식: '분 시간' (예: '30 2' = 매일 02:30)"
    echo ""
    echo "예시:"
    echo "  $0                   # 기본 설정 (매일 자정)"
    echo "  $0 -t '30 2'         # 매일 02:30에 백업"
    echo "  $0 -s                # 현재 상태 확인"
    echo "  $0 -r                # 백업 크론탭 제거"
    echo ""
}

# 현재 크론탭 상태 확인
check_cron_status() {
    log_info "현재 크론탭 상태 확인:"
    echo "================================"
    
    # 현재 크론탭 목록
    crontab -l 2>/dev/null | grep -E "(backup-mongodb|lovechedule)" || echo "MongoDB 백업 관련 크론탭이 없습니다."
    
    echo "================================"
    echo ""
    
    # 백업 스크립트 존재 확인
    if [ -f "$BACKUP_SCRIPT" ]; then
        log_success "백업 스크립트 존재: $BACKUP_SCRIPT"
        
        # 스크립트 실행 권한 확인
        if [ -x "$BACKUP_SCRIPT" ]; then
            log_success "백업 스크립트 실행 권한 있음"
        else
            log_warning "백업 스크립트 실행 권한 없음"
        fi
    else
        log_error "백업 스크립트가 존재하지 않습니다: $BACKUP_SCRIPT"
    fi
    
    # 백업 디렉토리 확인
    if [ -d "/home/ec2-user/mongodb-backups" ]; then
        BACKUP_COUNT=$(find /home/ec2-user/mongodb-backups -name "*.tar.gz" -type f | wc -l)
        log_info "백업 파일 수: $BACKUP_COUNT"
    else
        log_info "백업 디렉토리가 아직 생성되지 않았습니다."
    fi
}

# 크론탭에서 기존 백업 작업 제거
remove_backup_cron() {
    log "기존 MongoDB 백업 크론탭 제거 중..."
    
    # 현재 크론탭을 임시 파일로 백업
    TEMP_CRON=$(mktemp)
    crontab -l 2>/dev/null > "$TEMP_CRON"
    
    # MongoDB 백업 관련 항목 제거
    grep -v "backup-mongodb" "$TEMP_CRON" | grep -v "# MongoDB 백업" > "${TEMP_CRON}.new"
    
    # 새로운 크론탭 설정
    crontab "${TEMP_CRON}.new"
    
    # 임시 파일 정리
    rm -f "$TEMP_CRON" "${TEMP_CRON}.new"
    
    log_success "MongoDB 백업 크론탭 제거 완료"
}

# 백업 크론탭 설정
setup_backup_cron() {
    local backup_time="$1"
    
    log "MongoDB 백업 크론탭 설정 중..."
    log_info "백업 시간: $backup_time (* * *) - 매일"
    
    # 백업 스크립트 존재 확인
    if [ ! -f "$BACKUP_SCRIPT" ]; then
        log_error "백업 스크립트가 존재하지 않습니다: $BACKUP_SCRIPT"
        return 1
    fi
    
    # 백업 스크립트 실행 권한 부여
    chmod +x "$BACKUP_SCRIPT"
    log_info "백업 스크립트 실행 권한 부여"
    
    # 현재 크론탭을 임시 파일로 백업
    TEMP_CRON=$(mktemp)
    crontab -l 2>/dev/null > "$TEMP_CRON" || touch "$TEMP_CRON"
    
    # 기존 MongoDB 백업 항목 제거
    grep -v "backup-mongodb" "$TEMP_CRON" | grep -v "# MongoDB 백업" > "${TEMP_CRON}.clean"
    
    # 새로운 백업 크론탭 항목 추가
    cat >> "${TEMP_CRON}.clean" << EOF

# MongoDB 백업 - 매일 자동 실행
$backup_time * * * $BACKUP_SCRIPT >> /home/ec2-user/mongodb-backups/cron.log 2>&1
EOF
    
    # 새로운 크론탭 설정
    crontab "${TEMP_CRON}.clean"
    
    if [ $? -eq 0 ]; then
        log_success "MongoDB 백업 크론탭 설정 완료"
        log_info "백업 시간: 매일 $(echo $backup_time | awk '{print $2":"$1}')"
        
        # 설정 확인
        echo ""
        log_info "설정된 크론탭:"
        crontab -l | grep -A1 -B1 "backup-mongodb"
    else
        log_error "크론탭 설정 실패"
        return 1
    fi
    
    # 임시 파일 정리
    rm -f "$TEMP_CRON" "${TEMP_CRON}.clean"
    
    return 0
}

# 크론 서비스 상태 확인 및 시작
check_cron_service() {
    log "크론 서비스 상태 확인 중..."
    
    # 시스템에 따른 크론 서비스 확인
    if systemctl is-active --quiet cron; then
        log_success "크론 서비스 실행 중 (cron)"
    elif systemctl is-active --quiet crond; then
        log_success "크론 서비스 실행 중 (crond)"
    else
        log_warning "크론 서비스 상태 확인 중..."
        
        # 크론 서비스 시작 시도
        if systemctl start crond 2>/dev/null || systemctl start cron 2>/dev/null; then
            log_success "크론 서비스 시작됨"
        else
            log_error "크론 서비스 시작 실패 - 수동으로 시작해주세요"
            echo "  sudo systemctl start crond"
            echo "  또는"
            echo "  sudo systemctl start cron"
        fi
    fi
}

# 백업 테스트 실행
test_backup() {
    log_info "백업 스크립트 테스트 실행 중..."
    
    if [ -x "$BACKUP_SCRIPT" ]; then
        echo "테스트 실행하시겠습니까? (y/N): "
        read -r -n 1 response
        echo ""
        
        if [[ $response =~ ^[Yy]$ ]]; then
            log "백업 테스트 시작..."
            "$BACKUP_SCRIPT"
            
            if [ $? -eq 0 ]; then
                log_success "백업 테스트 성공"
            else
                log_error "백업 테스트 실패"
            fi
        else
            log "백업 테스트 건너뜀"
        fi
    else
        log_error "백업 스크립트를 실행할 수 없습니다: $BACKUP_SCRIPT"
    fi
}

# 메인 실행 함수
main() {
    local backup_time="$BACKUP_TIME"
    local action="setup"
    
    # 인자 파싱
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                usage
                exit 0
                ;;
            -s|--status)
                action="status"
                shift
                ;;
            -r|--remove)
                action="remove"
                shift
                ;;
            -t|--time)
                backup_time="$2"
                shift 2
                ;;
            *)
                log_error "알 수 없는 옵션: $1"
                usage
                exit 1
                ;;
        esac
    done
    
    log "========================================="
    log "MongoDB 백업 크론탭 설정"
    log "========================================="
    
    case $action in
        "status")
            check_cron_status
            ;;
        "remove")
            remove_backup_cron
            log_success "MongoDB 백업 크론탭 제거 완료"
            ;;
        "setup")
            # 백업 시간 형식 검증
            if ! echo "$backup_time" | grep -qE '^[0-9]+ [0-9]+$'; then
                log_error "잘못된 시간 형식: $backup_time"
                log_error "올바른 형식: '분 시간' (예: '0 0', '30 2')"
                exit 1
            fi
            
            # 크론 서비스 상태 확인
            check_cron_service
            
            # 백업 크론탭 설정
            if setup_backup_cron "$backup_time"; then
                echo ""
                log_success "MongoDB 백업 자동화 설정 완료!"
                echo ""
                log_info "📝 설정 내용:"
                log_info "  - 백업 시간: 매일 $(echo $backup_time | awk '{print $2":"$1}') (24시간 형식)"
                log_info "  - 백업 스크립트: $BACKUP_SCRIPT"
                log_info "  - 백업 디렉토리: /home/ec2-user/mongodb-backups"
                log_info "  - 백업 보관 기간: 30일"
                echo ""
                log_info "📋 유용한 명령어:"
                log_info "  - 백업 상태 확인: $0 -s"
                log_info "  - 백업 목록 보기: $SCRIPT_DIR/restore-mongodb.sh -l"
                log_info "  - 수동 백업 실행: $BACKUP_SCRIPT"
                log_info "  - 크론탭 제거: $0 -r"
                echo ""
                
                # 백업 테스트 제안
                echo "지금 백업 테스트를 실행하시겠습니까?"
                test_backup
            else
                log_error "크론탭 설정 실패"
                exit 1
            fi
            ;;
    esac
    
    log "========================================="
    log "크론탭 설정 작업 완료"
    log "========================================="
}

# 스크립트 실행
main "$@" 