-- 샘플 뉴스 데이터 (종목 관련 키워드 포함)
-- 기존 news 테이블 구조에 맞춰 수정

-- 삼성전자 관련 뉴스
INSERT INTO news (category, title, summary, link, image_url, publisher, pub_date, content, thumbnail, tags, author, source, source_url, description) VALUES
('경제', 
 '삼성전자, 차세대 3nm GAA 공정 반도체 양산 돌입', 
 '삼성전자가 업계 최초로 3나노미터 GAA(Gate-All-Around) 공정 기술을 적용한 차세대 반도체 양산에 성공했다.',
 'https://example.com/news/samsung-chip-1',
 '/images/news/samsung-chip.jpg',
 '파이낸셜뉴스',
 datetime('now', '-2 hours'),
 '삼성전자가 반도체 업계에서 처음으로 3나노미터(nm) GAA 공정 기술을 적용한 차세대 반도체 양산에 돌입했다고 13일 밝혔다. GAA는 기존 FinFET 구조보다 전력 효율성과 성능이 크게 향상된 차세대 트랜지스터 구조로, AI 칩과 고성능 컴퓨팅 분야에서 큰 주목을 받고 있다. 삼성전자 관계자는 "3nm GAA 공정은 전력 소비를 45% 줄이고 성능은 23% 향상시킨다"며 "AI 시대에 맞는 최적의 반도체 솔루션"이라고 강조했다.',
 '/images/news/samsung-chip.jpg',
 '["삼성전자", "반도체", "GAA", "3nm", "기술"]',
 '김기자',
 '파이낸셜뉴스',
 'https://example.com/news/samsung-chip-1',
 '삼성전자가 업계 최초로 3나노미터 GAA(Gate-All-Around) 공정 기술을 적용한 차세대 반도체 양산에 성공했다.');

INSERT INTO news (category, title, summary, link, image_url, publisher, pub_date, content, thumbnail, tags, author, source, source_url, description) VALUES
('IT',
 '갤럭시 S25 시리즈 사전예약 100만대 돌파',
 '삼성전자의 플래그십 스마트폰 갤럭시 S25가 출시 전 예약만으로 100만대를 넘어섰다.',
 'https://example.com/news/galaxy-s25-1',
 '/images/news/galaxy-s25.jpg',
 '전자신문',
 datetime('now', '-5 hours'),
 '삼성전자의 2026년형 플래그십 스마트폰 갤럭시 S25 시리즈가 사전예약 개시 3일 만에 100만대를 돌파하며 흥행을 예고하고 있다. 특히 AI 기능을 대폭 강화한 갤럭시 AI 2.0과 Snapdragon 8 Gen 4 프로세서 탑재로 소비자들의 관심이 집중됐다. 업계 관계자는 "전작 대비 30% 증가한 예약량"이라며 "프리미엄 스마트폰 시장에서 삼성의 입지가 더욱 견고해지고 있다"고 평가했다.',
 '/images/news/galaxy-s25.jpg',
 '["삼성전자", "갤럭시", "스마트폰", "Galaxy", "AI"]',
 '박기자',
 '전자신문',
 'https://example.com/news/galaxy-s25-1',
 '삼성전자의 플래그십 스마트폰 갤럭시 S25가 출시 전 예약만으로 100만대를 넘어섰다.');

