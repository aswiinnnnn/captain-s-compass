import { useNavigate } from 'react-router-dom';
import { ArrowRight, Ship, BarChart3, Route } from 'lucide-react';
import landingVideo from '@/assets/landing-bg.mp4';

const features = [
  {
    icon: Ship,
    title: 'Fleet Tracking',
    description: 'Real-time vessel monitoring with live positional data, speed metrics, and route visualization across global waters.',
  },
  {
    icon: BarChart3,
    title: 'Smart Bidding',
    description: 'AI-powered canal transit bidding with market intelligence, win-probability analysis, and automated optimization.',
  },
  {
    icon: Route,
    title: 'Voyage Planning',
    description: 'Multi-strategy route optimization balancing cost, speed, and weather conditions with interactive map previews.',
  },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen overflow-hidden relative flex flex-col items-center justify-center">
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
      <div className="absolute inset-0 bg-primary/80" />

      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl px-6">
        <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight mb-4">
          AquaMinds
        </h1>
        <p className="text-lg md:text-xl text-white/70 mb-10 leading-relaxed max-w-2xl mx-auto">
          Enterprise fleet operations platform for real-time voyage optimization, risk management, and intelligent bidding.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="inline-flex items-center gap-3 px-8 py-4 bg-white text-primary font-bold text-sm rounded-lg hover:bg-white/90 transition-all shadow-lg shadow-black/20 mb-16"
        >
          Explore Platform
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-6 text-left hover:bg-white/15 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mb-4">
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-white font-semibold text-base mb-2">{feature.title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Landing;
