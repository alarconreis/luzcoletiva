import Hero from '../components/Hero.jsx';
import FeatureCards from '../components/FeatureCards.jsx';
import MeetingSection from '../components/MeetingSection.jsx';
import StoriesSection from '../components/StoriesSection.jsx';

export default function Home() {
  return (
    <>
      <Hero />
      <FeatureCards />
      <MeetingSection />
      <StoriesSection />
    </>
  );
}
