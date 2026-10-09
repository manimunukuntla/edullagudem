import React from 'react';
import { Language } from '../types';
import { getTranslation } from '../lib/translations';
import { DiyaIcon } from './FestiveIcons';
import { useFestivalProfile } from '../lib/profile';
import { TARGET_WHATSAPP_NUMBER } from '../lib/whatsapp';

interface FooterProps {
  language: Language;
}

export const Footer: React.FC<FooterProps> = ({ language }) => {
  const t = getTranslation(language);
  const { profile } = useFestivalProfile();

  const title = language === 'te'
    ? (profile.eventTitleTe || 'ఎదుల్లగూడెం దేవి శరన్నవరాత్రులు 2026')
    : (profile.eventTitleEn || 'Edullagudem Devi Sharannavarathulu 2026');

  const committee = language === 'te'
    ? (profile.committeeNameTe || 'ఎదుల్లగూడెం దేవి శరన్నవరాత్రుల ఉత్సవ సమితి')
    : (profile.committeeNameEn || 'Edullagudem Devi Navarathri Utsava Samithi');

  const phone = profile.coordinatorPhone || TARGET_WHATSAPP_NUMBER;

  return (
    <footer className="mt-16 bg-[#3B0712] text-amber-100/80 border-t-2 border-amber-600/60 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <DiyaIcon className="w-5 h-5 text-amber-400" />
          <span className="font-serif font-bold text-amber-200 text-sm">
            {title}
          </span>
        </div>

        <div className="text-center sm:text-right text-[11px] text-amber-200/70 space-y-1">
          <p>© 2026 {committee}. All rights reserved.</p>
          <p>
            Official Contact / WhatsApp: <a href={`https://wa.me/91${phone}`} target="_blank" rel="noopener noreferrer" className="font-mono text-amber-300 font-bold hover:underline">{phone}</a>
          </p>
          <p className="text-amber-300/90 font-medium tracking-wide">
            Created by Mani
          </p>
        </div>
      </div>
    </footer>
  );
};
