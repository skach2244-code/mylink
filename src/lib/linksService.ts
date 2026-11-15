import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";

export interface LinkItem {
  id: string;
  title: string;
  badge: string;
  desc: string;
  url: string;
  isCopy?: boolean;
  copyValue?: string;
  order: number;
  createdAt?: number;
}

export const DEFAULT_LINKS: LinkItem[] = [
  {
    id: "github",
    title: "GitHub 저장소",
    badge: "@asdf4500",
    desc: "오픈소스 기여 및 개인 프로젝트 코드를 확인할 수 있어요",
    url: "https://github.com/asdf4500",
    order: 0,
  },
  {
    id: "blog",
    title: "기술 블로그",
    badge: "Velog",
    desc: "개발 과정에서의 문제 해결과 지식을 기록하고 공유해요",
    url: "https://velog.io",
    order: 1,
  },
  {
    id: "portfolio",
    title: "온라인 이력서 & 포트폴리오",
    badge: "Notion",
    desc: "수행한 프로젝트와 상세 이력을 정리해 둔 노션 페이지예요",
    url: "https://notion.so",
    order: 2,
  },
  {
    id: "email",
    title: "이메일 주소 복사하기",
    badge: "skach4488@gmail.com",
    desc: "클릭하면 클립보드로 이메일 주소가 바로 복사돼요",
    url: "mailto:skach4488@gmail.com",
    isCopy: true,
    copyValue: "skach4488@gmail.com",
    order: 3,
  },
  {
    id: "contact",
    title: "커피챗 및 협업 문의",
    badge: "Coffee Chat",
    desc: "새로운 기회나 사이드 프로젝트 제안은 언제든 환영해요",
    url: "mailto:skach4488@gmail.com",
    order: 4,
  },
];

const STORAGE_KEY = "mylink_persisted_links";

// Helper: Read from LocalStorage fallback
export const getLocalLinks = (): LinkItem[] => {
  if (typeof window === "undefined") return DEFAULT_LINKS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.sort((a, b) => a.order - b.order);
      }
    }
  } catch (e) {
    console.warn("Failed to load local links:", e);
  }
  return DEFAULT_LINKS;
};

// Helper: Save to LocalStorage fallback
export const saveLocalLinks = (links: LinkItem[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
  } catch (e) {
    console.warn("Failed to save local links:", e);
  }
};

// Fetch links from Firebase Firestore with fallback
export const fetchLinks = async (): Promise<LinkItem[]> => {
  try {
    const linksCol = collection(db, "links");
    const q = query(linksCol, orderBy("order", "asc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // First time initialization in Firestore
      const local = getLocalLinks();
      // Try seed
      try {
        const batch = writeBatch(db);
        local.forEach((item, index) => {
          const docRef = doc(db, "links", item.id);
          batch.set(docRef, { ...item, order: index, createdAt: Date.now() });
        });
        await batch.commit();
      } catch (err) {
        console.warn("Could not seed initial links to Firestore:", err);
      }
      return local;
    }

    const fetchedLinks: LinkItem[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      fetchedLinks.push({
        id: docSnap.id,
        title: data.title || "",
        badge: data.badge || "",
        desc: data.desc || "",
        url: data.url || "",
        isCopy: !!data.isCopy,
        copyValue: data.copyValue || "",
        order: typeof data.order === "number" ? data.order : 0,
        createdAt: data.createdAt,
      });
    });

    const sorted = fetchedLinks.sort((a, b) => a.order - b.order);
    saveLocalLinks(sorted);
    return sorted;
  } catch (error) {
    console.warn("Firestore fetchLinks error (using local cache):", error);
    return getLocalLinks();
  }
};

// Add link: Appends at the end
export const createLink = async (
  newLink: Omit<LinkItem, "order">,
  currentLength: number
): Promise<LinkItem> => {
  const item: LinkItem = {
    ...newLink,
    order: currentLength,
    createdAt: Date.now(),
  };

  // 1. Sync to local storage
  const current = getLocalLinks();
  const updated = [...current, item];
  saveLocalLinks(updated);

  // 2. Sync to Firebase Firestore
  try {
    const docRef = doc(db, "links", item.id);
    await setDoc(docRef, item);
  } catch (error) {
    console.warn("Firestore createLink error (saved locally):", error);
  }

  return item;
};

// Delete link
export const removeLink = async (id: string): Promise<void> => {
  // 1. Sync to local storage
  const current = getLocalLinks();
  const filtered = current.filter((l) => l.id !== id);
  // Re-index orders
  const reindexed = filtered.map((l, idx) => ({ ...l, order: idx }));
  saveLocalLinks(reindexed);

  // 2. Sync to Firebase Firestore
  try {
    const docRef = doc(db, "links", id);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn("Firestore removeLink error (saved locally):", error);
  }
};

// Reorder links (save updated list order)
export const saveReorderedLinks = async (reordered: LinkItem[]): Promise<void> => {
  const normalized = reordered.map((item, idx) => ({
    ...item,
    order: idx,
  }));

  // 1. Sync to local storage
  saveLocalLinks(normalized);

  // 2. Sync to Firebase Firestore
  try {
    const batch = writeBatch(db);
    normalized.forEach((item) => {
      const docRef = doc(db, "links", item.id);
      batch.set(docRef, item, { merge: true });
    });
    await batch.commit();
  } catch (error) {
    console.warn("Firestore reorder batch error (saved locally):", error);
  }
};
