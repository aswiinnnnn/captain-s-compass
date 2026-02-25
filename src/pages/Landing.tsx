import { useNavigate } from 'react-router-dom';
import { ArrowRight, Ship, BarChart3, Navigation, Shield, Zap, Globe } from 'lucide-react';
import landingVideo from '@/assets/landing-bg.mp4';

const features = [
  {
    icon: Ship,
    title: 'Fleet Overview',
    description: 'Real-time tracking of all vessels with live position updates and voyage status monitoring.',
  },
  {
    icon: Navigation,
    title: 'Voyage Planner',
    description: 'AI-powered route optimization with weather, cost, and speed strategy recommendations.',
  },
  {
    icon: BarChart3,
    title: 'Bidding Hub',
    description: 'Smart bidding engine for canal transit slots with competitive analysis and win-rate insights.',
  },
  {
    icon: Shield,
    title: 'Risk Analysis',
    description: 'Comprehensive risk profiling for piracy zones, weather hazards, and regulatory compliance.',
  },
  {
    icon: Zap,
    title: 'AI Assistant',
    description: 'Conversational AI co-pilot for real-time operational decisions and voyage intelligence.',
  },
  {
    icon: Globe,
    title: 'Global Coverage',
    description: 'Worldwide port database with inbound/outbound scheduling, ECA zones, and war risk mapping.',
  },
];

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
      <div className="absolute inset-0 bg-[#0D133B]/80" />

      {/* Content */}
      <div className="relative z-10 text-center max-w-5xl px-6">
        <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight mb-4">
          AquaMinds
        </h1>
        <p className="text-lg md:text-xl text-white/60 mb-12 leading-relaxed max-w-2xl mx-auto">
          Enterprise fleet operations platform for real-time voyage optimization, risk management, and intelligent bidding.
        </p>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-12">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white/[0.07] backdrop-blur-sm border border-white/10 rounded-lg p-4 text-left hover:bg-white/[0.12] transition-colors"
            >
              <feature.icon className="w-5 h-5 text-white/70 mb-2" />
              <h3 className="text-sm font-semibold text-white mb-1">{feature.title}</h3>
              <p className="text-[11px] leading-relaxed text-white/50">{feature.description}</p>
            </div>
          ))}
        </div>

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
