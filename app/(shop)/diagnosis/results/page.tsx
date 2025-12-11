"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Sparkles, 
  Heart, 
  ArrowRight,
  RotateCcw,
  ShoppingBag,
  TrendingUp,
  Shield,
  Droplets,
  Download,
  Share2,
  Calendar,
  Target,
  Award,
  Zap
} from "lucide-react";

interface Diagnosis {
  condition: string;
  severity: "mild" | "moderate" | "severe";
  description: string;
  recommendations: string[];
  productCategories: string[];
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string;
  image: string | null;
  images?: string[];
  featured: boolean;
  category: {
    id: string;
    name: string;
  } | null;
}

const getSeverityConfig = (severity: "mild" | "moderate" | "severe") => {
  switch (severity) {
    case "severe":
      return {
        icon: AlertCircle,
        bgGradient: "from-red-50/50 to-white",
        borderColor: "border-red-200/60",
        badgeBg: "bg-red-100",
        badgeText: "text-red-800",
        iconBg: "bg-red-100",
        iconColor: "text-red-600",
        accentColor: "text-red-600",
        progressColor: "bg-red-500",
      };
    case "moderate":
      return {
        icon: AlertTriangle,
        bgGradient: "from-yellow-50/50 to-white",
        borderColor: "border-yellow-200/60",
        badgeBg: "bg-yellow-100",
        badgeText: "text-yellow-800",
        iconBg: "bg-yellow-100",
        iconColor: "text-yellow-600",
        accentColor: "text-yellow-600",
        progressColor: "bg-yellow-500",
      };
    default:
      return {
        icon: CheckCircle2,
        bgGradient: "from-green-50/50 to-white",
        borderColor: "border-green-200/60",
        badgeBg: "bg-green-100",
        badgeText: "text-green-800",
        iconBg: "bg-green-100",
        iconColor: "text-green-600",
        accentColor: "text-green-600",
        progressColor: "bg-green-500",
      };
  }
};

