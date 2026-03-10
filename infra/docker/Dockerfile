# 하나의 이미지로 여러 엔트리포인트 실행하기

FROM node:18.10.0-alpine3.15 as dependencies
WORKDIR /usr/app

# 빌드 종속성 설치
RUN apk add --no-cache python3 make g++ gcc git libc6-compat sqlite-dev

# package.json 복사
COPY ../../package.json ./
COPY ../../package-lock.json ./

# npm 캐시 경로 설정 및 엔진 체크 비활성화
RUN npm config set cache /tmp/.npm --global && \
    npm config set unsafe-perm true && \
    npm config set engine-strict false

RUN npm install --legacy-peer-deps

# 소스 코드 복사
COPY ../../ ./

# 빌드 수행
FROM node:18.10.0-alpine3.15 as build
WORKDIR /usr/app

# 빌드 환경에도 필요한 종속성 설치
RUN apk add --no-cache python3 make g++ gcc libc6-compat sqlite-dev

COPY --from=dependencies /usr/app ./

# npm 설정
RUN npm config set cache /tmp/.npm --global && \
    npm config set engine-strict false

RUN npm run build

# 최종 이미지
FROM node:18.10.0-alpine3.15
WORKDIR /usr/app

# 프로덕션 환경 종속성 설치
RUN apk add --no-cache python3 make g++ gcc libc6-compat sqlite-dev

# package.json 및 필요한 파일 복사
COPY ../../package.json ./
COPY ../../package-lock.json ./
COPY ../../.env ./

# npm 설정
RUN npm config set cache /tmp/.npm --global && \
    npm config set engine-strict false

# 프로덕션 종속성 설치
RUN npm install --omit=dev --legacy-peer-deps

# 빌드된 파일 복사
COPY --from=build /usr/app/dist ./

# 시작 스크립트 추가
COPY ./infra/docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# 기본 환경 변수 설정
ENV NODE_ENV=production
ENV PROJECT_NAME=app
ENV PORT=4000

# 엔트리포인트 설정
ENTRYPOINT ["./entrypoint.sh"]