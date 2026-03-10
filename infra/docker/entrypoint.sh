#!/bin/sh
# filepath: /Users/bp_kim/Desktop/Personal/mclose/server/infra/docker/entrypoint.sh

# PROJECT_NAME 환경 변수 확인
if [ "$PROJECT_NAME" = "app" ]; then
  echo "Starting App API Server (app-main.js)..."
  MAIN_FILE="app-main.js"
  DEFAULT_PORT=4000
elif [ "$PROJECT_NAME" = "admin" ]; then
  echo "Starting Admin API Server (admin-main.js)..."
  MAIN_FILE="admin-main.js"
  DEFAULT_PORT=3500
else
  echo "WARNING: Unknown PROJECT_NAME '$PROJECT_NAME', defaulting to app-main.js"
  MAIN_FILE="app-main.js"
  DEFAULT_PORT=4000
fi

# PORT가 설정되지 않았다면 기본값 사용
if [ -z "$PORT" ]; then
  echo "PORT not set, using default: $DEFAULT_PORT"
  export PORT=$DEFAULT_PORT
fi

# 서버 시작
echo "Starting server with PORT=$PORT"
exec node ./$MAIN_FILE