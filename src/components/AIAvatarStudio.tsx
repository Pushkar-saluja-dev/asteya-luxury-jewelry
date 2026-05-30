import React, { useState, useEffect } from "react";
import {
  Sparkles, User, Save, RefreshCw, Check, Info,
  ChevronRight, ChevronLeft, Palette, Scissors, Glasses,
  Sun, Eye
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product } from "../types";

interface AIAvatarStudioProps {
  onRegisterAvatar: (avatarUrl: string, name: string) => void;
  currentUser: any;
}

/* ===== CUSTOMIZATION DATA ===== */
const SKIN_TONES = [
  { id: "porcelain", name: "Porcelain", base: "#f7e4d0", shadow: "#ddb898", highlight: "#fff6ef" },
  { id: "ivory", name: "Warm Ivory", base: "#eecfa8", shadow: "#ca9e6a", highlight: "#fde8cc" },
  { id: "beige", name: "Golden Beige", base: "#d4956a", shadow: "#a86840", highlight: "#e8b888" },
  { id: "honey", name: "Honey Glow", base: "#b87848", shadow: "#8a5030", highlight: "#d09060" },
  { id: "caramel", name: "Caramel", base: "#966040", shadow: "#703820", highlight: "#b47858" },
  { id: "bronze", name: "Deep Bronze", base: "#6e4028", shadow: "#4e2810", highlight: "#8c5838" },
  { id: "espresso", name: "Espresso", base: "#3a1c0c", shadow: "#200c04", highlight: "#582c18" },
];

const FACE_SHAPES = [
  { id: "oval", name: "Oval", rx: 16, ry: 20 },
  { id: "round", name: "Round", rx: 18, ry: 18 },
  { id: "heart", name: "Heart", rx: 15, ry: 20 },
  { id: "diamond", name: "Diamond", rx: 14, ry: 22 },
];

const HAIRSTYLES = [
  { id: "none", name: "Shaved" },
  { id: "short-waves", name: "Short Waves" },
  { id: "bob", name: "Sleek Bob" },
  { id: "long-straight", name: "Long Straight" },
  { id: "curly-medium", name: "Curly Medium" },
  { id: "afro", name: "Regal Afro" },
  { id: "bun", name: "High Bun" },
  { id: "braids", name: "Braids" },
];

const HAIR_COLORS = [
  { id: "jet-black", name: "Jet Black", hex: "#141414", highlight: "#303030" },
  { id: "dark-brown", name: "Dark Brown", hex: "#2c1a0e", highlight: "#4a2e18" },
  { id: "chestnut", name: "Chestnut", hex: "#6b3a22", highlight: "#9a5c38" },
  { id: "auburn", name: "Auburn", hex: "#8b2020", highlight: "#c43434" },
  { id: "honey-blonde", name: "Honey Blonde", hex: "#c8922a", highlight: "#e8bb5a" },
  { id: "platinum", name: "Platinum", hex: "#d0c8bc", highlight: "#ede8e2" },
  { id: "silver", name: "Silver", hex: "#888888", highlight: "#b8b8b8" },
  { id: "deep-violet", name: "Deep Violet", hex: "#3d1560", highlight: "#6b3090" },
  { id: "emerald", name: "Emerald", hex: "#135040", highlight: "#227060" },
];

const EYE_COLORS = [
  { id: "dark-brown", name: "Dark Brown", iris: "#3c2010", pupil: "#0a0a0a" },
  { id: "hazel", name: "Hazel", iris: "#7a5c2a", pupil: "#1a0e00" },
  { id: "green", name: "Emerald Green", iris: "#2d6a4f", pupil: "#0a1f14" },
  { id: "blue", name: "Ocean Blue", iris: "#2a5fa8", pupil: "#0a1f40" },
  { id: "grey", name: "Storm Grey", iris: "#5a6a78", pupil: "#1a2030" },
  { id: "amber", name: "Amber", iris: "#c68e00", pupil: "#3a2800" },
];

const LIP_COLORS = [
  { id: "natural", name: "Natural", color: "#b86858" },
  { id: "nude", name: "Nude Velvet", color: "#b88878" },
  { id: "rose", name: "Rose Gold", color: "#b84868" },
  { id: "wine", name: "Vintage Wine", color: "#801838" },
  { id: "coral", name: "Coral", color: "#c85838" },
  { id: "berry", name: "Deep Berry", color: "#581030" },
  { id: "clear", name: "Glass", color: "#cc9888" },
];

const EYEBROW_STYLES = [
  { id: "natural", name: "Natural Arc" },
  { id: "arched", name: "High Arch" },
  { id: "straight", name: "Straight" },
  { id: "full", name: "Full & Bold" },
];

const ACCESSORIES = [
  { id: "none", name: "None" },
  { id: "round-gold", name: "Round Gold" },
  { id: "cat-eye", name: "Cat-Eye Gold" },
  { id: "oversized", name: "Oversized Black" },
];

const LIGHTING = [
  {
    id: "atelier",
    name: "Warm Atelier",
    bg: "radial-gradient(ellipse at 30% 30%, #3d1a2a 0%, #1a0820 60%, #0a0310 100%)",
    ambient: "rgba(200,155,80,0.18)",
    rimLight: "rgba(240,200,120,0.25)",
  },
  {
    id: "studio",
    name: "Pure Studio",
    bg: "radial-gradient(ellipse at 50% 20%, #252030 0%, #0f0c18 60%, #060410 100%)",
    ambient: "rgba(200,200,240,0.15)",
    rimLight: "rgba(220,220,255,0.22)",
  },
  {
    id: "golden",
    name: "Golden Hour",
    bg: "radial-gradient(ellipse at 70% 30%, #2a1800 0%, #180e00 60%, #080400 100%)",
    ambient: "rgba(255,180,50,0.2)",
    rimLight: "rgba(255,220,100,0.28)",
  },
  {
    id: "midnight",
    name: "Velvet Midnight",
    bg: "radial-gradient(ellipse at 50% 10%, #0e1e38 0%, #050a18 60%, #020408 100%)",
    ambient: "rgba(80,120,255,0.18)",
    rimLight: "rgba(100,150,255,0.22)",
  },
];

/* ===== AVATAR SVG RENDERER ===== */
let _instanceId = 0;

