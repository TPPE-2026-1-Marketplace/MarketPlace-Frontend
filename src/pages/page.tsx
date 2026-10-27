import HeroSection from "@/components/sections/HeroSection";
import FeaturedProducts from "@/components/sections/FeaturedProducts";
import CategorySection from "@/components/sections/CategorySection";
import GuidanceSection from "@/components/sections/GuidanceSection";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <CategorySection />
      <FeaturedProducts />
      <GuidanceSection />
    </main>
  );
}
