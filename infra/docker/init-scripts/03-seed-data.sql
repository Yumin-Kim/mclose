INSERT INTO `mc_account` (`id`, `created_at`, `updated_at`, `balance`, `currency`, `user_id`) VALUES
(1, '2025-01-17 09:19:49', '2025-01-19 12:26:26', 3800.00, 'CL', 1),
(2, '2025-01-17 09:19:49', '2025-01-20 12:00:38', 9991900.00, 'OS', 1),
(3, '2025-01-20 11:53:46', '2025-01-20 12:00:03', 10000000.00, 'CL', 2),
(4, '2025-01-20 11:53:46', '2025-01-20 12:00:03', 10000000.00, 'OS', 2),
(5, '2025-01-20 11:54:38', '2025-01-20 12:00:03', 10000000.00, 'CL', 3),
(6, '2025-01-20 11:54:38', '2025-01-20 12:00:03', 10000000.00, 'OS', 3),
(7, '2025-01-20 11:55:29', '2025-01-20 12:00:03', 10000000.00, 'CL', 4),
(8, '2025-01-20 11:55:29', '2025-01-20 12:00:03', 10000000.00, 'OS', 4),
(9, '2025-01-20 11:56:18', '2025-01-20 12:00:03', 10000000.00, 'CL', 5),
(10, '2025-01-20 11:56:18', '2025-03-16 23:05:28', 9938390.00, 'OS', 5);

INSERT INTO `mc_account_history` (`id`, `created_at`, `updated_at`, `currency`, `amount`, `type`, `status`, `ledger_type`, `user_id`, `account_id`) VALUES
(1, '2025-01-17 09:22:56', '2025-01-17 09:22:56', 'CL', 5000.00, 'POINT', 'CONFIRMED', 'DEPOSIT', 1, 1),
(2, '2025-01-17 09:23:29', '2025-01-17 09:23:29', 'CL', -100.00, 'POINT', 'CONFIRMED', 'WITHDRAW', 1, 1),
(3, '2025-01-17 09:29:03', '2025-01-17 09:29:03', 'CL', -100.00, 'POINT', 'CONFIRMED', 'WITHDRAW', 1, 1),
(4, '2025-01-17 09:33:34', '2025-01-17 09:33:34', 'CL', -100.00, 'POINT', 'CONFIRMED', 'WITHDRAW', 1, 1),
(5, '2025-01-17 09:37:08', '2025-01-17 09:37:08', 'CL', -100.00, 'POINT', 'CONFIRMED', 'WITHDRAW', 1, 1),
(6, '2025-01-19 11:21:13', '2025-01-19 11:21:13', 'CL', -100.00, 'POINT', 'CONFIRMED', 'WITHDRAW', 1, 1),
(7, '2025-01-19 11:33:01', '2025-01-19 11:33:01', 'CL', -100.00, 'POINT', 'CONFIRMED', 'WITHDRAW', 1, 1),
(8, '2025-01-19 11:39:54', '2025-01-19 11:39:54', 'CL', -100.00, 'POINT', 'CONFIRMED', 'WITHDRAW', 1, 1),
(9, '2025-01-19 11:42:04', '2025-01-19 11:42:04', 'CL', -100.00, 'POINT', 'CONFIRMED', 'WITHDRAW', 1, 1),
(10, '2025-01-19 12:10:03', '2025-01-19 12:10:03', 'CL', -100.00, 'POINT', 'CONFIRMED', 'WITHDRAW', 1, 1),
(11, '2025-01-19 12:11:35', '2025-01-19 12:11:35', 'CL', -100.00, 'POINT', 'CONFIRMED', 'WITHDRAW', 1, 1),
(12, '2025-01-19 12:12:15', '2025-01-19 12:12:15', 'CL', -100.00, 'POINT', 'CONFIRMED', 'WITHDRAW', 1, 1),
(13, '2025-01-19 12:26:26', '2025-01-19 12:26:26', 'CL', -100.00, 'POINT', 'CONFIRMED', 'WITHDRAW', 1, 1),
(14, '2025-01-20 12:00:38', '2025-01-20 12:00:38', 'OS', -8100.00, 'POINT', 'CONFIRMED', 'WITHDRAW', 1, 2),
(15, '2025-03-16 23:05:28', '2025-03-16 23:05:28', 'OS', -61610.00, 'POINT', 'CONFIRMED', 'WITHDRAW', 5, 10);