function AvatarSVG({
  gender,
  skinTone,
  faceShape,
  hairstyle,
  hairColor,
  eyeColor,
  lipColor,
  eyebrowStyle,
  accessory,
  lighting,
  activeJewelry,
}: any) {
  // Unique prefix so gradient IDs don't clash between multiple SVG elements
  const [uid] = React.useState(() => `avt${++_instanceId}`);

  const sk = skinTone;   // skin
  const fc = faceShape;  // face shape
  const hr = hairColor;  // hair
  const ec = eyeColor;   // eye color
  const lp = lipColor;   // lip

  const cx = 100;        // face center X
  const cy = 102;        // face center Y
  const lx = cx - fc.rx; // left face edge
  const rx = cx + fc.rx; // right face edge

  // Eye center X positions
  const lex = lx + 13;  // left eye X
  const rex = rx - 13;  // right eye X
  const ey = 93;        // eye Y

  return (
    <svg
      viewBox="0 0 200 235"
      className="w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      <defs>
        {/* Skin — radial for 3D depth */}
        <radialGradient id={`${uid}s`} cx="42%" cy="28%" r="68%">
          <stop offset="0%" stopColor={sk.highlight} />
          <stop offset="45%" stopColor={sk.base} />
          <stop offset="100%" stopColor={sk.shadow} />
        </radialGradient>
        {/* Neck linear */}
        <linearGradient id={`${uid}n`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={sk.shadow} stopOpacity="0.9" />
          <stop offset="38%" stopColor={sk.base} />
          <stop offset="100%" stopColor={sk.shadow} stopOpacity="0.9" />
        </linearGradient>
        {/* Hair — radial */}
        <radialGradient id={`${uid}h`} cx="36%" cy="16%" r="74%">
          <stop offset="0%" stopColor={hr.highlight} />
          <stop offset="52%" stopColor={hr.hex} />
          <stop offset="100%" stopColor={hr.hex} stopOpacity="0.82" />
        </radialGradient>
        {/* Iris */}
        <radialGradient id={`${uid}i`} cx="36%" cy="30%" r="64%">
          <stop offset="0%" stopColor={ec.iris} stopOpacity="0.7" />
          <stop offset="100%" stopColor={ec.iris} />
        </radialGradient>
        {/* Eye white */}
        <radialGradient id={`${uid}ew`} cx="40%" cy="36%" r="60%">
          <stop offset="0%" stopColor="#f8f5f2" />
          <stop offset="100%" stopColor="#e0dbd6" />
        </radialGradient>
        {/* Rim light */}
        <radialGradient id={`${uid}r`} cx="86%" cy="46%" r="54%">
          <stop offset="0%" stopColor={lighting.rimLight} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        {/* Cheek blush */}
        <radialGradient id={`${uid}b`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={lp.color} stopOpacity="0.26" />
          <stop offset="100%" stopColor={lp.color} stopOpacity="0" />
        </radialGradient>
        {/* Clothing */}
        <linearGradient id={`${uid}c`} x1="0%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#1e102c" />
          <stop offset="100%" stopColor="#0b0414" />
        </linearGradient>
        {/* Lashes */}
        <linearGradient id={`${uid}l`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#080808" />
          <stop offset="100%" stopColor="#252525" />
        </linearGradient>
      </defs>

      {/* ── LAYER 1: Background glow ── */}
      <ellipse cx="100" cy="218" rx="78" ry="18" fill={lighting.ambient} opacity="0.28" />

      {/* ── LAYER 2: Clothing/Shoulders ── */}
      {gender === "female" ? (
        <path
          d="M 32 235 C 30 204, 46 183, 70 174 C 80 170, 90 168, 100 168 C 110 168, 120 170, 130 174 C 154 183, 170 204, 168 235 Z"
          fill={`url(#${uid}c)`}
          stroke="rgba(215,175,95,0.06)"
          strokeWidth="0.5"
        />
      ) : (
        <path
          d="M 18 235 C 16 202, 36 180, 66 172 C 78 168, 90 166, 100 165 C 110 166, 122 168, 134 172 C 164 180, 184 202, 182 235 Z"
          fill={`url(#${uid}c)`}
          stroke="rgba(215,175,95,0.06)"
          strokeWidth="0.5"
        />
      )}

      {/* ── LAYER 3: HAIR — back portions (behind face) ── */}

      {/* Long straight: side curtains behind face */}
      {hairstyle === "long-straight" && (
        <>
          <path d="M 82 98 C 78 118, 76 150, 72 185 C 70 205, 68 220, 66 235"
            stroke={hr.hex} strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.92" />
          <path d="M 83 98 C 79 118, 77 150, 73 185 C 71 205, 69 220, 67 235"
            stroke={hr.highlight} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.2" />
          <path d="M 118 98 C 122 118, 124 150, 128 185 C 130 205, 132 220, 134 235"
            stroke={hr.hex} strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.92" />
          <path d="M 117 98 C 121 118, 123 150, 127 185 C 129 205, 131 220, 133 235"
            stroke={hr.highlight} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.2" />
        </>
      )}

      {/* Braids: braid falls behind face */}
      {hairstyle === "braids" && (
        <>
          <path d="M 83 98 C 80 112, 79 132, 78 155 C 77 175, 76 198, 76 220"
            stroke={hr.hex} strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.94" />
          <path d="M 83 98 C 81 112, 80 132, 79 155 C 78 175, 77 198, 77 220"
            stroke={hr.highlight} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.26" />
          <path d="M 117 98 C 120 112, 121 132, 122 155 C 123 175, 124 198, 124 220"
            stroke={hr.hex} strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.94" />
          <path d="M 117 98 C 119 112, 120 132, 121 155 C 122 175, 123 198, 123 220"
            stroke={hr.highlight} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.26" />
        </>
      )}

      {/* Curly: side curls */}
      {hairstyle === "curly-medium" && (
        <>
          <circle cx="81" cy="98" r="10" fill={hr.hex} opacity="0.92" />
          <circle cx="119" cy="98" r="10" fill={hr.hex} opacity="0.92" />
          <circle cx="79" cy="110" r="9" fill={hr.hex} opacity="0.88" />
          <circle cx="121" cy="110" r="9" fill={hr.hex} opacity="0.88" />
        </>
      )}

      {/* Afro: side puffs */}
      {hairstyle === "afro" && (
        <>
          <circle cx="77" cy="98" r="14" fill={hr.hex} opacity="0.92" />
          <circle cx="123" cy="98" r="14" fill={hr.hex} opacity="0.92" />
          <circle cx="75" cy="112" r="12" fill={hr.hex} opacity="0.86" />
          <circle cx="125" cy="112" r="12" fill={hr.hex} opacity="0.86" />
        </>
      )}

      {/* Bob: lower side curtain */}
      {hairstyle === "bob" && (
        <>
          <path d={`M ${lx + 2} 108 C ${lx} 118, ${lx} 128, ${lx + 2} 136 C ${lx + 8} 142, 93 144, 100 144 C 107 144, ${rx - 8} 142, ${rx - 2} 136 C ${rx} 128, ${rx} 118, ${rx - 2} 108`}
            fill={`url(#${uid}h)`} opacity="0.96" />
        </>
      )}

      {/* ── LAYER 4: Neck ── */}
      <rect
        x={gender === "female" ? "88" : "85"}
        y={cy + fc.ry - 2}
        width={gender === "female" ? "24" : "30"}
        height="32"
        rx="11"
        fill={`url(#${uid}n)`}
      />
      <ellipse
        cx="100" cy={cy + fc.ry + 26}
        rx={gender === "female" ? "12" : "16"} ry="4"
        fill={sk.shadow} opacity="0.22"
      />

      {/* ── LAYER 5: Ear lobes ── */}
      <ellipse cx={lx - 3} cy={cy + 4} rx="5.5" ry="8" fill={sk.base} />
      <ellipse cx={lx - 3} cy={cy + 4} rx="3" ry="4.5" fill={sk.shadow} opacity="0.2" />
      <ellipse cx={rx + 3} cy={cy + 4} rx="5.5" ry="8" fill={sk.base} />
      <ellipse cx={rx + 3} cy={cy + 4} rx="3" ry="4.5" fill={sk.shadow} opacity="0.2" />

      {/* ── LAYER 6: FACE (always on top of hair-back) ── */}
      <ellipse cx={cx} cy={cy} rx={fc.rx} ry={fc.ry} fill={`url(#${uid}s)`} />
      {/* Rim light overlay */}
      <ellipse cx={cx} cy={cy} rx={fc.rx} ry={fc.ry} fill={`url(#${uid}r)`} opacity="0.38" />
      {/* Chin shadow */}
      <ellipse cx={cx} cy={cy + fc.ry - 5} rx={fc.rx - 5} ry="5" fill={sk.shadow} opacity="0.18" />

      {/* ── LAYER 7: HAIR — top cap (forehead/crown, drawn over face top) ── */}

      {hairstyle === "short-waves" && (
        <>
          <path
            d={`M ${lx + 4} 88 C ${lx + 4} 66, ${rx - 4} 66, ${rx - 4} 88 C ${rx - 6} 91, ${rx - 12} 90, 100 90 C ${lx + 12} 90, ${lx + 6} 91, ${lx + 4} 88 Z`}
            fill={`url(#${uid}h)`}
          />
          <path d={`M ${lx + 10} 72 C 100 65, ${rx - 10} 72, ${rx - 10} 72`}
            fill="none" stroke={hr.highlight} strokeWidth="0.9" opacity="0.28" />
          <path d={`M ${lx + 4} 90 C ${lx + 2} 100, ${lx + 3} 108, ${lx + 5} 112`}
            stroke={hr.hex} strokeWidth="3" fill="none" opacity="0.7" />
          <path d={`M ${rx - 4} 90 C ${rx - 2} 100, ${rx - 3} 108, ${rx - 5} 112`}
            stroke={hr.hex} strokeWidth="3" fill="none" opacity="0.7" />
        </>
      )}

      {hairstyle === "bob" && (
        <>
          <path
            d={`M ${lx + 4} 88 C ${lx + 4} 65, ${rx - 4} 65, ${rx - 4} 88 C ${rx - 6} 92, ${rx - 12} 91, 100 91 C ${lx + 12} 91, ${lx + 6} 92, ${lx + 4} 88 Z`}
            fill={`url(#${uid}h)`}
          />
          <path d={`M ${lx + 10} 72 C 100 64, ${rx - 10} 72, ${rx - 10} 72`}
            fill="none" stroke={hr.highlight} strokeWidth="1" opacity="0.26" />
        </>
      )}

      {hairstyle === "long-straight" && (
        <>
          <path
            d={`M ${lx + 4} 88 C ${lx + 4} 65, ${rx - 4} 65, ${rx - 4} 88 C ${rx - 6} 92, ${rx - 12} 91, 100 91 C ${lx + 12} 91, ${lx + 6} 92, ${lx + 4} 88 Z`}
            fill={`url(#${uid}h)`}
          />
          <path d={`M ${lx + 10} 72 C 100 64, ${rx - 10} 72, ${rx - 10} 72`}
            fill="none" stroke={hr.highlight} strokeWidth="1" opacity="0.26" />
        </>
      )}

      {hairstyle === "curly-medium" && (
        <>
          <circle cx="100" cy="70" r="18" fill={`url(#${uid}h)`} />
          <circle cx="88" cy="74" r="13" fill={hr.hex} />
          <circle cx="112" cy="74" r="13" fill={hr.hex} />
          <circle cx="92" cy="65" r="12" fill={`url(#${uid}h)`} />
          <circle cx="108" cy="65" r="12" fill={`url(#${uid}h)`} />
          <circle cx="96" cy="62" r="5.5" fill={hr.highlight} opacity="0.26" />
          <circle cx="107" cy="60" r="4.5" fill={hr.highlight} opacity="0.2" />
        </>
      )}

      {hairstyle === "afro" && (
        <>
          <circle cx="100" cy="66" r="24" fill={`url(#${uid}h)`} />
          <circle cx="84" cy="70" r="17" fill={hr.hex} />
          <circle cx="116" cy="70" r="17" fill={hr.hex} />
          <circle cx="88" cy="56" r="15" fill={`url(#${uid}h)`} />
          <circle cx="112" cy="56" r="15" fill={`url(#${uid}h)`} />
          <ellipse cx="98" cy="57" rx="12" ry="7" fill={hr.highlight} opacity="0.2" />
        </>
      )}

      {hairstyle === "bun" && (
        <>
          <path
            d={`M ${lx + 4} 88 C ${lx + 4} 68, ${rx - 4} 68, ${rx - 4} 88 C ${rx - 6} 91, ${rx - 12} 90, 100 90 C ${lx + 12} 90, ${lx + 6} 91, ${lx + 4} 88 Z`}
            fill={`url(#${uid}h)`}
          />
          <circle cx="100" cy="60" r="15" fill={`url(#${uid}h)`} />
          <path d="M 88 60 Q 100 53 112 60 Q 100 67 88 60"
            fill="none" stroke={hr.highlight} strokeWidth="0.9" opacity="0.3" />
          <line x1="94" y1="56" x2="106" y2="64" stroke="#d4af37" strokeWidth="0.9" opacity="0.62" />
        </>
      )}

      {hairstyle === "braids" && (
        <>
          <path
            d={`M ${lx + 4} 88 C ${lx + 4} 68, ${rx - 4} 68, ${rx - 4} 88 C ${rx - 6} 90, ${rx - 12} 89, 100 89 C ${lx + 12} 89, ${lx + 6} 90, ${lx + 4} 88 Z`}
            fill={`url(#${uid}h)`}
          />
          <path d={`M ${lx + 10} 73 C 100 66, ${rx - 10} 73, ${rx - 10} 73`}
            fill="none" stroke={hr.highlight} strokeWidth="0.8" opacity="0.25" />
        </>
      )}

      {/* Shaved — subtle texture shadow */}
      {hairstyle === "none" && (
        <ellipse cx="100" cy={cy - fc.ry + 6} rx={fc.rx - 1} ry="14"
          fill={hr.hex} opacity="0.14" />
      )}

      {/* ── LAYER 8: Cheek blush ── */}
      <ellipse cx={lx + 8} cy={cy + 8} rx="11" ry="7" fill={`url(#${uid}b)`} />
      <ellipse cx={rx - 8} cy={cy + 8} rx="11" ry="7" fill={`url(#${uid}b)`} />

      {/* ── LAYER 9: Eyebrows ── */}
      {eyebrowStyle === "natural" && (
        <>
          <path d={`M ${lex - 7} 84 Q ${lex} 81 ${lex + 7} 83`}
            fill="none" stroke={hr.hex} strokeWidth="2" strokeLinecap="round" opacity="0.9" />
          <path d={`M ${rex - 7} 83 Q ${rex} 81 ${rex + 7} 84`}
            fill="none" stroke={hr.hex} strokeWidth="2" strokeLinecap="round" opacity="0.9" />
        </>
      )}
      {eyebrowStyle === "arched" && (
        <>
          <path d={`M ${lex - 7} 86 Q ${lex} 79 ${lex + 8} 84`}
            fill="none" stroke={hr.hex} strokeWidth="2.1" strokeLinecap="round" opacity="0.92" />
          <path d={`M ${rex - 8} 84 Q ${rex} 79 ${rex + 7} 86`}
            fill="none" stroke={hr.hex} strokeWidth="2.1" strokeLinecap="round" opacity="0.92" />
        </>
      )}
      {eyebrowStyle === "straight" && (
        <>
          <line x1={lex - 7} y1="83" x2={lex + 8} y2="83"
            stroke={hr.hex} strokeWidth="2.4" strokeLinecap="round" opacity="0.92" />
          <line x1={rex - 8} y1="83" x2={rex + 7} y2="83"
            stroke={hr.hex} strokeWidth="2.4" strokeLinecap="round" opacity="0.92" />
        </>
      )}
      {eyebrowStyle === "full" && (
        <>
          <path d={`M ${lex - 8} 86 Q ${lex} 81 ${lex + 8} 84`}
            fill="none" stroke={hr.hex} strokeWidth="3.4" strokeLinecap="round" opacity="0.96" />
          <path d={`M ${rex - 8} 84 Q ${rex} 81 ${rex + 8} 86`}
            fill="none" stroke={hr.hex} strokeWidth="3.4" strokeLinecap="round" opacity="0.96" />
        </>
      )}

      {/* ── LAYER 10: Eyes ── */}
      {/* Left Eye */}
      <ellipse cx={lex} cy={ey} rx="7.5" ry="5" fill={`url(#${uid}ew)`} />
      <circle cx={lex} cy={ey} r="3.4" fill={`url(#${uid}i)`} />
      <circle cx={lex} cy={ey} r="1.7" fill={ec.pupil} />
      <circle cx={lex - 1.2} cy={ey - 1.5} r="1" fill="white" opacity="0.9" />
      <path d={`M ${lex - 7.5} ${ey - 3.5} Q ${lex} ${ey - 6} ${lex + 7.5} ${ey - 3.5}`}
        fill="none" stroke={`url(#${uid}l)`} strokeWidth="1.7" strokeLinecap="round" />
      <path d={`M ${lex - 6} ${ey + 4} Q ${lex} ${ey + 5.5} ${lex + 6} ${ey + 4}`}
        fill="none" stroke={sk.shadow} strokeWidth="0.7" strokeLinecap="round" opacity="0.4" />

      {/* Right Eye */}
      <ellipse cx={rex} cy={ey} rx="7.5" ry="5" fill={`url(#${uid}ew)`} />
      <circle cx={rex} cy={ey} r="3.4" fill={`url(#${uid}i)`} />
      <circle cx={rex} cy={ey} r="1.7" fill={ec.pupil} />
      <circle cx={rex - 1.2} cy={ey - 1.5} r="1" fill="white" opacity="0.9" />
      <path d={`M ${rex - 7.5} ${ey - 3.5} Q ${rex} ${ey - 6} ${rex + 7.5} ${ey - 3.5}`}
        fill="none" stroke={`url(#${uid}l)`} strokeWidth="1.7" strokeLinecap="round" />
      <path d={`M ${rex - 6} ${ey + 4} Q ${rex} ${ey + 5.5} ${rex + 6} ${ey + 4}`}
        fill="none" stroke={sk.shadow} strokeWidth="0.7" strokeLinecap="round" opacity="0.4" />

      {/* ── LAYER 11: Nose ── */}
      <path d={`M ${cx} ${cy + 2} L ${cx - 3} ${cy + 12} Q ${cx} ${cy + 14} ${cx + 3} ${cy + 12} Z`}
        fill={sk.shadow} opacity="0.18" />
      <circle cx={cx - 3.5} cy={cy + 12} r="2.5" fill={sk.shadow} opacity="0.16" />
      <circle cx={cx + 3.5} cy={cy + 12} r="2.5" fill={sk.shadow} opacity="0.16" />

      {/* ── LAYER 12: Lips ── */}
      {/* Upper lip */}
      <path
        d={`M ${cx - 8} ${cy + 18} Q ${cx - 4} ${cy + 15} ${cx} ${cy + 15.5} Q ${cx + 4} ${cy + 15} ${cx + 8} ${cy + 18} Q ${cx + 4} ${cy + 17} ${cx} ${cy + 17.5} Q ${cx - 4} ${cy + 17} ${cx - 8} ${cy + 18} Z`}
        fill={lp.color}
      />
      {/* Lower lip */}
      <path
        d={`M ${cx - 8} ${cy + 18} Q ${cx} ${cy + 25} ${cx + 8} ${cy + 18} Q ${cx + 4} ${cy + 23} ${cx} ${cy + 23.5} Q ${cx - 4} ${cy + 23} ${cx - 8} ${cy + 18} Z`}
        fill={lp.color}
        opacity="0.94"
      />
      {/* Lip highlight */}
      <ellipse cx={cx} cy={cy + 21} rx="5" ry="1.6" fill="white" opacity="0.1" />

      {/* ── LAYER 13: Glasses ── */}
      {accessory === "round-gold" && (
        <>
          <circle cx={lex} cy={ey} r="8.5" fill="none" stroke="#d4af37" strokeWidth="1.4" opacity="0.92" />
          <circle cx={rex} cy={ey} r="8.5" fill="none" stroke="#d4af37" strokeWidth="1.4" opacity="0.92" />
          <line x1={lex + 8.5} y1={ey} x2={rex - 8.5} y2={ey}
            stroke="#d4af37" strokeWidth="1.1" opacity="0.88" />
          <line x1={lex - 8.5} y1={ey} x2={lex - 15} y2={ey - 3}
            stroke="#d4af37" strokeWidth="1" opacity="0.8" />
          <line x1={rex + 8.5} y1={ey} x2={rex + 15} y2={ey - 3}
            stroke="#d4af37" strokeWidth="1" opacity="0.8" />
        </>
      )}
      {accessory === "cat-eye" && (
        <>
          <path d={`M ${lex - 8} ${ey - 2} Q ${lex} ${ey - 7} ${lex + 10} ${ey - 5} L ${lex + 9} ${ey + 5} Q ${lex} ${ey + 7} ${lex - 8} ${ey + 5} Z`}
            fill="none" stroke="#d4af37" strokeWidth="1.4" opacity="0.92" />
          <path d={`M ${rex + 8} ${ey - 2} Q ${rex} ${ey - 7} ${rex - 10} ${ey - 5} L ${rex - 9} ${ey + 5} Q ${rex} ${ey + 7} ${rex + 8} ${ey + 5} Z`}
            fill="none" stroke="#d4af37" strokeWidth="1.4" opacity="0.92" />
          <line x1={lex + 9} y1={ey} x2={rex - 9} y2={ey}
            stroke="#d4af37" strokeWidth="1.1" opacity="0.88" />
        </>
      )}
      {accessory === "oversized" && (
        <>
          <rect x={lex - 9} y={ey - 7} width="19" height="14" rx="4"
            fill="rgba(15,10,20,0.6)" stroke="#161616" strokeWidth="2.4" opacity="0.97" />
          <rect x={rex - 10} y={ey - 7} width="19" height="14" rx="4"
            fill="rgba(15,10,20,0.6)" stroke="#161616" strokeWidth="2.4" opacity="0.97" />
          <line x1={lex + 10} y1={ey} x2={rex - 10} y2={ey}
            stroke="#161616" strokeWidth="2.2" opacity="0.97" />
          <line x1={lex - 9} y1={ey} x2={lex - 17} y2={ey - 3}
            stroke="#161616" strokeWidth="1.8" opacity="0.92" />
          <line x1={rex + 9} y1={ey} x2={rex + 17} y2={ey - 3}
            stroke="#161616" strokeWidth="1.8" opacity="0.92" />
        </>
      )}

      {/* ── LAYER 14: Earring markers ── */}
      {activeJewelry && activeJewelry.category === "earrings" && (
        <>
          <circle cx={lx - 3} cy={cy + 16} r="2.5" fill="#d4af37" opacity="0.52" />
          <circle cx={rx + 3} cy={cy + 16} r="2.5" fill="#d4af37" opacity="0.52" />
        </>
      )}

      {/* ── LAYER 15: Necklace indicator ── */}
      {activeJewelry && activeJewelry.category === "necklaces" && (
        <path d={`M 88 ${cy + fc.ry + 18} Q 100 ${cy + fc.ry + 24} 112 ${cy + fc.ry + 18}`}
          fill="none" stroke="#d4af37" strokeWidth="1.7" opacity="0.42" strokeLinecap="round" />
      )}
    </svg>
  );
}

/* ===== STEP TAB CONFIG ===== */
const STEPS = [
  { id: "base", label: "Base", icon: User },
  { id: "skin", label: "Skin", icon: Palette },
  { id: "hair", label: "Hair", icon: Scissors },
  { id: "features", label: "Eyes & Lips", icon: Eye },
  { id: "accessories", label: "Style", icon: Glasses },
  { id: "jewelry", label: "Jewelry", icon: Sparkles },
  { id: "lighting", label: "Scene", icon: Sun },
];

/* ===== STYLE HELPERS ===== */
const goldActive: React.CSSProperties = {
  background: "linear-gradient(135deg, rgba(212,175,55,0.22), rgba(212,175,55,0.07))",
  border: "1px solid rgba(212,175,55,0.42)",
  color: "#d4af37",
};
const inactiveStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.07)",
  color: "#9ca3af",
};

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-gray-500 block mb-1.5">
      {children}
    </span>
  );
}
function StepHeader({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)" }}>
        <Icon className="w-4 h-4 text-amber-400" />
      </div>
      <div>
        <h3 className="font-cinzel text-sm text-white font-bold uppercase tracking-widest">{title}</h3>
        <p className="font-cormorant text-xs text-gray-400 italic">{subtitle}</p>
      </div>
    </div>
  );
}

