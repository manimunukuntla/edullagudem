import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { getTranslation } from '../lib/translations';
import { DiyaIcon, KalasamIcon } from './FestiveIcons';
import { Calendar, Ticket, ShieldCheck, Sparkles, Phone, Eye, MapPin } from 'lucide-react';
import { DEFAULT_DEVI_PROFILE_STORAGE_KEY } from './DeviProfileAvatar';
import { TARGET_WHATSAPP_NUMBER } from '../lib/whatsapp';

interface DeviBannerProps {
  language: Language;
  onStartRegistration: () => void;
  onCheckStatus: () => void;
  onOpenProfile?: () => void;
}

/**
 * Detailed Sacred Idol Artwork replicating the uploaded murti of Sri Edullagudem Devi Ammavaru:
 * - Seated gracefully on a dark rock pedestal
 * - Royal crimson red saree with white golden polka dots, shimmering emerald-green & gold zari border
 * - Emerald green blouse with golden embroidered borders & armlets
 * - Towering silver Trishulam (Trident) held in left hand with red cloth streamers and maroon damru
 * - Sacred coiled Nagendra (Cobra snake) in left hand
 * - Upright curved golden Khadgam (sword) in right hand (Abhaya posture)
 * - Ornate golden Mukutam (crown) with luminous white crescent moon (Chandrakala) & red kumkum bindi
 * - Radiant golden sun-halo (Prabhamandala) behind head
 * - Swirling auspicious golden-yellow haldi / chandan smoke rising from below
 */