INSERT INTO `mc_admin` (`id`, `created_at`, `updated_at`, `login_id`, `login_pw`, `pw_round`, `real_name`, `nickname`, `email`, `jwt`, `role`, `allow_ip`, `is_deleted`, `phone_no`, `last_activited_at`) VALUES
(2, '2025-03-11 12:57:19', '2025-05-05 04:51:37', 'dbals0@naver.com', 'd755185f27fa9190a77b787074fe63fd18f3f4c8d63c4a07d52de271444bb9c2', 9, '김유민', '김유민', 'dbals0@naver.com', '', 'SUPER', '112.146.225.211', 0, '01012341234', '2025-05-05 04:51:37'),
(3, '2025-03-11 13:09:10', '2025-03-11 13:12:13', 'choiguemin1@gmail.com', '682fa366ba1f857b731a757deb28be1babf2ff1d98e3c025c1344823032caa25', 8, '최규민', '최규민', 'choiguemin1@gmail.com', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjMiLCJsb2dpbklkIjoiY2hvaWd1ZW1pbjFAZ21haWwuY29tIiwicmVhbE5hbWUiOiLstZzqt5zrr7wiLCJlbWFpbCI6ImNob2lndWVtaW4xQGdtYWlsLmNvbSIsImlhdCI6MTc0MTY5ODczMywiZXhwIjoxNzQ3NzQ2NzMzfQ.LvBiQeyUX5xCrGteop6-DbgsabrrLof9OK8SKPRRlgA', 'SUPER', '1.230.239.102', 0, '01043214321', '2025-03-11 13:09:10'),
(4, '2025-03-13 12:24:17', '2025-03-17 12:17:35', 'dbals1@naver.com', '14884247b46539eb84a11da76b4d3f285d4d4da36d2a2b74c6c64d1db4388403', 2, '김유민_EDITOR', '김유민_EDITOR', 'dbals1@naver.com', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQiLCJsb2dpbklkIjoiZGJhbHMxQG5hdmVyLmNvbSIsInJlYWxOYW1lIjoi6rmA7Jyg66-8X0VESVRPUiIsImVtYWlsIjoiZGJhbHMxQG5hdmVyLmNvbSIsImlhdCI6MTc0MjIxMzg1NSwiZXhwIjoxNzQ4MjYxODU1fQ.b7GjMxxHJBbcX170bJDfT2SPHj6Try9c1q5XskpOtT0', 'EDITOR', '112.146.225.211', 0, '01012341234', '2025-03-13 12:25:16'),
(5, '2025-03-13 12:24:57', '2025-03-13 12:25:38', 'dbals2@naver.com', '5b7f65db4dd1131d3bf61dfcfa3641ce694c69330a4b79d5e9753e03791e8e38', 13, '김유민_COMMON', '김유민_COMMON', 'dbals2@naver.com', '', 'COMMON', '112.146.225.211', 0, '01012341234', '2025-03-13 12:25:38'),
(6, '2025-04-09 13:06:53', '2025-04-09 13:16:59', 'awas3537@naver.com', 'cf57f25c15d32db83b93d1e57232f8c7642d33021f6159f69b2c050c3b853c36', 12, '김기협', '김기협', 'awas3537@naver.com', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYiLCJsb2dpbklkIjoiYXdhczM1MzdAbmF2ZXIuY29tIiwicmVhbE5hbWUiOiLquYDquLDtmJEiLCJlbWFpbCI6ImF3YXMzNTM3QG5hdmVyLmNvbSIsImlhdCI6MTc0NDIwNDYxOSwiZXhwIjoxNzUwMjUyNjE5fQ.dSOZiIrMufqCpuudW0ttEuqAq7cKND9myYPWTGYrxkc', 'SUPER', '27.35.10.229', 0, '01012341234', '2025-04-09 13:06:53');

INSERT INTO `mc_market_cart` (`id`, `created_at`, `updated_at`, `user_id`, `market_item_id`) VALUES
(1, '2025-01-22 11:39:30', '2025-01-22 11:39:30', 2, 2);

INSERT INTO `mc_market_item` (`id`, `created_at`, `updated_at`, `thumbnail_url`, `thumbnail_start_time`, `meta_data`, `price`, `name`, `title`, `hashtag`, `like_cnt`, `view_cnt`, `purchase_cnt`, `deleted_at`, `is_deleted`, `is_show`, `issue_comment`, `user_id`, `raw_video_id`) VALUES
(1, '2025-01-19 12:57:33', '2025-03-16 23:00:54', 'https://mclose-test-bucket.s3.amazonaws.com/images/thumbnail/1737291453474.png', 0.00, NULL, 10000.00, '202501191257336091668', 'HEllo', '1123', 0, 89, 0, NULL, 0, 1, NULL, 1, 11),
(2, '2025-01-19 13:04:21', '2025-03-16 22:58:01', 'https://mclose-test-bucket.s3.amazonaws.com/images/thumbnail/1737291861177.png', 13.05, NULL, 80000.00, '202501191304213864525', 'First Market Item 001', 'Hello', 0, 90, 0, NULL, 0, 1, NULL, 1, 12);

INSERT INTO `mc_payment_history` (`id`, `created_at`, `updated_at`, `currency`, `imp_uid`, `merchant_uid`, `pay_method`, `pg_provider_code`, `amount`, `charge_amount`, `status`, `paid_at`, `error_code`, `error_msg`, `user_id`) VALUES
(1, '2025-01-17 09:20:35', '2025-01-17 09:22:56', 'CL', '01947390-7a86-4d8d-5beb-555a0dbd5830', '2b96c3fc-ce2f-48ae-8601-40a43eb26c08', 'CARD', 'NicePayments', 51750, 5000, 'PAID', '2025-01-17 09:22:56', NULL, NULL, 1);

INSERT INTO `mc_prompt_history` (`id`, `created_at`, `updated_at`, `question`, `answer`, `api_request_body`, `api_response_body`, `command_uuid`, `user_id`) VALUES
(1, '2025-01-17 09:23:29', '2025-01-17 09:23:33', '영상 생성', NULL, '{\"userId\":\"1\",\"question\":\"영상 생성\",\"ratio\":\"16:9\",\"resolution\":\"720p\",\"frame\":16,\"motion\":15,\"style\":\"cinematic\",\"width\":\"720\",\"height\":\"1280\",\"commandUUID\":\"8d7372c7-11a2-4d4b-b1a8-ef97338dce59\",\"timestamp\":1737105809948}', '{\'videoUrl\': \'https://videos.pexels.com/video-files/853877/853877-hd_1920_1080_25fps.mp4\'}', '8d7372c7-11a2-4d4b-b1a8-ef97338dce59', 1),
(2, '2025-01-17 09:29:03', '2025-01-17 09:29:04', 'TEST', NULL, '{\"userId\":\"1\",\"question\":\"TEST\",\"ratio\":\"16:9\",\"resolution\":\"720p\",\"frame\":16,\"motion\":15,\"style\":\"cinematic\",\"width\":\"720\",\"height\":\"1280\",\"commandUUID\":\"b4538033-9d1d-4082-803b-4eb83f119f44\",\"timestamp\":1737106143297}', '{\'videoUrl\': \'https://videos.pexels.com/video-files/4139671/4139671-sd_426_240_30fps.mp4\'}', 'b4538033-9d1d-4082-803b-4eb83f119f44', 1),
(3, '2025-01-17 09:33:34', '2025-01-17 09:33:35', '완료', NULL, '{\"userId\":\"1\",\"question\":\"완료\",\"ratio\":\"16:9\",\"resolution\":\"720p\",\"frame\":16,\"motion\":15,\"style\":\"cinematic\",\"width\":\"720\",\"height\":\"1280\",\"commandUUID\":\"d21f4bf4-dc99-4a77-bdf3-c89cafbaae2a\",\"timestamp\":1737106414178}', '{\'videoUrl\': \'https://videos.pexels.com/video-files/1841002/1841002-uhd_2732_1440_24fps.mp4\'}', 'd21f4bf4-dc99-4a77-bdf3-c89cafbaae2a', 1),
(4, '2025-01-17 09:37:08', '2025-01-17 09:37:09', 'test', NULL, '{\"userId\":\"1\",\"question\":\"test\",\"ratio\":\"16:9\",\"resolution\":\"720p\",\"frame\":16,\"motion\":15,\"style\":\"cinematic\",\"width\":\"720\",\"height\":\"1280\",\"commandUUID\":\"40b8e99a-2390-40ca-ae84-0e09a3b92430\",\"timestamp\":1737106628790}', '{\'videoUrl\': \'https://videos.pexels.com/video-files/8447510/8447510-hd_2048_1080_25fps.mp4\'}', '40b8e99a-2390-40ca-ae84-0e09a3b92430', 1),
(5, '2025-01-19 11:21:13', '2025-01-19 11:21:16', '1234', NULL, '{\"userId\":\"1\",\"question\":\"1234\",\"ratio\":\"16:9\",\"resolution\":\"720p\",\"frame\":16,\"motion\":15,\"style\":\"cinematic\",\"width\":\"720\",\"height\":\"1280\",\"commandUUID\":\"01f96b24-665e-4dbb-a6ce-a9435a41590e\",\"timestamp\":1737285673032}', '{\'videoUrl\': \'https://videos.pexels.com/video-files/9872597/9872597-sd_426_240_24fps.mp4\'}', '01f96b24-665e-4dbb-a6ce-a9435a41590e', 1),
(6, '2025-01-19 11:33:01', '2025-01-19 11:33:03', 'test', NULL, '{\"userId\":\"1\",\"question\":\"test\",\"ratio\":\"16:9\",\"resolution\":\"720p\",\"frame\":16,\"motion\":15,\"style\":\"cinematic\",\"width\":\"720\",\"height\":\"1280\",\"commandUUID\":\"1da28426-af2f-4b2a-87ac-c40c38350714\",\"timestamp\":1737286381305}', '{\'videoUrl\': \'https://videos.pexels.com/video-files/15138295/15138295-sd_640_360_30fps.mp4\'}', '1da28426-af2f-4b2a-87ac-c40c38350714', 1),
(7, '2025-01-19 11:39:54', '2025-01-19 11:39:55', 'test', NULL, '{\"userId\":\"1\",\"question\":\"test\",\"ratio\":\"16:9\",\"resolution\":\"720p\",\"frame\":16,\"motion\":15,\"style\":\"cinematic\",\"width\":\"720\",\"height\":\"1280\",\"commandUUID\":\"7dd360b6-17a5-42c4-a1c8-bbf49b788ebf\",\"timestamp\":1737286794764}', '{\'videoUrl\': \'https://videos.pexels.com/video-files/5076785/5076785-sd_360_640_30fps.mp4\'}', '7dd360b6-17a5-42c4-a1c8-bbf49b788ebf', 1),
(8, '2025-01-19 11:42:04', '2025-01-19 11:42:06', 'hello', NULL, '{\"userId\":\"1\",\"question\":\"hello\",\"ratio\":\"16:9\",\"resolution\":\"720p\",\"frame\":16,\"motion\":15,\"style\":\"cinematic\",\"width\":\"720\",\"height\":\"1280\",\"commandUUID\":\"b2213234-7756-45c7-95b8-136a58edadd9\",\"timestamp\":1737286924753}', '{\'videoUrl\': \'https://videos.pexels.com/video-files/5527139/5527139-uhd_1440_2560_24fps.mp4\'}', 'b2213234-7756-45c7-95b8-136a58edadd9', 1),
(9, '2025-01-19 12:10:03', '2025-01-19 12:10:05', '1234', NULL, '{\"userId\":\"1\",\"question\":\"1234\",\"ratio\":\"16:9\",\"resolution\":\"720p\",\"frame\":16,\"motion\":15,\"style\":\"cinematic\",\"width\":\"720\",\"height\":\"1280\",\"commandUUID\":\"6dc433c7-8978-435a-b11a-bf4445a54efb\",\"timestamp\":1737288603481}', '{\'videoUrl\': \'https://videos.pexels.com/video-files/30278658/12979469_640_360_30fps.mp4\'}', '6dc433c7-8978-435a-b11a-bf4445a54efb', 1),
(10, '2025-01-19 12:11:35', '2025-01-19 12:11:36', 'dasdasd', NULL, '{\"userId\":\"1\",\"question\":\"dasdasd\",\"ratio\":\"16:9\",\"resolution\":\"720p\",\"frame\":16,\"motion\":15,\"style\":\"cinematic\",\"width\":\"720\",\"height\":\"1280\",\"commandUUID\":\"ed32e941-b509-40ee-bfb9-630ba423d336\",\"timestamp\":1737288695184}', '{\'videoUrl\': \'https://videos.pexels.com/video-files/6209891/6209891-sd_960_540_25fps.mp4\'}', 'ed32e941-b509-40ee-bfb9-630ba423d336', 1),
(11, '2025-01-19 12:12:15', '2025-01-19 12:12:17', '1234', NULL, '{\"userId\":\"1\",\"question\":\"1234\",\"ratio\":\"16:9\",\"resolution\":\"720p\",\"frame\":16,\"motion\":15,\"style\":\"cinematic\",\"width\":\"720\",\"height\":\"1280\",\"commandUUID\":\"0dbef020-f2d0-4eed-b007-76a3d367a97f\",\"timestamp\":1737288735616}', '{\'videoUrl\': \'https://videos.pexels.com/video-files/5433602/5433602-hd_1920_1080_30fps.mp4\'}', '0dbef020-f2d0-4eed-b007-76a3d367a97f', 1),
(12, '2025-01-19 12:26:26', '2025-01-19 12:26:28', '124', NULL, '{\"userId\":\"1\",\"question\":\"124\",\"ratio\":\"16:9\",\"resolution\":\"720p\",\"frame\":16,\"motion\":15,\"style\":\"cinematic\",\"width\":\"720\",\"height\":\"1280\",\"commandUUID\":\"ed2eb307-e0ff-42c6-821c-f6138849515f\",\"timestamp\":1737289586944}', '{\'videoUrl\': \'https://videos.pexels.com/video-files/8969043/8969043-sd_506_960_24fps.mp4\'}', 'ed2eb307-e0ff-42c6-821c-f6138849515f', 1);

INSERT INTO `mc_raw_video` (`id`, `created_at`, `updated_at`, `title`, `origin_video_url`, `water_mark_video_url`, `video_resolution`, `video_duration`, `video_format`, `video_ratio`, `workspace_hashtag`, `command_uuid`, `meta_data`, `deleted_at`, `is_deleted`, `user_id`, `prompt_history_id`) VALUES
(1, '2025-01-17 09:23:30', '2025-01-17 09:23:30', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '8d7372c7-11a2-4d4b-b1a8-ef97338dce59', NULL, NULL, 0, 1, 1),
(2, '2025-01-17 09:29:03', '2025-01-17 09:29:03', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'b4538033-9d1d-4082-803b-4eb83f119f44', NULL, NULL, 0, 1, 2),
(3, '2025-01-17 09:33:34', '2025-01-17 09:33:34', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'd21f4bf4-dc99-4a77-bdf3-c89cafbaae2a', NULL, NULL, 0, 1, 3),
(4, '2025-01-17 09:37:08', '2025-01-17 09:37:08', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '40b8e99a-2390-40ca-ae84-0e09a3b92430', NULL, NULL, 0, 1, 4),
(5, '2025-01-19 11:21:13', '2025-01-19 11:21:27', '', 'https://mclose-video-bucket.s3.ap-northeast-2.amazonaws.com/video-storage/1737285677602.mp4', 'https://mclose-video-bucket.s3.ap-northeast-2.amazonaws.com/transform-video-storage/1737285677602.mp4', '426x240', '14.375', 'mp4', '71:40', NULL, '01f96b24-665e-4dbb-a6ce-a9435a41590e', NULL, NULL, 0, 1, 5),
(6, '2025-01-19 11:33:01', '2025-01-19 11:33:14', '', 'https://mclose-video-bucket.s3.ap-northeast-2.amazonaws.com/mount_s3/raw_video/1737286384210.mp4', 'https://mclose-video-bucket.s3.ap-northeast-2.amazonaws.com/mount_s3/transformed_video/1737286384210.mp4', '640x360', '20.453333', 'mp4', '16:9', NULL, '1da28426-af2f-4b2a-87ac-c40c38350714', NULL, NULL, 0, 1, 6),
(7, '2025-01-19 11:39:54', '2025-01-19 11:39:54', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '7dd360b6-17a5-42c4-a1c8-bbf49b788ebf', NULL, NULL, 0, 1, 7),
(8, '2025-01-19 11:42:04', '2025-01-19 11:42:04', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'b2213234-7756-45c7-95b8-136a58edadd9', NULL, NULL, 0, 1, 8),
(9, '2025-01-19 12:10:03', '2025-01-19 12:10:30', '', 'https://mclose-video-bucket.s3.ap-northeast-2.amazonaws.com/mount_s3/raw_video/1737288611078.mp4', 'https://mclose-video-bucket.s3.ap-northeast-2.amazonaws.com/mount_s3/transformed_video/1737288611078.mp4', '640x360', '20.4204', 'mp4', '16:9', NULL, '6dc433c7-8978-435a-b11a-bf4445a54efb', NULL, NULL, 0, 1, 9),
(10, '2025-01-19 12:11:35', '2025-01-19 12:11:45', '', 'https://mclose-video-bucket.s3.ap-northeast-2.amazonaws.com/mount_s3/raw_video/1737288698085.mp4', 'https://mclose-video-bucket.s3.ap-northeast-2.amazonaws.com/mount_s3/transformed_video/1737288698085.mp4', '426x240', '13.96', 'mp4', '71:40', NULL, 'ed32e941-b509-40ee-bfb9-630ba423d336', NULL, NULL, 0, 1, 10),
(11, '2025-01-19 12:12:15', '2025-01-19 12:23:41', '', 'https://mclose-video-bucket.s3.ap-northeast-2.amazonaws.com/raw_video/1737288737406.mp4', 'https://mclose-video-bucket.s3.ap-northeast-2.amazonaws.com/transformed_video/1737288737406.mp4', '1920x1080', '10.71', 'mp4', '16:9', NULL, '0dbef020-f2d0-4eed-b007-76a3d367a97f', NULL, NULL, 0, 1, 11),
(12, '2025-01-19 12:26:27', '2025-01-19 12:26:52', '', 'https://mclose-video-bucket.s3.ap-northeast-2.amazonaws.com/raw_video/1737289589517.mp4', 'https://mclose-video-bucket.s3.ap-northeast-2.amazonaws.com/transformed_video/1737289589517.mp4', '506x960', '18.458333', 'mp4', '253:480', NULL, 'ed2eb307-e0ff-42c6-821c-f6138849515f', NULL, NULL, 0, 1, 12);

INSERT INTO `mc_stock_account` (`id`, `created_at`, `updated_at`, `volume`, `user_id`, `stock_item_id`, `market_item_id`) VALUES
(1, '2025-01-19 13:07:28', '2025-01-19 13:07:28', 100.00, 1, 1, 2);

INSERT INTO `mc_stock_item` (`id`, `created_at`, `updated_at`, `open_price`, `close_price`, `high_price`, `low_price`, `initial_price`, `thumbnail_url`, `thumbnail_start_time`, `name`, `title`, `view_cnt`, `match_cnt`, `deleted_at`, `is_deleted`, `is_show`, `issue_comment`, `user_id`, `raw_video_id`) VALUES
(1, '2025-01-19 13:07:28', '2025-03-16 23:05:14', 8000.00, 8000.00, 9600.00, 6400.00, 8000.00, 'https://mclose-test-bucket.s3.amazonaws.com/images/thumbnail/1737292048125.png', 1.58, '202501191307282912701', 'Hello ##001 ', 7, 0, NULL, 0, 1, NULL, 1, 12);

INSERT INTO `mc_stock_order` (`id`, `created_at`, `updated_at`, `volume`, `amount`, `type`, `stock_item_id`) VALUES
(1, '2025-01-19 13:07:28', '2025-01-19 13:07:28', 14.00, 8000.00, 'SELL', 1),
(2, '2025-01-20 12:00:38', '2025-01-20 12:00:38', 1.00, 8100.00, 'BUY', 1),
(3, '2025-03-16 23:05:28', '2025-03-16 23:05:28', 5.00, 12322.00, 'BUY', 1);

INSERT INTO `mc_stock_order_live` (`id`, `created_at`, `updated_at`, `origin_volume`, `volume`, `amount`, `type`, `status`, `deleted_at`, `is_deleted`, `user_id`, `stock_item_id`) VALUES
(1, '2025-01-19 13:07:28', '2025-01-19 13:07:28', 14.00, 14.00, 8000.00, 'SELL', 'WAIT', NULL, 0, 1, 1),
(2, '2025-01-20 12:00:38', '2025-01-20 12:00:38', 1.00, 1.00, 8100.00, 'BUY', 'WAIT', NULL, 0, 1, 1),
(3, '2025-03-16 23:05:27', '2025-03-16 23:05:27', 5.00, 5.00, 12322.00, 'BUY', 'WAIT', NULL, 0, 5, 1);

INSERT INTO `mc_support_bussiness` (`id`, `created_at`, `updated_at`, `real_name`, `phone_no`, `email`, `content`, `status`, `company_no`, `company_name`, `company_part_name`, `is_optional_required`, `user_id`, `admin_id`) VALUES
(1, '2025-03-01 02:26:31', '2025-03-01 02:26:31', 'e', 'ee', 'e@e', 'e', 'PENDING', 'ee', 'e', 'e', 0, NULL, NULL),
(2, '2025-03-01 02:26:32', '2025-03-01 02:26:32', '', '', '@', '', 'PENDING', '', '', '', 0, NULL, NULL),
(3, '2025-03-01 02:26:33', '2025-03-01 02:26:33', '', '010', '@gmail.com', '', 'PENDING', '', '', '', 0, NULL, NULL),
(4, '2025-03-01 02:26:33', '2025-03-01 02:26:33', '', '010', '@gmail.com', '', 'PENDING', '', '', '', 0, NULL, NULL),
(5, '2025-03-01 02:30:24', '2025-03-01 02:30:24', 'e', 'ee', 'e@e', 'e', 'PENDING', 'ee', 'e', 'e', 0, NULL, NULL),
(6, '2025-03-01 02:30:24', '2025-03-01 02:30:24', '', '', '@', '', 'PENDING', '', '', '', 0, NULL, NULL),
(7, '2025-03-01 02:30:25', '2025-03-01 02:30:25', '', '010', '@gmail.com', '', 'PENDING', '', '', '', 0, NULL, NULL),
(8, '2025-03-01 02:30:25', '2025-03-01 02:30:25', '', '010', '@gmail.com', '', 'PENDING', '', '', '', 0, NULL, NULL),
(9, '2025-03-01 02:31:46', '2025-03-01 02:31:46', 'e', 'ee', 'e@e', 'e', 'PENDING', 'ee', 'e', 'e', 0, NULL, NULL),
(10, '2025-03-01 02:31:46', '2025-03-01 02:31:46', '', '', '@', '', 'PENDING', '', '', '', 0, NULL, NULL),
(11, '2025-03-01 02:31:47', '2025-03-01 02:31:47', '', '010', '@gmail.com', '', 'PENDING', '', '', '', 0, NULL, NULL),
(12, '2025-03-01 02:31:47', '2025-03-01 02:31:47', '', '010', '@gmail.com', '', 'PENDING', '', '', '', 0, NULL, NULL);

INSERT INTO `mc_usage_history` (`id`, `created_at`, `updated_at`, `type`, `ref_id`, `currency`, `amount`, `user_id`) VALUES
(1, '2025-01-17 09:23:29', '2025-01-17 09:23:29', 'PROMPT', NULL, 'CL', 100.00, 1),
(2, '2025-01-17 09:29:03', '2025-01-17 09:29:03', 'PROMPT', NULL, 'CL', 100.00, 1),
(3, '2025-01-17 09:33:34', '2025-01-17 09:33:34', 'PROMPT', NULL, 'CL', 100.00, 1),
(4, '2025-01-17 09:37:08', '2025-01-17 09:37:08', 'PROMPT', NULL, 'CL', 100.00, 1),
(5, '2025-01-19 11:21:13', '2025-01-19 11:21:13', 'PROMPT', NULL, 'CL', 100.00, 1),
(6, '2025-01-19 11:33:01', '2025-01-19 11:33:01', 'PROMPT', NULL, 'CL', 100.00, 1),
(7, '2025-01-19 11:39:54', '2025-01-19 11:39:54', 'PROMPT', NULL, 'CL', 100.00, 1),
(8, '2025-01-19 11:42:04', '2025-01-19 11:42:04', 'PROMPT', NULL, 'CL', 100.00, 1),
(9, '2025-01-19 12:10:03', '2025-01-19 12:10:03', 'PROMPT', NULL, 'CL', 100.00, 1),
(10, '2025-01-19 12:11:35', '2025-01-19 12:11:35', 'PROMPT', NULL, 'CL', 100.00, 1),
(11, '2025-01-19 12:12:15', '2025-01-19 12:12:15', 'PROMPT', NULL, 'CL', 100.00, 1),
(12, '2025-01-19 12:26:26', '2025-01-19 12:26:26', 'PROMPT', NULL, 'CL', 100.00, 1);

INSERT INTO `mc_user` (`id`, `created_at`, `updated_at`, `real_name`, `login_id`, `login_pw`, `pw_round`, `phone_no`, `email`, `birth_date`, `gender`, `jwt`, `role`, `is_deleted`, `deleted_at`, `bank_code`, `account_number`, `bank_name`, `sign_in_retrial_count`, `last_activited_at`, `workspace_hashtag`, `is_consent_used`, `is_consent_personal_info`, `is_consent_marketing_info`) VALUES
(1, '2025-01-17 09:19:49', '2025-03-10 12:18:27', '김유민', 'test001@test.com', '9ada624aabd8037aaa31d670c2095c4bf98d7c52200f5d2bc877c0fcbc4a742a', 5, '01011111111', 'test001@test.com', NULL, NULL, NULL, 'USER', 0, NULL, '011', '3510771277043', '농협', 0, '2025-03-10 12:18:27', NULL, 1, 1, 1),
(2, '2025-01-20 11:53:46', '2025-01-22 11:39:08', '최규민', 'test002@test.comm', 'a0762f0a7d14c95cb059f331990085b7d7b0f2931a9f07aea02af4eb05490747', 6, '01022222222', 'test002@test.com', NULL, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjIiLCJpYXQiOjE3Mzc1NDU5NDgsImV4cCI6MTczNzYzMjM0OH0.jpk_FMRtlOoXc0cYqltwZEBwnL4EKMg_U2AMZaE1oyM', 'USER', 0, NULL, '', '', '', 0, '2025-01-22 11:39:08', NULL, 1, 1, 1),
(3, '2025-01-20 11:54:38', '2025-01-20 11:58:19', '한명현', 'test003@test.com', '57b072e31034380d2491c6795da520e0e4e09d00027f72959428b5351569775f', 12, '010333333333', 'test003@test.com', NULL, NULL, NULL, 'USER', 0, NULL, '', '', '', 0, '2025-01-20 11:58:19', NULL, 1, 1, 1),
(4, '2025-01-20 11:55:29', '2025-03-10 12:18:32', '최준현', 'test004@test.com', '0ef0a54701c0fea2cbf5762350973712b9f2a6ae968f135a7620e77afc05ce88', 9, '01044444444', 'test004@test.com', NULL, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQiLCJpYXQiOjE3NDE2MDkxMTIsImV4cCI6MTc0MTY5NTUxMn0.wzg4rL4Wmb6eG24NufkfjDGW71SfmGPlmRfVlOeaWIk', 'USER', 0, NULL, '', '', '', 0, '2025-03-10 12:18:32', NULL, 1, 1, 1),
(5, '2025-01-20 11:56:18', '2025-03-16 23:01:50', '김기협', 'test005@test.com', '31cc6c29a40dfeaff9b7b3798d158f710c015cb7b66d1d1bb3a6fd42cee5f0dd', 4, '01055555555', 'test005@test.com', NULL, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUiLCJpYXQiOjE3NDIxNjYxMTAsImV4cCI6MTc0MjI1MjUxMH0.smIpm9dfR4XQdQ6ePZK3rWHDkIjCOARaHKPgHnBaLLU', 'USER', 0, NULL, '', '', '', 0, '2025-03-16 23:01:50', NULL, 1, 1, 1);

INSERT INTO `migrations` (`id`, `timestamp`, `name`) VALUES
(1, 1741697015369, 'Migration1741697015369'),
(2, 1743511607178, 'Migration1743511607178'),
(3, 1743851262096, 'Migration1743851262096');