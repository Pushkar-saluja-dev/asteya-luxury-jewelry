import React, { useState, FormEvent, useEffect, useRef } from "react";
import { ShieldCheck, Mail, Sparkles, Send, User as UserIcon, Settings, Scissors, Lock, LogOut, Camera } from "lucide-react";
import { motion } from "motion/react";
import { SignIn, SignUp, useUser, SignOutButton } from "@clerk/clerk-react";
import { User as UserType } from "../types";
import { checkIsAdmin } from "../lib/admin";
import { useMotionSafety } from "../lib/useMotionSafety";

interface VIPCircleProps {
  currentUser: UserType | null;
  onLogin: (name: string, email: string, avatarUrl?: string, vipTier?: string, points?: number) => void;
  onLogout: () => void;
}

const HAS_CLERK = !!(import.meta.env?.VITE_CLERK_PUBLISHABLE_KEY as string);

export default function VIPCircle(props: VIPCircleProps) {
  const safetyMode = useMotionSafety();
  return (
    <div className="max-w-7xl mx-auto px-6 pt-32 pb-24 min-h-screen">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="text-[10px] tracking-[0.4em] text-gold-classic uppercase font-outfit font-bold mb-3 block">
          MY PRIVATE VAULT
        </span>
        <h1 className="font-cinzel text-3xl sm:text-5xl tracking-widest text-[#f5f0f5] uppercase font-bold mb-4">
          Atelier Profile
        </h1>
        <p className="font-cormorant text-gray-300 italic text-md sm:text-lg">
          "Manage your sizing preferences, security credentials, and curated luxury jewelry try-on parameters from your private ASTEYA dashboard."
        </p>
      </div>

      {HAS_CLERK ? (
        <ClerkVIPCircle {...props} />
      ) : (
        <OfflineVIPCircle {...props} />
      )}
    </div>
  );
}

