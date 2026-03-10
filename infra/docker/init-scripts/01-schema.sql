
-- -------------------------------------------------------------
-- TablePlus 6.4.4(604)
--
-- https://tableplus.com/
--
-- Database: mclose_data
-- Generation Time: 2025-05-10 20:09:15.3860
-- -------------------------------------------------------------


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


DROP TABLE IF EXISTS `mc_account`;
CREATE TABLE `mc_account` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `balance` decimal(60,2) NOT NULL COMMENT 'user account balance',
  `currency` enum('CL','OS') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CL' COMMENT 'Enum: [CL,OS]',
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `mc_account_history`;
CREATE TABLE `mc_account_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `currency` enum('CL','OS','KRW') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Enum: [CL,OS]',
  `amount` decimal(60,2) NOT NULL COMMENT '소모한 금액',
  `type` enum('POINT','ASSET') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'type [POINT:포인트,ASSET:실 자산]',
  `status` enum('NONE','PENDING','CANCELED','UNCONFIRMED','CONFIRMED') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'history 상태 기록 [NONE,PENDING,CANCELED,UNCONFIRMED,CONFIRMED]',
  `ledger_type` enum('DEPOSIT','WITHDRAW') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ledger type [DEPOSIT,WITHDRAW]',
  `user_id` bigint DEFAULT NULL,
  `account_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `account_history_idx` (`type`,`currency`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='포인트 입출금 간 이력을 기록하는 테이블\n\n    type으로 point와 asset을 구분한다.\n\n    point는 애플리케이션에서 사용하는 포인트이며, asset은 실 자산이다.';

DROP TABLE IF EXISTS `mc_admin`;
CREATE TABLE `mc_admin` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `login_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '로그인 아이디(이메일)',
  `login_pw` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'hashing된 로그인 비밀번호',
  `pw_round` int DEFAULT NULL COMMENT 'hashing 횟수',
  `real_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '관리자 이름',
  `nickname` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '사용자 닉네임',
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '관리자 이메일',
  `jwt` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'jwt',
  `role` enum('SUPER','CUSTOMER','EDITOR','COMMON') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SUPER' COMMENT '관리자 권한 (SUPER, CUSTOMER-CS , EDITOR-제작,COMMON-기획)',
  `allow_ip` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '허용 IP',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '삭제 여부',
  `phone_no` varchar(12) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '전화번호',
  `last_activited_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '마지막 활동 날짜',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `mc_market_cart`;
CREATE TABLE `mc_market_cart` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `user_id` bigint DEFAULT NULL,
  `market_item_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `mc_market_history`;
CREATE TABLE `mc_market_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `price` decimal(60,2) NOT NULL COMMENT '구매 영상 상품의 가격 정보',
  `status` enum('WAITING','CANCELED','COMPLETED','REFUNDED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'WAITING' COMMENT 'Enum: [WAITING, CANCELED, COMPLETED, REFUNDED]',
  `available_download_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_available_download` tinyint NOT NULL DEFAULT '0' COMMENT '다운로드 가능 여부',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '삭제 여부',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `cumulative_sales_amount` decimal(60,2) NOT NULL COMMENT '누적 판매 금액',
  `cumulative_purchase_cnt` int NOT NULL DEFAULT '0' COMMENT 'view count',
  `cumulative_view_cnt` int NOT NULL DEFAULT '0' COMMENT 'view count',
  `fee_amount` decimal(60,2) NOT NULL DEFAULT '0.00' COMMENT '수수료 금액',
  `amount` decimal(60,2) NOT NULL DEFAULT '0.00' COMMENT 'account에 반영된 금액',
  `is_registered_stock` tinyint NOT NULL DEFAULT '0' COMMENT '지분 등록 여부',
  `buy_user_id` bigint DEFAULT NULL,
  `sell_user_id` bigint DEFAULT NULL,
  `market_item_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='market에서 거래한 기록을 남기는 테이블\n';

DROP TABLE IF EXISTS `mc_market_item`;
CREATE TABLE `mc_market_item` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `thumbnail_url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Thumbnail URL',
  `thumbnail_start_time` decimal(60,2) NOT NULL COMMENT 'Thumbnail Start Time',
  `meta_data` text COLLATE utf8mb4_unicode_ci COMMENT 'Meta Data',
  `price` decimal(60,2) NOT NULL COMMENT 'Price',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Item Name code (ex: YYYYMMDDHHmmss)',
  `title` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'title',
  `hashtag` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'hashtag example,hello,world',
  `like_cnt` int NOT NULL DEFAULT '0' COMMENT 'like count',
  `view_cnt` int NOT NULL DEFAULT '0' COMMENT 'view count',
  `purchase_cnt` int NOT NULL DEFAULT '0' COMMENT 'purchase count',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '삭제 여부',
  `is_show` tinyint NOT NULL DEFAULT '1' COMMENT '노출 여부',
  `issue_comment` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '이슈 항목 가록',
  `user_id` bigint DEFAULT NULL,
  `raw_video_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `mc_market_like`;
CREATE TABLE `mc_market_like` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `user_id` bigint DEFAULT NULL,
  `market_item_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `mc_market_profit_payout_history`;
CREATE TABLE `mc_market_profit_payout_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `spend_amount` decimal(60,2) NOT NULL COMMENT '소모한 금액',
  `profit_amount` decimal(60,2) NOT NULL COMMENT '지분 수익금',
  `volume` decimal(60,2) NOT NULL DEFAULT '100.00' COMMENT '지분 수량',
  `buy_user_id` bigint DEFAULT NULL,
  `stock_holder_user_id` bigint DEFAULT NULL,
  `market_history_id` bigint DEFAULT NULL,
  `stock_account_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='영상 구매간 상품에 대한 할당 받은 지분에 따른 수익금 지급 이력을 기록하는 테이블';

DROP TABLE IF EXISTS `mc_outflow_history`;
CREATE TABLE `mc_outflow_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `currency` enum('CL','OS') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CL' COMMENT 'Enum: [CL,OS]',
  `origin_amount` decimal(60,2) NOT NULL COMMENT '수수료 차감 전 금액 - 정산 입력 금액',
  `expected_amount` decimal(60,2) NOT NULL COMMENT '수수료 차감 후 금액 - 정산 예상 금액 ',
  `fee` decimal(60,2) NOT NULL COMMENT '수수료',
  `type` enum('REFUND','SETTLEMENT') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '환불, 정산 타입 : REFUND(환불), SETTLEMENT(정산)',
  `status` enum('PENDING','PROGRESS','CONFIRMED','CANCELED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING' COMMENT '환불, 정산 상태 : READY(환불대기), PROGRESS(환불처리중), CONFIRMED(환불완료), CANCELED(환불취소)',
  `reg_bank_code` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '은행 코드',
  `reg_account_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '계좌번호',
  `reg_bank_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '은행명',
  `user_id` bigint DEFAULT NULL,
  `admin_id` bigint DEFAULT NULL,
  `process_at` timestamp NULL DEFAULT NULL COMMENT '환불, 정산 처리 일시',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='환불 , 정산 이력';

DROP TABLE IF EXISTS `mc_payment_history`;
CREATE TABLE `mc_payment_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `currency` enum('CL','OS') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CL' COMMENT 'CL,OS',
  `imp_uid` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'portone 생성 결제 고유번호',
  `merchant_uid` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'mclose 결제 요청 고유번호',
  `pay_method` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '결제수단 코드(카드, 가상계좌, 휴대폰 등)',
  `pg_provider_code` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'PG사 이름',
  `amount` int NOT NULL COMMENT '결제금액- 현금',
  `charge_amount` int DEFAULT NULL COMMENT '충전 금액 - 포인트',
  `status` enum('READY','PAID','CANCELED','OUTFLOW','OUTFLOW_CANCELED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'READY' COMMENT '결제상태 : READY(결제대기), PAID(결제완료), CANCELED(결제취소), OUTFLOW(정산 완료) , OUTFLOW_CANCELED(정산 취소)',
  `paid_at` datetime DEFAULT NULL COMMENT '결제 응답 일시(결제 완료 또는 취소 시간 기록 오로지 기록용으로 사용)',
  `error_code` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '결제 실패시 에러코드',
  `error_msg` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '결제 실패시 에러메시지',
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `mc_prompt_history`;
CREATE TABLE `mc_prompt_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `question` text COLLATE utf8mb4_unicode_ci COMMENT 'Prompt',
  `answer` text COLLATE utf8mb4_unicode_ci COMMENT 'Answer',
  `api_request_body` text COLLATE utf8mb4_unicode_ci COMMENT 'API Request Body',
  `api_response_body` text COLLATE utf8mb4_unicode_ci COMMENT 'API Response Body',
  `command_uuid` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Command UUID',
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `mc_raw_video`;
CREATE TABLE `mc_raw_video` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `title` varchar(400) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '내프로젝트 제못',
  `origin_video_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Video URL',
  `water_mark_video_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Video URL',
  `video_resolution` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Video Resolution(ffmpeg resolution: 640x360)',
  `video_duration` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Video Duration (ffmpeg duration: 1114624)',
  `video_format` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Video Format (ffmpeg format: mp4, avi, ...)',
  `video_ratio` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Video ratio(ffmpeg display_aspect_ratio: 16:9, 4:3, ...)',
  `workspace_hashtag` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '워크스페이스 해시태그 (최대 1000자) ,으로 구분하며 공백은 허용하지 않는다.',
  `command_uuid` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Command UUID (Video Daemon Service)',
  `meta_data` text COLLATE utf8mb4_unicode_ci COMMENT 'Meta Data',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '삭제 여부',
  `user_id` bigint DEFAULT NULL,
  `prompt_history_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `mc_stock_account`;
CREATE TABLE `mc_stock_account` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `volume` decimal(60,2) NOT NULL DEFAULT '100.00' COMMENT '지분 수량',
  `user_id` bigint DEFAULT NULL,
  `stock_item_id` bigint DEFAULT NULL,
  `market_item_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `mc_stock_item`;
CREATE TABLE `mc_stock_item` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `open_price` decimal(60,2) DEFAULT NULL COMMENT '시가',
  `close_price` decimal(60,2) DEFAULT NULL COMMENT '전일 종가',
  `high_price` decimal(60,2) DEFAULT NULL COMMENT '고가',
  `low_price` decimal(60,2) DEFAULT NULL COMMENT '저가',
  `initial_price` decimal(60,2) DEFAULT NULL COMMENT '초기 가격',
  `thumbnail_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Thumbnail URL',
  `thumbnail_start_time` decimal(60,2) NOT NULL COMMENT 'Thumbnail Start Time',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Item Name code (ex: YYYYMMDDHHmmss)',
  `title` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'title',
  `view_cnt` int NOT NULL DEFAULT '0' COMMENT 'view count',
  `match_cnt` int NOT NULL DEFAULT '0' COMMENT '체결 수',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '삭제 여부',
  `is_show` tinyint NOT NULL DEFAULT '1' COMMENT '노출 여부',
  `issue_comment` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '이슈 항목 가록',
  `user_id` bigint DEFAULT NULL,
  `raw_video_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `mc_stock_match`;
CREATE TABLE `mc_stock_match` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `total_amount` decimal(60,2) NOT NULL COMMENT '거래량 * 가격',
  `original_volume` decimal(60,2) NOT NULL COMMENT '체결 시점 등록된 거래량',
  `volume` decimal(60,2) NOT NULL COMMENT '거래량',
  `amount` decimal(60,2) NOT NULL COMMENT '거래금액',
  `fee_amount` decimal(60,2) NOT NULL COMMENT '수수료 금액',
  `order_live_id` bigint DEFAULT NULL,
  `buy_user_id` bigint DEFAULT NULL,
  `sell_user_id` bigint DEFAULT NULL,
  `stock_item_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `mc_stock_order`;
CREATE TABLE `mc_stock_order` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `volume` decimal(60,2) NOT NULL COMMENT '거래량',
  `amount` decimal(60,2) NOT NULL COMMENT '거래금액',
  `type` enum('BUY','SELL') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '매매 종류',
  `stock_item_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='지분 item 별 총 가격별 거래량을 기록하기 위한 테이블';

DROP TABLE IF EXISTS `mc_stock_order_cancel`;
CREATE TABLE `mc_stock_order_cancel` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `volume` decimal(60,2) NOT NULL COMMENT '거래량',
  `amount` decimal(60,2) NOT NULL COMMENT '거래금액',
  `reg_type` enum('BUYER_CANCEL','SELLER_CANCEL','SELLER_DELETE','ADMIN_DELETE') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '삭제 취소 제공처 : 1.구매자 주문 취소:BUYER_CANCEL, 2.판매자 주문 취소:SELLER_CANCEL 3.판매자 상품 삭제 :SELLER_DELETE, 4.관리자 주문 삭제:ADMIN_DELETE',
  `user_id` bigint DEFAULT NULL,
  `stock_item_id` bigint DEFAULT NULL,
  `stock_order_live_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `mc_stock_order_live`;
CREATE TABLE `mc_stock_order_live` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `origin_volume` decimal(60,2) NOT NULL COMMENT '초기 생성 및 수정시 사용되는 거래량',
  `volume` decimal(60,2) NOT NULL COMMENT '거래량',
  `amount` decimal(60,2) NOT NULL COMMENT '거래금액',
  `type` enum('BUY','SELL') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '매매 종류',
  `status` enum('WAIT','CANCELED','COMPLETE','HIDE') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '매매 상태\n WAIT: 대기, CANCELED: 취소, COMPLETE: 완료, HIDE: 숨김(관리자 전용)',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '삭제 여부',
  `user_id` bigint DEFAULT NULL,
  `stock_item_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `mc_support_bussiness`;
CREATE TABLE `mc_support_bussiness` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `real_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'real_name',
  `phone_no` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'phone_no',
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'email',
  `content` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'content',
  `status` enum('PENDING','PROGRESS','CONFIRMED','CANCELED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING' COMMENT 'status',
  `company_no` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '회사번호',
  `company_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '회사명',
  `company_part_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '부서명',
  `is_optional_required` tinyint NOT NULL DEFAULT '0' COMMENT '선택항목 필수여부',
  `user_id` bigint DEFAULT NULL,
  `admin_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `mc_support_customer`;
CREATE TABLE `mc_support_customer` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'email',
  `real_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'real_name',
  `phone_no` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'phone_no',
  `type` enum('VIDEO','REFUND','SERVICE','ETC') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT ' type : VIDEO(영상) , REFUND(환불) , SERVICE(서비스) , ETC(기타)',
  `content` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'content',
  `status` enum('PENDING','PROGRESS','CONFIRMED','CANCELED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING' COMMENT 'status',
  `response_content` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'response_content',
  `user_id` bigint DEFAULT NULL,
  `admin_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `mc_support_faq`;
CREATE TABLE `mc_support_faq` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `title` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'title',
  `content` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'content',
  `admin_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `mc_usage_history`;
CREATE TABLE `mc_usage_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `type` enum('MARKET','STOCK_MATCH_BUY','PROMPT') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MARKET' COMMENT 'Enum: [MARKET : 마켓 제품 구매시 , STOCK_MATCH_BUY : 지분 matching 된 경우, PROMPT : 프롬프트 요청시]',
  `ref_id` int DEFAULT NULL COMMENT 'MARKET : mc_market_item.id, STOCK_MATCH_BUY : mc_stock_item.id, PROMPT : mc_prompt_history.id',
  `currency` enum('CL','OS') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CL' COMMENT 'Enum: [CL,OS]',
  `amount` decimal(60,2) NOT NULL COMMENT '소모된 금액',
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `mc_user`;
CREATE TABLE `mc_user` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `real_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '실명',
  `login_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '로그인 아이디(이메일)',
  `login_pw` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'hashing된 로그인 비밀번호',
  `pw_round` int DEFAULT NULL COMMENT 'hashing 횟수',
  `phone_no` varchar(12) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '전화번호',
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `birth_date` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '생년 월일',
  `gender` enum('MALE','FEMALE','OTHER') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '성별',
  `jwt` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'jwt',
  `role` enum('ADMIN','USER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USER' COMMENT '사용자 권한 (ADMIN, USER)',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '삭제 여부',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `bank_code` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '은행 코드',
  `account_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '계좌번호',
  `bank_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '은행명',
  `sign_in_retrial_count` int DEFAULT '0' COMMENT '로그인 재시도 횟수',
  `last_activited_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '마지막 활동 날짜',
  `workspace_hashtag` varchar(1024) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '워크스페이스 해시태그 (최대 1000자) ,으로 구분하며 공백은 허용하지 않는다.',
  `is_consent_used` tinyint NOT NULL DEFAULT '1' COMMENT '이용동의 여부',
  `is_consent_personal_info` tinyint NOT NULL DEFAULT '1' COMMENT '개인정보 이용동의 여부',
  `is_consent_marketing_info` tinyint NOT NULL DEFAULT '0' COMMENT '마케팅 이용동의 여부',
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_3600aec4eccffe9e948cda1e7f` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `mc_user_memo`;
CREATE TABLE `mc_user_memo` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `content` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'content',
  `user_id` bigint DEFAULT NULL,
  `admin_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `migrations`;
CREATE TABLE `migrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `timestamp` bigint NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;