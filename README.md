# 🔗 마이링크 (MyLink)

> **shadcn/ui 감성의 나만의 모바일 프로필 & 링크트리 서비스**  
> 모바일 쉘 기반의 깔끔한 사용자 경험과 실시간 관리자 대시보드(`/admin`)를 제공하는 링크트리 클론 서비스입니다.

---

## 📖 기능 정의서 (PRD)

프로젝트의 전체 요구사항, 데이터 모델(ERD), API 명세 및 개발 로드맵은 [PRD.md](file:///c:/Users/skach/OneDrive/Desktop/%ED%95%99%EC%97%85/%28%ED%99%94%29%20%EB%B0%94%EC%9D%B4%EB%B8%8C%EC%BD%94%EB%94%A9/projects/mylink/PRD.md)에서 자세히 확인하실 수 있습니다.

- **방문자 화면 (`/`)**: shadcn/ui 기반 모바일 쉘, 프로필 히어로 카드, 추천 프로젝트, 실시간 링크 추가/목록, 원클릭 이메일 복사, 링크 클릭 수 집계
- **관리자 화면 (`/admin`)**: 마스터 비밀번호 인증, 링크 추가/수정/삭제, 공개/비공개(ON/OFF) 토글, 순서 재정렬, 프로필 커스텀, 누적 클릭 통계 확인
- **데이터베이스 및 백엔드**: Next.js App Router + Firebase (Firestore & Analytics)

---

## 🛠️ 기술 스택 (Tech Stack)

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS v4](https://tailwindcss.com/)
- **Backend & BaaS**: [Firebase](https://firebase.google.com/) (Firestore, Auth, Analytics)
- **Design System**: [shadcn/ui](https://ui.shadcn.com/) (Zinc / Minimalist Monochrome)

---

## 🚀 시작하기 (Getting Started)

### 1. 패키지 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env.example` 파일을 복사하여 `.env.local` 파일을 생성하고 필요한 값을 입력합니다:
```bash
cp .env.example .env.local
```

### 3. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인하세요.
- **메인 프로필**: `http://localhost:3000/`
- **관리자 대시보드**: `http://localhost:3000/admin`
