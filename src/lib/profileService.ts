import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface ProfileData {
  badge: string;
  title: string;
  bio: string;
  chip1: string;
  chip2: string;
}

export interface TechItem {
  name: string;
  highlight: boolean;
}

export const DEFAULT_PROFILE: ProfileData = {
  badge: "웹 프론트엔드 엔지니어",
  title: "안녕하세요,\n임세은이에요",
  bio: "프론트엔드 기술과 생성형 AI를 활용해 유용하고 직관적인 사용자 경험을 만들어요. 일상의 작은 불편을 코드로 해결하는 것을 즐겨요.",
  chip1: "💻 웹 프론트엔드",
  chip2: "⚡ 바이브 코딩",
};

export const DEFAULT_TECH_STACKS: TechItem[] = [
  { name: "Next.js 16", highlight: true },
  { name: "React 19", highlight: true },
  { name: "TypeScript", highlight: false },
  { name: "Tailwind CSS", highlight: false },
  { name: "shadcn/ui", highlight: true },
  { name: "Firebase", highlight: true },
];

const PROFILE_STORAGE_KEY = "mylink_persisted_profile";
const TECH_STORAGE_KEY = "mylink_persisted_tech";

// Local storage helpers
export const getLocalProfile = (): ProfileData => {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn("Error reading local profile:", e);
  }
  return DEFAULT_PROFILE;
};

export const getLocalTechStacks = (): TechItem[] => {
  if (typeof window === "undefined") return DEFAULT_TECH_STACKS;
  try {
    const saved = localStorage.getItem(TECH_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn("Error reading local tech stacks:", e);
  }
  return DEFAULT_TECH_STACKS;
};

// Fetch profile with Firestore + Local fallback
export const fetchProfile = async (): Promise<ProfileData> => {
  try {
    const docRef = doc(db, "settings", "profile");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as ProfileData;
      if (typeof window !== "undefined") {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(data));
      }
      return data;
    }
  } catch (err) {
    console.warn("Firestore fetchProfile error:", err);
  }
  return getLocalProfile();
};

// Save profile
export const saveProfile = async (profile: ProfileData): Promise<void> => {
  if (typeof window !== "undefined") {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  }
  try {
    const docRef = doc(db, "settings", "profile");
    await setDoc(docRef, profile);
  } catch (err) {
    console.warn("Firestore saveProfile error:", err);
  }
};

// Fetch tech stacks
export const fetchTechStacks = async (): Promise<TechItem[]> => {
  try {
    const docRef = doc(db, "settings", "techStacks");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && Array.isArray(data.items)) {
        if (typeof window !== "undefined") {
          localStorage.setItem(TECH_STORAGE_KEY, JSON.stringify(data.items));
        }
        return data.items;
      }
    }
  } catch (err) {
    console.warn("Firestore fetchTechStacks error:", err);
  }
  return getLocalTechStacks();
};

// Save tech stacks
export const saveTechStacks = async (items: TechItem[]): Promise<void> => {
  if (typeof window !== "undefined") {
    localStorage.setItem(TECH_STORAGE_KEY, JSON.stringify(items));
  }
  try {
    const docRef = doc(db, "settings", "techStacks");
    await setDoc(docRef, { items, updatedAt: Date.now() });
  } catch (err) {
    console.warn("Firestore saveTechStacks error:", err);
  }
};
