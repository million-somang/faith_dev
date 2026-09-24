# 📰 VERA 포털 뉴스 API 발행 공식 연동 가이드

본 문서는 **VERA 포털(https://veranex.app)**에 외부 시스템(Python 스크립트, n8n, AI 에이전트, 백오피스 등)에서 뉴스를 실시간으로 발행하기 위한 REST API 명세서 및 연동 규칙입니다.

---

## 🔑 기본 연동 정보

* **기본 엔드포인트(Base URL):** `https://veranex.app`
* **인증 방식:** HTTP Header에 API Key 전달
* **인증 헤더:**
  ```http
  x-api-key: vera-news-api-key-2026
  ```
  *(또는 `Authorization: Bearer vera-news-api-key-2026` 지원)*

---

## 📌 지원 카테고리 규격

API 요청 시 `category` 필드에는 아래의 영문 코드 또는 한글 명칭 중 하나를 전달하시면 시스템이 자동으로 표준 규격으로 매핑합니다.

| 표준 코드 (`category`) | 한글 권장 표기 | 허용되는 입력 키워드 (자동 매핑) |
| :--- | :--- | :--- |
| `economy` | 경제 | `경제`, `economy`, `증시`, `금융`, `stock`, `finance`, `비즈니스` |
| `tech` | IT/과학 | `it`, `과학`, `기술`, `tech`, `science`, `it/과학` |
| `society` | 사회 | `사회`, `society` |
| `politics` | 정치 | `정치`, `politics` |
| `world` | 세계 | `세계`, `국제`, `world`, `global` |
| `lifestyle` | 생활/문화 | `생활`, `문화`, `lifestyle`, `culture`, `생활/문화` |
| `entertainment` | 연예 | `연예`, `엔터`, `entertainment`, `fun`, `연예/스타` |
| `sports` | 스포츠 | `스포츠`, `sports` |

---

## 1️⃣ [API 1] 대표 이미지 파일 직접 업로드 (선택)

로컬에 있는 이미지 파일(JPG, PNG, WebP 등)을 서버에 업로드하여 이미지 URL을 발급받습니다.  
*(이미 웹에 올라가 있는 이미지 URL이 있다면 이 단계를 건너뛰고 바로 뉴스 등록 API의 `imageUrl` 필드에 넣으시면 됩니다.)*

### 요청 규격 (Request)
* **Method:** `POST`
* **URL:** `https://veranex.app/api/news/upload-image`
* **Content-Type:** `multipart/form-data`
* **Headers:** `x-api-key: vera-news-api-key-2026`
* **Form-Data:**
  * `file`: 이미지 파일 바이너리 (최대 10MB / `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`)

### 응답 예시 (Response 201 Created)
```json
{
  "success": true,
  "message": "이미지가 성공적으로 업로드되었습니다.",
  "imageUrl": "/uploads/news/news_1727170123456_a1b2c3.jpg",
  "fullUrl": "https://veranex.app/uploads/news/news_1727170123456_a1b2c3.jpg",
  "fileName": "news_1727170123456_a1b2c3.jpg",
  "fileSize": 128450
}
```
> 반환된 `fullUrl` 또는 `imageUrl`을 아래 뉴스 등록 API의 `imageUrl` 필드에 전달하시면 됩니다.

---

## 2️⃣ [API 2] 뉴스 기사 등록

새로운 뉴스 기사를 등록합니다. 등록 즉시 VERA 포털 메인 홈 화면 최상단과 실시간 뉴스 목록에 라이브로 노출됩니다.

### 요청 규격 (Request)
* **Method:** `POST`
* **URL:** `https://veranex.app/api/news` *(또는 `/api/news/create`)*
* **Content-Type:** `application/json`
* **Headers:** `x-api-key: vera-news-api-key-2026`

### 요청 필드 상세 (Payload Schema)
| 필드명 | 타입 | 필수 여부 | 기본값 | 설명 및 제약 조건 |
| :--- | :---: | :---: | :---: | :--- |
| `title` | `string` | **필수** | - | 기사 제목 (3자 ~ 200자) |
| `content` | `string` | **필수** | - | 기사 본문 전체 (텍스트, 마크다운, HTML 지원, 최소 10자) |
| `category` | `string` | 선택 | `economy` | 카테고리 (`economy`, `tech`, `society` 등, 표 참조) |
| `aiSummary` | `array`\|`string` | 선택 | *(자동 추출)* | **[권장] 핵심 3줄 요약.** 배열(`["요약1", "요약2", "요약3"]`) 또는 줄바꿈 문자열 |
| `imageUrl` | `string` | 선택 | `""` | 대표 썸네일 이미지 URL (웹 URL 또는 upload-image 반환 URL) |
| `source` | `string` | 선택 | `VERA 뉴스데스크` | 기사 발행 주체 / 언론사명 |
| `sourceUrl` | `string` | 선택 | *(자체 링크)* | 원문 출처 URL (미입력 시 VERA 고유 링크 자동 생성) |
| `tags` | `array`\|`string` | 선택 | `""` | 태그/키워드 (예: `["인공지능", "반도체"]` 또는 `"인공지능,반도체"`) |
| `summary` | `string` | 선택 | *(본문 앞 160자)* | 목록 카드용 1줄 짧은 요약 (미입력 시 자동 추출) |

### JSON 요청 예시 (Example Request Body)
```json
{
  "title": "글로벌 AI 혁신 컨퍼런스 2026 개막, 차세대 생성형 모델 대거 공개",
  "category": "tech",
  "content": "24일 서울 삼성동 코엑스에서 개막한 글로벌 AI 혁신 컨퍼런스 2026에서 차세대 온디바이스 AI와 자율 에이전트 기술이 전 세계 투자자들의 뜨거운 관심을 모았습니다.\n\n주요 글로벌 테크 기업들은 기존 거대언어모델(LLM) 대비 전력 소모를 70% 줄인 고효율 경량화 모델을 잇달아 선보였습니다. 특히 모바일 및 엣지 기기에서 네트워크 연결 없이도 고성능 추론이 가능한 신기술이 실시간으로 시연되었습니다.\n\n이번 행사에 참여한 업계 전문가들은 2026년 하반기를 기점으로 기업용 소프트웨어의 80% 이상에 지능형 자율 에이전트가 통합될 것으로 내다봤습니다.",
  "aiSummary": [
    "코엑스에서 글로벌 AI 혁신 컨퍼런스 2026 성황리 개막",
    "전력 소모 70% 감축한 고효율 온디바이스 경량화 AI 시연",
    "2026년 하반기 기업용 소프트웨어 80%에 자율 에이전트 탑재 전망"
  ],
  "imageUrl": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
  "source": "VERA 테크 리포트",
  "sourceUrl": "https://veranex.app/news/official-tech-2026",
  "tags": ["AI", "테크", "온디바이스", "생성형AI"]
}
```

### 응답 예시 (Response 201 Created)
```json
{
  "success": true,
  "message": "뉴스가 성공적으로 등록되었습니다.",
  "article": {
    "id": 1420,
    "title": "글로벌 AI 혁신 컨퍼런스 2026 개막, 차세대 생성형 모델 대거 공개",
    "category": "tech",
    "aiSummary": "• 코엑스에서 글로벌 AI 혁신 컨퍼런스 2026 성황리 개막\n• 전력 소모 70% 감축한 고효율 온디바이스 경량화 AI 시연\n• 2026년 하반기 기업용 소프트웨어 80%에 자율 에이전트 탑재 전망",
    "thumbnail": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
    "articleUrl": "https://veranex.app/news/1420",
    "createdAt": "2026-09-24T11:30:00.000Z"
  }
}
```

---

## 💻 언어별 연동 예제 코드

### 1. cURL (터미널에서 즉시 테스트)

```bash
curl -X POST "https://veranex.app/api/news" \
  -H "Content-Type: application/json" \
  -H "x-api-key: vera-news-api-key-2026" \
  -d '{
    "title": "테스트 뉴스 기사 제목입니다",
    "category": "economy",
    "content": "기사 본문 내용입니다. 최소 열 글자 이상 작성되어야 정상적으로 등록됩니다.",
    "aiSummary": "• 테스트 1번 요약\n• 테스트 2번 요약\n• 테스트 3번 요약",
    "imageUrl": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800",
    "source": "경제 분석 데스크",
    "tags": ["경제", "속보"]
  }'
```

---

### 2. Python (requests 라이브러리)

#### Case A: 이미지 웹 URL로 뉴스 등록하기
```python
import requests

API_URL = "https://veranex.app/api/news"
API_KEY = "vera-news-api-key-2026"

payload = {
    "title": "미국 연준, 기준금리 0.25%p 인하 시사... 글로벌 증시 반등세",
    "category": "economy",
    "content": "미국 연방준비제도(Fed)가 최근 물가 안정 지표를 근거로 다음 연방공개시장위원회(FOMC)에서 기준금리를 0.25%p 인하할 가능성을 시사했습니다. 이에 뉴욕 증시와 아시아 주요 증시가 일제히 상승세로 돌아섰습니다.",
    "aiSummary": [
        "연준, 물가 안정세에 따라 0.25%p 금리 인하 가능성 시사",
        "뉴욕 증시 3대 지수 및 코스피 동반 반등세",
        "달러 인덱스 소폭 하락하며 원화 환율 안정 기대"
    ],
    "imageUrl": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800",
    "source": "글로벌 매크로 데스크",
    "tags": ["연준", "금리인하", "주식", "환율"]
}

headers = {
    "Content-Type": "application/json",
    "x-api-key": API_KEY
}

response = requests.post(API_URL, json=payload, headers=headers)
result = response.json()

if response.status_code == 201:
    print(f"✅ 뉴스 등록 성공! 기사 링크: {result['article']['articleUrl']}")
else:
    print(f"❌ 실패 ({response.status_code}):", result)
```

#### Case B: 로컬 이미지 파일 업로드 후 뉴스 등록하기
```python
import requests

BASE_URL = "https://veranex.app"
API_KEY = "vera-news-api-key-2026"

headers = {"x-api-key": API_KEY}

# 1. 로컬 이미지 파일 업로드
image_path = "sample_chart.png"
with open(image_path, "rb") as f:
    files = {"file": f}
    upload_res = requests.post(f"{BASE_URL}/api/news/upload-image", files=files, headers=headers)

if upload_res.status_code != 201:
    raise Exception(f"이미지 업로드 실패: {upload_res.text}")

uploaded_image_url = upload_res.json()["fullUrl"]
print("📸 이미지 업로드 완료:", uploaded_image_url)

# 2. 업로드된 이미지 URL로 뉴스 등록
news_payload = {
    "title": "2026 스마트 라이프 트렌드 분석 보고서 발표",
    "category": "lifestyle",
    "content": "2026년 대한민국 현대인들의 라이프스타일 키워드는 '초개인화 자동화'와 '디지털 웰니스'로 집약되었습니다. 복잡한 앱 설치 없이 웹에서 가볍게 사용하는 유틸리티 서비스가 급성장하고 있습니다.",
    "imageUrl": uploaded_image_url,
    "source": "VERA 라이프 연구소",
    "tags": ["라이프", "트렌드", "2026"]
}

news_res = requests.post(f"{BASE_URL}/api/news", json=news_payload, headers={"Content-Type": "application/json", **headers})
print("✅ 최종 뉴스 발행 결과:", news_res.json())
```

---

### 3. Node.js (fetch / ESM)

```javascript
const API_URL = 'https://veranex.app/api/news';
const API_KEY = 'vera-news-api-key-2026';

async function publishNews() {
  const payload = {
    title: '차세대 반도체 공정 혁신, 수율 95% 돌파 소식',
    category: 'tech',
    content: '국내 주요 연구진이 차세대 극자외선(EUV) 노광 공정의 수율을 95% 이상으로 끌어올리는 신소재 개발에 성공했다고 발표했습니다.',
    aiSummary: '• 차세대 EUV 반도체 신소재 개발로 수율 95% 달성\n• 기존 대비 양산 원가 30% 절감 기대\n• 하반기 글로벌 주요 파운드리 생산 라인 적용 예정',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
    source: 'IT 혁신 데스크',
    tags: ['반도체', 'EUV', '신기술']
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  console.log('결과:', data);
}

publishNews();
```

---

## ⚠️ 에러 코드 안내

| 상태 코드 | 에러 메시지 예시 | 원인 및 해결 방법 |
| :---: | :--- | :--- |
| `401 Unauthorized` | `Invalid or missing API Key...` | `x-api-key` 헤더가 누락되었거나 일치하지 않습니다. 키 값을 확인하세요. |
| `400 Bad Request` | `title is required...` | 제목(최소 3자) 또는 본문(최소 10자)이 누락되었습니다. |
| `400 Bad Request` | `Invalid file format...` | 허용되지 않은 이미지 확장자입니다. (`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif` 허용) |
| `500 Server Error` | `Failed to create news...` | 서버 내부 일시 오류입니다. 오류 메시지를 확인하세요. |
