# 로고 파일 안내

## 로고 파일 위치
`/home/user/webapp/public/logo_fl.png`

## 로고 파일 추가 방법

### 방법 1: 직접 복사
```bash
# AI 드라이브에서 복사 (파일이 /mnt/aidrive/logo_fl.png에 있는 경우)
cp /mnt/aidrive/logo_fl.png /home/user/webapp/public/logo_fl.png

# 또는 다른 위치에서 복사
cp [로고파일경로] /home/user/webapp/public/logo_fl.png
```

### 방법 2: 파일 업로드
1. 로컬 컴퓨터에서 `logo_fl.png` 파일 준비
2. 파일 업로드 도구 사용
3. `/home/user/webapp/public/` 폴더에 업로드

## 로고 사양
- **파일명**: `logo_fl.png`
- **권장 크기**: 높이 120-150px (자동으로 조정됨)
- **형식**: PNG (투명 배경 권장)
- **위치**: 헤더 왼쪽 상단
- **반응형**: 
  - 모바일: 32px 높이
  - 태블릿: 40px 높이
  - 데스크톱: 48px 높이

## 적용 확인
로고 파일 추가 후:
1. 서버 재시작 필요 없음 (정적 파일)
2. 브라우저 새로고침으로 확인
3. URL: `http://localhost:3000/logo_fl.png`

## 문제 해결
로고가 보이지 않는 경우:
```bash
# 1. 파일 존재 확인
ls -lh /home/user/webapp/public/logo_fl.png

# 2. 권한 확인
chmod 644 /home/user/webapp/public/logo_fl.png

# 3. 브라우저에서 직접 접근 테스트
curl http://localhost:3000/logo_fl.png
```
