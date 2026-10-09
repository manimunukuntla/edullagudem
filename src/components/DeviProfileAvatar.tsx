import React, { useState, useEffect } from 'react';

export const DEFAULT_DEVI_PROFILE_STORAGE_KEY = 'edullagudem_devi_profile_image';

export interface DeviProfileAvatarProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'hero';
  className?: string;
  showHalo?: boolean;
  showBorder?: boolean;
  onClick?: () => void;
  customSrc?: string | null;
}

const sizeMap = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
  xl: 'w-20 h-20',
  '2xl': 'w-28 h-28',
  hero: 'w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52',
};

/**
 * Detailed Divine Sacred Artwork of Goddess Durga / Sri Edullagudem Devi Sharannavarathulu
 */
export const SacredDeviPortraitSVG: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Background Divine Aura Gradient */}
        <radialGradient id="sacredHalo" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="35%" stopColor="#FDE047" />
          <stop offset="65%" stopColor="#F59E0B" />
          <stop offset="90%" stopColor="#B45309" />
          <stop offset="100%" stopColor="#78350F" />
        </radialGradient>

        {/* Golden Crown & Jewelry Gradient */}
        <linearGradient id="divineGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="25%" stopColor="#FACC15" />
          <stop offset="50%" stopColor="#EAB308" />
          <stop offset="75%" stopColor="#CA8A04" />
          <stop offset="100%" stopColor="#854D0E" />
        </linearGradient>

        {/* Crimson Saffron Silk */}
        <linearGradient id="sacredCrimson" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="40%" stopColor="#DC2626" />
          <stop offset="80%" stopColor="#991B1B" />
          <stop offset="100%" stopColor="#7F1D1D" />
        </linearGradient>

        {/* Sacred Kumkum Red */}
        <radialGradient id="kumkumRed" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="80%" stopColor="#B91C1C" />
          <stop offset="100%" stopColor="#7F1D1D" />
        </radialGradient>

        {/* Divine Skin Tone */}
        <linearGradient id="divineSkin" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="50%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>

        {/* Drop shadow filter */}
        <filter id="divineGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Outer Circle Container */}
      <circle cx="100" cy="100" r="98" fill="url(#sacredHalo)" />

      {/* 24 Rays of Divine Sun / Aura (Prabhamandala) */}
      <g stroke="#FDE047" strokeWidth="2.5" opacity="0.8" strokeLinecap="round">
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i * 360) / 24;
          const rad = (angle * Math.PI) / 180;
          const x1 = 100 + 72 * Math.cos(rad);
          const y1 = 100 + 72 * Math.sin(rad);
          const x2 = 100 + 94 * Math.cos(rad);
          const y2 = 100 + 94 * Math.sin(rad);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
      </g>

      {/* Decorative Ornate Gold Ring */}
      <circle cx="100" cy="100" r="94" stroke="url(#divineGold)" strokeWidth="3" />
      <circle cx="100" cy="100" r="90" stroke="#78350F" strokeWidth="1" strokeDasharray="3 3" />

      {/* Golden halo disc behind head */}
      <circle cx="100" cy="90" r="54" fill="#FEF08A" opacity="0.6" filter="url(#divineGlow)" />

      {/* Shoulders and Royal Silk Saree / Shawl */}
      <path
        d="M32 195 C 40 148, 70 138, 100 138 C 130 138, 160 148, 168 195 Z"
        fill="url(#sacredCrimson)"
      />
      {/* Saree Gold Borders (Zari) */}
      <path
        d="M36 195 C 50 152, 75 142, 100 142 C 125 142, 150 152, 164 195"
        stroke="url(#divineGold)"
        strokeWidth="4"
        fill="none"
      />
      <path
        d="M60 155 L 100 195 L 140 155"
        stroke="url(#divineGold)"
        strokeWidth="2.5"
        fill="none"
      />

      {/* Layered Sacred Temple Necklaces (Mangalsutra, Kasulaperu, Gold Haarams) */}
      <path d="M78 142 C 85 158, 115 158, 122 142" stroke="url(#divineGold)" strokeWidth="3.5" fill="none" />
      <circle cx="100" cy="154" r="5" fill="#DC2626" stroke="url(#divineGold)" strokeWidth="1.5" />
      <path d="M72 150 C 82 170, 118 170, 128 150" stroke="url(#divineGold)" strokeWidth="3" fill="none" />
      {/* Golden coins pendant pearls */}
      {[82, 90, 100, 110, 118].map((cx, idx) => (
        <circle key={idx} cx={cx} cy={164 - Math.abs(100 - cx) * 0.4} r="3" fill="url(#divineGold)" />
      ))}

      {/* Divine Face & Neck */}
      {/* Neck */}
      <path d="M86 120 L 86 142 L 114 142 L 114 120 Z" fill="url(#divineSkin)" />
      {/* Sacred Neck Lines (Kantharekha) */}
      <path d="M90 128 C 96 131, 104 131, 110 128" stroke="#B45309" strokeWidth="1" />
      <path d="M92 134 C 97 137, 103 137, 108 134" stroke="#B45309" strokeWidth="1" />

      {/* Face Contour (Graceful, serene oval chin) */}
      <path
        d="M72 82 C 72 120, 84 132, 100 132 C 116 132, 128 120, 128 82 C 128 62, 72 62, 72 82 Z"
        fill="url(#divineSkin)"
      />

      {/* Ears & Kundalas (Heavy Gold Temple Earrings) */}
      {/* Left Ear & Earring */}
      <circle cx="68" cy="94" r="6" fill="url(#divineGold)" />
      <path d="M68 98 L 62 114 L 74 114 Z" fill="url(#divineGold)" stroke="#92400E" strokeWidth="0.8" />
      <circle cx="68" cy="116" r="3" fill="#DC2626" />
      {/* Right Ear & Earring */}
      <circle cx="132" cy="94" r="6" fill="url(#divineGold)" />
      <path d="M132 98 L 126 114 L 138 114 Z" fill="url(#divineGold)" stroke="#92400E" strokeWidth="0.8" />
      <circle cx="132" cy="116" r="3" fill="#DC2626" />

      {/* Black Hair Waves Framing the Face */}
      <path
        d="M68 76 C 68 112, 74 122, 74 122 C 70 105, 73 85, 82 72 C 74 72, 68 76, 68 76 Z"
        fill="#1C1917"
      />
      <path
        d="M132 76 C 132 112, 126 122, 126 122 C 130 105, 127 85, 118 72 C 126 72, 132 76, 132 76 Z"
        fill="#1C1917"
      />

      {/* Eyebrows (Arched like bow of Sri Rama) */}
      <path d="M78 84 C 84 81, 91 82, 95 85" stroke="#1C1917" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M122 84 C 116 81, 109 82, 105 85" stroke="#1C1917" strokeWidth="2.2" strokeLinecap="round" />

      {/* Eyes (Padmadalākṣhī - Lotus Petal Shaped, Compassionate Divine Gaze) */}
      {/* Left Eye */}
      <path
        d="M77 90 C 83 86, 92 86, 96 91 C 91 94, 83 94, 77 90 Z"
        fill="#FFFFFF"
        stroke="#1C1917"
        strokeWidth="1.2"
      />
      <circle cx="87" cy="90" r="3.2" fill="#292524" />
      <circle cx="88" cy="89" r="1.1" fill="#FFFFFF" />

      {/* Right Eye */}
      <path
        d="M123 90 C 117 86, 108 86, 104 91 C 109 94, 117 94, 123 90 Z"
        fill="#FFFFFF"
        stroke="#1C1917"
        strokeWidth="1.2"
      />
      <circle cx="113" cy="90" r="3.2" fill="#292524" />
      <circle cx="114" cy="89" r="1.1" fill="#FFFFFF" />

      {/* Nose & Golden Nose Ring (Nathu / Mukkupudaka) */}
      <path d="M100 85 L 97 103 C 98 106, 102 106, 103 103" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Left Nostril Nathu with Pearl */}
      <circle cx="94" cy="103" r="2.2" fill="url(#divineGold)" />
      <circle cx="93" cy="105" r="1.2" fill="#FFFFFF" />

      {/* Divine Lips (Red Bimba fruit auspicious smile) */}
      <path
        d="M93 113 C 96 111, 100 112, 100 113 C 100 112, 104 111, 107 113 C 105 118, 95 118, 93 113 Z"
        fill="#DC2626"
      />
      <path d="M92 113 C 97 114, 103 114, 108 113" stroke="#7F1D1D" strokeWidth="0.8" />

      {/* Sacred Forehead Tilakam: */}
      {/* Sandalwood crescent base */}
      <path d="M92 78 C 96 81, 104 81, 108 78" stroke="#FEF08A" strokeWidth="2.5" strokeLinecap="round" />
      {/* Trinetra (Divine Third Eye of Wisdom) */}
      <path
        d="M100 70 C 103 74, 103 78, 100 81 C 97 78, 97 74, 100 70 Z"
        fill="url(#kumkumRed)"
        stroke="url(#divineGold)"
        strokeWidth="0.8"
      />
      {/* Auspicious Round Red Kumkum Bindi */}
      <circle cx="100" cy="83" r="2.6" fill="url(#kumkumRed)" />

      {/* Majestic Golden Kireetam (Crown) of Goddess Durga */}
      {/* Crown base band */}
      <rect x="70" y="62" width="60" height="9" rx="2" fill="url(#divineGold)" stroke="#78350F" strokeWidth="1" />
      {/* Rubies & Emeralds on crown band */}
      <circle cx="76" cy="66.5" r="2" fill="#DC2626" />
      <circle cx="84" cy="66.5" r="2" fill="#16A34A" />
      <circle cx="92" cy="66.5" r="2" fill="#DC2626" />
      <circle cx="100" cy="66.5" r="2.5" fill="#FEF08A" stroke="#78350F" strokeWidth="0.8" />
      <circle cx="108" cy="66.5" r="2" fill="#DC2626" />
      <circle cx="116" cy="66.5" r="2" fill="#16A34A" />
      <circle cx="124" cy="66.5" r="2" fill="#DC2626" />

      {/* Tier 1 Crown Arch */}
      <path
        d="M74 62 C 78 45, 88 38, 100 35 C 112 38, 122 45, 126 62 Z"
        fill="url(#divineGold)"
        stroke="#78350F"
        strokeWidth="1.2"
      />
      {/* Tier 2 Crown Peak */}
      <path
        d="M84 42 C 90 24, 96 16, 100 12 C 104 16, 110 24, 116 42 Z"
        fill="url(#divineGold)"
        stroke="#78350F"
        strokeWidth="1.2"
      />
      {/* Golden Kalasam Shikhara on Top of Crown */}
      <circle cx="100" cy="11" r="3.5" fill="#FEF08A" stroke="#78350F" strokeWidth="0.8" />
      <path d="M100 4 L 102 9 L 98 9 Z" fill="#FDE047" />

      {/* Crescent Moon (Chandra-Kala) on Crown */}
      <path
        d="M112 28 C 115 32, 115 38, 111 41 C 113 40, 115 36, 114 31 Z"
        fill="#FFFFFF"
      />

      {/* Fresh Marigold & Jasmine Garland (Pula Mala) Framing Shoulders */}
      {/* Left Mala */}
      {[
        { cx: 50, cy: 155, c: '#F59E0B' },
        { cx: 58, cy: 168, c: '#EA580C' },
        { cx: 68, cy: 180, c: '#FACC15' },
        { cx: 80, cy: 190, c: '#F59E0B' },
      ].map((g, idx) => (
        <g key={`l-${idx}`}>
          <circle cx={g.cx} cy={g.cy} r="6" fill={g.c} />
          <circle cx={g.cx} cy={g.cy} r="3" fill="#FEF08A" />
          <circle cx={g.cx - 5} cy={g.cy - 3} r="2" fill="#FFFFFF" />
        </g>
      ))}

      {/* Right Mala */}
      {[
        { cx: 150, cy: 155, c: '#F59E0B' },
        { cx: 142, cy: 168, c: '#EA580C' },
        { cx: 132, cy: 180, c: '#FACC15' },
        { cx: 120, cy: 190, c: '#F59E0B' },
      ].map((g, idx) => (
        <g key={`r-${idx}`}>
          <circle cx={g.cx} cy={g.cy} r="6" fill={g.c} />
          <circle cx={g.cx} cy={g.cy} r="3" fill="#FEF08A" />
          <circle cx={g.cx + 5} cy={g.cy - 3} r="2" fill="#FFFFFF" />
        </g>
      ))}
    </svg>
  );
};