-- SK하이닉스 관련 뉴스
INSERT INTO news (category, title, summary, link, image_url, publisher, pub_date, content, thumbnail, tags, author, source, source_url, description) VALUES
('경제',
 'SK하이닉스, HBM3E 12단 양산 성공...엔비디아 공급 확대',
 'SK하이닉스가 AI 반도체용 초고속 메모리 HBM3E 12단 제품 양산에 성공하며 엔비디아와의 협력을 강화한다.',
 'https://example.com/news/hynix-hbm-1',
 '/images/news/hbm-chip.jpg',
 '한국경제',
 datetime('now', '-4 hours'),
 'SK하이닉스가 AI 가속기에 탑재되는 초고대역폭 메모리(HBM) HBM3E 12단 제품의 양산에 성공했다고 밝혔다. 이번 제품은 기존 8단 제품 대비 용량이 50% 증가한 24GB이며, 데이터 처리 속도도 30% 향상됐다. SK하이닉스는 이미 엔비디아의 차세대 AI 가속기 H200에 HBM3E를 독점 공급하고 있으며, 이번 12단 제품으로 공급 물량을 더욱 확대할 계획이다. 증권가에서는 "AI 반도체 시장 성장과 함께 SK하이닉스의 실적 개선이 가속화될 것"이라고 전망했다.',
 '/images/news/hbm-chip.jpg',
 '["SK하이닉스", "하이닉스", "HBM", "메모리", "AI반도체", "엔비디아"]',
 '최기자',
 '한국경제',
 'https://example.com/news/hynix-hbm-1',
 'SK하이닉스가 AI 반도체용 초고속 메모리 HBM3E 12단 제품 양산에 성공하며 엔비디아와의 협력을 강화한다.');

-- LG에너지솔루션 관련 뉴스
INSERT INTO news (category, title, summary, link, image_url, publisher, pub_date, content, thumbnail, tags, author, source, source_url, description) VALUES
('경제',
 'LG에너지솔루션, 북미 전기차 배터리 공장 증설 확정',
 'LG에너지솔루션이 미국 미시간주에 3조원 규모의 배터리 공장 증설을 결정했다.',
 'https://example.com/news/lges-factory-1',
 '/images/news/battery-factory.jpg',
 '매일경제',
 datetime('now', '-6 hours'),
 'LG에너지솔루션이 북미 전기차 시장 공략을 위해 미국 미시간주에 3조원을 투자해 배터리 공장을 증설한다고 발표했다. 새 공장은 2027년 가동을 목표로 하며, 연간 30GWh 규모의 배터리를 생산할 계획이다. 이는 전기차 약 40만대에 탑재할 수 있는 물량이다. GM과 포드 등 주요 자동차 제조사들과 장기 공급 계약을 체결하며 안정적인 수요를 확보했다. 업계에서는 "IRA 보조금 혜택과 함께 북미 시장 점유율을 크게 확대할 것"으로 기대하고 있다.',
 '/images/news/battery-factory.jpg',
 '["LG에너지솔루션", "LG에너지", "배터리", "전기차", "북미"]',
 '이기자',
 '매일경제',
 'https://example.com/news/lges-factory-1',
 'LG에너지솔루션이 미국 미시간주에 3조원 규모의 배터리 공장 증설을 결정했다.');

-- 네이버 관련 뉴스
INSERT INTO news (category, title, summary, link, image_url, publisher, pub_date, content, thumbnail, tags, author, source, source_url, description) VALUES
('IT',
 '네이버, 초거대 AI 하이퍼클로바X 2.0 공개',
 '네이버가 한국어 특화 초거대 AI 모델 하이퍼클로바X의 차세대 버전을 선보였다.',
 'https://example.com/news/naver-ai-1',
 '/images/news/naver-ai.jpg',
 '조선비즈',
 datetime('now', '-3 hours'),
 '네이버가 자체 개발한 초거대 AI 언어모델 하이퍼클로바X의 2.0 버전을 공개했다. 새 버전은 기존 대비 성능이 3배 향상됐으며, 특히 한국어 이해도와 추론 능력이 크게 개선됐다. 네이버는 이 기술을 검색, 쇼핑, 웹툰 등 자사 서비스 전반에 적용할 계획이다. 최수연 네이버 대표는 "하이퍼클로바X 2.0은 글로벌 AI 경쟁에서 한국이 앞서 나갈 수 있는 핵심 기술"이라며 "연내 API를 공개해 국내 기업들도 활용할 수 있도록 하겠다"고 밝혔다.',
 '/images/news/naver-ai.jpg',
 '["네이버", "NAVER", "AI", "하이퍼클로바", "검색"]',
 '정기자',
 '조선비즈',
 'https://example.com/news/naver-ai-1',
 '네이버가 한국어 특화 초거대 AI 모델 하이퍼클로바X의 차세대 버전을 선보였다.');

