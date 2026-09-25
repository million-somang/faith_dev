# ✈️ VERA 포털 여행(Travel) 콘텐츠 API 발행 공식 연동 가이드

본 문서는 **VERA 포털(https://veranex.app)**의 **재미 - 여행 큐레이션 서비스(`/entertainment/travel`)**에 외부 시스템(Python 스크립트, n8n, AI 여행 에이전트, 백오피스 등)에서 여행 콘텐츠를 실시간으로 발행하기 위한 REST API 명세서 및 연동 규칙입니다.

---

## 🔑 1. 기본 연동 정보

* **기본 엔드포인트(Base URL):** `https://veranex.app`
* **인증 방식:** HTTP Header에 API Key 전달
* **인증 헤더:**
  ```http
  x-api-key: vera-news-api-key-2026
  ```
  *(또는 `x-api-key: vera-travel-api-key-2026`, `Authorization: Bearer <KEY>` 지원)*

---

## 📌 2. 권역(Region) 및 테마(Category) 표준 규격

API 요청 시 `region` 및 `category` 필드에는 아래의 영문 코드 또는 한글 명칭 중 하나를 전달하시면 시스템이 자동으로 표준 코드로 정규화 매핑합니다.

### 1) 권역 코드 (`region`)
| 표준 코드 | 권장 표기 | 지원되는 한글/영문 키워드 (자동 매핑) |
| :--- | :--- | :--- |
| `domestic` | **국내 여행** | `국내`, `국내여행`, `한국`, `korea`, `domestic`, `제주`, `강원`, `서울`, `부산` |
| `asia` | **일본·아시아** | `아시아`, `동남아`, `일본`, `japan`, `대만`, `태국`, `베트남`, `홍콩`, `싱가포르`, `발리`, `asia` |
| `europe` | **유럽 낭만** | `유럽`, `europe`, `서유럽`, `동유럽`, `프랑스`, `이탈리아`, `스페인`, `스위스`, `영국` |
| `americas` | **미주·대양주**| `미주`, `미국`, `하와이`, `괌`, `사이판`, `캐나다`, `americas`, `usa` |
| `etc` | **기타 해외** | `기타`, `대양주`, `호주`, `뉴질랜드`, `아프리카`, `etc`, `oceania` |

### 2) 테마 카테고리 코드 (`category`)
| 표준 코드 | 권장 표기 | 지원되는 한글/영문 키워드 (자동 매핑) |
| :--- | :--- | :--- |
| `healing` | **힐링·휴양** | `힐링`, `휴양`, `호캉스`, `온천`, `쉼`, `healing`, `relax` |
| `food` | **미식·맛집** | `맛집`, `미식`, `먹방`, `카페`, `푸드`, `food`, `gourmet` |
| `culture` | **문화·역사** | `문화`, `역사`, `유적지`, `미술관`, `전통`, `culture`, `history` |
| `nature` | **자연·액티비티** | `자연`, `풍경`, `바다`, `산`, `트레킹`, `액티비티`, `nature`, `activity` |
| `city` | **도시·쇼핑** | `도시`, `쇼핑`, `야경`, `시티투어`, `핫플`, `city` |
| `camping` | **캠핑·차박** | `캠핑`, `차박`, `글램핑`, `백패킹`, `camping` |

---

## 📸 3. [API 1] 대표 및 갤러리 이미지 업로드

로컬에 있는 이미지 파일(JPG, PNG, WebP 등)을 서버에 업로드하여 이미지 URL을 발급받습니다.  
*(이미 웹에 올라가 있는 이미지 URL이 있다면 이 단계를 생략하고 바로 등록 API의 `imageUrl` 또는 `gallery`에 넣으시면 됩니다.)*

### 요청 규격 (Request)
* **Method:** `POST`
* **URL:** `https://veranex.app/api/travel/upload-image`
* **Content-Type:** `multipart/form-data`
* **Headers:** `x-api-key: vera-news-api-key-2026`
* **Form-Data:**
  * `file`: 이미지 파일 바이너리 (최대 10MB / `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`)

### 응답 예시 (Response 201 Created)
```json
{
  "success": true,
  "message": "여행 이미지가 성공적으로 업로드되었습니다.",
  "imageUrl": "/uploads/travel/travel_1727250000000_a1b2c3.jpg",
  "fullUrl": "https://veranex.app/uploads/travel/travel_1727250000000_a1b2c3.jpg",
  "fileName": "travel_1727250000000_a1b2c3.jpg",
  "fileSize": 245100
}
```

---

## 📝 4. [API 2] 여행 콘텐츠 등록

여행기, 코스 안내, AI 핵심 3대 추천 포인트, 꿀팁 정보를 포털에 정식 등록합니다.

### 요청 규격 (Request)
* **Method:** `POST`
* **URL:** `https://veranex.app/api/travel` (또는 `https://veranex.app/api/travel/create`)
* **Content-Type:** `application/json`
* **Headers:** `x-api-key: vera-news-api-key-2026`

### 요청 JSON 파라미터 상세
| 필드명 | 타입 | 필수 | 기본값 | 설명 및 가이드 |
| :--- | :--- | :---: | :---: | :--- |
| **`title`** | `string` | **필수** | - | 여행기 제목 (예: "에메랄드빛 바다와 오름의 쉼, 제주 서귀포 힐링 2박 3일") |
| **`destination`** | `string` | **필수** | - | 목적지 명칭 (예: "제주도 서귀포", "일본 교토", "스위스 인터라켄") |
| **`region`** | `string` | **필수** | `domestic` | 권역 코드 (`domestic`, `asia`, `europe`, `americas`, `etc` 또는 한글) |
| **`category`** | `string` | **필수** | `healing` | 테마 코드 (`healing`, `food`, `culture`, `nature`, `city`, `camping`) |
| **`content`** | `string` | **필수** | - | 상세 여행 스토리 및 코스 안내 본문 (단락별 줄바꿈 지원) |
| **`ai_summary`** | `string` / `array` | 권장 | 자동생성 | **AI 핵심 추천 포인트 3가지** (배열 `["포인트1", "포인트2", "포인트3"]` 또는 줄바꿈 텍스트) |
| **`travel_tips`** | `string` | 선택 | `null` | **여행 꿀팁 & 실전 방문 팁** (주차 정보, 추천 방문 시간대, 준비물) |
| **`imageUrl`** | `string` | 권장 | `null` | 대표 썸네일 이미지 URL (상단 배너 및 목록 카드에 사용) |
| **`gallery`** | `array` | 선택 | `null` | 추가 현장 사진 URL 목록 (`["https://...", "https://..."]`) |
| **`best_season`** | `string` | 선택 | `null` | 추천 방문 계절/시기 (예: "4월~5월 봄꽃 시즌", "가을 단풍철") |
| **`duration`** | `string` | 선택 | `null` | 추천 여행 일정 (예: "2박 3일", "당일치기", "1주일") |
| **`estimated_cost`**| `string` | 선택 | `null` | 예상 경비 가이드 (예: "1인 30~40만원선") |
| **`location_address`**| `string` | 선택 | `null` | 주요 명소 도로명 주소 또는 위치 키워드 |
| **`tags`** | `string` / `array` | 선택 | `null` | 검색 태그 (예: `"제주도,힐링,바다,카페투어"` 또는 배열) |
| **`author`** | `string` | 선택 | `RoofAI 큐레이터` | 작성자/에디터 명칭 |
| **`source`** | `string` | 선택 | `null` | 참고/출처 기관 (예: "한국관광공사 대한민국 구석구석") |
| **`source_url`** | `string` | 선택 | `null` | 원문 링크 URL |
| **`is_featured`** | `boolean` / `number`| 선택 | `0` | 상단 스포트라이트 추천 여행지 지정 (`true` 또는 `1`) |

---

### 요청 예시 (JSON Payload)
```json
{
  "title": "푸른 바다와 솔숲이 빚어낸 쉼, 강릉 안목해변 커피거리 & 송정해변 산책",
  "destination": "강원도 강릉",
  "region": "domestic",
  "category": "healing",
  "ai_summary": [
    "안목해변 오션뷰 카페거리에서 즐기는 스페셜티 핸드드립 커피의 여유",
    "울창한 해송 숲을 따라 거니는 송정해변 무장애 솔바람 산책길",
    "KTX 강릉역에서 버스로 20분 내 도착 가능한 뛰어난 대중교통 접근성"
  ],
  "content": "강원도 강릉의 안목해변은 커피 향과 파도 소리가 어우러지는 사계절 대표 힐링 명소입니다.\n\n해안선을 따라 늘어선 루프탑 카페에서 동해의 시원한 수평선을 바라보며 여유로운 티타임을 즐겨보세요. 커피거리를 지나 북쪽으로 이어지는 송정해변 솔숲길은 수백 년 된 해송들이 뿜어내는 피톤치드로 가득합니다.\n\n바쁜 일상을 잠시 내려놓고 파도 소리를 배경 삼아 걷다 보면 복잡했던 생각들이 파도처럼 말끔히 씻겨 내려갑니다.",
  "travel_tips": "💡 [주차 팁] 안목해변 공영주차장은 오전 10시 이후 만차가 빠르니 송정해변 방면 무료 주차장을 이용하시면 여유롭습니다.\n💡 [포토존] 해 질 무렵 강릉항 방파제 빨간 등대 앞이 노을 인생샷 명당입니다.",
  "imageUrl": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
  "gallery": [
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80"
  ],
  "duration": "1박 2일",
  "best_season": "5월~6월, 9월~10월",
  "estimated_cost": "1인 약 15~20만원",
  "location_address": "강원특별자치도 강릉시 창해로 14번길 20-1",
  "tags": ["강릉", "안목해변", "커피거리", "힐링여행", "동해바다"],
  "author": "RoofAI 감성 여행 큐레이터",
  "is_featured": true
}
```

### 응답 예시 (Response 201 Created)
```json
{
  "success": true,
  "message": "여행 콘텐츠가 성공적으로 등록되었습니다.",
  "article": {
    "id": 1,
    "title": "푸른 바다와 솔숲이 빚어낸 쉼, 강릉 안목해변 커피거리 & 송정해변 산책",
    "destination": "강원도 강릉",
    "region": "domestic",
    "category": "healing",
    "published_at": "2026-09-25T16:50:00.000Z"
  },
  "url": "https://veranex.app/entertainment/travel/1"
}
```

---

## 💻 5. 프로그래밍 언어별 연동 예제

### Python 예제
```python
import requests
import json

API_URL = "https://veranex.app/api/travel"
API_KEY = "vera-news-api-key-2026"

payload = {
    "title": "천년 고도의 밤을 걷다, 경주 동궁과 월지 & 첨성대 야경 투어",
    "destination": "경북 경주",
    "region": "domestic",
    "category": "culture",
    "ai_summary": [
        "연못에 그림처럼 반영되는 신라 왕궁의 화려한 황금빛 야경",
        "은은한 조명 아래 밤 산책하기 좋은 첨성대 일대 역사 유적지구",
        "황리단길 트렌디한 한옥 카페 및 로컬 맛집과의 뛰어난 연계 동선"
    ],
    "content": "신라 천년의 역사가 살아 숨 쉬는 경주는 밤이 되면 낮과는 완전히 다른 신비로운 매력을 발산합니다...\n\n동궁과 월지의 연못 위로 비치는 전각의 금빛 반영은 감탄을 자아냅니다.",
    "travel_tips": "💡 [야경 팁] 일몰 30분 전 입장하셔야 노을과 조명이 어우러지는 매직아워를 감상하실 수 있습니다.",
    "duration": "1박 2일",
    "best_season": "4월 봄꽃, 10월 가을 단풍철",
    "imageUrl": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80",
    "tags": ["경주", "동궁과월지", "야경명소", "문화역사", "국내여행"]
}

headers = {
    "Content-Type": "application/json",
    "x-api-key": API_KEY
}

response = requests.post(API_URL, json=payload, headers=headers)
print("응답 코드:", response.status_code)
print("결과:", response.json())
```

### cURL 예제
```bash
curl -X POST "https://veranex.app/api/travel" \
  -H "Content-Type: application/json" \
  -H "x-api-key: vera-news-api-key-2026" \
  -d '{
    "title": "청정 알프스의 숨결, 스위스 인터라켄 융프라우요흐 기차 여행",
    "destination": "스위스 인터라켄",
    "region": "europe",
    "category": "nature",
    "ai_summary": [
        "유럽 최고도 철도역 융프라우요흐(Top of Europe) 설원 전망대",
        "그린델발트 아이거 익스프레스 케이블카를 활용한 쾌적한 환승",
        "튠 호수와 브리엔츠 호수의 눈부신 에메랄드빛 유람선 코스"
    ],
    "content": "만년설이 빛나는 알프스의 심장 스위스 인터라켄은 전 세계 여행자들의 버킷리스트입니다...",
    "duration": "3박 4일",
    "best_season": "6월~9월 여름 트레킹, 12월~3월 스키 시즌",
    "imageUrl": "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=80"
  }'
```

---

## 🔍 6. 조회 API 명세

### 1) 여행 목록 조회 (`GET /api/travel`)
* **URL:** `https://veranex.app/api/travel`
* **Query Parameters:**
  * `region`: 권역 필터 (`all`, `domestic`, `asia`, `europe`, `americas`, `etc`)
  * `category`: 테마 필터 (`all`, `healing`, `food`, `culture`, `nature`, `city`, `camping`)
  * `keyword`: 검색어
  * `sort`: 정렬 기준 (`latest`: 최신순, `popular`: 조회수/인기순)
  * `limit`: 페이지당 개수 (기본값: 20)
  * `offset`: 건너뛸 개수 (기본값: 0)

### 2) 여행 상세 조회 (`GET /api/travel/:id`)
* **URL:** `https://veranex.app/api/travel/{id}`
* **설명:** 단일 여행기 상세 데이터 및 동일 권역 관련 추천 여행지 3선을 반환하며, 호출 시 조회수(`view_count`)가 1 증가합니다.

### 3) 추천해요 증가 (`POST /api/travel/:id/like`)
* **URL:** `https://veranex.app/api/travel/{id}/like`
* **설명:** 해당 여행기의 추천수(`like_count`)를 1 증가시킵니다.
