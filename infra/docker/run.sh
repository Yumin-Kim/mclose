#!/bin/bash
# filepath: /Users/bp_kim/Desktop/Personal/mclose/server/infra/docker/run.sh

# 작업 디렉토리를 도커 설정 디렉토리로 변경
cd "$(dirname "$0")"

# 기존 컨테이너 중지 및 삭제 여부 확인
read -p "기존 컨테이너를 중지하고 삭제할까요? (y/n): " STOP_CONTAINERS
if [ "$STOP_CONTAINERS" = "y" ]; then
  echo "기존 컨테이너 중지 및 삭제 중..."
  docker-compose -f docker-compose.dev.yaml --project-name mclose-server down
fi

# 환경 변수 파일 확인
if [ ! -f "../../.env" ]; then
  echo "Error: .env 파일이 없습니다. 프로젝트 루트에 .env 파일을 생성해주세요."
  exit 1
fi

# 컨테이너 실행
echo "컨테이너 실행 중..."
docker-compose -f docker-compose.dev.yaml --project-name mclose-server up -d

echo "컨테이너 상태:"
docker-compose -f docker-compose.dev.yaml --project-name mclose-server ps