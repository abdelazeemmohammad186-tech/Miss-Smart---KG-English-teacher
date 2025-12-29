
import React, { useEffect, useState } from 'react';

interface TeacherAvatarProps {
  isTalking?: boolean;
  isLoading?: boolean;
}

export const TeacherAvatar: React.FC<TeacherAvatarProps> = ({ isTalking, isLoading }) => {
  const [blink, setBlink] = useState(false);

  // تأثير الرمش العشوائي للعيون لتبدو حية
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-64 h-64 md:w-80 md:h-80 group">
        {/* توهج خلفي سحري متغير الألوان */}
        <div className={`absolute -inset-12 rounded-full blur-3xl opacity-30 transition-all duration-1000 ${
          isTalking ? 'bg-gradient-to-r from-yellow-400 to-pink-500 animate-pulse scale-110' : 'bg-pink-300'
        }`}></div>

        {/* وجه ميس سمارت المطور (SVG) */}
        <svg viewBox="0 0 200 200" className={`w-full h-full drop-shadow-[0_20px_35px_rgba(0,0,0,0.15)] transition-all duration-500 ${isTalking ? 'scale-105 rotate-1' : 'scale-100 hover:rotate-1'}`}>
          {/* الشعر الخلفي */}
          <path d="M30,110 Q30,20 100,20 Q170,20 170,110" fill="#3E2723" />
          
          {/* الرقبة */}
          <rect x="85" y="140" width="30" height="30" fill="#FFCCBC" />
          
          {/* الوجه الأساسي */}
          <circle cx="100" cy="95" r="75" fill="#FFE0BD" stroke="#F5CBA7" strokeWidth="1" /> 
          
          {/* الشعر الأمامي (الغرة) */}
          <path d="M25,95 Q25,30 100,30 Q175,30 175,95 L175,80 Q100,20 25,80 Z" fill="#4E342E" />

          {/* العيون والرمش */}
          <g className={isTalking ? 'animate-bounce' : ''}>
            {/* العين اليسرى */}
            <circle cx="70" cy="90" r="10" fill="white" />
            {!blink ? (
              <circle cx="72" cy="90" r="5" fill="#333" />
            ) : (
              <line x1="60" y1="90" x2="80" y2="90" stroke="#333" strokeWidth="3" strokeLinecap="round" />
            )}
            
            {/* العين اليمنى */}
            <circle cx="130" cy="90" r="10" fill="white" />
            {!blink ? (
              <circle cx="128" cy="90" r="5" fill="#333" />
            ) : (
              <line x1="120" y1="90" x2="140" y2="90" stroke="#333" strokeWidth="3" strokeLinecap="round" />
            )}
          </g>

          {/* النظارة الذكية اللامعة */}
          <g opacity="0.7">
            <circle cx="70" cy="90" r="18" fill="none" stroke="#444" strokeWidth="2.5" />
            <circle cx="130" cy="90" r="18" fill="none" stroke="#444" strokeWidth="2.5" />
            <line x1="88" y1="90" x2="112" y2="90" stroke="#444" strokeWidth="2.5" />
          </g>

          {/* الخدود الوردية */}
          <circle cx="55" cy="120" r="12" fill="#FF8A80" opacity="0.3" />
          <circle cx="145" cy="120" r="12" fill="#FF8A80" opacity="0.3" />

          {/* الفم التفاعلي */}
          {isTalking ? (
            <path d="M80,135 Q100,165 120,135 Z" fill="#D81B60" className="animate-pulse" />
          ) : (
            <path d="M85,138 Q100,152 115,138" fill="none" stroke="#D81B60" strokeWidth="4" strokeLinecap="round" />
          )}
        </svg>

        {/* قبعة التخرج المرحة */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 -rotate-12 transition-transform hover:rotate-0 duration-300">
          <i className="fas fa-graduation-cap text-5xl text-gray-800 drop-shadow-lg"></i>
          <div className="absolute top-8 right-0 w-1 h-8 bg-yellow-500 rounded-full animate-wiggle"></div>
        </div>

        {/* فقاعات الحب الطائرة عند الكلام */}
        {isTalking && (
          <div className="absolute -right-4 top-1/4 animate-ping">
            <i className="fas fa-heart text-pink-500 text-3xl"></i>
          </div>
        )}
      </div>

      <div className={`px-10 py-5 rounded-[40px] text-white font-black text-2xl shadow-2xl transition-all duration-500 border-b-8 border-black/10 transform ${
        isLoading ? 'bg-amber-400 rotate-2' : isTalking ? 'bg-pink-500 scale-110 -rotate-2' : 'bg-purple-600'
      }`}>
        <i className={`fas ${isLoading ? 'fa-wand-magic-sparkles animate-spin' : isTalking ? 'fa-comment-dots' : 'fa-face-smile-wink'} mr-3`}></i>
        {isLoading ? "ميس سمارت بتحضر المفاجأة..." : isTalking ? "أنا سامعة وشايفة يا بطل!" : "اضغط عشان أكلمك!"}
      </div>
    </div>
  );
};