export const DeviProfileAvatar: React.FC<DeviProfileAvatarProps> = ({
  size = 'md',
  className = '',
  showHalo = true,
  showBorder = true,
  onClick,
  customSrc,
}) => {
  const [profileImage, setProfileImage] = useState<string | null>(customSrc || null);

  useEffect(() => {
    if (customSrc !== undefined) {
      setProfileImage(customSrc);
      return;
    }

    try {
      const stored = localStorage.getItem(DEFAULT_DEVI_PROFILE_STORAGE_KEY);
      if (stored) {
        setProfileImage(stored);
      }
    } catch {
      // LocalStorage fallback
    }

    // Sync with server profile image
    const syncImage = () => {
      fetch(`/api/profile?t=${Date.now()}`, { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          setProfileImage(data?.profileImage || null);
          try {
            if (data?.profileImage) {
              localStorage.setItem(DEFAULT_DEVI_PROFILE_STORAGE_KEY, data.profileImage);
            } else {
              localStorage.removeItem(DEFAULT_DEVI_PROFILE_STORAGE_KEY);
            }
          } catch {}
        })
        .catch(() => {});
    };

    syncImage();

    // Listen to custom profile update event
    const handleStorageUpdate = () => {
      syncImage();
    };

    window.addEventListener('devi_profile_updated', handleStorageUpdate);
    window.addEventListener('festival_profile_updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('focus', handleStorageUpdate);

    return () => {
      window.removeEventListener('devi_profile_updated', handleStorageUpdate);
      window.removeEventListener('festival_profile_updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('focus', handleStorageUpdate);
    };
  }, [customSrc]);

  const sizeClass = sizeMap[size] || sizeMap.md;

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full transition-transform select-none ${
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300' : ''
      } ${sizeClass} ${className}`}
      title="ఎదుల్లగూడెం దేవి అమ్మవారి దివ్య దర్శనం (Edullagudem Devi Official Profile)"
    >
      {/* Outer Halo Glow */}
      {showHalo && (
        <span
          className="absolute -inset-1 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-300 to-red-500 opacity-60 blur-xs animate-pulse pointer-events-none"
        />
      )}

      {/* Main Avatar Container */}
      <div
        className={`relative w-full h-full rounded-full overflow-hidden bg-gradient-to-b from-amber-700 via-red-900 to-amber-950 flex items-center justify-center ${
          showBorder ? 'border-2 border-amber-300 shadow-md ring-1 ring-amber-500/50' : ''
        }`}
      >
        {profileImage ? (
          <img
            src={profileImage}
            alt="Edullagudem Devi Sharannavarathulu 2026 Profile"
            className="w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
            onError={() => {
              // If custom image fails to load, gracefully fall back to divine portrait
              setProfileImage(null);
            }}
          />
        ) : (
          <SacredDeviPortraitSVG className="w-full h-full" />
        )}
      </div>

      {/* Tiny Auspicious Diya Marker for larger sizes */}
      {(size === 'xl' || size === '2xl' || size === 'hero') && (
        <div className="absolute -bottom-1 -right-1 bg-amber-500 text-stone-950 rounded-full p-1 border-2 border-amber-200 shadow-md flex items-center justify-center">
          <span className="text-[10px] sm:text-xs font-bold leading-none">🕉️</span>
        </div>
      )}
    </div>
  );
};
