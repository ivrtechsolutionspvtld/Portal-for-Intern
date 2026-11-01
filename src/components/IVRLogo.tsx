import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface IVRLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  white?: boolean;
  showTagline?: boolean;
  linkHref?: string;
}

export default function IVRLogo({
  className = '',
  size = 'md',
  white = false,
  showTagline = true,
  linkHref = '/',
}: IVRLogoProps) {
  // Height sizing for the official logo image while maintaining exact 1024:414 aspect ratio
  const imgHeightClass = {
    sm: 'h-8 sm:h-9',
    md: 'h-10 sm:h-11',
    lg: 'h-12 sm:h-14',
  }[size];

  const brandTitleSize = {
    sm: 'text-xs sm:text-sm font-black',
    md: 'text-sm sm:text-base font-black',
    lg: 'text-base sm:text-lg font-black',
  }[size];

  const content = (
    <div className={`inline-flex items-center gap-3 group ${className}`}>
      {/* Official Uploaded Logo Image */}
      <div
        className={`relative flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-[1.02] ${
          white
            ? 'bg-white px-2 py-1 rounded-xl shadow-md border border-white/20'
            : 'bg-white/90 px-1.5 py-0.5 rounded-lg'
        }`}
      >
        <img
          src="/ivr-logo.png"
          alt="IVR TECH SOLUTIONS PRIVATE LIMITED"
          className={`${imgHeightClass} w-auto object-contain block`}
          style={{ maxHeight: size === 'lg' ? '56px' : size === 'md' ? '44px' : '36px' }}
        />
      </div>

      {/* Official Company Name & Exact Tagline */}
      <div className="flex flex-col text-left">
        <div className={`tracking-tight leading-tight uppercase ${brandTitleSize}`}>
          <span className={white ? 'text-white' : 'text-slate-900'}>
            IVR TECH SOLUTIONS{' '}
          </span>
          <span className={white ? 'text-purple-300 font-bold text-[10px] sm:text-xs' : 'text-[#7C3AED] font-bold text-[10px] sm:text-xs'}>
            PVT LTD
          </span>
        </div>

        {showTagline && (
          <span
            className={`text-[9px] sm:text-[10px] font-medium tracking-normal mt-0.5 leading-snug line-clamp-1 ${
              white ? 'text-purple-200/90' : 'text-slate-500'
            }`}
          >
            Building Skills. Creating Opportunities. Shaping Careers.
          </span>
        )}
      </div>
    </div>
  );

  if (linkHref) {
    return (
      <Link href={linkHref} className="inline-block focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