/* ================= CLERK AUTH WIDGET WRAPPER ================= */
function ClerkVIPCircle({ currentUser, onLogin, onLogout }: VIPCircleProps) {
  const safetyMode = useMotionSafety();
  const { user, isLoaded, isSignedIn } = useUser();
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  // Local storage sizing states
  const [ringSize, setRingSize] = useState(() => localStorage.getItem("asteya_pref_ring_size") || "7");
  const [braceletSize, setBraceletSize] = useState(() => localStorage.getItem("asteya_pref_bracelet_size") || "M");
  const [necklaceLength, setNecklaceLength] = useState(() => localStorage.getItem("asteya_pref_necklace_len") || "18\"");

  useEffect(() => {
    localStorage.setItem("asteya_pref_ring_size", ringSize);
  }, [ringSize]);

  useEffect(() => {
    localStorage.setItem("asteya_pref_bracelet_size", braceletSize);
  }, [braceletSize]);

  useEffect(() => {
    localStorage.setItem("asteya_pref_necklace_len", necklaceLength);
  }, [necklaceLength]);

  // ---- Rules of Hooks: hooks placed *above* the early-return guards below ----
  // The `if (!isLoaded) return ...` and `if (!isSignedIn) return ...` branches
  // would otherwise make these hook calls conditional, desync'ing React's hook
  // list between renders and crashing `useInsertionEffect` on mobile.
  //
  // The effect body is gated by `isSignedIn && user`, so it stays inert during
  // the very first render when Clerk is still resolving — moving it above the
  // early returns is safe.
  useEffect(() => {
    if (isSignedIn && user) {
      const email = user.primaryEmailAddress?.emailAddress || "";
      onLogin(
        user.fullName || user.firstName || "Exclusive VIP",
        email,
        user.imageUrl,
        checkIsAdmin(email) ? "Imperial Crown VIP" : "Golden Circle",
        100 // dummy reward points internally but unused visually
      );
    }
  }, [isSignedIn, user]);

  // Profile pic upload (stored in localStorage, overlays Clerk photo)
  const [localAvatar, setLocalAvatar] = useState<string | null>(
    () => localStorage.getItem("asteya_profile_pic")
  );
  const clerkFileInputRef = useRef<HTMLInputElement>(null);

  if (!isLoaded) {
    return (
      <div className="py-24 flex justify-center items-center">
        <div className="relative w-16 h-16 border border-gold-classic/20 border-t-gold-classic rounded-full animate-spin" />
      </div>
    );
  }

  // Check if Clerk user is signed in
  if (!isSignedIn) {
    return (
      <div className="max-w-md mx-auto flex flex-col items-center">
        <div className="w-full bg-[#120313]/60 border border-gold-classic/15 p-6 sm:p-8 rounded-sm text-center shadow-gold-glow mb-6">
          <ShieldCheck className="w-10 h-10 text-gold-classic mb-3 mx-auto animate-pulse" />
          <h3 className="font-cinzel text-sm tracking-widest text-[#f5f0f5] uppercase font-bold mb-2">
            ENGAGE SECURE SIGN IN
          </h3>
          <p className="font-cormorant text-xs text-gray-400 italic mb-6">
            "Enter Clerk credentials to unlock Atelier synchronization channels."
          </p>

          <div className="clerk-auth-container flex justify-center text-left bg-transparent rounded-sm text-white max-w-sm mx-auto overflow-hidden">
            {authMode === "signin" ? (
              <SignIn 
                routing="hash" 
                signUpUrl="#signup" 
                appearance={{
                  elements: {
                    card: "bg-transparent border-0 shadow-none text-white",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    socialButtonsBlockButton: "border border-gold-classic/20 bg-plum-900/40 text-white hover:bg-gold-classic/10 font-outfit text-xs",
                    formButtonPrimary: "bg-gold-gradient text-plum-950 font-bold font-outfit uppercase tracking-widest text-xs hover:shadow-gold-glow",
                    formFieldLabel: "text-gold-pale/80 font-outfit text-[10px] uppercase tracking-widest",
                    formFieldInput: "bg-plum-900 border-gold-classic/15 text-white focus:border-gold-classic",
                    footerActionText: "text-gray-400 font-outfit text-xs",
                    footerActionLink: "text-gold-classic font-bold hover:text-gold-light"
                  }
                }}
              />
            ) : (
              <SignUp 
                routing="hash" 
                signInUrl="#signin"
                appearance={{
                  elements: {
                    card: "bg-transparent border-0 shadow-none text-white",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    socialButtonsBlockButton: "border border-gold-classic/20 bg-plum-900/40 text-white hover:bg-gold-classic/10 font-outfit text-xs",
                    formButtonPrimary: "bg-gold-gradient text-plum-950 font-bold font-outfit uppercase tracking-widest text-xs hover:shadow-gold-glow",
                    formFieldLabel: "text-gold-pale/80 font-outfit text-[10px] uppercase tracking-widest",
                    formFieldInput: "bg-plum-900 border-gold-classic/15 text-white focus:border-gold-classic",
                    footerActionText: "text-gray-400 font-outfit text-xs",
                    footerActionLink: "text-gold-classic font-bold hover:text-gold-light"
                  }
                }}
              />
            )}
          </div>
        </div>

        <div className="flex gap-4 font-outfit text-[10px] uppercase tracking-widest">
          <button
            onClick={() => setAuthMode(authMode === "signin" ? "signup" : "signin")}
            className="text-gold-classic font-bold underline hover:text-gold-light"
          >
            {authMode === "signin" ? "Need an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    );
  }

  // Synthesize custom Atelier profile metadata for logged-in Clerk user
  const email = user.primaryEmailAddress?.emailAddress || "";
  const isAdmin = checkIsAdmin(email);

  const clerkVipUser: UserType = {
    id: user.id,
    name: user.fullName || user.firstName || "Exclusive VIP",
    email: email,
    vipTier: isAdmin ? "Imperial Crown VIP" : "Golden Circle",
    points: 100,
    memberSince: "May 2026",
    avatarUrl: user.imageUrl
  };

  // (localAvatar state + clerkFileInputRef were hoisted above the early-return
  //  guards so the hook order stays stable across load states — see top of this
  //  component.)

  const handleClerkAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setLocalAvatar(dataUrl);
      localStorage.setItem("asteya_profile_pic", dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const displayAvatar = localAvatar || clerkVipUser.avatarUrl;

  return (
    <motion.div
      initial={safetyMode ? false : { opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-8"
    >
      {/* Left Column: Member Info & Sizing (5 Cols) */}
      <div className="lg:col-span-5 space-y-6">
        {/* User Identity Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-sm bg-gradient-to-br from-plum-900 to-plum-950 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 bg-gold-classic/10 border-b border-l border-gold-classic/10 font-mono text-[8px] tracking-widest text-[#dac174] uppercase font-bold">
            Verified
          </div>

          <div className="flex items-center gap-4">
            {/* Clickable avatar upload zone */}
            <div className="relative group cursor-pointer shrink-0" onClick={() => clerkFileInputRef.current?.click()}>
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gold-classic/40 bg-plum-900 flex items-center justify-center transition-all group-hover:border-gold-classic">
                {displayAvatar ? (
                  <img src={displayAvatar} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon className="w-6 h-6 text-gold-pale" />
                )}
              </div>
              {/* Hover overlay */}
              <div className="absolute inset-0 rounded-full bg-black/55 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>
            <input
              ref={clerkFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleClerkAvatarUpload}
            />
            <div>
              <h3 className="font-cinzel text-md tracking-wider text-[#f5f0f5] font-bold uppercase">
                {clerkVipUser.name}
              </h3>
              <span className="text-[9px] tracking-[0.25em] text-gold-classic font-outfit uppercase mt-0.5 block font-semibold">
                {clerkVipUser.vipTier}
              </span>
            </div>
          </div>
        </div>

        {/* Jewelry Sizing Preferences */}
        <div className="glass-panel p-6 sm:p-8 rounded-sm bg-plum-950/20 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <Scissors className="w-4 h-4 text-gold-classic" />
            <span className="font-cinzel text-xs tracking-widest text-[#f5f0f5] uppercase font-bold">
              Jewelry Size Preferences
            </span>
          </div>

          {/* Ring Size Selector */}
          <div className="space-y-2">
            <label className="text-[9px] uppercase tracking-widest text-gray-400 block">Ring Size Preference</label>
            <div className="flex gap-2.5">
              {["5", "6", "7", "8", "9"].map((size) => (
                <button
                  key={size}
                  onClick={() => setRingSize(size)}
                  className={`flex-1 py-2 text-xs font-mono rounded-sm transition-all border cursor-pointer ${
                    ringSize === size
                      ? "bg-gold-gradient text-plum-950 border-gold-classic shadow-gold-soft font-bold"
                      : "bg-plum-900/40 text-gray-400 border-gold-classic/10 hover:border-gold-classic/30"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Bracelet Size Selector */}
          <div className="space-y-2">
            <label className="text-[9px] uppercase tracking-widest text-gray-400 block">Bracelet / Cuff Size</label>
            <div className="flex gap-2.5">
              {["S", "M", "L"].map((size) => (
                <button
                  key={size}
                  onClick={() => setBraceletSize(size)}
                  className={`flex-1 py-2 text-xs font-mono rounded-sm transition-all border cursor-pointer ${
                    braceletSize === size
                      ? "bg-gold-gradient text-plum-950 border-gold-classic shadow-gold-soft font-bold"
                      : "bg-plum-900/40 text-gray-400 border-gold-classic/10 hover:border-gold-classic/30"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Necklace preferred length */}
          <div className="space-y-2">
            <label className="text-[9px] uppercase tracking-widest text-gray-400 block">Necklace Length</label>
            <div className="flex gap-2.5">
              {["16\"", "18\"", "20\"", "22\""].map((len) => (
                <button
                  key={len}
                  onClick={() => setNecklaceLength(len)}
                  className={`flex-1 py-2 text-xs font-mono rounded-sm transition-all border cursor-pointer ${
                    necklaceLength === len
                      ? "bg-gold-gradient text-plum-950 border-gold-classic shadow-gold-soft font-bold"
                      : "bg-plum-900/40 text-gray-400 border-gold-classic/10 hover:border-gold-classic/30"
                  }`}
                >
                  {len}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Preferences & Security details (7 Cols) */}
      <div className="lg:col-span-7 glass-panel p-6 sm:p-8 rounded-sm space-y-6">
        <h3 className="font-cinzel text-sm tracking-[0.2em] text-[#f5f0f5] uppercase font-bold mb-4 border-b border-gold-classic/10 pb-3">
          Atelier Preferences & Security
        </h3>

        {/* Curation Info */}
        <div className="space-y-5">
          <div className="flex gap-4 p-4 border border-gold-classic/5 bg-plum-950/15 rounded-sm">
            <div className="p-3 bg-gold-classic/5 border border-gold-classic/15 rounded-sm h-fit shrink-0">
              <Settings className="w-5 h-5 text-gold-classic" />
            </div>
            <div>
              <h4 className="font-cinzel text-xs sm:text-sm text-[#f5f0f5] tracking-widest uppercase font-semibold mb-1">
                Active Virtual Try-On Session
              </h4>
              <p className="font-cormorant text-gray-400 italic text-sm leading-relaxed">
                Your face mesh matrices, manual coordinate offsets, and jewelry scale settings are securely cached in this active browser session for real-time try-on rendering.
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-4 border border-gold-classic/5 bg-plum-950/15 rounded-sm">
            <div className="p-3 bg-gold-classic/5 border border-gold-classic/15 rounded-sm h-fit shrink-0">
              <Mail className="w-5 h-5 text-gold-classic" />
            </div>
            <div>
              <h4 className="font-cinzel text-xs sm:text-sm text-[#f5f0f5] tracking-widest uppercase font-semibold mb-1">
                Atelier Communications
              </h4>
              <p className="font-cormorant text-gray-400 italic text-sm leading-relaxed">
                Registered to: <span className="text-white font-mono text-xs">{clerkVipUser.email}</span>. Premium updates, collection launches, and bespoke sizing requests are channeled through this address.
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-4 border border-gold-classic/5 bg-plum-950/15 rounded-sm">
            <div className="p-3 bg-gold-classic/5 border border-gold-classic/15 rounded-sm h-fit shrink-0">
              <Lock className="w-5 h-5 text-gold-classic" />
            </div>
            <div>
              <h4 className="font-cinzel text-xs sm:text-sm text-[#f5f0f5] tracking-widest uppercase font-semibold mb-1">
                Private Security Ledger
              </h4>
              <p className="font-cormorant text-gray-400 italic text-sm leading-relaxed">
                Visual snapshots snapped during camera sessions and uploaded images are processed entirely on your local machine and never transmitted to our servers, keeping your identity private.
              </p>
            </div>
          </div>
        </div>

        {/* Action Logout */}
        <div className="pt-6 border-t border-gold-classic/10 flex justify-end">
          <SignOutButton>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 py-3 px-6 border border-gold-classic/20 hover:border-gold-classic/60 bg-[#120313]/40 text-gold-pale hover:text-gold-classic font-outfit text-[10px] tracking-widest uppercase font-semibold rounded-sm transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out from Atelier
            </button>
          </SignOutButton>
        </div>
      </div>
    </motion.div>
  );
}

/* ================= OFFLINE FALLBACK WIDGET ================= */
function OfflineVIPCircle({ currentUser, onLogin, onLogout }: VIPCircleProps) {
  const safetyMode = useMotionSafety();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Local storage sizing states
  const [ringSize, setRingSize] = useState(() => localStorage.getItem("asteya_pref_ring_size") || "7");
  const [braceletSize, setBraceletSize] = useState(() => localStorage.getItem("asteya_pref_bracelet_size") || "M");
  const [necklaceLength, setNecklaceLength] = useState(() => localStorage.getItem("asteya_pref_necklace_len") || "18\"");

  // Profile picture upload (saved in localStorage)
  const [localAvatar, setLocalAvatar] = useState<string | null>(() => localStorage.getItem("asteya_profile_pic"));
  const offlineFileInputRef = useRef<HTMLInputElement>(null);

  const handleOfflineAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setLocalAvatar(dataUrl);
      localStorage.setItem("asteya_profile_pic", dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const offlineDisplayAvatar = localAvatar || currentUser?.avatarUrl;


  useEffect(() => {
    localStorage.setItem("asteya_pref_ring_size", ringSize);
  }, [ringSize]);

  useEffect(() => {
    localStorage.setItem("asteya_pref_bracelet_size", braceletSize);
  }, [braceletSize]);

  useEffect(() => {
    localStorage.setItem("asteya_pref_necklace_len", necklaceLength);
  }, [necklaceLength]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;
    setSubmitting(true);
    setTimeout(() => {
      onLogin(name, email);
      setSubmitting(false);
    }, 1200);
  };

  return (
    <>
      {!currentUser ? (
        <motion.div
          initial={safetyMode ? false : { opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto glass-panel p-6 sm:p-8 rounded-sm bg-[#120313]/50 border-gold-classic/15 relative overflow-hidden"
        >
          <div className="flex flex-col items-center justify-center text-center mb-8">
            <ShieldCheck className="w-10 h-10 text-gold-classic mb-3 animate-pulse" />
            <h3 className="font-cinzel text-sm tracking-widest text-[#f5f0f5] uppercase font-bold">
              ASTEYA ATELIER REGISTRY
            </h3>
            <p className="font-cormorant text-xs text-gray-400 mt-1.5 italic">
              "Enter your preferences to establish your private profile and calibrate your try-on bounds."
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 font-outfit">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-gold-pale/70 block">
                Your Full First Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Christian Dior"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-plum-900 border border-gold-classic/15 focus:border-gold-classic/60 p-3.5 text-xs rounded-sm text-[#f5f0f5] placeholder-gray-600 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-gold-pale/70 block">
                Exclusive VIP Email
              </label>
              <input
                type="email"
                required
                placeholder="vip@asteya-paris.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-plum-900 border border-gold-classic/15 focus:border-gold-classic/60 p-3.5 text-xs rounded-sm text-[#f5f0f5] placeholder-gray-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-gold-gradient disabled:bg-gold-classic/20 text-plum-950 font-bold font-outfit text-xs tracking-[0.25em] uppercase rounded-sm hover:shadow-gold-glow transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              {submitting ? "ESTABLISHING ATELIER VAULT..." : "ENGAGE ACCOUNT SECURE"}
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </motion.div>
      ) : (
        <motion.div
          initial={safetyMode ? false : { opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
          {/* Left Column: Member Info & Sizing */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel p-6 sm:p-8 rounded-sm bg-gradient-to-br from-plum-900 to-plum-950 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 bg-gold-classic/10 border-b border-l border-gold-classic/10 font-mono text-[9px] text-[#dac174]">
                ASTEYA C-6
              </div>

              <div className="flex items-center gap-4">
                {/* Clickable avatar upload zone */}
                <div className="relative group cursor-pointer shrink-0" onClick={() => offlineFileInputRef.current?.click()}>
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gold-classic/40 bg-plum-900 flex items-center justify-center transition-all group-hover:border-gold-classic">
                    {offlineDisplayAvatar ? (
                      <img src={offlineDisplayAvatar} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <UserIcon className="w-6 h-6 text-gold-pale" />
                    )}
                  </div>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 rounded-full bg-black/55 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </div>
                <input
                  ref={offlineFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleOfflineAvatarUpload}
                />
                <div>
                  <h3 className="font-cinzel text-md tracking-wider text-[#f5f0f5] font-bold uppercase">
                    {currentUser.name}
                  </h3>
                  <span className="text-[9px] tracking-[0.25em] text-gold-classic font-outfit uppercase mt-0.5 block font-semibold">
                    {currentUser.vipTier || "Exclusive Member"}
                  </span>
                </div>
              </div>
            </div>

            {/* Jewelry Sizing Preferences */}
            <div className="glass-panel p-6 sm:p-8 rounded-sm bg-plum-950/20 space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <Scissors className="w-4 h-4 text-gold-classic" />
                <span className="font-cinzel text-xs tracking-widest text-[#f5f0f5] uppercase font-bold">
                  Jewelry Size Preferences
                </span>
              </div>

              {/* Ring Size Selector */}
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-widest text-gray-400 block">Ring Size Preference</label>
                <div className="flex gap-2.5">
                  {["5", "6", "7", "8", "9"].map((size) => (
                    <button
                      key={size}
                      onClick={() => setRingSize(size)}
                      className={`flex-1 py-2 text-xs font-mono rounded-sm transition-all border cursor-pointer ${
                        ringSize === size
                          ? "bg-gold-gradient text-plum-950 border-gold-classic shadow-gold-soft font-bold"
                          : "bg-plum-900/40 text-gray-400 border-gold-classic/10 hover:border-gold-classic/30"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bracelet Size Selector */}
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-widest text-gray-400 block">Bracelet / Cuff Size</label>
                <div className="flex gap-2.5">
                  {["S", "M", "L"].map((size) => (
                    <button
                      key={size}
                      onClick={() => setBraceletSize(size)}
                      className={`flex-1 py-2 text-xs font-mono rounded-sm transition-all border cursor-pointer ${
                        braceletSize === size
                          ? "bg-gold-gradient text-plum-950 border-gold-classic shadow-gold-soft font-bold"
                          : "bg-plum-900/40 text-gray-400 border-gold-classic/10 hover:border-gold-classic/30"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Necklace preferred length */}
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-widest text-gray-400 block">Necklace Length</label>
                <div className="flex gap-2.5">
                  {["16\"", "18\"", "20\"", "22\""].map((len) => (
                    <button
                      key={len}
                      onClick={() => setNecklaceLength(len)}
                      className={`flex-1 py-2 text-xs font-mono rounded-sm transition-all border cursor-pointer ${
                        necklaceLength === len
                          ? "bg-gold-gradient text-plum-950 border-gold-classic shadow-gold-soft font-bold"
                          : "bg-plum-900/40 text-gray-400 border-gold-classic/10 hover:border-gold-classic/30"
                      }`}
                    >
                      {len}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Preferences & Security details */}
          <div className="lg:col-span-7 glass-panel p-6 sm:p-8 rounded-sm space-y-6">
            <h3 className="font-cinzel text-sm tracking-[0.2em] text-[#f5f0f5] uppercase font-bold mb-4 border-b border-gold-classic/10 pb-3">
              Atelier Preferences & Security
            </h3>

            {/* Curation Info */}
            <div className="space-y-5">
              <div className="flex gap-4 p-4 border border-gold-classic/5 bg-plum-950/15 rounded-sm">
                <div className="p-3 bg-gold-classic/5 border border-gold-classic/15 rounded-sm h-fit shrink-0">
                  <Settings className="w-5 h-5 text-gold-classic" />
                </div>
                <div>
                  <h4 className="font-cinzel text-xs sm:text-sm text-[#f5f0f5] tracking-widest uppercase font-semibold mb-1">
                    Active Virtual Try-On Session
                  </h4>
                  <p className="font-cormorant text-gray-400 italic text-sm leading-relaxed">
                    Your face mesh matrices, manual coordinate offsets, and jewelry scale settings are securely cached in this active browser session for real-time try-on rendering.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 border border-gold-classic/5 bg-plum-950/15 rounded-sm">
                <div className="p-3 bg-gold-classic/5 border border-gold-classic/15 rounded-sm h-fit shrink-0">
                  <Mail className="w-5 h-5 text-gold-classic" />
                </div>
                <div>
                  <h4 className="font-cinzel text-xs sm:text-sm text-[#f5f0f5] tracking-widest uppercase font-semibold mb-1">
                    Atelier Communications
                  </h4>
                  <p className="font-cormorant text-gray-400 italic text-sm leading-relaxed">
                    Registered to: <span className="text-white font-mono text-xs">{currentUser.email}</span>. Premium updates, collection launches, and bespoke sizing requests are channeled through this address.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 border border-gold-classic/5 bg-plum-950/15 rounded-sm">
                <div className="p-3 bg-gold-classic/5 border border-gold-classic/15 rounded-sm h-fit shrink-0">
                  <Lock className="w-5 h-5 text-gold-classic" />
                </div>
                <div>
                  <h4 className="font-cinzel text-xs sm:text-sm text-[#f5f0f5] tracking-widest uppercase font-semibold mb-1">
                    Private Security Ledger
                  </h4>
                  <p className="font-cormorant text-gray-400 italic text-sm leading-relaxed">
                    Visual snapshots snapped during camera sessions and uploaded images are processed entirely on your local machine and never transmitted to our servers, keeping your identity private.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Logout */}
            <div className="pt-6 border-t border-gold-classic/10 flex justify-end">
              <button
                onClick={onLogout}
                className="flex items-center gap-2 py-3 px-6 border border-gold-classic/20 hover:border-gold-classic/60 bg-[#120313]/40 text-gold-pale hover:text-gold-classic font-outfit text-[10px] tracking-widest uppercase font-semibold rounded-sm transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Exit Profile Session
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}
