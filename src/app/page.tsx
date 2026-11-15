"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getFirebaseAnalytics } from "@/lib/firebase";
import {
  LinkItem,
  fetchLinks,
  createLink,
  removeLink,
  saveReorderedLinks,
} from "@/lib/linksService";
import {
  ProfileData,
  TechItem,
  DEFAULT_PROFILE,
  DEFAULT_TECH_STACKS,
  fetchProfile,
  saveProfile,
  fetchTechStacks,
  saveTechStacks,
} from "@/lib/profileService";

export default function Home() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [isLoadingLinks, setIsLoadingLinks] = useState(true);

  // Profile & Tech Stacks states
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [techStacks, setTechStacks] = useState<TechItem[]>(DEFAULT_TECH_STACKS);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState<ProfileData>(DEFAULT_PROFILE);
  const [newTechInput, setNewTechInput] = useState("");
  const [newTechIsDark, setNewTechIsDark] = useState<boolean>(true); // true = 검은색 배경, false = 흰색 배경

  // Admin Mode states (Password: 1234)
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");

  // Link addition form states
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [titleError, setTitleError] = useState("");
  const [urlError, setUrlError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Copy helper
  const copyToClipboard = (text: string, label: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast(`${label} 복사되었어요`);
    }
  };

  // Initialize Firebase Analytics & Load data from Firestore / LocalStorage
  useEffect(() => {
    getFirebaseAnalytics();

    // Check saved admin state
    if (typeof window !== "undefined") {
      const savedAdmin = localStorage.getItem("mylink_is_admin");
      if (savedAdmin === "true") {
        setIsAdmin(true);
      }
    }

    // Load Links, Profile, and Tech Stacks
    const loadData = async () => {
      setIsLoadingLinks(true);
      try {
        const [loadedLinks, loadedProfile, loadedTech] = await Promise.all([
          fetchLinks(),
          fetchProfile(),
          fetchTechStacks(),
        ]);
        setLinks(loadedLinks);
        setProfile(loadedProfile);
        setEditProfileData(loadedProfile);
        setTechStacks(loadedTech);
      } catch (e) {
        console.warn("Error loading data:", e);
      } finally {
        setIsLoadingLinks(false);
      }
    };

    loadData();
  }, []);

  // Admin Login Handler: Only 1234 allowed
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordInput === "1234") {
      setIsAdmin(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("mylink_is_admin", "true");
      }
      setShowLoginModal(false);
      setPasswordInput("");
      setLoginError("");
      showToast("관리자 모드로 전환되었어요");
    } else {
      setLoginError("비밀번호가 올바르지 않아요 (1234를 입력하세요)");
    }
  };

  // Admin Logout Handler
  const handleAdminLogout = () => {
    setIsAdmin(false);
    setIsEditingProfile(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("mylink_is_admin");
    }
    showToast("관리자 모드가 해제되었어요");
  };

  // Save Profile Text Changes
  const handleSaveProfile = async () => {
    setProfile(editProfileData);
    await saveProfile(editProfileData);
    setIsEditingProfile(false);
    showToast("프로필 소개 텍스트가 저장되었어요");
  };

  // Add Tech Stack (with background color choice: Black vs White)
  const handleAddTech = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTechInput.trim();
    if (!trimmed) return;

    if (techStacks.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) {
      showToast("이미 등록된 기술 스택이에요");
      return;
    }

    const updated = [...techStacks, { name: trimmed, highlight: newTechIsDark }];
    setTechStacks(updated);
    setNewTechInput("");
    await saveTechStacks(updated);
    showToast(`'${trimmed}' 기술 스택이 추가되었어요`);
  };

  // Toggle Tech Stack Background (Black ↔ White)
  const handleToggleTechColor = async (name: string) => {
    const updated = techStacks.map((t) =>
      t.name === name ? { ...t, highlight: !t.highlight } : t
    );
    setTechStacks(updated);
    await saveTechStacks(updated);
    showToast(`'${name}' 배경색이 변경되었어요`);
  };

  // Remove Tech Stack
  const handleRemoveTech = async (name: string) => {
    const updated = techStacks.filter((t) => t.name !== name);
    setTechStacks(updated);
    await saveTechStacks(updated);
    showToast(`'${name}' 기술 스택이 삭제되었어요`);
  };

  // Link addition handler: Newly added link is appended to the END (맨 마지막)
  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;
    const trimmedTitle = newTitle.trim();
    const trimmedDesc = newDesc.trim();
    const trimmedUrl = newUrl.trim();

    if (!trimmedTitle) {
      setTitleError("제목을 입력해 주세요");
      hasError = true;
    } else {
      setTitleError("");
    }

    if (!trimmedUrl) {
      setUrlError("주소를 입력해 주세요");
      hasError = true;
    } else {
      const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/;
      if (!urlPattern.test(trimmedUrl)) {
        setUrlError("올바른 주소를 입력해 주세요");
        hasError = true;
      } else {
        setUrlError("");
      }
    }

    if (hasError) return;

    setIsSubmitting(true);

    const finalUrl = trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")
      ? trimmedUrl
      : `https://${trimmedUrl}`;

    let badgeName = "Link";
    try {
      const parsed = new URL(finalUrl);
      badgeName = parsed.hostname.replace("www.", "");
    } catch {
      badgeName = "Link";
    }

    const newLinkData: Omit<LinkItem, "order"> = {
      id: `link-${Date.now()}`,
      title: trimmedTitle,
      badge: badgeName,
      desc: trimmedDesc || finalUrl,
      url: finalUrl,
      isCopy: false,
    };

    // Append to the END (맨 마지막)
    const created = await createLink(newLinkData, links.length);
    setLinks((prev) => [...prev, created]);

    setNewTitle("");
    setNewDesc("");
    setNewUrl("");
    setTitleError("");
    setUrlError("");
    setIsSubmitting(false);
    showToast(`'${trimmedTitle}' 링크가 추가되었어요`);
  };

  // Delete Link
  const handleDeleteLink = async (id: string, title: string) => {
    if (!confirm(`'${title}' 링크를 삭제하시겠어요?`)) return;

    await removeLink(id);
    setLinks((prev) => prev.filter((l) => l.id !== id));
    showToast(`'${title}' 링크가 삭제되었어요`);
  };

  // Reorder Link: Move Up (▲) or Down (▼)
  const handleMoveLink = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= links.length) return;

    const newLinks = [...links];
    const temp = newLinks[index];
    newLinks[index] = newLinks[targetIndex];
    newLinks[targetIndex] = temp;

    setLinks(newLinks);
    await saveReorderedLinks(newLinks);
    showToast("순서가 변경되었어요");
  };

  // Dynamic icon helper based on URL or type
  const getLinkIcon = (item: LinkItem) => {
    const url = (item.url || "").toLowerCase();
    const id = (item.id || "").toLowerCase();

    if (id === "github" || url.includes("github.com")) {
      return (
        <svg className="w-5 h-5 text-zinc-800" viewBox="0 0 24 24" fill="currentColor">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
      );
    }

    if (id === "blog" || url.includes("velog.io") || url.includes("medium.com") || url.includes("tistory.com")) {
      return (
        <svg className="w-5 h-5 text-zinc-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
          <path d="M6 6h10" />
          <path d="M6 10h10" />
        </svg>
      );
    }

    if (id === "portfolio" || url.includes("notion.so")) {
      return (
        <svg className="w-5 h-5 text-zinc-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M3 9h18" />
          <path d="M9 21V9" />
        </svg>
      );
    }

    if (item.isCopy || url.startsWith("mailto:")) {
      return (
        <svg className="w-5 h-5 text-zinc-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      );
    }

    if (id === "contact") {
      return (
        <svg className="w-5 h-5 text-zinc-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
          <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
          <line x1="6" y1="2" x2="6" y2="4" />
          <line x1="10" y1="2" x2="10" y2="4" />
          <line x1="14" y1="2" x2="14" y2="4" />
        </svg>
      );
    }

    // Default universal link icon
    return (
      <svg className="w-5 h-5 text-zinc-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    );
  };

  return (
    <div className="w-full min-h-screen bg-[#f2f4f6] flex flex-col items-center selection:bg-zinc-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 z-50 transition-all duration-200">
          <div className="bg-zinc-900 text-zinc-50 text-sm font-medium px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 border border-zinc-800">
            <svg className="w-4 h-4 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Admin Login Modal Dialog (Only 1234) */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-zinc-200 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">관리자 인증</h3>
                  <p className="text-xs text-zinc-500">과제 평가 및 테스트용 안내</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  setLoginError("");
                }}
                className="text-zinc-400 hover:text-zinc-700 p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200 leading-relaxed">
              💡 <strong>과제 평가자 안내</strong>: 아래 입력창에 <strong>1234</strong>를 입력하시면 즉시 관리자 모드로 전환되어 프로필 텍스트 수정, 기술 스택 편집, 링크 추가·삭제·순서변경을 테스트하실 수 있습니다.
            </p>

            <form onSubmit={handleAdminLogin} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-zinc-800">
                  마스터 비밀번호 (1234를 입력하세요)
                </label>
                <Input
                  type="password"
                  placeholder="1234를 입력하세요"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (loginError) setLoginError("");
                  }}
                  autoFocus
                  className="bg-zinc-50 border-zinc-300"
                />
                {loginError && <p className="text-xs text-red-500 font-medium mt-0.5">{loginError}</p>}
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowLoginModal(false);
                    setLoginError("");
                  }}
                  className="flex-1 text-xs"
                >
                  취소
                </Button>
                <Button type="submit" className="flex-1 text-xs bg-zinc-900 text-white hover:bg-zinc-800 font-semibold">
                  로그인
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1. Fixed Top Sticky Header (스크롤을 내려도 항상 상단 고정!) */}
      <header
        className="fixed top-0 inset-x-0 z-40 w-full backdrop-blur-md flex justify-center shadow-xs"
        style={{ backgroundColor: "rgba(9, 9, 11, 0.96)", borderBottom: "1px solid #27272a" }}
      >
        <div className="w-full max-w-[480px] h-14 px-4 flex items-center justify-between">
          {/* Logo & Version Badge */}
          <div className="flex items-center gap-2">
            <span className="text-[17px] font-bold tracking-tight text-white" style={{ color: "#ffffff" }}>
              MyLink
            </span>
            <span
              className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold shadow-xs"
              style={{ color: "#09090b", backgroundColor: "#ffffff", border: "1px solid #e4e4e7" }}
            >
              v1.0
            </span>
          </div>

          {/* Controls: Admin Mode Toggle & Share Button */}
          <div className="flex items-center gap-1.5">
            {isAdmin ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAdminLogout}
                className="text-xs text-amber-300 hover:text-amber-200 hover:bg-zinc-800 h-8 px-2.5 gap-1.5 border border-amber-500/40 rounded-lg cursor-pointer"
                title="클릭 시 관리자 모드 해제"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                <span>관리자 ON</span>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLoginModal(true)}
                className="text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 h-8 px-2.5 gap-1 rounded-lg cursor-pointer"
                title="관리자 로그인 (1234 입력)"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>관리자</span>
              </Button>
            )}

            {/* Share / Copy URL Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(typeof window !== "undefined" ? window.location.href : "http://localhost:3000", "링크가")}
              className="text-zinc-300 hover:text-white hover:bg-zinc-800 h-8 w-8 cursor-pointer"
              title="링크 주소 복사하기"
              aria-label="링크 주소 복사하기"
            >
              <svg className="w-4 h-4 text-zinc-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-[480px] px-4 pt-18 pb-14 flex flex-col gap-3.5">
        
        {/* 2. Hero Profile Card (상단 검은색, 하단 흰색 반반 분할 디자인) */}
        <div className="rounded-2xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col bg-white">
          {/* Top Half: Black Background (상단 검은색: 뱃지 + 인사말 & 이름) */}
          <div
            className="p-5 flex flex-col gap-3"
            style={{ backgroundColor: "#09090b", color: "#ffffff" }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-2">
                <span
                  className="w-fit text-xs font-semibold px-3 py-1 rounded-full shadow-xs"
                  style={{ color: "#09090b", backgroundColor: "#ffffff", border: "1px solid #e4e4e7" }}
                >
                  {profile.badge}
                </span>
                <h1
                  className="text-2xl font-bold tracking-tight text-white leading-snug whitespace-pre-line"
                  style={{ color: "#ffffff" }}
                >
                  {profile.title}
                </h1>
              </div>

              {isAdmin && !isEditingProfile && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditingProfile(true)}
                  className="text-xs h-7 px-2.5 bg-zinc-900 hover:bg-zinc-800 text-amber-300 border-zinc-700 shrink-0 gap-1 cursor-pointer"
                  title="프로필 텍스트 수정"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  <span>텍스트 수정</span>
                </Button>
              )}
            </div>
          </div>

          {/* Bottom Half: White Background (하단 흰색: 소개글 본문 + 태그 칩) */}
          <div className="p-5 bg-white flex flex-col gap-3.5 border-t border-zinc-100">
            {isEditingProfile ? (
              /* 관리자 프로필 텍스트 수정 폼 */
              <div className="flex flex-col gap-3 bg-zinc-50 p-3.5 rounded-xl border border-zinc-200">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                  <span className="text-xs font-bold text-zinc-900">프로필 텍스트 편집</span>
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditProfileData(profile);
                        setIsEditingProfile(false);
                      }}
                      className="h-7 text-xs px-2.5"
                    >
                      취소
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveProfile}
                      className="h-7 text-xs px-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold"
                    >
                      저장하기
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-zinc-600 font-medium">상단 뱃지 문구 (검은색 상단에 표시)</label>
                  <Input
                    value={editProfileData.badge}
                    onChange={(e) => setEditProfileData({ ...editProfileData, badge: e.target.value })}
                    className="h-8 text-xs bg-white border-zinc-300"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-zinc-600 font-medium">인사말 & 이름 (검은색 상단에 표시)</label>
                  <Input
                    value={editProfileData.title}
                    onChange={(e) => setEditProfileData({ ...editProfileData, title: e.target.value })}
                    className="h-8 text-xs bg-white border-zinc-300"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-zinc-600 font-medium">소개글 본문 (Bio, 흰색 하단에 표시)</label>
                  <textarea
                    rows={3}
                    value={editProfileData.bio}
                    onChange={(e) => setEditProfileData({ ...editProfileData, bio: e.target.value })}
                    className="w-full text-xs p-2 rounded-md bg-white border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 text-zinc-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-zinc-600 font-medium">태그 1</label>
                    <Input
                      value={editProfileData.chip1}
                      onChange={(e) => setEditProfileData({ ...editProfileData, chip1: e.target.value })}
                      className="h-8 text-xs bg-white border-zinc-300"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-zinc-600 font-medium">태그 2</label>
                    <Input
                      value={editProfileData.chip2}
                      onChange={(e) => setEditProfileData({ ...editProfileData, chip2: e.target.value })}
                      className="h-8 text-xs bg-white border-zinc-300"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <p className="text-[14px] text-zinc-600 leading-relaxed font-normal">
                  {profile.bio}
                </p>

                {/* Quick Info Chips */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-100">
                  <span
                    className="text-xs font-semibold px-3 py-1.5 rounded-md shadow-xs"
                    style={{ color: "#09090b", backgroundColor: "#f4f4f5", border: "1px solid #e4e4e7" }}
                  >
                    {profile.chip1}
                  </span>
                  <span
                    className="text-xs font-semibold px-3 py-1.5 rounded-md shadow-xs"
                    style={{ color: "#09090b", backgroundColor: "#f4f4f5", border: "1px solid #e4e4e7" }}
                  >
                    {profile.chip2}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 3. Featured Project Card (퍼스널 링크트리) */}
        <a
          href="https://github.com/asdf4500/mylink"
          target="_blank"
          rel="noopener noreferrer"
          className="group block cursor-pointer"
        >
          <Card className="border-zinc-200 bg-white transition-all duration-200 hover:border-zinc-400 hover:shadow-md">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="default" className="text-[11px] font-medium bg-zinc-900 text-zinc-50">
                  Featured Project
                </Badge>
                <span className="text-xs text-zinc-500 group-hover:text-zinc-900 flex items-center gap-1 transition-colors">
                  GitHub 저장소
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </span>
              </div>
              <CardTitle className="text-base font-semibold text-zinc-900 mt-2">
                MyLink — shadcn 감성의 퍼스널 링크트리
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <CardDescription className="text-xs text-zinc-500 leading-relaxed">
                Next.js 16과 Firebase, shadcn/ui 가이드라인을 바탕으로 설계된 미니멀하고 반응성이 뛰어난 링크트리 웹 서비스입니다.
              </CardDescription>
            </CardContent>
          </Card>
        </a>

        {/* 4. Links Section (순서 변경 및 삭제 컨트롤) */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>Links</span>
              {isAdmin && (
                <span className="text-[11px] font-normal text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                  순서조절/삭제 가능
                </span>
              )}
            </span>
            <span className="text-xs text-zinc-400 font-medium">
              총 {links.length}개 링크
            </span>
          </div>

          <Card className="border-zinc-200 bg-white overflow-hidden divide-y divide-zinc-100 shadow-sm">
            {isLoadingLinks ? (
              <div className="p-8 text-center text-xs text-zinc-400">
                링크 데이터를 불러오고 있어요...
              </div>
            ) : links.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-400">
                등록된 링크가 없어요. 관리자 모드에서 링크를 추가해 보세요!
              </div>
            ) : (
              links.map((item, index) => {
                const iconElement = getLinkIcon(item);

                return (
                  <div
                    key={item.id}
                    className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-zinc-50/80 transition-colors group"
                  >
                    {/* Link Click / Copy Action */}
                    <div
                      onClick={() => {
                        if (item.isCopy) {
                          copyToClipboard(item.copyValue || item.url, "이메일 주소가");
                        } else {
                          window.open(item.url, item.url.startsWith("http") ? "_blank" : "_self");
                        }
                      }}
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-lg bg-zinc-100 border border-zinc-200/60 flex items-center justify-center shrink-0 group-hover:bg-zinc-200/70 transition-colors">
                        {iconElement}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-zinc-900 truncate">
                            {item.title}
                          </span>
                          <Badge variant="outline" className="text-[11px] py-0 px-1.5 h-4 font-normal text-zinc-600 border-zinc-200 shrink-0">
                            {item.badge}
                          </Badge>
                        </div>
                        <p className="text-xs text-zinc-500 truncate mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </div>

                    {/* Right Action: Admin Controls OR Standard Visitor Controls */}
                    {isAdmin ? (
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Move Up Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveLink(index, "up");
                          }}
                          disabled={index === 0}
                          title="위로 이동"
                          className="w-7 h-7 rounded border border-zinc-200 bg-zinc-50 hover:bg-zinc-200 text-zinc-700 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-xs transition-colors cursor-pointer"
                        >
                          ▲
                        </button>

                        {/* Move Down Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveLink(index, "down");
                          }}
                          disabled={index === links.length - 1}
                          title="아래로 이동"
                          className="w-7 h-7 rounded border border-zinc-200 bg-zinc-50 hover:bg-zinc-200 text-zinc-700 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-xs transition-colors cursor-pointer"
                        >
                          ▼
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLink(item.id, item.title);
                          }}
                          title="삭제하기"
                          className="w-7 h-7 rounded border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center text-xs transition-colors ml-0.5 cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    ) : item.isCopy ? (
                      <Badge variant="secondary" className="shrink-0 text-xs text-zinc-700 group-hover:bg-zinc-900 group-hover:text-zinc-50 transition-colors">
                        복사
                      </Badge>
                    ) : (
                      <svg className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    )}
                  </div>
                );
              })
            )}
          </Card>

          {/* ★ 관리자: 링크 추가 폼이 링크 탭의 바로 밑부분에 배치! */}
          {isAdmin && (
            <Card className="border-zinc-300 bg-white shadow-md overflow-hidden animate-in fade-in mt-1">
              <CardHeader className="p-4 pb-2 bg-zinc-50 border-b border-zinc-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                    <CardTitle className="text-sm font-bold text-zinc-900">
                      관리자: 새 링크 추가하기
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border-emerald-200">
                    맨 마지막에 추가됨
                  </Badge>
                </div>
                <CardDescription className="text-xs text-zinc-500 mt-0.5">
                  추가된 링크는 Firebase(Firestore)에 자동 저장되어 영구 보존됩니다
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 pt-3">
                <form onSubmit={handleAddLink} className="flex flex-col gap-3">
                  {/* 제목 입력 칸 */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-zinc-700 flex items-center justify-between">
                      <span>제목</span>
                      <span className="text-[11px] text-zinc-400 font-normal">필수</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="예: 인스타그램, 포트폴리오, 링크드인"
                      value={newTitle}
                      onChange={(e) => {
                        setNewTitle(e.target.value);
                        if (titleError) setTitleError("");
                      }}
                      className={`bg-zinc-50/50 ${titleError ? "border-red-500 focus-visible:ring-red-400" : ""}`}
                    />
                    {titleError && (
                      <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-0.5">
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>{titleError}</span>
                      </p>
                    )}
                  </div>

                  {/* 세부 설명 입력 칸 */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-zinc-700 flex items-center justify-between">
                      <span>세부 설명</span>
                      <span className="text-[11px] text-zinc-400 font-normal">선택 (미입력 시 주소 표시)</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="예: 일상 및 개발 기록, 오픈소스 프로젝트 등"
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      className="bg-zinc-50/50"
                    />
                  </div>

                  {/* 주소 입력 칸 */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-zinc-700 flex items-center justify-between">
                      <span>주소 (URL)</span>
                      <span className="text-[11px] text-zinc-400 font-normal">필수</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="예: https://instagram.com/myname"
                      value={newUrl}
                      onChange={(e) => {
                        setNewUrl(e.target.value);
                        if (urlError) setUrlError("");
                      }}
                      className={`bg-zinc-50/50 ${urlError ? "border-red-500 focus-visible:ring-red-400" : ""}`}
                    />
                    {urlError && (
                      <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-0.5">
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>{urlError}</span>
                      </p>
                    )}
                  </div>

                  {/* 추가 버튼 */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-10 mt-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-50 text-sm font-semibold rounded-lg shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>{isSubmitting ? "저장 중..." : "링크 추가하기"}</span>
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 5. Tech Stacks Card (기술 스택 추가 및 삭제 지원) */}
        <Card className="border-zinc-200 bg-white shadow-sm">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-sm font-semibold text-zinc-900">
                  기술 스택
                </CardTitle>
                {isAdmin && (
                  <Badge variant="outline" className="text-[10px] text-amber-700 bg-amber-50 border-amber-200">
                    관리자 편집 가능
                  </Badge>
                )}
              </div>
              <span className="text-xs text-zinc-400">지속적인 학습 중</span>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 flex flex-col gap-3">
            <div className="flex flex-wrap gap-1.5">
              {techStacks.map((tech) => (
                <div key={tech.name} className="inline-flex items-center gap-1">
                  <span
                    onClick={() => isAdmin && handleToggleTechColor(tech.name)}
                    title={isAdmin ? "클릭 시 배경색 전환 (검은색 ↔ 흰색)" : undefined}
                    className={`inline-flex items-center rounded-full text-xs font-medium px-2.5 py-0.5 transition-all select-none ${
                      isAdmin ? "cursor-pointer hover:opacity-85" : ""
                    } ${
                      tech.highlight
                        ? "bg-zinc-900 text-zinc-50 border border-zinc-900 shadow-xs"
                        : "bg-white text-zinc-900 border border-zinc-200 shadow-xs"
                    }`}
                  >
                    <span>{tech.name}</span>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveTech(tech.name);
                        }}
                        className={`ml-1.5 text-[11px] font-bold transition-colors ${
                          tech.highlight ? "text-zinc-400 hover:text-red-300" : "text-zinc-400 hover:text-red-500"
                        }`}
                        title="스택 삭제"
                      >
                        ✕
                      </button>
                    )}
                  </span>
                </div>
              ))}
            </div>

            {/* 관리자: 새로운 기술 스택 추가 폼 (왼쪽 검은색/흰색 동그라미 선택기 + 줄어든 입력창 + 추가 버튼) */}
            {isAdmin && (
              <form onSubmit={handleAddTech} className="flex items-center gap-2 pt-2 border-t border-zinc-100">
                {/* 배경색 선택 동그라미 (검은색 / 흰색) */}
                <div className="flex items-center gap-1.5 shrink-0 bg-zinc-100 p-1 rounded-lg border border-zinc-200" title="배경색 선택">
                  {/* 검은색 동그라미 */}
                  <button
                    type="button"
                    onClick={() => setNewTechIsDark(true)}
                    title="검은색 배경으로 추가"
                    aria-label="검은색 배경"
                    className={`w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center transition-all cursor-pointer ${
                      newTechIsDark
                        ? "ring-2 ring-zinc-900 ring-offset-2 ring-offset-white scale-105 shadow-xs"
                        : "opacity-40 hover:opacity-75"
                    }`}
                  >
                    {newTechIsDark && (
                      <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>

                  {/* 흰색 동그라미 */}
                  <button
                    type="button"
                    onClick={() => setNewTechIsDark(false)}
                    title="흰색 배경으로 추가"
                    aria-label="흰색 배경"
                    className={`w-6 h-6 rounded-full bg-white border border-zinc-300 flex items-center justify-center transition-all cursor-pointer ${
                      !newTechIsDark
                        ? "ring-2 ring-zinc-900 ring-offset-2 ring-offset-white scale-105 shadow-xs"
                        : "opacity-40 hover:opacity-75"
                    }`}
                  >
                    {!newTechIsDark && (
                      <svg className="w-3 h-3 text-zinc-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* 기술 스택 입력창 (약간 줄어든 폭: flex-1 min-w-0) */}
                <Input
                  type="text"
                  placeholder={`새 기술 스택 (${newTechIsDark ? "검은색 배경" : "흰색 배경"})`}
                  value={newTechInput}
                  onChange={(e) => setNewTechInput(e.target.value)}
                  className="h-8 text-xs bg-zinc-50 flex-1 min-w-0"
                />

                {/* 스택 추가 버튼 */}
                <Button type="submit" size="sm" className="h-8 text-xs bg-zinc-900 text-white shrink-0 font-medium">
                  스택 추가
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* 6. About Story Card */}
        <Card className="border-zinc-200 bg-white shadow-sm">
          <CardHeader className="p-4 pb-1.5">
            <CardTitle className="text-sm font-semibold text-zinc-900">
              어떤 가치를 중요하게 생각하나요?
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <CardDescription className="text-xs text-zinc-600 leading-relaxed">
              화려한 기교보다 사용자가 직관적으로 이해할 수 있는 명확한 디자인과 구조를 선호해요. 바이브 코딩과 최신 프론트엔드 도구를 활용해 아이디어를 실질적인 서비스로 구현해 나가는 중이에요.
            </CardDescription>
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="text-center pt-2 pb-4 flex flex-col items-center gap-1 text-xs text-zinc-400">
          <p>© 2026 임세은 (asdf4500). All rights reserved.</p>
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/asdf4500/mylink"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline hover:text-zinc-600 transition-colors"
            >
              GitHub 저장소
            </a>
            <span>•</span>
            <span>Crafted with Firebase & shadcn/ui</span>
          </div>
        </footer>

      </main>
    </div>
  );
}
