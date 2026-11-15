# [PRD] 마이링크 (MyLink) 기능 정의서

> **버전**: v1.0  
> **최종 수정일**: 2026-11-15  
> **상태**: 승인됨 (Approved)  
> **프로젝트 위치**: `mylink/`

---

## 1. 프로젝트 개요 (Overview)

### 1.1 배경 및 목적
- **배경**: 현재 마이링크 프로젝트는 모바일 쉘 기반 단일 정적 프로필 페이지(`src/app/page.tsx`)로 구성되어 있습니다.
- **목적**: 깔끔하고 모던한 **shadcn/ui (Zinc 테마)** 디자인을 기반으로, 별도의 코드 수정 없이 웹 관리자 대시보드(`/admin`)에서 프로필 정보와 링크 목록을 실시간으로 추가·수정·삭제하고 방문자 클릭 통계를 수집할 수 있는 **개인용 링크트리 클론 서비스**로 고도화합니다.

### 1.2 서비스 정체성 및 슬로건
- **서비스명**: 마이링크 (MyLink)
- **디자인 테마**: shadcn/ui (Zinc / Minimalist Monochrome)
- **핵심 가치**: "미니멀하고 신뢰감을 주는 나만의 모바일 프로필 & 링크 허브"

---

## 2. 사용자 정의 및 주요 시나리오 (Users & User Scenarios)

### 2.1 사용자 유형
1. **관리자 (소유자 - 1인)**
   - 본인의 프로필 및 링크를 관리하는 단일 관리자.
   - 마스터 비밀번호를 통해 관리자 페이지에 접근.
2. **방문자 (일반 대중 / 게스트)**
   - 공유받은 링크를 통해 접속하여 소유자의 프로필과 링크를 탐색하고 클릭하는 사용자.

### 2.2 주요 유저 시나리오
```mermaid
flowchart LR
    subgraph Visitor [방문자 시나리오]
        V1[공개 링크 접속 /] --> V2[프로필 및 추천 프로젝트 확인]
        V2 --> V3[링크 클릭 및 이메일 복사]
        V3 --> V4[클릭 통계 자동 집계]
    end

    subgraph Admin [관리자 시나리오]
        A1[/admin 접속] --> A2[마스터 비밀번호 로그인]
        A2 --> A3[대시보드: 링크 CRUD 및 순서 변경]
        A3 --> A4[링크 공개/비공개 토글]
        A3 --> A5[프로필/추천프로젝트/기술스택 편집]
        A3 --> A6[링크별 누적 클릭수 분석]
    end
```

---

## 3. 핵심 기능 요구사항 (Functional Requirements)

### 3.1 공개 프로필 화면 (`/`)
| 기능 ID | 기능명 | 상세 내용 | 우선순위 |
| :--- | :--- | :--- | :--- |
| **FR-PUB-01** | 프로필 히어로 카드 | 아바타, 인사말(헤드라인), 소개글(Bio), 소속 뱃지, 위치/직무 칩 표시 | P0 (필수) |
| **FR-PUB-02** | 추천 프로젝트 배너 | 대표 프로젝트명, 뱃지, 설명, 외부 저장소 링크 연결 | P0 (필수) |
| **FR-PUB-03** | 활성 링크 목록 렌더링 | `is_active: true` 상태인 링크만 정렬 순서(`order_index`)대로 렌더링 | P0 (필수) |
| **FR-PUB-04** | 링크 인터랙션 지원 | 1) 외부 URL 새 창 열기<br>2) 클립보드 원클릭 복사(토스트 팝업 알림)<br>3) 이메일/커피챗 문의 액션 | P0 (필수) |
| **FR-PUB-05** | 클릭수 비동기 집계 | 사용자가 링크 클릭 시 백그라운드로 `/api/links/[id]/click`을 호출하여 통계 반영 | P1 (중요) |
| **FR-PUB-06** | TDS 모바일 쉘 UI | 데스크톱에서도 모바일 앱 화면처럼 중앙 정렬(`max-w-[480px]`) 및 부드러운 인터랙션 유지 | P0 (필수) |

