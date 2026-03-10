## Terform 
본 프로젝트의 terraform 코드는 `server/infra` 디렉토리에 위치하고 있습니다.
이 디렉토리에는 AWS 리소스를 관리하기 위한 terraform 코드가 포함되어 있습니다.
이 코드는 AWS 리소스를 프로비저닝하고 관리하는 데 사용됩니다.
terraform은 인프라를 코드로 관리할 수 있는 도구로, AWS 리소스를 선언적으로 정의하고 배포할 수 있습니다.
terraform을 사용하면 인프라를 코드로 관리할 수 있어, 버전 관리와 협업이 용이해집니다.
## AWS 리소스
본 프로젝트에서 사용하는 AWS 리소스는 다음과 같습니다.
* LightSail
    - Region : 서울 리전(ap-northeast-2)
    - Instance : 서버를 호스팅하는 인스턴스입니다.
        - Instance Name : MCLOSE-APP
        - 4 GB RAM, 2 vCPUs, 80 GB SSD
        - Ubuntu 24.04 LTS
        - Install S/W
            - Nginx : 로드 밸런서와 연결된 서버에서 사용하는 웹 서버입니다.
            - NVM : Node Version Manager로, Node.js 버전을 관리하는 도구입니다.(v18.10)
            - s3fs : S3 버킷을 마운트하는 도구입니다.(디스크 마운트 한정 용량이 있는것으로 보임) - 단 추후 제거 하고 스트림 방식으로 s3에 저장하는 방식으로 변경해야함
    - Database : 서버에서 사용하는 데이터베이스입니다.
        - MySQL : 서버에서 사용하는 데이터베이스입니다.(MySQL 8.0)
    - LoadBalancer : 서버에 대한 트래픽을 분산시키는 로드 밸런서입니다.
        - Target Instances : MCLOSE-APP
        - health check : /health-check.html 경로에 대한 헬스 체크를 수행합니다.
        - Custom Domain(format : Domain/ Certificate) :
            - mclose.net / mclose.net 
            - app-api.mclose.net / mclose.net 
            - admin.mclose.net / mclose.net 
            - admin-api.mclose.net / mclose.net 
        - Attached certificate : 
            - mclose.net / mclose.net 
            - app-api.mclose.net / mclose.net 
            - admin.mclose.net / mclose.net 
            - admin-api.mclose.net / mclose.net
        - Allow HTTP/HTTPS traffic : 
            - HTTP : 80
            - HTTPS : 443
    - Dmmain : 서버에서 사용하는 도메인입니다.
        - mclose.net : 서버에서 사용하는 도메인입니다.
            - Name Server : 
                - 4 개
            - domain assignment : 
                - mclose.net : MCLOSE-APP
                - *.mclose.net : MCLOSE-APP
* SQS
    - StandardQueue : 
        - mclose-gateway-queue : default
        - mclose-video-transform-in-queue : default
        - mclose-video-transform-out-queue : default
    - FileQueue : 
        - 콘텐츠 기반 중복 제거 : 활성화
        - mclose-matching-in-queue.fifo : FIFO
        - mclose-matching-out-queue.fifo : FIFO

아래 항목은 제거 및 생성하지 않는다
* S3
    - Bucket : 영상 . 정적 콘텐츠 저장
* SES(샌드 박스 해제)
    - Email : 
        - mclose.net : 발신자 이메일
        