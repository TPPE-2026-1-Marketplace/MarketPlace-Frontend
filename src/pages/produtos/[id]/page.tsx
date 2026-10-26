import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/context/FavoritesContext";
import {
  fetchProduct,
  fetchProducts,
  fetchProductReviews,
  findVariant,
  getDisplayVariant,
  type Product,
  type ProductReview,
} from "@/lib/catalog";
import ImageGallery from "@/components/ui/ImageGallery";
import { ProductBreadcrumb } from "@/components/product/ProductBreadcrumb";
import { ProductPurchaseInfo } from "@/components/product/ProductPurchaseInfo";
import { ProductDetailsSection } from "@/components/product/ProductDetailsSection";
import { ProductReviewsSection } from "@/components/product/ProductReviewsSection";
import { ProductRelatedSection } from "@/components/product/ProductRelatedSection";
import { MobileStickyPurchaseBar } from "@/components/product/MobileStickyPurchaseBar";
import { SizeGuideModal } from "@/components/product/SizeGuideModal";
import { ProductDetailSkeleton } from "@/components/product/ProductDetailSkeleton";
import { ProductNotFound } from "@/components/product/ProductNotFound";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [sizeError, setSizeError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    async function loadData() {
      try {
        const [loadedProduct, relatedResponse, reviewsResponse] = await Promise.all([
          fetchProduct(Number(id)),
          fetchProducts({ page: 1, limit: 4 }),
          fetchProductReviews(Number(id)),
        ]);
        const initialVariant = getDisplayVariant(loadedProduct);
        setProduct(loadedProduct);
        setSelectedColor(initialVariant?.cor ?? "");
        setSelectedSize(initialVariant?.tamanho ?? "");
        setActiveImage(0);
        setRelated(
          relatedResponse.data.filter(
            (relatedProduct) => relatedProduct.idProduto !== loadedProduct.idProduto,
          ),
        );
        setReviews(reviewsResponse.data);
        setAverageRating(reviewsResponse.media);
        setTotalReviews(reviewsResponse.totalAvaliacoes);
      } catch (loadError) {
        console.error(loadError);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return <ProductNotFound />;
  }

  const selectableVariants = product.variants.filter((variant) => variant.ativo);
  const colors = Array.from(
    new Set(selectableVariants.map((variant) => variant.cor).filter(Boolean)),
  ) as string[];
  const sizes = Array.from(
    new Set(
      selectableVariants
        .filter((variant) => !selectedColor || variant.cor === selectedColor)
        .map((variant) => variant.tamanho)
        .filter(Boolean),
    ),
  ) as string[];

  const activeVariant =
    findVariant(product, selectedColor || undefined, selectedSize || undefined) ??
    findVariant(product, selectedColor || undefined) ??
    getDisplayVariant(product);

  const gallery = activeVariant?.images.length
    ? activeVariant.images
    : [{ idImagem: 0, url: "/hero-dress.png", ordem: 0, descricao: null }];

  const price = activeVariant?.precoVariante ?? product.precoBase;
  const originalPrice = product.precoBase > price ? product.precoBase : null;
  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : null;
  const stockEcommerce = activeVariant?.stock.qtdOnline ?? 0;
  const totalStock =
    (activeVariant?.stock.qtdOnline ?? 0) + (activeVariant?.stock.qtdLojaFisica ?? 0);
  const isLowStock = totalStock > 0 && totalStock <= 3;

  const categoryName = product.categories[0]?.nome || "Vestido";
  const activeVariantSku = activeVariant?.codigoSku || product.sku;

  const selectColor = (color: string) => {
    const variant =
      findVariant(product, color, selectedSize || undefined) ?? findVariant(product, color);
    setSelectedColor(color);
    setSelectedSize(variant?.tamanho ?? "");
    setQuantity(1);
    setActiveImage(0);
    setSizeError(null);
  };

  const selectSize = (size: string) => {
    const variant =
      findVariant(product, selectedColor || undefined, size) ?? findVariant(product, undefined, size);
    setSelectedSize(size);
    setSelectedColor(variant?.cor ?? selectedColor);
    setQuantity(1);
    setActiveImage(0);
    setSizeError(null);
  };

  const buildCartVariant = (variant: Product["variants"][number]) => ({
    codigoSku: variant.codigoSku,
    produto: {
      idProduto: product.idProduto,
      titulo: product.titulo,
      precoBase: product.precoBase,
    },
    precoVariante: variant.precoVariante,
    cor: variant.cor,
    tamanho: variant.tamanho,
    images: variant.images,
  });

  const handleAddToCart = () => {
    if (product.variants.length === 0) {
      alert("Por favor, selecione o tamanho e a cor antes de adicionar ao carrinho.");
      return;
    }

    if (!selectedSize && sizes.length > 0) {
      setSizeError("Selecione um tamanho");
      return;
    }

    if (!activeVariant) {
      alert("Por favor, selecione o tamanho e a cor antes de adicionar ao carrinho.");
      return;
    }

    addItem(buildCartVariant(activeVariant), quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (product.variants.length === 0) {
      alert("Por favor, selecione o tamanho e a cor antes de continuar.");
      return;
    }

    if (!selectedSize && sizes.length > 0) {
      setSizeError("Selecione um tamanho");
      return;
    }

    if (!activeVariant) {
      alert("Por favor, selecione o tamanho e a cor antes de continuar.");
      return;
    }

    addItem(buildCartVariant(activeVariant), quantity);
    navigate("/carrinho");
  };

  return (
    <div className="min-h-screen bg-[var(--background)] font-sans pb-16 lg:pb-0" data-testid="product-detail">
      {/* Breadcrumb da Loja */}
      <ProductBreadcrumb categoryName={categoryName} productTitle={product.titulo} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Botão Voltar */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] mt-4 mb-6 transition-colors cursor-pointer"
        >
          <ChevronLeft className="size-4" /> Voltar
        </button>

        {/* Bloco Superior: Galeria (Esq.) e Escolha e Compra (Dir.) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
          <ImageGallery
            images={gallery}
            productName={product.titulo}
            selectedIndex={activeImage}
            onSelectImage={setActiveImage}
            discount={discount}
            isLowStock={isLowStock}
            isFavorite={isFavorite(String(product.idProduto))}
            onToggleFavorite={() => toggleFavorite(String(product.idProduto))}
          />

          <ProductPurchaseInfo
            title={product.titulo}
            categoryName={categoryName}
            sku={activeVariantSku}
            price={price}
            originalPrice={originalPrice}
            discount={discount}
            colors={colors}
            selectedColor={selectedColor}
            onSelectColor={selectColor}
            sizes={sizes}
            selectedSize={selectedSize}
            onSelectSize={selectSize}
            onOpenSizeGuide={() => setShowSizeModal(true)}
            sizeError={sizeError}
            quantity={quantity}
            onQuantityChange={setQuantity}
            stockEcommerce={stockEcommerce}
            added={added}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            averageRating={averageRating}
            totalReviews={totalReviews}
          />
        </div>

        {/* Apresentação do Produto / Conheça o Vestido e Informações Técnicas */}
        <ProductDetailsSection
          description={product.descricao}
          sku={activeVariantSku}
          categoryName={categoryName}
          colors={colors}
          sizes={sizes}
          stockEcommerce={stockEcommerce}
          material={product.material}
          composicao={product.composicao}
          silhueta={product.silhueta}
          selectedSize={selectedSize}
        />

        {/* Seção de Avaliações dos Clientes */}
        <ProductReviewsSection
          reviews={reviews}
          averageRating={averageRating}
          totalReviews={totalReviews}
        />

        {/* Vitrine de Produtos Relacionados */}
        <ProductRelatedSection products={related} />
      </div>

      {/* Barra de Compra Persistente no Mobile */}
      <MobileStickyPurchaseBar
        price={price}
        added={added}
        onAddToCart={handleAddToCart}
        isOutOfStock={stockEcommerce <= 0}
      />

      {/* Modal Guia e Tabela de Medidas */}
      <SizeGuideModal
        isOpen={showSizeModal}
        onClose={() => setShowSizeModal(false)}
        sizes={sizes}
        selectedSize={selectedSize}
      />
    </div>
  );
}