### 3.2 관리자 인증 및 보안
| 기능 ID | 기능명 | 상세 내용 | 우선순위 |
| :--- | :--- | :--- | :--- |
| **FR-AUTH-01** | 마스터 비밀번호 인증 | 과제 평가 및 테스트를 위해 마스터 비밀번호 `1234`를 입력하여 관리자 모드로 즉시 전환 | P0 (필수) |
| **FR-AUTH-02** | 세션 유지 | 브라우저 스토리지(`mylink_is_admin`)에 관리자 상태를 유지하여 새로고침 시에도 편집 권한 유지 | P0 (필수) |
| **FR-AUTH-03** | 권한별 UI 제어 | 비관리자(방문자)에게는 편집 폼과 수정/삭제 버튼을 숨기고, 관리자에게만 편집 도구 노출 | P0 (필수) |

### 3.3 관리자 링크 관리
| 기능 ID | 기능명 | 상세 내용 | 우선순위 |
| :--- | :--- | :--- | :--- |
| **FR-LNK-01** | 새 링크 추가 | 제목, URL 입력 후 추가 시 **항상 맨 마지막에 추가**되며 Firebase에 영구 저장 | P0 (필수) |
| **FR-LNK-02** | 입력값 3단계 유효성 검증 | 1) `제목을 입력해 주세요`<br>2) `주소를 입력해 주세요`<br>3) `올바른 주소를 입력해 주세요` | P0 (필수) |
| **FR-LNK-03** | 링크 순서 조절 (위/아래 이동) | `▲` (위로), `▼` (아래로) 버튼으로 순서를 변경하고 Firebase에 실시간 갱신 | P0 (필수) |
| **FR-LNK-04** | 링크 삭제 | `🗑️` 삭제 버튼으로 불필요한 링크를 확인 후 Firebase 및 목록에서 영구 제거 | P0 (필수) |

### 3.4 관리자 프로필 & 기술 스택 커스텀
| 기능 ID | 기능명 | 상세 내용 | 우선순위 |
| :--- | :--- | :--- | :--- |
| **FR-PRF-01** | 프로필 텍스트 실시간 수정 | 상단 뱃지 문구, 인사말/이름, 소개글(Bio), 하단 태그 칩을 직접 수정 후 저장 | P0 (필수) |
| **FR-PRF-02** | 기술 스택 동적 관리 | 지속적인 학습에 맞춰 새로운 기술 스택을 입력하여 추가하고, `✕` 버튼으로 삭제 가능 | P0 (필수) |
| **FR-PRF-03** | Firebase 실시간 동기화 | 프로필 텍스트 및 기술 스택 변경 사항이 Firebase Firestore에 자동 동기화 | P0 (필수) |

---

## 4. 데이터베이스 및 스키마 설계 (Data Architecture)

백엔드 인프라는 **Firebase (Firestore + Analytics)** 구조를 채택하며, 네트워크나 보안 규칙 상태에 구애받지 않고 동작하도록 **로컬 스토리지 Fallback 동기화 패턴**을 지원합니다.

### 4.1 Firestore 컬렉션 및 문서 구조

- **`links` 컬렉션**:
  - `id` (문서 ID): 고유 식별자
  - `title` (string): 링크 제목
  - `badge` (string): 사이트 도메인/태그
  - `desc` (string): 설명 또는 URL
  - `url` (string): 대상 웹 주소
  - `isCopy` (boolean): 클립보드 복사 여부
  - `copyValue` (string): 복사할 값
  - `order` (number): 정렬 순서 (새 링크는 마지막 번호 부여)
  - `createdAt` (number): 생성 타임스탬프