export const SacredMurtiArt: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => {
  return (
    <svg
      viewBox="0 0 500 680"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Sri Edullagudem Devi Ammavaru Sacred Idol with Trishula, Sword, Red Saree and Holy Haldi Smoke"
    >
      <defs>
        {/* Divine Sunrays & Atmosphere Gradient */}
        <radialGradient id="sunbeamGlow" cx="30%" cy="20%" r="70%">
          <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.9" />
          <stop offset="30%" stopColor="#FBBF24" stopOpacity="0.6" />
          <stop offset="60%" stopColor="#D97706" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#1E1B4B" stopOpacity="0.8" />
        </radialGradient>

        {/* Holy Haldi / Chandan Smoke Gradient */}
        <linearGradient id="haldiSmoke" x1="0%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor="#CA8A04" stopOpacity="0.85" />
          <stop offset="40%" stopColor="#EAB308" stopOpacity="0.75" />
          <stop offset="70%" stopColor="#FEF08A" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#FACC15" stopOpacity="0" />
        </linearGradient>

        {/* Rocky Throne Gradient */}
        <linearGradient id="rockThrone" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#374151" />
          <stop offset="40%" stopColor="#1F2937" />
          <stop offset="100%" stopColor="#111827" />
        </linearGradient>

        {/* Red Saree Pattern with Gold/White Polka Dots */}
        <pattern id="sareePolka" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="8" cy="8" r="1.6" fill="#FEF3C7" opacity="0.95" />
          <circle cx="0" cy="0" r="1.2" fill="#FDE68A" opacity="0.8" />
          <circle cx="16" cy="16" r="1.2" fill="#FDE68A" opacity="0.8" />
        </pattern>

        {/* Saree Base Red Gradient */}
        <linearGradient id="crimsonSilk" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DC2626" />
          <stop offset="50%" stopColor="#B91C1C" />
          <stop offset="100%" stopColor="#7F1D1D" />
        </linearGradient>

        {/* Emerald Green Border & Blouse */}
        <linearGradient id="emeraldZari" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="50%" stopColor="#047857" />
          <stop offset="100%" stopColor="#064E3B" />
        </linearGradient>

        {/* Divine Gold Jewelry & Sword */}
        <linearGradient id="templeGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="25%" stopColor="#FDE047" />
          <stop offset="50%" stopColor="#EAB308" />
          <stop offset="85%" stopColor="#CA8A04" />
          <stop offset="100%" stopColor="#854D0E" />
        </linearGradient>

        {/* Silver Trishula Metallic Gradient */}
        <linearGradient id="silverTrishula" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="35%" stopColor="#F8FAFC" />
          <stop offset="70%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>

        {/* Soft Aura Blur */}
        <filter id="auraGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Atmospheric Background with Sunlight */}
      <rect width="500" height="680" rx="24" fill="url(#sunbeamGlow)" />

      {/* Radiant Sunburst Rays from Top Left */}
      <g stroke="#FEF08A" strokeWidth="1.5" opacity="0.4">
        {Array.from({ length: 18 }).map((_, i) => (
          <line
            key={i}
            x1="120"
            y1="60"
            x2={Math.cos((i * 10 * Math.PI) / 180) * 800 + 120}
            y2={Math.sin((i * 10 * Math.PI) / 180) * 800 + 60}
          />
        ))}
      </g>

      {/* Towering Trishula Shaft (extends from lap to sky behind left arm) */}
      <line x1="340" y1="40" x2="340" y2="600" stroke="url(#silverTrishula)" strokeWidth="7" strokeLinecap="round" />

      {/* Grand Silver Trishula Trident Top (Prongs & Spear) */}
      <g transform="translate(340, 75)" filter="url(#auraGlow)">
        {/* Center Spearhead */}
        <path d="M 0 -55 Q -10 -25 -6 0 L 6 0 Q 10 -25 0 -55 Z" fill="url(#silverTrishula)" stroke="#E2E8F0" strokeWidth="1.5" />
        {/* Left Curved Outer Prong */}
        <path d="M -6 -5 Q -32 -25 -25 -52 Q -22 -28 -8 -15 Z" fill="url(#silverTrishula)" stroke="#CBD5E1" strokeWidth="1" />
        {/* Right Curved Outer Prong */}
        <path d="M 6 -5 Q 32 -25 25 -52 Q 22 -28 8 -15 Z" fill="url(#silverTrishula)" stroke="#CBD5E1" strokeWidth="1" />
        {/* Trishul Base Collar */}
        <ellipse cx="0" cy="5" rx="14" ry="4" fill="url(#templeGold)" stroke="#B45309" strokeWidth="1" />

        {/* Sacred Damru attached right under Trishula */}
        <g transform="translate(0, 32)">
          {/* Top Cup */}
          <path d="M -16 -12 L 16 -12 L 0 0 Z" fill="#7F1D1D" stroke="url(#templeGold)" strokeWidth="1.5" />
          {/* Bottom Cup */}
          <path d="M -16 12 L 16 12 L 0 0 Z" fill="#991B1B" stroke="url(#templeGold)" strokeWidth="1.5" />
          {/* Waist Band */}
          <ellipse cx="0" cy="0" rx="3" ry="2" fill="url(#templeGold)" />
          {/* Beaded Cords */}
          <circle cx="-18" cy="2" r="2.5" fill="#FEF08A" />
          <circle cx="18" cy="-2" r="2.5" fill="#FEF08A" />
        </g>

        {/* Flowing Red Silk Ribbon / Scarf tied to Damru */}
        <path
          d="M 2 35 C 10 70, 25 100, 18 170 C 14 130, 20 80, 4 45 Z"
          fill="#DC2626"
          opacity="0.9"
        />
        <path
          d="M -2 36 C -12 75, -5 120, -10 160 C -4 125, -6 75, 0 45 Z"
          fill="#B91C1C"
          opacity="0.85"
        />
      </g>

      {/* Dark Rocky Throne / Peetham */}
      <path
        d="M 50 640 L 70 510 Q 150 490 250 495 Q 350 490 430 510 L 450 640 Q 250 660 50 640 Z"
        fill="url(#rockThrone)"
        stroke="#4B5563"
        strokeWidth="3"
      />
      {/* Rock Facets */}
      <path d="M 90 540 L 160 530 L 190 600 L 120 620 Z" fill="#1F2937" opacity="0.7" />
      <path d="M 310 525 L 390 535 L 380 615 L 290 605 Z" fill="#1F2937" opacity="0.6" />

      {/* Sacred Prabhamandalam (Golden Sun Halo behind Goddess head) */}
      <circle cx="260" cy="210" r="82" fill="url(#templeGold)" opacity="0.95" filter="url(#auraGlow)" />
      <circle cx="260" cy="210" r="76" stroke="#FEF08A" strokeWidth="3" fill="#B45309" opacity="0.9" />

      {/* Ornate Rays on Sun Halo */}
      {Array.from({ length: 24 }).map((_, i) => {
        const rad = (i * 15 * Math.PI) / 180;
        const x1 = 260 + 72 * Math.cos(rad);
        const y1 = 210 + 72 * Math.sin(rad);
        const x2 = 260 + 82 * Math.cos(rad);
        const y2 = 210 + 82 * Math.sin(rad);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FDE047" strokeWidth="2.5" strokeLinecap="round" />;
      })}

      {/* GODDESS BODY & SEATED FORM */}

      {/* Torso & Green Blouse */}
      <path d="M 215 280 Q 260 270 305 280 L 315 375 Q 260 385 205 375 Z" fill="url(#emeraldZari)" />
      {/* Blouse Golden Embroidery on Neckline */}
      <path d="M 230 280 Q 260 310 290 280" stroke="url(#templeGold)" strokeWidth="4" fill="none" />

      {/* Goddess Beautiful Face */}
      <path d="M 235 205 Q 260 255 285 205 Q 275 175 245 175 Z" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1" />

      {/* Red Kumkum Tilak & Chandrakala on Forehead */}
      <circle cx="260" cy="195" r="4.5" fill="#DC2626" />
      <path d="M 252 188 Q 260 193 268 188 Q 260 185 252 188 Z" fill="#FFFFFF" />

      {/* Compassionate Divine Eyes & Eyebrows */}
      <path d="M 243 203 Q 251 198 255 204" stroke="#451A03" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M 265 204 Q 269 198 277 203" stroke="#451A03" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="249" cy="204" r="2.2" fill="#1C1917" />
      <circle cx="271" cy="204" r="2.2" fill="#1C1917" />

      {/* Divine Smile & Golden Nose Ring (Mukku Podaka) */}
      <path d="M 253 222 Q 260 228 267 222" stroke="#B91C1C" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="266" cy="214" r="1.5" fill="#FACC15" />

      {/* Golden Mukutam (Towering Ornate Crown) */}
      <g filter="url(#auraGlow)">
        <path
          d="M 230 180 Q 260 115 260 95 Q 260 115 290 180 Q 260 190 230 180 Z"
          fill="url(#templeGold)"
          stroke="#78350F"
          strokeWidth="2"
        />
        {/* Pure White Crescent Moon (Chandrakala) on Crown Base */}
        <path
          d="M 242 165 C 248 152 260 152 266 162 C 258 156 248 158 242 165 Z"
          fill="#FFFFFF"
          filter="drop-shadow(0 0 3px #FEF08A)"
        />
        {/* Crown Jewel Inlays */}
        <circle cx="260" cy="135" r="4" fill="#DC2626" />
        <circle cx="260" cy="115" r="3" fill="#059669" />
        <circle cx="260" cy="95" r="3.5" fill="#FEF08A" />
      </g>

      {/* Royal Red Saree Draping with Polka Dots & Green Border */}
      {/* Main Skirt & Seated Pleats (Right Leg Folded, Left Leg Draped Gracefully) */}
      <g>
        <path
          d="M 180 370 Q 260 360 340 375 L 390 540 Q 250 570 125 540 Z"
          fill="url(#crimsonSilk)"
        />
        {/* Polka Dots Overlay on Saree */}
        <path
          d="M 180 370 Q 260 360 340 375 L 390 540 Q 250 570 125 540 Z"
          fill="url(#sareePolka)"
        />
        {/* Pleats Folds Shadows */}
        <path d="M 255 370 L 245 545 L 265 545 L 270 370 Z" fill="#991B1B" opacity="0.6" />
        <path d="M 290 380 L 310 535 L 330 530 L 305 380 Z" fill="#7F1D1D" opacity="0.7" />
        <path d="M 210 380 L 175 525 L 195 530 L 225 380 Z" fill="#7F1D1D" opacity="0.6" />

        {/* Shimmering Emerald Green & Gold Zari Border on Pallu */}
        <path
          d="M 125 530 Q 250 560 390 530 L 400 550 Q 250 580 115 550 Z"
          fill="url(#emeraldZari)"
          stroke="url(#templeGold)"
          strokeWidth="3"
        />
        {/* Golden Zari Motifs on Border */}
        <path
          d="M 125 540 Q 250 570 390 540"
          stroke="url(#templeGold)"
          strokeWidth="2.5"
          strokeDasharray="6 4"
        />
      </g>

      {/* Lotus Divine Feet visible at base */}
      <ellipse cx="240" cy="565" rx="14" ry="7" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1" />
      <circle cx="236" cy="565" r="1.5" fill="#DC2626" />
      <circle cx="240" cy="565" r="1.5" fill="#DC2626" />
      <circle cx="244" cy="565" r="1.5" fill="#DC2626" />

      {/* Left Hand Holding Trishula & Coiled Nagendra (Cobra) */}
      <g>
        {/* Left Arm extending to Trishul */}
        <path d="M 310 310 Q 350 340 345 375" stroke="#FEF3C7" strokeWidth="18" strokeLinecap="round" />
        {/* Green Blouse Sleeve on Left Arm */}
        <path d="M 305 295 Q 330 315 328 335" stroke="url(#emeraldZari)" strokeWidth="20" strokeLinecap="round" />
        <circle cx="328" cy="335" r="11" fill="none" stroke="url(#templeGold)" strokeWidth="3" />
        {/* Left Hand Wristlet & Fingers wrapping Trishula */}
        <circle cx="340" cy="375" r="9" fill="url(#templeGold)" />

        {/* Sacred Nagendra (Cobra Snake) wrapping left hand */}
        <path
          d="M 345 395 Q 380 405 370 370 Q 360 340 390 320 Q 395 305 385 310"
          fill="none"
          stroke="#451A03"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Cobra Hood */}
        <ellipse cx="388" cy="315" rx="10" ry="7" fill="#78350F" stroke="url(#templeGold)" strokeWidth="1.5" />
      </g>

      {/* Right Hand Holding Curved Golden Khadgam (Sword) */}
      <g>
        {/* Right Arm in Abhaya/Khadgam Posture */}
        <path d="M 210 310 Q 170 330 175 355" stroke="#FEF3C7" strokeWidth="18" strokeLinecap="round" />
        {/* Green Blouse Sleeve on Right Arm */}
        <path d="M 215 295 Q 190 315 190 335" stroke="url(#emeraldZari)" strokeWidth="20" strokeLinecap="round" />
        <circle cx="190" cy="335" r="11" fill="none" stroke="url(#templeGold)" strokeWidth="3" />
        {/* Right Hand Palm */}
        <circle cx="175" cy="355" r="9" fill="url(#templeGold)" />

        {/* The Golden Curved Khadgam / Sword */}
        <g transform="translate(170, 345)" filter="url(#auraGlow)">
          {/* Ornate Hilt & Pommel */}
          <rect x="-8" y="-3" width="16" height="6" rx="2" fill="#854D0E" stroke="url(#templeGold)" strokeWidth="1" />
          <circle cx="0" cy="5" r="4" fill="url(#templeGold)" />
          {/* Curved Golden Scimitar Blade Upward */}
          <path
            d="M -3 -3 Q -15 -60 12 -120 Q 20 -70 3 -3 Z"
            fill="url(#templeGold)"
            stroke="#FEF08A"
            strokeWidth="2"
          />
        </g>
      </g>

      {/* Heavy Temple Jewelry & Green Beaded Garland (Rudraksha / Maragatha Mala) */}
      <g>
        {/* Choker Necklace */}
        <path d="M 235 265 Q 260 280 285 265" stroke="url(#templeGold)" strokeWidth="8" fill="none" strokeLinecap="round" />
        {/* Mid-length Gold Haram */}
        <path d="M 225 275 Q 260 315 295 275" stroke="url(#templeGold)" strokeWidth="6" fill="none" strokeLinecap="round" />
        {/* Long Green Beaded Garland reaching lap */}
        <path
          d="M 220 285 Q 260 375 300 285"
          stroke="#059669"
          strokeWidth="6"
          strokeDasharray="4 3"
          fill="none"
          strokeLinecap="round"
        />
        {/* Gold Pendant */}
        <circle cx="260" cy="345" r="9" fill="url(#templeGold)" stroke="#78350F" strokeWidth="2" />
        <circle cx="260" cy="345" r="4" fill="#DC2626" />
      </g>

      {/* Auspicious Billowing Yellow Haldi / Chandan / Gulal Smoke */}
      <g opacity="0.85">
        <ellipse cx="140" cy="580" rx="90" ry="40" fill="url(#haldiSmoke)" />
        <ellipse cx="360" cy="570" rx="80" ry="45" fill="url(#haldiSmoke)" />
        <ellipse cx="250" cy="600" rx="130" ry="50" fill="url(#haldiSmoke)" />
        <circle cx="110" cy="520" r="45" fill="url(#haldiSmoke)" opacity="0.6" />
        <circle cx="390" cy="510" r="50" fill="url(#haldiSmoke)" opacity="0.6" />
      </g>
    </svg>
  );
};