-- 애플 관련 뉴스
INSERT INTO news (category, title, summary, link, image_url, publisher, pub_date, content, thumbnail, tags, author, source, source_url, description) VALUES
('글로벌',
 '애플, AI 기반 Siri 대대적 업그레이드 예고',
 '애플이 OpenAI와의 협력을 통해 Siri를 ChatGPT 수준으로 개선한다고 밝혔다.',
 'https://example.com/news/apple-siri-1',
 '/images/news/apple-siri.jpg',
 'IT조선',
 datetime('now', '-3 hours'),
 '애플이 음성 비서 Siri에 생성형 AI 기술을 대폭 도입한다고 발표했다. 팀 쿡 CEO는 "2026년 하반기 출시될 iOS 20에서 완전히 새로워진 Siri를 만나게 될 것"이라며 "OpenAI, Google과의 협력을 통해 자연어 이해와 대화 능력을 획기적으로 개선했다"고 밝혔다. 새 Siri는 문맥을 이해하고 복잡한 질문에 답변할 수 있으며, 개인화된 추천 기능도 제공한다. 업계에서는 "AI 경쟁에서 뒤처졌다는 비판을 받았던 애플이 반격을 시작했다"고 평가했다.',
 '/images/news/apple-siri.jpg',
 '["애플", "Apple", "Siri", "AI", "iOS"]',
 '김기자',
 'IT조선',
 'https://example.com/news/apple-siri-1',
 '애플이 OpenAI와의 협력을 통해 Siri를 ChatGPT 수준으로 개선한다고 밝혔다.');

-- 테슬라 관련 뉴스
INSERT INTO news (category, title, summary, link, image_url, publisher, pub_date, content, thumbnail, tags, author, source, source_url, description) VALUES
('글로벌',
 '테슬라, 완전자율주행 FSD v13 베타 공개',
 '일론 머스크가 이끄는 테슬라가 차세대 자율주행 소프트웨어 FSD v13 베타 버전을 공개했다.',
 'https://example.com/news/tesla-fsd-1',
 '/images/news/tesla-fsd.jpg',
 '블로터',
 datetime('now', '-1 hour'),
 '테슬라가 완전자율주행(FSD) 소프트웨어의 최신 버전인 v13 베타를 일부 사용자들에게 배포하기 시작했다. 일론 머스크는 X(구 트위터)를 통해 "FSD v13은 인간 운전자보다 10배 안전하다"며 "2026년 상반기 정식 출시를 목표로 한다"고 밝혔다. 새 버전은 AI 기반 경로 예측 알고리즘이 대폭 개선됐으며, 복잡한 도심 환경에서도 안정적인 주행이 가능하다. 다만 규제 당국의 승인이 필요해 상용화까지는 시간이 걸릴 것으로 보인다.',
 '/images/news/tesla-fsd.jpg',
 '["테슬라", "Tesla", "일론머스크", "자율주행", "FSD", "전기차"]',
 '박기자',
 '블로터',
 'https://example.com/news/tesla-fsd-1',
 '일론 머스크가 이끄는 테슬라가 차세대 자율주행 소프트웨어 FSD v13 베타 버전을 공개했다.');