export default function DiagnosisResultsPage() {
  const router = useRouter();
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Retrieve diagnosis data from sessionStorage
    const storedDiagnosis = sessionStorage.getItem("diagnosis_result");
    
    if (storedDiagnosis) {
      try {
        const parsedDiagnosis = JSON.parse(storedDiagnosis);
        setDiagnosis(parsedDiagnosis);
        fetchRecommendedProducts(parsedDiagnosis.productCategories);
      } catch (error) {
        console.error("Failed to parse diagnosis data:", error);
        router.push("/diagnosis");
      }
    } else {
      router.push("/diagnosis");
    }
    setIsLoading(false);
  }, [router]);

  const fetchRecommendedProducts = async (categories: string[]) => {
    setIsLoadingProducts(true);
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const allProducts: Product[] = await res.json();
        
        const keywords = [
          ...categories,
          "strength",
          "strengthening",
          "cuticle",
          "oil",
          "moisturiz",
          "hydrat",
          "treatment",
          "growth",
          "base",
          "care",
        ];

        const filtered = allProducts.filter((product) => {
          const nameLower = product.name.toLowerCase();
          const descLower = (product.description || "").toLowerCase();
          const categoryName = (product.category?.name || "").toLowerCase();

          return keywords.some((keyword) =>
            nameLower.includes(keyword) ||
            descLower.includes(keyword) ||
            categoryName.includes(keyword)
          );
        });

        const recommended = filtered.length > 0 
          ? filtered.slice(0, 6)
          : allProducts.filter(p => p.featured).slice(0, 6);

        setRecommendedProducts(recommended);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const restartDiagnosis = () => {
    sessionStorage.removeItem("diagnosis_result");
    router.push("/diagnosis");
  };

  const handleShare = async () => {
    if (navigator.share && diagnosis) {
      try {
        await navigator.share({
          title: "My Nail Diagnosis - BIO Sculpture",
          text: `My nail diagnosis: ${diagnosis.condition} - ${diagnosis.severity} condition`,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-black mb-4"></div>
          <div className="text-lg font-heading font-medium text-brand-black">Loading your diagnosis...</div>
        </div>
      </div>
    );
  }

  if (!diagnosis || !mounted) {
    return null;
  }

  const severityConfig = getSeverityConfig(diagnosis.severity);
  const SeverityIcon = severityConfig.icon;
  const severityProgress = diagnosis.severity === "severe" ? 30 : diagnosis.severity === "moderate" ? 60 : 85;

  return (
    <div className="min-h-screen w-full bg-brand-white">
      {/* Hero Section with Diagnosis Summary */}
      <div className="w-full bg-gradient-to-b from-brand-sweet-bianca/30 via-brand-white to-brand-white border-b border-brand-champagne/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center mb-12">
            <div 
              className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand-black mb-6 transform transition-all duration-500 ${
                mounted ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
              }`}
            >
              <Sparkles className="w-10 h-10 text-brand-white" />
            </div>
            <h1 className={`text-4xl lg:text-6xl font-heading font-medium mb-6 text-brand-black transition-all duration-700 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              Your Nail Diagnosis
            </h1>
            <p className={`text-lg lg:text-xl font-sans font-light text-brand-champagne max-w-2xl mx-auto transition-all duration-700 delay-100 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              Based on your responses, here's your personalized nail care analysis
            </p>
          </div>

          {/* Diagnosis Summary Card */}
          <Card className={`bg-gradient-to-br ${severityConfig.bgGradient} ${severityConfig.borderColor} border-2 shadow-2xl transform transition-all duration-500 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <CardHeader className="pb-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex items-start gap-6">
                  <div className={`p-4 rounded-2xl ${severityConfig.iconBg} shadow-lg`}>
                    <SeverityIcon className={`w-10 h-10 ${severityConfig.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-3xl lg:text-4xl font-heading font-medium text-brand-black mb-3">
                      {diagnosis.condition}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span
                        className={`inline-flex items-center px-5 py-2 rounded-full text-sm font-heading font-medium ${severityConfig.badgeBg} ${severityConfig.badgeText} shadow-sm`}
                      >
                        {diagnosis.severity.charAt(0).toUpperCase() + diagnosis.severity.slice(1)} Condition
                      </span>
                      <span className="text-sm font-sans font-light text-brand-champagne">
                        {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    {/* Progress Indicator */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-sans font-light text-brand-champagne">Overall Health Score</span>
                        <span className="text-xs font-heading font-medium text-brand-black">{severityProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-brand-sweet-bianca rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${severityConfig.progressColor} transition-all duration-1000 ease-out`}
                          style={{ width: mounted ? `${severityProgress}%` : '0%' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleShare}
                    variant="outline"
                    size="sm"
                    className="border-brand-champagne/30 hover:bg-brand-champagne/10"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={handlePrint}
                    variant="outline"
                    size="sm"
                    className="border-brand-champagne/30 hover:bg-brand-champagne/10"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-brand-black text-lg lg:text-xl font-sans font-light leading-relaxed">
                {diagnosis.description}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        {/* Recommendations Section */}
        <div className="mb-20">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 rounded-xl bg-brand-black shadow-lg">
              <Heart className="w-7 h-7 text-brand-white" />
            </div>
            <div>
              <h2 className="text-3xl lg:text-5xl font-heading font-medium text-brand-black mb-2">
                Personalized Recommendations
              </h2>
              <p className="text-brand-champagne font-sans font-light">
                Tailored care steps to improve your nail health
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
            {diagnosis.recommendations.map((rec, index) => (
              <Card 
                key={index} 
                className="group border border-brand-champagne/20 hover:border-brand-champagne/40 hover:shadow-xl transition-all duration-300 bg-brand-white"
              >
                <CardContent className="p-6 lg:p-8">
                  <div className="flex items-start gap-5">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-brand-black text-brand-white flex items-center justify-center text-base font-heading font-medium shadow-lg group-hover:scale-110 transition-transform duration-300">
                      {index + 1}
                    </div>
                    <p className="text-brand-black text-base lg:text-lg font-sans font-light leading-relaxed pt-1.5">
                      {rec}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recommended Products Section */}
        <div className="mb-20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-brand-black shadow-lg">
                <ShoppingBag className="w-7 h-7 text-brand-white" />
              </div>
              <div>
                <h2 className="text-3xl lg:text-5xl font-heading font-medium text-brand-black mb-2">
                  Recommended Products
                </h2>
                <p className="text-brand-champagne font-sans font-light">
                  Curated selections for your specific needs
                </p>
              </div>
            </div>
            <Button 
              onClick={() => router.push("/products")} 
              variant="outline"
              className="hidden sm:flex items-center gap-2 border-brand-champagne/30 hover:bg-brand-champagne/10 font-heading"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {isLoadingProducts ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-black mb-4"></div>
              <div className="text-lg font-sans font-light text-brand-champagne">Loading recommended products...</div>
            </div>
          ) : recommendedProducts.length === 0 ? (
            <Card className="border-2 border-dashed border-brand-champagne/30 bg-brand-sweet-bianca/20">
              <CardContent className="py-20 text-center">
                <ShoppingBag className="w-20 h-20 text-brand-champagne/40 mx-auto mb-6" />
                <p className="text-brand-champagne mb-8 text-lg font-sans font-light">
                  No specific products found. Check out our full product range!
                </p>
                <Button 
                  onClick={() => router.push("/products")} 
                  size="lg" 
                  className="gap-2 bg-brand-black hover:bg-brand-champagne font-heading"
                >
                  <ShoppingBag className="w-5 h-5" />
                  View All Products
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-10">
                {recommendedProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className={`transform transition-all duration-500 ${
                      mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    <ProductCard
                      id={product.id}
                      name={product.name}
                      price={product.price}
                      image={product.image}
                      images={product.images}
                      featured={product.featured}
                    />
                  </div>
                ))}
              </div>
              <div className="text-center">
                <Button 
                  onClick={() => router.push("/products")} 
                  size="lg"
                  variant="outline"
                  className="gap-2 border-brand-champagne/30 hover:bg-brand-champagne/10 font-heading"
                >
                  View All Products
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Quick Tips Section */}
        <Card className="mb-16 bg-gradient-to-br from-brand-sweet-bianca/40 to-brand-white border border-brand-champagne/20 shadow-lg">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-brand-black">
                <TrendingUp className="w-6 h-6 text-brand-white" />
              </div>
              <CardTitle className="text-2xl lg:text-3xl font-heading font-medium text-brand-black">
                Quick Tips for Better Nail Health
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-3 rounded-lg bg-brand-champagne/10">
                  <Shield className="w-6 h-6 text-brand-champagne" />
                </div>
                <div>
                  <h4 className="font-heading font-medium mb-2 text-brand-black">Protect Your Nails</h4>
                  <p className="text-sm font-sans font-light text-brand-champagne leading-relaxed">
                    Use gloves when doing household chores and avoid using nails as tools.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-3 rounded-lg bg-brand-champagne/10">
                  <Droplets className="w-6 h-6 text-brand-champagne" />
                </div>
                <div>
                  <h4 className="font-heading font-medium mb-2 text-brand-black">Stay Hydrated</h4>
                  <p className="text-sm font-sans font-light text-brand-champagne leading-relaxed">
                    Keep your nails and cuticles moisturized daily with quality oils and creams.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-3 rounded-lg bg-brand-champagne/10">
                  <Heart className="w-6 h-6 text-brand-champagne" />
                </div>
                <div>
                  <h4 className="font-heading font-medium mb-2 text-brand-black">Be Gentle</h4>
                  <p className="text-sm font-sans font-light text-brand-champagne leading-relaxed">
                    Avoid harsh chemicals and be gentle when removing polish or shaping nails.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Plan Section */}
        <Card className="mb-16 border border-brand-champagne/20 bg-gradient-to-br from-brand-white to-brand-sweet-bianca/20">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-brand-black">
                <Target className="w-6 h-6 text-brand-white" />
              </div>
              <CardTitle className="text-2xl lg:text-3xl font-heading font-medium text-brand-black">
                Your Action Plan
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 rounded-xl bg-brand-white border border-brand-champagne/20">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-champagne/10 mb-4">
                  <Calendar className="w-6 h-6 text-brand-champagne" />
                </div>
                <h4 className="font-heading font-medium mb-2 text-brand-black">Week 1-2</h4>
                <p className="text-sm font-sans font-light text-brand-champagne">
                  Start with daily moisturizing and cuticle care routine
                </p>
              </div>
              <div className="text-center p-6 rounded-xl bg-brand-white border border-brand-champagne/20">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-champagne/10 mb-4">
                  <Zap className="w-6 h-6 text-brand-champagne" />
                </div>
                <h4 className="font-heading font-medium mb-2 text-brand-black">Week 3-4</h4>
                <p className="text-sm font-sans font-light text-brand-champagne">
                  Incorporate strengthening treatments and protective base coats
                </p>
              </div>
              <div className="text-center p-6 rounded-xl bg-brand-white border border-brand-champagne/20">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-champagne/10 mb-4">
                  <Award className="w-6 h-6 text-brand-champagne" />
                </div>
                <h4 className="font-heading font-medium mb-2 text-brand-black">Month 2+</h4>
                <p className="text-sm font-sans font-light text-brand-champagne">
                  Maintain routine and enjoy healthier, stronger nails
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-12 border-t border-brand-champagne/20">
          <Button 
            onClick={restartDiagnosis} 
            variant="outline" 
            size="lg" 
            className="w-full sm:w-auto gap-2 border-brand-champagne/30 hover:bg-brand-champagne/10 font-heading"
          >
            <RotateCcw className="w-5 h-5" />
            Take Diagnosis Again
          </Button>
          <Button 
            onClick={() => router.push("/products")} 
            size="lg" 
            className="w-full sm:w-auto gap-2 bg-brand-black hover:bg-brand-champagne font-heading transition-colors duration-300"
          >
            <ShoppingBag className="w-5 h-5" />
            Shop Products
          </Button>
        </div>
      </div>
    </div>
  );
}
