# Figma API 연동 가이드

## 📋 개요
이 문서는 Faith Portal 웹 애플리케이션에 Figma API를 연동하는 방법을 설명합니다.

## 🔑 1. Figma Personal Access Token 발급

### 1.1 토큰 발급 방법
1. Figma 계정으로 로그인
2. https://www.figma.com/settings 접속
3. **Personal access tokens** 섹션으로 이동
4. **Generate new token** 클릭
5. 토큰 이름 입력 (예: "Faith Portal Integration")
6. 생성된 토큰 복사 (한 번만 표시됩니다!)

### 1.2 토큰 권한
생성된 토큰은 다음 권한을 가집니다:
- 파일 읽기
- 팀/프로젝트 정보 접근
- 디자인 데이터 가져오기

## 🔧 2. 로컬 개발 환경 설정

### 2.1 환경 변수 파일 생성
프로젝트 루트에 `.dev.vars` 파일 생성:

```bash
# .dev.vars (이 파일은 .gitignore에 포함되어 있음)
FIGMA_ACCESS_TOKEN=figd_your_token_here
```

### 2.2 .gitignore 확인
`.dev.vars` 파일이 git에 커밋되지 않도록 확인:

```
.dev.vars
*.env
```

## 🚀 3. Cloudflare Pages 프로덕션 설정

### 3.1 Wrangler로 Secret 등록
```bash
# 프로덕션 환경에 Figma 토큰 등록
npx wrangler pages secret put FIGMA_ACCESS_TOKEN --project-name webapp

# 등록된 secret 확인
npx wrangler pages secret list --project-name webapp
```

### 3.2 wrangler.jsonc 업데이트
환경 변수 바인딩이 필요한 경우:

```jsonc
{
  "name": "webapp",
  "compatibility_date": "2024-01-01",
  "vars": {
    "ENVIRONMENT": "production"
  }
}
```

## 📡 4. Figma API 사용 방법

### 4.1 API 엔드포인트
Figma REST API 기본 URL: `https://api.figma.com/v1/`

주요 엔드포인트:
- `GET /files/:file_key` - 파일 정보 가져오기
- `GET /files/:file_key/nodes` - 특정 노드 가져오기
- `GET /images/:file_key` - 이미지 렌더링
- `GET /teams/:team_id/projects` - 팀 프로젝트 목록

### 4.2 API 호출 예제 (Hono)

```typescript
// src/index.tsx
app.get('/api/figma/design/:fileKey', async (c) => {
  const { FIGMA_ACCESS_TOKEN } = c.env
  const fileKey = c.req.param('fileKey')
  
  if (!FIGMA_ACCESS_TOKEN) {
    return c.json({ error: 'Figma token not configured' }, 500)
  }
  
  try {
    const response = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
      headers: {
        'X-Figma-Token': FIGMA_ACCESS_TOKEN
      }
    })
    
    if (!response.ok) {
      throw new Error(`Figma API error: ${response.status}`)
    }
    
    const data = await response.json()
    return c.json(data)
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
})
```

### 4.3 Figma File Key 찾기
Figma 파일 URL 예시:
```
https://www.figma.com/file/ABC123xyz/My-Design-File
                           ↑
                      File Key
```

## 🎨 5. 사용 사례

### 5.1 디자인 시스템 토큰 가져오기
```typescript
// 색상, 폰트 등 디자인 토큰을 Figma에서 가져와 CSS 변수로 변환
app.get('/api/figma/tokens/:fileKey', async (c) => {
  // Figma Styles API 호출
  // 결과를 CSS 변수로 변환
  // return c.json({ colors, fonts, spacing })
})
```

### 5.2 이미지 에셋 가져오기
```typescript
// 아이콘, 로고 등을 Figma에서 내보내기
app.get('/api/figma/export/:fileKey/:nodeId', async (c) => {
  // Figma Images API 호출
  // PNG/SVG 형식으로 에셋 반환
})
```

### 5.3 프로토타입 임베드
```html
<!-- Figma 프로토타입을 iframe으로 임베드 -->
<iframe 
  style="border: 1px solid rgba(0, 0, 0, 0.1);" 
  width="800" 
  height="450" 
  src="https://www.figma.com/embed?embed_host=share&url=https://www.figma.com/proto/YOUR_FILE_KEY"
  allowfullscreen>
</iframe>
```

## 🔒 6. 보안 고려사항

### 6.1 토큰 보안
- ❌ **절대 하지 말 것**: 프론트엔드 코드에 토큰 노출
- ✅ **해야 할 것**: 서버사이드 API로만 Figma 호출
- ✅ **해야 할 것**: 환경 변수로 토큰 관리

### 6.2 Rate Limiting
Figma API는 rate limit이 있습니다:
- 개인 토큰: 분당 100 요청
- 초과 시 429 에러 반환

캐싱 전략 권장:
```typescript
// Cloudflare Workers KV로 캐싱
const cachedData = await c.env.KV.get(`figma:${fileKey}`)
if (cachedData) {
  return c.json(JSON.parse(cachedData))
}

// API 호출 후 결과 캐싱 (1시간)
await c.env.KV.put(`figma:${fileKey}`, JSON.stringify(data), {
  expirationTtl: 3600
})
```

## 📚 7. 참고 자료

- [Figma API 공식 문서](https://www.figma.com/developers/api)
- [Figma REST API 레퍼런스](https://www.figma.com/developers/api#introduction)
- [Figma 플러그인 개발](https://www.figma.com/plugin-docs/)

## 🛠️ 8. 트러블슈팅

### 8.1 401 Unauthorized
- 토큰이 올바르게 설정되었는지 확인
- 토큰이 만료되지 않았는지 확인

### 8.2 403 Forbidden
- 파일에 대한 접근 권한 확인
- 팀/프로젝트 권한 확인

### 8.3 404 Not Found
- File Key가 정확한지 확인
- 파일이 삭제되지 않았는지 확인

## 🚀 9. 다음 단계

1. ✅ Figma Personal Access Token 발급
2. ✅ `.dev.vars` 파일에 토큰 추가
3. ✅ 로컬에서 테스트 API 작성
4. ✅ Cloudflare에 Secret 등록
5. ✅ 프로덕션 배포

---

**마지막 업데이트**: 2025-12-12
**작성자**: Faith Portal Development Team
