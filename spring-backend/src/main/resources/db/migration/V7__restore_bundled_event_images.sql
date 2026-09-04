-- Normalize the legacy seeded event images as a one-time Spring migration.

UPDATE EVENTS
SET image_url = CASE title
    WHEN '桜祭り' THEN '/static/events/lehoianhdao.png'
    WHEN 'Lễ hội hoa anh đào' THEN '/static/events/lehoianhdao.png'
    WHEN '寿司作り体験' THEN '/static/events/hoclamsushi.png'
    WHEN 'Học làm Sushi' THEN '/static/events/hoclamsushi.png'
    WHEN '富士山登山' THEN '/static/events/leonuiphusi.png'
    WHEN 'Leo núi Phú Sĩ' THEN '/static/events/leonuiphusi.png'
    WHEN '留学セミナー' THEN '/static/events/hoithaoduhoc.png'
    WHEN 'Hội thảo du học' THEN '/static/events/hoithaoduhoc.png'
    WHEN 'J-POP交流会' THEN '/static/events/giaoluujpop.png'
    WHEN 'Giao lưu J-Pop' THEN '/static/events/giaoluujpop.png'
    WHEN 'マンガ展' THEN '/static/events/trienlammanga.png'
    WHEN 'Triển lãm Manga' THEN '/static/events/trienlammanga.png'
    WHEN '書道ワークショップ' THEN '/static/events/workshopthuphap.png'
    WHEN 'Workshop Thư pháp' THEN '/static/events/workshopthuphap.png'
    WHEN 'トリン・コン・ソン音楽の夕べ' THEN '/static/events/demnhactrinh.png'
    WHEN 'Đêm nhạc Trịnh' THEN '/static/events/demnhactrinh.png'
    WHEN 'コミュニティサッカー' THEN '/static/events/bongdacongdong.png'
    WHEN 'Bóng đá cộng đồng' THEN '/static/events/bongdacongdong.png'
    WHEN '日本語会話交流会' THEN '/static/events/tiengnhatgiaotiep.png'
    WHEN 'Tiếng Nhật giao tiếp' THEN '/static/events/tiengnhatgiaotiep.png'
    WHEN 'ITキャリアフェア' THEN '/static/events/ngayhoivieclamit.png'
    WHEN 'Ngày hội việc làm IT' THEN '/static/events/ngayhoivieclamit.png'
    WHEN '茶道体験会' THEN '/static/events/tiectradao.png'
    WHEN 'Tiệc trà đạo' THEN '/static/events/tiectradao.png'
    WHEN '生け花体験' THEN '/static/events/camhoaikebana.png'
    WHEN 'Cắm hoa Ikebana' THEN '/static/events/camhoaikebana.png'
    WHEN '日本語スピーチコンテスト' THEN '/static/events/hungbientiengnhat.png'
    WHEN 'Hùng biện tiếng Nhật' THEN '/static/events/hungbientiengnhat.png'
    WHEN 'アニメファンオフ会' THEN '/static/events/offlinefananime.png'
    WHEN 'Offline fan anime' THEN '/static/events/offlinefananime.png'
    ELSE image_url
END
WHERE title IN (
    '桜祭り', 'Lễ hội hoa anh đào', '寿司作り体験', 'Học làm Sushi',
    '富士山登山', 'Leo núi Phú Sĩ', '留学セミナー', 'Hội thảo du học',
    'J-POP交流会', 'Giao lưu J-Pop', 'マンガ展', 'Triển lãm Manga',
    '書道ワークショップ', 'Workshop Thư pháp',
    'トリン・コン・ソン音楽の夕べ', 'Đêm nhạc Trịnh',
    'コミュニティサッカー', 'Bóng đá cộng đồng',
    '日本語会話交流会', 'Tiếng Nhật giao tiếp',
    'ITキャリアフェア', 'Ngày hội việc làm IT', '茶道体験会', 'Tiệc trà đạo',
    '生け花体験', 'Cắm hoa Ikebana',
    '日本語スピーチコンテスト', 'Hùng biện tiếng Nhật',
    'アニメファンオフ会', 'Offline fan anime'
);