- **`settings` 컬렉션**:
  - `settings/profile`: `badge`, `title`, `bio`, `chip1`, `chip2` (프로필 소개 텍스트)
  - `settings/techStacks`: `items: Array<{ name, highlight }>` (지속 학습 중인 기술 스택 목록)

    LINKS {
        string id PK "링크 고유 식별자 (UUID)"
        string title "링크 제목"
        string badge "링크 우측 뱃지 태그"
        string desc "링크 부가 설명"
        string url "대상 URL"
        string icon_type "아이콘 식별자 (github, velog, notion, mail, etc.)"
        boolean is_copy "클립보드 복사 여부"
        string copy_value "복사될 텍스트"
        boolean is_active "공개 여부 (ON/OFF)"
        int order_index "정렬 순서"
        int click_count "누적 클릭 수"
        timestamp created_at "생성 일시"
        timestamp updated_at "수정 일시"
    }

    PROFILES ||--o{ LINKS : "manages"
```

### 4.2 Supabase SQL DDL (초기 스크립트)
```sql
-- 1. 프로필 테이블 생성
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY DEFAULT 'me',
  name TEXT NOT NULL,
  headline TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  avatar_text TEXT DEFAULT '임',
  badge_text TEXT,
  chips JSONB DEFAULT '[]'::jsonb,
  featured_project JSONB DEFAULT '{}'::jsonb,
  tech_stacks JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 링크 목록 테이블 생성
CREATE TABLE IF NOT EXISTS links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  badge TEXT,
  "desc" TEXT,
  url TEXT NOT NULL,
  icon_type TEXT DEFAULT 'default',
  is_copy BOOLEAN DEFAULT FALSE,
  copy_value TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  order_index INT NOT NULL DEFAULT 0,
  click_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 클릭 카운트 원자적 증가 RPC 함수
CREATE OR REPLACE FUNCTION increment_link_click(link_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE links
  SET click_count = click_count + 1,
      updated_at = NOW()
  WHERE id = link_id;
END;
$$ LANGUAGE plpgsql;
```

---

## 5. API 명세서 (API Specification)

| 메서드 | 경로 | 설명 | 인증 필요 |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/data` | 공개 메인 페이지용 전체 데이터(프로필 + 활성 링크) 조회 | X |
| `POST` | `/api/links/[id]/click` | 링크 클릭 수 1 증가 (Atomic 카운팅) | X |
| `POST` | `/api/admin/login` | 마스터 비밀번호 검증 및 세션 쿠키 발급 | X |
| `POST` | `/api/admin/logout` | 관리자 세션 쿠키 삭제 | O |
| `GET` | `/api/admin/data` | 관리자 대시보드용 전체 데이터(비공개 링크 포함, 클릭수 포함) | O |
| `POST` | `/api/admin/links` | 신규 링크 생성 | O |
| `PUT` | `/api/admin/links/[id]` | 링크 정보 수정 또는 `is_active` 상태 토글 | O |
| `DELETE` | `/api/admin/links/[id]` | 링크 영구 삭제 | O |
| `PATCH` | `/api/admin/links/reorder` | 링크 순서 일괄 재정렬 (`order_index` 업데이트) | O |
| `PUT` | `/api/admin/profile` | 프로필/소개글/추천프로젝트/기술스택 전체 정보 저장 | O |

---

## 6. 비기능적 요구사항 (Non-Functional Requirements)

1. **디자인 시스템 일관성 (shadcn/ui - Zinc 테마)**
   - 컬러: Zinc/Slate 모노크롬 (배경 `#fafafa`, 서피스 `#ffffff`, 텍스트 `#09090b`, 보조 텍스트 `#71717a`, 보더 `#e4e4e7`).
   - 타이포그래피: Pretendard / Sans-serif 기반의 깔끔한 글꼴 및 자간(`tracking-tight`).
   - 컴포넌트: `Card`, `Badge`, `Button`, `Avatar`를 통한 일관된 모던 미니멀 UI.
   - 피드백 인터랙션: 호버 시 부드러운 테두리 및 배경 변화(`transition-colors`), 토스트 알림.
2. **반응형 모바일 쉘 (Mobile First)**
   - 모바일 기기 풀스크린 경험 제공.
   - 태블릿/PC 접속 시 최대 폭 `480px` 중앙 정렬 카드 쉘 유지.
3. **무중단 Fallback 아키텍처 (Resilience)**
   - Supabase 클라우드 DB 키가 `.env.local`에 없거나 일시적 오류 시, 기존 `src/app/page.tsx`의 기본 데이터로 매끄럽게 동작하여 서비스가 중단되지 않도록 보장.
4. **보안**
   - 관리자 비밀번호는 단방향 해시 또는 서버 환경변수 비교로 처리.
   - API 라우트에 세션 검증 로직 적용하여 무단 데이터 변조 방지.

---

## 7. 프로젝트 파일 구조 (Target File Structure)

```text
mylink/
├── PRD.md                                # 본 기능 정의서
├── .env.example                          # 환경 변수 가이드 (Supabase URL, Anon Key, Admin Password)
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # 글로벌 메타데이터 & 폰트 설정
│   │   ├── globals.css                   # Tailwind CSS v4 & TDS 스타일 클래스
│   │   ├── page.tsx                      # [공개] 메인 모바일 쉘 링크트리 화면
│   │   ├── admin/
│   │   │   ├── login/page.tsx            # [관리자] 마스터 비밀번호 로그인 페이지
│   │   │   ├── page.tsx                  # [관리자] 링크 관리 & 클릭 통계 대시보드
│   │   │   └── profile/page.tsx          # [관리자] 프로필/소개/프로젝트 편집 페이지
│   │   └── api/
│   │       ├── data/route.ts             # 메인 공개 데이터 제공 API
│   │       ├── links/[id]/click/route.ts # 클릭 카운팅 API
│   │       └── admin/                    # 관리자 전용 인증 및 CRUD API 핸들러
│   ├── components/
│   │   ├── LinkCard.tsx                  # 링크 아이템 컴포넌트
│   │   ├── ProfileHero.tsx               # 프로필 히어로 섹션
│   │   ├── FeaturedProject.tsx           # 추천 프로젝트 카드
│   │   ├── TechStackChips.tsx            # 기술 스택 태그 칩
│   │   └── Toast.tsx                     # TDS 플로팅 토스트 컴포넌트
│   ├── lib/
│   │   ├── supabase.ts                   # Supabase 클라이언트 인스턴스
│   │   ├── auth.ts                       # 관리자 세션 검증 유틸리티
│   │   └── defaultData.ts                # 초기 기본 데이터 & Fallback 목업
│   └── types/
│       └── mylink.ts                     # TypeScript 인터페이스 (Profile, LinkItem 등)
```

---

## 8. 구현 마일스톤 및 로드맵 (Milestones)

- [x] **Phase 1: 요구사항 정의 및 PRD 작성**
  - 사용자 질의를 통한 요구사항 명세화 및 `PRD.md` 작성 완료
- [ ] **Phase 2: 데이터 모델 & Supabase 연동 레이어 구성**
  - TypeScript 타입 정의 (`types/mylink.ts`)
  - 기본 데이터셋 모듈화 (`lib/defaultData.ts`)
  - Supabase 클라이언트 및 API 라우트 핸들러 작성
- [ ] **Phase 3: 메인 공개 페이지 연동 및 클릭 카운팅**
  - `src/app/page.tsx`를 동적 데이터 기반으로 리팩토링
  - 링크 클릭 이벤트 핸들러 및 카운트 API 연동
- [ ] **Phase 4: 관리자 인증 및 대시보드 구축**
  - `/admin/login` 마스터 비밀번호 로그인 구현
  - `/admin` 링크 추가, 수정, 삭제, 공개/비공개 토글, 정렬 기능
  - 누적 클릭 통계 뱃지 시각화
- [ ] **Phase 5: 프로필 커스텀 에디터 및 배포 검증**
  - `/admin/profile` 프로필 문구 및 아바타, 추천 프로젝트 수정 폼
  - Vercel 배포 환경 및 Supabase 연동 검증