-- 엔비디아 관련 뉴스
INSERT INTO news (category, title, summary, link, image_url, publisher, pub_date, content, thumbnail, tags, author, source, source_url, description) VALUES
('글로벌',
 '엔비디아, AI 칩 B200 출하 시작...성능 5배 향상',
 '엔비디아가 차세대 AI 가속기 Blackwell B200의 대량 출하를 시작했다.',
 'https://example.com/news/nvidia-chip-1',
 '/images/news/nvidia-chip.jpg',
 'ZDNet Korea',
 datetime('now', '-2 hours'),
 '엔비디아가 차세대 AI 가속기 칩 B200(Blackwell 아키텍처)의 본격 출하에 들어갔다. 젠슨 황 CEO는 "B200은 기존 H100 대비 성능이 5배 향상됐으며, 전력 효율도 2.5배 개선됐다"고 밝혔다. 마이크로소프트, 아마존, 구글 등 주요 클라우드 기업들이 대량 주문을 완료했으며, OpenAI도 GPT-5 학습에 B200을 사용할 것으로 알려졌다. 엔비디아의 주가는 이 소식에 5% 상승하며 시가총액 3조 달러를 넘어섰다.',
 '/images/news/nvidia-chip.jpg',
 '["엔비디아", "NVIDIA", "GPU", "AI칩", "젠슨황"]',
 '최기자',
 'ZDNet Korea',
 'https://example.com/news/nvidia-chip-1',
 '엔비디아가 차세대 AI 가속기 Blackwell B200의 대량 출하를 시작했다.');

-- 마이크로소프트 관련 뉴스
INSERT INTO news (category, title, summary, link, image_url, publisher, pub_date, content, thumbnail, tags, author, source, source_url, description) VALUES
('글로벌',
 '마이크로소프트, Azure AI 서비스 대폭 확장',
 '마이크로소프트가 클라우드 플랫폼 Azure의 AI 서비스를 대폭 확장한다고 발표했다.',
 'https://example.com/news/msft-azure-1',
 '/images/news/azure-ai.jpg',
 '디지털타임스',
 datetime('now', '-4 hours'),
 '마이크로소프트가 Azure 클라우드 플랫폼에서 제공하는 AI 서비스를 대폭 확장한다. 새로 추가되는 서비스에는 GPT-4 Turbo API, DALL-E 3 이미지 생성, Whisper 음성 인식 등이 포함된다. 사티아 나델라 CEO는 "모든 기업이 AI를 활용할 수 있도록 인프라를 제공하는 것이 우리의 목표"라며 "연내 전 세계 60개 리전에 AI 데이터센터를 구축할 계획"이라고 밝혔다. Azure는 OpenAI와의 독점 파트너십을 기반으로 AI 시장에서 빠르게 성장하고 있다.',
 '/images/news/azure-ai.jpg',
 '["마이크로소프트", "Microsoft", "Azure", "AI", "클라우드"]',
 '이기자',
 '디지털타임스',
 'https://example.com/news/msft-azure-1',
 '마이크로소프트가 클라우드 플랫폼 Azure의 AI 서비스를 대폭 확장한다고 발표했다.');

-- 일반 경제 뉴스
INSERT INTO news (category, title, summary, link, image_url, publisher, pub_date, content, thumbnail, tags, author, source, source_url, description) VALUES
('경제',
 '코스피, 외국인 순매수에 2650선 회복',
 '국내 증시가 외국인 투자자들의 대규모 매수세에 힘입어 상승 마감했다.',
 'https://example.com/news/kospi-1',
 '/images/news/kospi.jpg',
 '서울경제',
 datetime('now', '-1 hour'),
 '13일 코스피 지수는 전 거래일 대비 34.27포인트(1.31%) 오른 2,651.38에 거래를 마쳤다. 외국인이 8,500억원어치를 순매수하며 지수 상승을 이끌었다. 개인도 2,300억원을 사들였다. 업종별로는 반도체(+2.8%), 전기전자(+2.1%), 자동차(+1.6%) 등이 강세를 보였다. 증권가에서는 "미국 연준의 금리 동결 시사와 중국 경기 부양책 기대감이 맞물린 결과"라고 분석했다.',
 '/images/news/kospi.jpg',
 '["코스피", "증시", "외국인", "매수"]',
 '강기자',
 '서울경제',
 'https://example.com/news/kospi-1',
 '국내 증시가 외국인 투자자들의 대규모 매수세에 힘입어 상승 마감했다.');