export const TempleHero: React.FC<DeviBannerProps> = ({
  language,
  onStartRegistration,
  onCheckStatus,
  onOpenProfile,
}) => {
  const t = getTranslation(language);
  const [bannerImage, setBannerImage] = useState<string | null>(null);

  // Sync banner image from server & localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DEFAULT_DEVI_PROFILE_STORAGE_KEY);
      if (stored) setBannerImage(stored);
    } catch {}

    const syncBanner = () => {
      fetch(`/api/profile?t=${Date.now()}`, { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          setBannerImage(data?.profileImage || data?.bannerImage || null);
        })
        .catch(() => {});
    };

    syncBanner();

    const handleUpdate = () => {
      syncBanner();
    };

    window.addEventListener('devi_profile_updated', handleUpdate);
    window.addEventListener('festival_profile_updated', handleUpdate);
    window.addEventListener('focus', handleUpdate);
    return () => {
      window.removeEventListener('devi_profile_updated', handleUpdate);
      window.removeEventListener('festival_profile_updated', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, []);

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#4A0E17] via-[#7F1D1D] to-[#3B0712] text-amber-50 border-b-4 border-amber-500 shadow-2xl">
      {/* Traditional Marigold Flower Garland (బంతిపూల తోరణం) & Mango leaves along top border */}
      <div className="w-full h-3 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 flex items-center justify-around overflow-hidden shadow-inner">
        {Array.from({ length: 32 }).map((_, i) => (
          <span key={i} className="text-[10px] leading-none select-none">
            {i % 2 === 0 ? '🌼' : '🍃'}
          </span>
        ))}
      </div>

      {/* Decorative Traditional Rangoli Kolam watermark */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, #FDE047 2%, transparent 0%), radial-gradient(circle at 75px 75px, #F59E0B 2%, transparent 0%)`,
          backgroundSize: '100px 100px',
        }}
      />

      <div className="relative max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Top Auspicious Inscription Bar */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4 text-center">
          <DiyaIcon className="w-6 h-6 text-amber-400 shrink-0" />
          <span className="font-serif text-xs sm:text-sm font-bold text-amber-300 tracking-widest uppercase">
            ॥ శ్రీ దుర్గా భవానీ ప్రసన్న ॥
          </span>
          <span className="hidden sm:inline text-amber-400/50">·</span>
          <span className="hidden sm:inline text-xs text-amber-200/90 font-medium">
            ఎదుల్లగూడెం దేవి శరన్నవరాత్రులు 2026 లక్కీ డ్రా
          </span>
          <KalasamIcon className="w-6 h-6 text-amber-400 shrink-0" />
        </div>

        {/* Widescreen Banner Container */}
        <div className="relative rounded-2xl sm:rounded-3xl border-2 sm:border-3 border-amber-400/70 bg-gradient-to-r from-black/60 via-amber-950/40 to-black/70 p-4 sm:p-7 shadow-2xl backdrop-blur-xs overflow-hidden">
          {/* Ornate Corner Accents */}
          <div className="absolute top-2 left-2 text-amber-400 text-xs sm:text-sm select-none">⚜️</div>
          <div className="absolute top-2 right-2 text-amber-400 text-xs sm:text-sm select-none">⚜️</div>
          <div className="absolute bottom-2 left-2 text-amber-400 text-xs sm:text-sm select-none">⚜️</div>
          <div className="absolute bottom-2 right-2 text-amber-400 text-xs sm:text-sm select-none">⚜️</div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left Column: Grand Sacred Murti Banner Visual (Exact Representation of the Idol) */}
            <div className="md:col-span-5 flex flex-col items-center justify-center">
              <div
                onClick={onOpenProfile}
                className="relative group cursor-pointer max-w-[280px] sm:max-w-[320px] w-full rounded-2xl overflow-hidden shadow-2xl border-3 border-amber-300 ring-4 ring-amber-500/30 transition-transform duration-300 hover:scale-[1.02]"
                title="క్లిక్ చేసి అమ్మవారి పూర్తి దర్శనం & వివరాలు చూడండి (Click for Full Darshan)"
              >
                {/* Glowing halo pulse behind the image */}
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-200 to-red-500 opacity-50 blur-md group-hover:opacity-75 transition-opacity" />

                <div className="relative aspect-[3/4] w-full bg-gradient-to-b from-amber-950 to-stone-950 flex items-center justify-center overflow-hidden">
                  {bannerImage ? (
                    <img
                      src={bannerImage}
                      alt="Sri Edullagudem Devi Ammavaru Sacred Murti"
                      className="w-full h-full object-cover object-center"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <SacredMurtiArt className="w-full h-full object-cover" />
                  )}

                  {/* Sacred Bottom Overlay Badge */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-3 pt-6 text-center">
                    <p className="font-serif font-black text-amber-200 text-sm sm:text-base leading-tight drop-shadow">
                      శ్రీ ఎదుల్లగూడెం దేవి అమ్మవారు
                    </p>
                    <p className="text-[11px] text-amber-300/90 font-medium">
                      త్రిశూలధారిణి · శరన్నవరాత్రులు 2026
                    </p>
                  </div>

                  {/* Click to expand darshan hint */}
                  <div className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/60 text-amber-300 backdrop-blur-xs group-hover:scale-110 transition-transform">
                    <Eye className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* View Darshan Button */}
              {onOpenProfile && (
                <button
                  type="button"
                  onClick={onOpenProfile}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-400/20 hover:bg-amber-400/35 border border-amber-300/50 text-amber-200 hover:text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>{language === 'te' ? 'అమ్మవారి దర్శనం & కమిటీ వివరాలు' : 'Divine Darshan & Committee Details'}</span>
                </button>
              )}
            </div>

            {/* Right Column: Festival Titles, Credentials & Registration CTAs */}
            <div className="md:col-span-7 flex flex-col justify-center text-center md:text-left space-y-4">
              {/* Event Badge */}
              <div className="inline-flex items-center justify-center md:justify-start gap-2">
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-red-600 to-amber-600 border border-amber-300 text-yellow-100 text-xs font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
                  <span>{language === 'te' ? 'మహా లక్కీ డ్రా మహోత్సవం' : 'Grand Lucky Draw Festival'}</span>
                </span>
                <span className="px-2.5 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs font-bold">
                  2026
                </span>
              </div>

              {/* Main Festival Title Banner */}
              <div>
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-amber-200 tracking-tight leading-tight drop-shadow-lg">
                  ఎదుల్లగూడెం దేవి శరన్నవరాత్రులు
                </h1>
                <h2 className="text-lg sm:text-2xl font-serif font-bold text-yellow-300 mt-1 drop-shadow">
                  Sri Edullagudem Devi Sharannavarathulu 2026
                </h2>
                <p className="text-xs sm:text-sm text-amber-100/90 mt-2 font-normal leading-relaxed">
                  {language === 'te'
                    ? 'అమ్మవారి దివ్య కృపా కటాక్షాలతో ₹50 టోకెన్ చెల్లించి ఎదుల్లగూడెం దేవి శరన్నవరాత్రుల లక్కీ డ్రాలో పాల్గొనండి!'
                    : 'Participate in the auspicious Sri Edullagudem Devi Sharannavarathulu lucky draw with ₹50 entry fee and receive your digital sequential token!'}
                </p>
              </div>

              {/* Highlights Ribbon: Date, Price, Venue */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {/* Lucky Draw Date */}
                <div className="p-3 rounded-xl bg-black/40 border border-amber-400/40 flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-700 to-amber-700 flex items-center justify-center shrink-0 shadow">
                    <Calendar className="w-5 h-5 text-amber-200" />
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
                      {language === 'te' ? 'లక్కీ డ్రా తేదీ' : 'Grand Draw Date'}
                    </span>
                    <p className="font-bold text-white text-sm sm:text-base leading-tight">
                      21 October 2026
                    </p>
                    <span className="text-[10px] text-amber-200/80">విజయదశమి ముగింపు సాయంత్రం</span>
                  </div>
                </div>

                {/* Entry Fee Box */}
                <div className="p-3 rounded-xl bg-black/40 border border-amber-400/40 flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shrink-0 shadow">
                    <Ticket className="w-5 h-5 text-stone-950 font-bold" />
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
                      {language === 'te' ? 'టోకెన్ రుసుము' : 'Entry Ticket'}
                    </span>
                    <p className="font-black text-amber-300 text-lg sm:text-xl leading-tight">
                      ₹50 <span className="text-xs text-amber-100 font-semibold">/ టోకెన్</span>
                    </p>
                    <span className="text-[10px] text-emerald-300 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> సురక్షిత UPI పేమెంట్
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onStartRegistration}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-base font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-stone-950 shadow-xl hover:shadow-amber-400/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-200"
                >
                  <Ticket className="w-5 h-5 text-stone-950" />
                  <span>{language === 'te' ? 'ఇప్పుడే ₹50 చెల్లించి టోకెన్ పొందండి' : 'Register Now (Pay ₹50)'}</span>
                </button>

                <button
                  type="button"
                  onClick={onCheckStatus}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold bg-white/10 hover:bg-white/20 text-amber-100 border border-amber-300/50 hover:border-amber-300 transition-colors backdrop-blur-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{language === 'te' ? 'నా టోకెన్ తనిఖీ చేయండి' : 'Find My Token'}</span>
                </button>
              </div>

              {/* Verified Organizer Credentials Footer */}
              <div className="pt-2 border-t border-amber-400/20 flex flex-wrap items-center justify-between text-[11px] text-amber-200/80 gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>UPI: <strong className="font-mono text-amber-300">9573454579@postbank</strong> (KANDALA KIRAN REDDY)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-emerald-400" />
                  <span>వాట్సాప్: <strong className="font-mono text-amber-300">+91 {TARGET_WHATSAPP_NUMBER}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
