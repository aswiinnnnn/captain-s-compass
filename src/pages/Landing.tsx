import { useNavigate } from 'react-router-dom';
import { Anchor, ArrowRight } from 'lucide-react';
import landingVideo from '@/assets/landing-bg.mp4';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen overflow-hidden relative flex items-center justify-center">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={landingVideo} type="video/mp4" />
      </video>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-[#0D133B]/75" />

      {/* Content */}
      <div className="relative z-10 text-center max-w-2xl px-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 mb-8">
          <Anchor className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight mb-4">
          Captain Voyage
        </h1>
        <p className="text-lg md:text-xl text-white/70 mb-10 leading-relaxed">
          Enterprise fleet operations platform for real-time voyage optimization, risk management, and intelligent bidding.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="inline-flex items-center gap-3 px-8 py-4 bg-white text-[#0D133B] font-bold text-sm rounded-lg hover:bg-white/90 transition-all shadow-lg shadow-black/20"
        >
          Explore Platform
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Landing;