('news-samsung-1', 
 '삼성전자, 차세대 3nm GAA 공정 반도체 양산 돌입', 
 '삼성전자가 업계 최초로 3나노미터 GAA(Gate-All-Around) 공정 기술을 적용한 차세대 반도체 양산에 성공했다.',
 '삼성전자가 반도체 업계에서 처음으로 3나노미터(nm) GAA 공정 기술을 적용한 차세대 반도체 양산에 돌입했다고 13일 밝혔다. GAA는 기존 FinFET 구조보다 전력 효율성과 성능이 크게 향상된 차세대 트랜지스터 구조로, AI 칩과 고성능 컴퓨팅 분야에서 큰 주목을 받고 있다. 삼성전자 관계자는 "3nm GAA 공정은 전력 소비를 45% 줄이고 성능은 23% 향상시킨다"며 "AI 시대에 맞는 최적의 반도체 솔루션"이라고 강조했다.',
 '/images/news/samsung-chip.jpg',
 '경제',
 '["삼성전자", "반도체", "GAA", "3nm", "기술"]',
 '김기자',
 '파이낸셜뉴스',
 datetime('now', '-2 hours'));

INSERT INTO news (id, title, description, content, thumbnail, category, tags, author, source, published_at) VALUES
('news-samsung-2',
 '갤럭시 S25 시리즈 사전예약 100만대 돌파',
 '삼성전자의 플래그십 스마트폰 갤럭시 S25가 출시 전 예약만으로 100만대를 넘어섰다.',
 '삼성전자의 2026년형 플래그십 스마트폰 갤럭시 S25 시리즈가 사전예약 개시 3일 만에 100만대를 돌파하며 흥행을 예고하고 있다. 특히 AI 기능을 대폭 강화한 갤럭시 AI 2.0과 Snapdragon 8 Gen 4 프로세서 탑재로 소비자들의 관심이 집중됐다. 업계 관계자는 "전작 대비 30% 증가한 예약량"이라며 "프리미엄 스마트폰 시장에서 삼성의 입지가 더욱 견고해지고 있다"고 평가했다.',
 '/images/news/galaxy-s25.jpg',
 'IT',
 '["삼성전자", "갤럭시", "스마트폰", "Galaxy", "AI"]',
 '박기자',
 '전자신문',
 datetime('now', '-5 hours'));

-- SK하이닉스 관련 뉴스
INSERT INTO news (id, title, description, content, thumbnail, category, tags, author, source, published_at) VALUES
('news-hynix-1',
 'SK하이닉스, HBM3E 12단 양산 성공...엔비디아 공급 확대',
 'SK하이닉스가 AI 반도체용 초고속 메모리 HBM3E 12단 제품 양산에 성공하며 엔비디아와의 협력을 강화한다.',
 'SK하이닉스가 AI 가속기에 탑재되는 초고대역폭 메모리(HBM) HBM3E 12단 제품의 양산에 성공했다고 밝혔다. 이번 제품은 기존 8단 제품 대비 용량이 50% 증가한 24GB이며, 데이터 처리 속도도 30% 향상됐다. SK하이닉스는 이미 엔비디아의 차세대 AI 가속기 H200에 HBM3E를 독점 공급하고 있으며, 이번 12단 제품으로 공급 물량을 더욱 확대할 계획이다. 증권가에서는 "AI 반도체 시장 성장과 함께 SK하이닉스의 실적 개선이 가속화될 것"이라고 전망했다.',
 '/images/news/hbm-chip.jpg',
 '경제',
 '["SK하이닉스", "하이닉스", "HBM", "메모리", "AI반도체", "엔비디아"]',
 '최기자',
 '한국경제',
 datetime('now', '-4 hours'));

