import HeroSection from "@/components/sections/HeroSection";
import FeaturedProducts from "@/components/sections/FeaturedProducts";
import CategorySection from "@/components/sections/CategorySection";
import PromoSection from "@/components/sections/PromoSection";
import ReviewsSection from "@/components/sections/ReviewsSection";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <CategorySection />
      <FeaturedProducts />
      <PromoSection />
      <ReviewsSection />
    </main>
  );
}
