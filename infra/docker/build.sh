#!/bin/bash
# filepath: /Users/bp_kim/Desktop/Personal/mclose/server/infra/docker/build.sh

# 작업 디렉토리를 프로젝트 루트로 변경
cd "$(dirname "$0")/../.."
ROOT_DIR=$(pwd)

echo "Current Directory: $ROOT_DIR"

# 하나의 공용 이미지 태그 정의
MCLOSE_IMAGE="mclose-server:latest"
BUILDX="default-builder"

# buildx 설치 확인
# Docker 실행 중인지 확인
if ! docker info > /dev/null 2>&1; then
  echo "Error : Not connected to Docker daemon. Please start Docker Desktop."
  exit 1
fi
# buildx 설치 확인
if ! docker buildx version > /dev/null 2>&1; then
  echo "Error: Docker Buildx is not installed. Please install Docker CLI plugin."
  echo "For Docker Desktop, please update to the latest version."
  exit 1
fi

# buildx 빌더 설정 - 이미 존재하는 경우 건너뜀
if ! docker buildx inspect $BUILDX > /dev/null 2>&1; then
  echo "Creating new builder: $BUILDX"
  docker buildx create --name $BUILDX --use
else
  echo "Using existing builder: $BUILDX"
  docker buildx use $BUILDX
fi

# 빌더가 준비되었는지 확인 (부트스트랩은 한 번만 수행)
if ! docker buildx inspect --bootstrap | grep -q "Status: running"; then
  echo "Bootstrapping builder..."
  docker buildx inspect --bootstrap
fi

# 이미지 빌드 (linux/amd64 플랫폼 지정)
echo "Starting build: MCLOSE Server unified image (linux/amd64 platform)"
docker buildx build \
  --platform linux/amd64 \
  --load \
  -t mclose-server:latest \
  -f ./infra/docker/Dockerfile \
  .

# 빌드 성공 여부 확인
if [ $? -eq 0 ]; then
  echo "Image build successful: $MCLOSE_IMAGE"
  docker images | grep mclose-server
  echo "Run the container with the following command: ./infra/docker/run.sh"
else
  echo "Image build failed!"
  exit 1
fi