-- LG에너지솔루션 관련 뉴스
INSERT INTO news (id, title, description, content, thumbnail, category, tags, author, source, published_at) VALUES
('news-lges-1',
 'LG에너지솔루션, 북미 전기차 배터리 공장 증설 확정',
 'LG에너지솔루션이 미국 미시간주에 3조원 규모의 배터리 공장 증설을 결정했다.',
 'LG에너지솔루션이 북미 전기차 시장 공략을 위해 미국 미시간주에 3조원을 투자해 배터리 공장을 증설한다고 발표했다. 새 공장은 2027년 가동을 목표로 하며, 연간 30GWh 규모의 배터리를 생산할 계획이다. 이는 전기차 약 40만대에 탑재할 수 있는 물량이다. GM과 포드 등 주요 자동차 제조사들과 장기 공급 계약을 체결하며 안정적인 수요를 확보했다. 업계에서는 "IRA 보조금 혜택과 함께 북미 시장 점유율을 크게 확대할 것"으로 기대하고 있다.',
 '/images/news/battery-factory.jpg',
 '경제',
 '["LG에너지솔루션", "LG에너지", "배터리", "전기차", "북미"]',
 '이기자',
 '매일경제',
 datetime('now', '-6 hours'));

-- 네이버 관련 뉴스
INSERT INTO news (id, title, description, content, thumbnail, category, tags, author, source, published_at) VALUES
('news-naver-1',
 '네이버, 초거대 AI 하이퍼클로바X 2.0 공개',
 '네이버가 한국어 특화 초거대 AI 모델 하이퍼클로바X의 차세대 버전을 선보였다.',
 '네이버가 자체 개발한 초거대 AI 언어모델 하이퍼클로바X의 2.0 버전을 공개했다. 새 버전은 기존 대비 성능이 3배 향상됐으며, 특히 한국어 이해도와 추론 능력이 크게 개선됐다. 네이버는 이 기술을 검색, 쇼핑, 웹툰 등 자사 서비스 전반에 적용할 계획이다. 최수연 네이버 대표는 "하이퍼클로바X 2.0은 글로벌 AI 경쟁에서 한국이 앞서 나갈 수 있는 핵심 기술"이라며 "연내 API를 공개해 국내 기업들도 활용할 수 있도록 하겠다"고 밝혔다.',
 '/images/news/naver-ai.jpg',
 'IT',
 '["네이버", "NAVER", "AI", "하이퍼클로바", "검색"]',
 '정기자',
 '조선비즈',
 datetime('now', '-3 hours'));

-- 애플 관련 뉴스
INSERT INTO news (id, title, description, content, thumbnail, category, tags, author, source, published_at) VALUES
('news-apple-1',
 '애플, AI 기반 Siri 대대적 업그레이드 예고',
 '애플이 OpenAI와의 협력을 통해 Siri를 ChatGPT 수준으로 개선한다고 밝혔다.',
 '애플이 음성 비서 Siri에 생성형 AI 기술을 대폭 도입한다고 발표했다. 팀 쿡 CEO는 "2026년 하반기 출시될 iOS 20에서 완전히 새로워진 Siri를 만나게 될 것"이라며 "OpenAI, Google과의 협력을 통해 자연어 이해와 대화 능력을 획기적으로 개선했다"고 밝혔다. 새 Siri는 문맥을 이해하고 복잡한 질문에 답변할 수 있으며, 개인화된 추천 기능도 제공한다. 업계에서는 "AI 경쟁에서 뒤처졌다는 비판을 받았던 애플이 반격을 시작했다"고 평가했다.',
 '/images/news/apple-siri.jpg',
 '글로벌',
 '["애플", "Apple", "Siri", "AI", "iOS"]',
 '김기자',
 'IT조선',
 datetime('now', '-3 hours'));

-- 테슬라 관련 뉴스
INSERT INTO news (id, title, description, content, thumbnail, category, tags, author, source, published_at) VALUES
('news-tesla-1',
 '테슬라, 완전자율주행 FSD v13 베타 공개',
 '일론 머스크가 이끄는 테슬라가 차세대 자율주행 소프트웨어 FSD v13 베타 버전을 공개했다.',
 '테슬라가 완전자율주행(FSD) 소프트웨어의 최신 버전인 v13 베타를 일부 사용자들에게 배포하기 시작했다. 일론 머스크는 X(구 트위터)를 통해 "FSD v13은 인간 운전자보다 10배 안전하다"며 "2026년 상반기 정식 출시를 목표로 한다"고 밝혔다. 새 버전은 AI 기반 경로 예측 알고리즘이 대폭 개선됐으며, 복잡한 도심 환경에서도 안정적인 주행이 가능하다. 다만 규제 당국의 승인이 필요해 상용화까지는 시간이 걸릴 것으로 보인다.',
 '/images/news/tesla-fsd.jpg',
 '글로벌',
 '["테슬라", "Tesla", "일론머스크", "자율주행", "FSD", "전기차"]',
 '박기자',
 '블로터',
 datetime('now', '-1 hour'));