/* ===== MAIN COMPONENT ===== */
export default function AIAvatarStudio({ onRegisterAvatar, currentUser }: AIAvatarStudioProps) {
  const [userName, setUserName] = useState(currentUser?.name || "Curator");
  const [activeStep, setActiveStep] = useState(0);
  const [savingState, setSavingState] = useState(false);
  const [saved, setSaved] = useState(false);

  const [gender, setGender] = useState<"female" | "male">("female");
  const [skinTone, setSkinTone] = useState(SKIN_TONES[0]);
  const [faceShape, setFaceShape] = useState(FACE_SHAPES[0]);
  const [hairstyle, setHairstyle] = useState(HAIRSTYLES[2].id); // bob default
  const [hairColor, setHairColor] = useState(HAIR_COLORS[0]);
  const [eyeColor, setEyeColor] = useState(EYE_COLORS[0]);
  const [lipColor, setLipColor] = useState(LIP_COLORS[0]);
  const [eyebrowStyle, setEyebrowStyle] = useState(EYEBROW_STYLES[0].id);
  const [accessory, setAccessory] = useState(ACCESSORIES[0].id);
  const [lighting, setLighting] = useState(LIGHTING[0]);

  const [productsList, setProductsList] = useState<Product[]>([]);
  const [activeJewelry, setActiveJewelry] = useState<Product | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        const items = Array.isArray(data)
          ? data.filter((p: any) => p.tryOnImageUrl)
          : Array.isArray(data?.products)
          ? data.products.filter((p: any) => p.tryOnImageUrl)
          : [];
        setProductsList(items);
        if (items.length > 0) setActiveJewelry(items[0]);
      })
      .catch(() => {});
  }, []);

  const jewelScale =
    activeJewelry?.category === "necklaces" ? 1.1 :
    activeJewelry?.category === "earrings" ? 0.52 : 0.44;

  const handleSave = () => {
    setSavingState(true);
    const avatarConfig = {
      gender, skinTone: skinTone.id, faceShape: faceShape.id, hairstyle,
      hairColor: hairColor.id, eyeColor: eyeColor.id, lipColor: lipColor.id,
      eyebrowStyle, accessory, lighting: lighting.id
    };
    const avatarUrl = `data:text/plain;base64,${btoa(JSON.stringify({ avatarConfig, userName }))}`;
    setTimeout(() => {
      onRegisterAvatar(avatarUrl, userName);
      setSavingState(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 1400);
  };

  const currentStep = STEPS[activeStep];

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(ellipse at 20% 0%, #1a082a 0%, #0a0512 60%, #060209 100%)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-20">

        {/* Header */}
        <div className="text-center mb-12">
          <motion.span initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="inline-block text-[9px] tracking-[0.5em] text-amber-400 uppercase font-bold mb-3 px-4 py-1.5 border border-amber-400/20 rounded-full bg-amber-400/5">
            Digital Identity Studio
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="font-cinzel text-4xl sm:text-6xl tracking-widest text-white uppercase font-bold mb-4">
            Avatar{" "}
            <span style={{ background: "linear-gradient(135deg, #d4af37, #f5e06e, #b8860b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Atelier
            </span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="font-cormorant text-gray-300 italic text-lg max-w-xl mx-auto">
            Craft your luxury digital identity and preview premium jewelry collections directly on your avatar
          </motion.p>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

          {/* LEFT: Avatar Preview */}
          <div className="xl:col-span-4 space-y-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
              className="relative rounded-2xl overflow-hidden border border-white/8 shadow-2xl"
              style={{
                background: lighting.bg,
                boxShadow: `0 0 60px ${lighting.ambient}, 0 20px 60px rgba(0,0,0,0.6)`,
              }}>
              {/* Corner badge */}
              <div className="absolute top-0 right-0 z-10 p-2.5 border-b border-l border-amber-400/15 bg-amber-400/5">
                <span className="font-mono text-[7px] text-amber-400 uppercase tracking-widest">Live Preview</span>
              </div>

              {/* Avatar canvas */}
              <div className="relative px-6 pt-10 pb-4 flex flex-col items-center">
                <div className="relative w-72 h-72" style={{ filter: `drop-shadow(0 6px 28px ${lighting.ambient})` }}>

                  {/* Core SVG Avatar */}
                  <AvatarSVG
                    gender={gender}
                    skinTone={skinTone}
                    faceShape={faceShape}
                    hairstyle={hairstyle}
                    hairColor={hairColor}
                    eyeColor={eyeColor}
                    lipColor={lipColor}
                    eyebrowStyle={eyebrowStyle}
                    accessory={accessory}
                    lighting={lighting}
                    activeJewelry={activeJewelry}
                  />

                  {/* Earring image overlays */}
                  {activeJewelry && activeJewelry.category === "earrings" && (
                    <>
                      <div style={{
                        position: "absolute", left: "14%", top: "55%",
                        transform: `translate(-50%, 0) scale(${jewelScale})`,
                        transformOrigin: "top center", width: "52px", zIndex: 30,
                        filter: "drop-shadow(0 4px 12px rgba(200,155,60,0.55))",
                      }}>
                        <img src={activeJewelry.tryOnImageUrl || activeJewelry.images[0]} alt={activeJewelry.name} className="w-full" />
                      </div>
                      <div style={{
                        position: "absolute", right: "14%", top: "55%",
                        transform: `translate(50%, 0) scale(${jewelScale})`,
                        transformOrigin: "top center", width: "52px", zIndex: 30,
                        filter: "drop-shadow(0 4px 12px rgba(200,155,60,0.55))",
                      }}>
                        <img src={activeJewelry.tryOnImageUrl || activeJewelry.images[0]} alt={activeJewelry.name} className="w-full" />
                      </div>
                    </>
                  )}
                  {/* Necklace image overlay */}
                  {activeJewelry && activeJewelry.category === "necklaces" && (
                    <div style={{
                      position: "absolute", left: "50%", bottom: "8%",
                      transform: `translate(-50%, 0) scale(${jewelScale})`,
                      transformOrigin: "top center", width: "105px", zIndex: 30,
                      filter: "drop-shadow(0 6px 16px rgba(200,155,60,0.5))",
                    }}>
                      <img src={activeJewelry.tryOnImageUrl || activeJewelry.images[0]} alt={activeJewelry.name} className="w-full" />
                    </div>
                  )}
                </div>

                {/* Name input */}
                <div className="w-full mt-4 text-center">
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="bg-transparent border-b border-amber-400/20 focus:border-amber-400/60 w-full text-center text-base font-cinzel text-white uppercase tracking-widest focus:outline-none py-1"
                    placeholder="Your Name"
                  />
                  {activeJewelry && (
                    <span className="text-[8px] font-mono tracking-widest text-amber-400/60 uppercase block mt-1">
                      ✦ {activeJewelry.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Active jewelry pill */}
              {activeJewelry && (
                <div className="border-t border-white/5 px-5 py-3 flex items-center gap-3 bg-black/20">
                  <div className="w-8 h-8 rounded-lg overflow-hidden border border-amber-400/20 shrink-0">
                    <img src={activeJewelry.images[0]} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-cinzel text-[9px] text-white font-bold truncate tracking-wide">{activeJewelry.name}</p>
                    <p className="text-[7px] font-mono text-amber-400/50 uppercase tracking-widest truncate">{activeJewelry.categoryLabel} · Try-On Active</p>
                  </div>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0 ml-auto" />
                </div>
              )}
            </motion.div>

            {/* Save button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              disabled={savingState}
              onClick={handleSave}
              className="w-full py-4 rounded-xl font-outfit text-sm tracking-widest font-bold uppercase flex items-center justify-center gap-3 transition-all duration-300 cursor-pointer relative overflow-hidden"
              style={{
                background: saved ? "linear-gradient(135deg, #22c55e, #16a34a)" : "linear-gradient(135deg, #d4af37, #f5e06e, #b8860b)",
                color: "#0a0512",
                boxShadow: saved ? "0 8px 32px rgba(34,197,94,0.35)" : "0 8px 32px rgba(212,175,55,0.4)",
              }}>
              {savingState ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Saving to Profile...</>
              ) : saved ? (
                <><Check className="w-4 h-4" /> Avatar Saved!</>
              ) : (
                <><Save className="w-4 h-4" /> Save Avatar to Profile</>
              )}
            </motion.button>

            {/* Info note */}
            <div className="rounded-xl p-4 flex items-start gap-3 border border-white/5" style={{ background: "rgba(255,255,255,0.03)" }}>
              <Info className="w-4 h-4 text-amber-400/60 shrink-0 mt-0.5" />
              <p className="font-cormorant text-xs text-gray-400 italic leading-relaxed">
                Your avatar is your secure digital identity across ASTEYA. Save it to display jewelry directly on your personalized avatar in all product listings.
              </p>
            </div>
          </div>

          {/* RIGHT: Customization Panel */}
          <div className="xl:col-span-8 space-y-4">

            {/* Step tabs */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="flex gap-1 p-1.5 rounded-xl overflow-x-auto"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const active = activeStep === idx;
                return (
                  <button key={step.id} onClick={() => setActiveStep(idx)}
                    className="flex-1 min-w-fit flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg transition-all duration-200 cursor-pointer"
                    style={active ? goldActive : { background: "transparent", border: "1px solid transparent", color: "#6b7280" }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: active ? "#d4af37" : "#6b7280" }} />
                    <span className="text-[8px] font-outfit uppercase tracking-wider whitespace-nowrap font-semibold"
                      style={{ color: active ? "#d4af37" : "#6b7280" }}>
                      {step.label}
                    </span>
                  </button>
                );
              })}
            </motion.div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
              <motion.div key={currentStep.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl p-6 sm:p-8"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>

                {/* BASE */}
                {currentStep.id === "base" && (
                  <div className="space-y-6">
                    <StepHeader icon={User} title="Base Silhouette" subtitle="Choose the base model for your avatar" />
                    <div className="space-y-3">
                      <Label>Gender Expression</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {(["female", "male"] as const).map((g) => (
                          <button key={g} onClick={() => setGender(g)}
                            className="py-5 rounded-xl border font-outfit text-sm tracking-widest uppercase transition-all cursor-pointer font-semibold flex flex-col items-center gap-2"
                            style={gender === g ? goldActive : inactiveStyle}>
                            <span className="text-3xl">{g === "female" ? "👩" : "👨"}</span>
                            {g === "female" ? "Feminine" : "Masculine"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label>Face Shape</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {FACE_SHAPES.map((shape) => (
                          <button key={shape.id} onClick={() => setFaceShape(shape)}
                            className="py-4 rounded-xl border font-outfit text-xs tracking-widest uppercase transition-all cursor-pointer"
                            style={faceShape.id === shape.id ? goldActive : inactiveStyle}>
                            <svg viewBox="0 0 40 46" className="w-10 h-11 mx-auto mb-1.5">
                              <ellipse cx="20" cy="23" rx={shape.rx * 0.88} ry={shape.ry * 0.88}
                                fill={faceShape.id === shape.id ? "rgba(212,175,55,0.25)" : "rgba(255,255,255,0.09)"}
                                stroke={faceShape.id === shape.id ? "#d4af37" : "rgba(255,255,255,0.28)"}
                                strokeWidth="1.2" />
                            </svg>
                            {shape.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* SKIN */}
                {currentStep.id === "skin" && (
                  <div className="space-y-6">
                    <StepHeader icon={Palette} title="Skin Tone" subtitle="Select your complexion palette" />
                    <Label>Complexion</Label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {SKIN_TONES.map((tone) => (
                        <button key={tone.id} onClick={() => setSkinTone(tone)}
                          className="p-3 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer"
                          style={skinTone.id === tone.id ? goldActive : inactiveStyle}>
                          <div className="w-10 h-10 rounded-full border-2 shadow-lg"
                            style={{
                              background: `radial-gradient(circle at 35% 30%, ${tone.highlight}, ${tone.base})`,
                              borderColor: skinTone.id === tone.id ? "#d4af37" : "rgba(255,255,255,0.15)",
                              boxShadow: skinTone.id === tone.id ? "0 0 14px rgba(212,175,55,0.4)" : "none",
                            }} />
                          <span className="text-[9px] font-outfit uppercase tracking-wider text-center leading-tight"
                            style={{ color: skinTone.id === tone.id ? "#d4af37" : "#9ca3af" }}>
                            {tone.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* HAIR */}
                {currentStep.id === "hair" && (
                  <div className="space-y-6">
                    <StepHeader icon={Scissors} title="Coiffure" subtitle="Choose your hair style and colour" />
                    <div className="space-y-2">
                      <Label>Hairstyle</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {HAIRSTYLES.map((style) => (
                          <button key={style.id} onClick={() => setHairstyle(style.id)}
                            className="py-3 px-2 rounded-xl border font-outfit text-[10px] tracking-widest uppercase transition-all cursor-pointer text-center"
                            style={hairstyle === style.id ? goldActive : inactiveStyle}>
                            {style.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Hair Colour</Label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {HAIR_COLORS.map((color) => (
                          <button key={color.id} onClick={() => setHairColor(color)}
                            className="p-2.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer"
                            style={hairColor.id === color.id ? goldActive : inactiveStyle}>
                            <div className="w-8 h-8 rounded-full border"
                              style={{
                                background: `radial-gradient(circle at 35% 30%, ${color.highlight}, ${color.hex})`,
                                borderColor: hairColor.id === color.id ? "#d4af37" : "rgba(255,255,255,0.15)",
                              }} />
                            <span className="text-[8px] font-outfit uppercase tracking-wide text-center"
                              style={{ color: hairColor.id === color.id ? "#d4af37" : "#9ca3af" }}>
                              {color.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* FEATURES */}
                {currentStep.id === "features" && (
                  <div className="space-y-6">
                    <StepHeader icon={Eye} title="Facial Features" subtitle="Refine eyes, brows, and lips" />
                    <div className="space-y-2">
                      <Label>Eye Colour</Label>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {EYE_COLORS.map((ec) => (
                          <button key={ec.id} onClick={() => setEyeColor(ec)}
                            className="p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer"
                            style={eyeColor.id === ec.id ? goldActive : inactiveStyle}>
                            <div className="w-8 h-8 rounded-full relative flex items-center justify-center"
                              style={{ background: `radial-gradient(circle at 35% 30%, ${ec.iris}80, ${ec.iris})`, border: `2px solid ${eyeColor.id === ec.id ? "#d4af37" : "rgba(255,255,255,0.15)"}` }}>
                              <div className="w-3 h-3 rounded-full" style={{ background: ec.pupil }} />
                              <div className="absolute w-1 h-1 rounded-full bg-white/80 top-1.5 left-2" />
                            </div>
                            <span className="text-[8px] font-outfit uppercase tracking-wide text-center leading-tight"
                              style={{ color: eyeColor.id === ec.id ? "#d4af37" : "#9ca3af" }}>
                              {ec.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Eyebrow Style</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {EYEBROW_STYLES.map((eb) => (
                          <button key={eb.id} onClick={() => setEyebrowStyle(eb.id)}
                            className="py-3 rounded-xl border font-outfit text-[10px] tracking-widest uppercase transition-all cursor-pointer"
                            style={eyebrowStyle === eb.id ? goldActive : inactiveStyle}>
                            {eb.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Lip Colour</Label>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                        {LIP_COLORS.map((lc) => (
                          <button key={lc.id} onClick={() => setLipColor(lc)}
                            className="p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer"
                            style={lipColor.id === lc.id ? goldActive : inactiveStyle}>
                            <div className="w-8 h-3.5 rounded-full"
                              style={{ background: lc.color, border: `2px solid ${lipColor.id === lc.id ? "#d4af37" : "rgba(255,255,255,0.15)"}` }} />
                            <span className="text-[7px] font-outfit uppercase tracking-wide text-center leading-tight"
                              style={{ color: lipColor.id === lc.id ? "#d4af37" : "#9ca3af" }}>
                              {lc.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ACCESSORIES */}
                {currentStep.id === "accessories" && (
                  <div className="space-y-6">
                    <StepHeader icon={Glasses} title="Eyewear & Accents" subtitle="Add designer frames to your avatar" />
                    <Label>Designer Eyewear</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {ACCESSORIES.map((acc) => (
                        <button key={acc.id} onClick={() => setAccessory(acc.id)}
                          className="py-5 rounded-xl border font-outfit text-xs tracking-widest uppercase transition-all cursor-pointer"
                          style={accessory === acc.id ? goldActive : inactiveStyle}>
                          {acc.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* JEWELRY */}
                {currentStep.id === "jewelry" && (
                  <div className="space-y-6">
                    <StepHeader icon={Sparkles} title="Jewelry Collection" subtitle="Preview ASTEYA pieces on your avatar" />
                    {productsList.length === 0 ? (
                      <div className="text-center py-12">
                        <Sparkles className="w-10 h-10 text-amber-400/30 mx-auto mb-3" />
                        <p className="font-cormorant italic text-gray-500 text-sm">
                          No try-on items available. Upload jewelry via the Admin panel.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {productsList.map((p) => {
                          const isActive = activeJewelry?.id === p.id;
                          return (
                            <button key={p.id} onClick={() => setActiveJewelry(isActive ? null : p)}
                              className="p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all text-left"
                              style={isActive ? goldActive : inactiveStyle}>
                              <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-white/10">
                                <img src={p.tryOnImageUrl || p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-cinzel text-xs text-white font-bold truncate">{p.name}</p>
                                <p className="text-[8px] font-mono uppercase tracking-wider mt-1 truncate"
                                  style={{ color: isActive ? "#d4af37" : "#6b7280" }}>
                                  {p.categoryLabel}
                                </p>
                              </div>
                              {isActive && (
                                <div className="w-5 h-5 rounded-full shrink-0 ml-auto flex items-center justify-center"
                                  style={{ background: "linear-gradient(135deg, #d4af37, #f5e06e)" }}>
                                  <Check className="w-3 h-3 text-black" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* LIGHTING */}
                {currentStep.id === "lighting" && (
                  <div className="space-y-6">
                    <StepHeader icon={Sun} title="Studio Scene" subtitle="Set the perfect ambient lighting mood" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {LIGHTING.map((mood) => (
                        <button key={mood.id} onClick={() => setLighting(mood)}
                          className="p-5 rounded-xl border text-left cursor-pointer transition-all"
                          style={lighting.id === mood.id ? goldActive : inactiveStyle}>
                          <div className="w-full h-16 rounded-lg mb-3" style={{ background: mood.bg }} />
                          <p className="font-cinzel text-xs text-white font-bold tracking-wider uppercase">{mood.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step nav */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/5">
                  <button disabled={activeStep === 0} onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                    className="flex items-center gap-2 py-2 px-4 rounded-lg font-outfit text-xs tracking-widest uppercase transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    style={inactiveStyle}>
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">
                    {activeStep + 1} / {STEPS.length}
                  </span>
                  <button disabled={activeStep === STEPS.length - 1} onClick={() => setActiveStep(Math.min(STEPS.length - 1, activeStep + 1))}
                    className="flex items-center gap-2 py-2 px-4 rounded-lg font-outfit text-xs tracking-widest uppercase transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.08))", border: "1px solid rgba(212,175,55,0.3)", color: "#d4af37" }}>
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
