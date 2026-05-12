import Hero from '../components/Hero.jsx';
import FeatureCards from '../components/FeatureCards.jsx';
import MeetingSection from '../components/MeetingSection.jsx';
import LatestPostsSection from '../components/LatestPostsSection.jsx';

import PageMeta from '../components/PageMeta.jsx';
export default function Home() {
  return (
    <>
      <PageMeta
      description="Plataforma brasileira de solidariedade. Conectamos quem precisa de ajuda com quem pode ajudar, com identidade verificada e mediação humana. Sem comissão, sem intermediação de dinheiro."
      path="/"
      />
      <Hero />
      <FeatureCards />
      <MeetingSection />
      <LatestPostsSection />
    </>
  );
}