-- 엔비디아 관련 뉴스
INSERT INTO news (id, title, description, content, thumbnail, category, tags, author, source, published_at) VALUES
('news-nvidia-1',
 '엔비디아, AI 칩 B200 출하 시작...성능 5배 향상',
 '엔비디아가 차세대 AI 가속기 Blackwell B200의 대량 출하를 시작했다.',
 '엔비디아가 차세대 AI 가속기 칩 B200(Blackwell 아키텍처)의 본격 출하에 들어갔다. 젠슨 황 CEO는 "B200은 기존 H100 대비 성능이 5배 향상됐으며, 전력 효율도 2.5배 개선됐다"고 밝혔다. 마이크로소프트, 아마존, 구글 등 주요 클라우드 기업들이 대량 주문을 완료했으며, OpenAI도 GPT-5 학습에 B200을 사용할 것으로 알려졌다. 엔비디아의 주가는 이 소식에 5% 상승하며 시가총액 3조 달러를 넘어섰다.',
 '/images/news/nvidia-chip.jpg',
 '글로벌',
 '["엔비디아", "NVIDIA", "GPU", "AI칩", "젠슨황"]',
 '최기자',
 'ZDNet Korea',
 datetime('now', '-2 hours'));

-- 마이크로소프트 관련 뉴스
INSERT INTO news (id, title, description, content, thumbnail, category, tags, author, source, published_at) VALUES
('news-msft-1',
 '마이크로소프트, Azure AI 서비스 대폭 확장',
 '마이크로소프트가 클라우드 플랫폼 Azure의 AI 서비스를 대폭 확장한다고 발표했다.',
 '마이크로소프트가 Azure 클라우드 플랫폼에서 제공하는 AI 서비스를 대폭 확장한다. 새로 추가되는 서비스에는 GPT-4 Turbo API, DALL-E 3 이미지 생성, Whisper 음성 인식 등이 포함된다. 사티아 나델라 CEO는 "모든 기업이 AI를 활용할 수 있도록 인프라를 제공하는 것이 우리의 목표"라며 "연내 전 세계 60개 리전에 AI 데이터센터를 구축할 계획"이라고 밝혔다. Azure는 OpenAI와의 독점 파트너십을 기반으로 AI 시장에서 빠르게 성장하고 있다.',
 '/images/news/azure-ai.jpg',
 '글로벌',
 '["마이크로소프트", "Microsoft", "Azure", "AI", "클라우드"]',
 '이기자',
 '디지털타임스',
 datetime('now', '-4 hours'));

-- 일반 경제 뉴스
INSERT INTO news (id, title, description, content, thumbnail, category, tags, author, source, published_at) VALUES
('news-economy-1',
 '코스피, 외국인 순매수에 2650선 회복',
 '국내 증시가 외국인 투자자들의 대규모 매수세에 힘입어 상승 마감했다.',
 '13일 코스피 지수는 전 거래일 대비 34.27포인트(1.31%) 오른 2,651.38에 거래를 마쳤다. 외국인이 8,500억원어치를 순매수하며 지수 상승을 이끌었다. 개인도 2,300억원을 사들였다. 업종별로는 반도체(+2.8%), 전기전자(+2.1%), 자동차(+1.6%) 등이 강세를 보였다. 증권가에서는 "미국 연준의 금리 동결 시사와 중국 경기 부양책 기대감이 맞물린 결과"라고 분석했다.',
 '/images/news/kospi.jpg',
 '경제',
 '["코스피", "증시", "외국인", "매수"]',
 '강기자',
 '서울경제',
 datetime('now', '-1 hour'));
