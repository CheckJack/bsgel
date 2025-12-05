"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";

interface Question {
  id: string;
  question: string;
  type: "single" | "multiple";
  options: { value: string; label: string }[];
  category: "condition" | "habits" | "appearance";
}

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

const questions: Question[] = [
  // Nail Condition Questions
  {
    id: "condition-1",
    question: "How would you describe the strength of your nails?",
    type: "single",
    options: [
      { value: "strong", label: "Strong and hard" },
      { value: "moderate", label: "Moderately strong" },
      { value: "weak", label: "Weak and flexible" },
      { value: "brittle", label: "Brittle and break easily" },
    ],
    category: "condition",
  },
  {
    id: "condition-2",
    question: "Do your nails peel or split?",
    type: "single",
    options: [
      { value: "never", label: "Never" },
      { value: "rarely", label: "Rarely" },
      { value: "sometimes", label: "Sometimes" },
      { value: "often", label: "Often" },
    ],
    category: "condition",
  },
  {
    id: "condition-3",
    question: "Do you notice any discoloration on your nails?",
    type: "single",
    options: [
      { value: "none", label: "No discoloration" },
      { value: "yellow", label: "Yellow tint" },
      { value: "white", label: "White spots or patches" },
      { value: "dark", label: "Dark spots or lines" },
    ],
    category: "condition",
  },
  {
    id: "condition-4",
    question: "How do your cuticles look?",
    type: "single",
    options: [
      { value: "healthy", label: "Healthy and soft" },
      { value: "dry", label: "Dry and cracked" },
      { value: "overgrown", label: "Overgrown" },
      { value: "damaged", label: "Damaged or torn" },
    ],
    category: "condition",
  },
  {
    id: "condition-5",
    question: "Do your nails have ridges or bumps?",
    type: "single",
    options: [
      { value: "smooth", label: "Smooth surface" },
      { value: "vertical", label: "Vertical ridges" },
      { value: "horizontal", label: "Horizontal ridges" },
      { value: "bumps", label: "Bumps or uneven texture" },
    ],
    category: "condition",
  },
  // Habit Questions
  {
    id: "habits-1",
    question: "How often do you use nail polish?",
    type: "single",
    options: [
      { value: "never", label: "Never" },
      { value: "rarely", label: "Rarely (few times a year)" },
      { value: "weekly", label: "Weekly" },
      { value: "daily", label: "Daily or almost daily" },
    ],
    category: "habits",
  },
  {
    id: "habits-2",
    question: "Do you bite your nails or pick at your cuticles?",
    type: "single",
    options: [
      { value: "never", label: "Never" },
      { value: "rarely", label: "Rarely" },
      { value: "sometimes", label: "Sometimes" },
      { value: "often", label: "Often" },
    ],
    category: "habits",
  },
  {
    id: "habits-3",
    question: "How do you care for your cuticles?",
    type: "single",
    options: [
      { value: "oil", label: "I use cuticle oil regularly" },
      { value: "push", label: "I push them back gently" },
      { value: "cut", label: "I cut them" },
      { value: "nothing", label: "I don't do anything" },
    ],
    category: "habits",
  },
  {
    id: "habits-4",
    question: "How do you remove nail polish?",
    type: "single",
    options: [
      { value: "acetone-free", label: "Acetone-free remover" },
      { value: "acetone", label: "Acetone-based remover" },
      { value: "peel", label: "I peel it off" },
      { value: "never", label: "I don't use polish" },
    ],
    category: "habits",
  },
  {
    id: "habits-5",
    question: "How often do you moisturize your hands and nails?",
    type: "single",
    options: [
      { value: "daily", label: "Daily" },
      { value: "few-times", label: "A few times a week" },
      { value: "weekly", label: "Once a week" },
      { value: "rarely", label: "Rarely or never" },
    ],
    category: "habits",
  },
  // Appearance Questions
  {
    id: "appearance-1",
    question: "What shape are your nails naturally?",
    type: "single",
    options: [
      { value: "square", label: "Square" },
      { value: "round", label: "Round" },
      { value: "oval", label: "Oval" },
      { value: "almond", label: "Almond" },
    ],
    category: "appearance",
  },
  {
    id: "appearance-2",
    question: "How fast do your nails grow?",
    type: "single",
    options: [
      { value: "fast", label: "Very fast" },
      { value: "normal", label: "Normal rate" },
      { value: "slow", label: "Slow" },
      { value: "very-slow", label: "Very slow" },
    ],
    category: "appearance",
  },
  {
    id: "appearance-3",
    question: "Do you experience nail lifting from the nail bed?",
    type: "single",
    options: [
      { value: "never", label: "Never" },
      { value: "rarely", label: "Rarely" },
      { value: "sometimes", label: "Sometimes" },
      { value: "often", label: "Often" },
    ],
    category: "appearance",
  },
];

export default function NailDiagnosisPage() {
  const router = useRouter();
  const [hasStarted, setHasStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  const currentQuestion = questions[currentStep];
  const isLastQuestion = currentStep === questions.length - 1;
  const showResults = diagnosis !== null;

  const handleAnswer = (value: string) => {
    if (currentQuestion.type === "single") {
      setAnswers({ ...answers, [currentQuestion.id]: value });
    } else {
      const currentAnswers = (answers[currentQuestion.id] as string[]) || [];
      const newAnswers = currentAnswers.includes(value)
        ? currentAnswers.filter((a) => a !== value)
        : [...currentAnswers, value];
      setAnswers({ ...answers, [currentQuestion.id]: newAnswers });
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      generateDiagnosis();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generateDiagnosis = () => {
    // Analyze answers to determine diagnosis
    const conditionAnswers = Object.entries(answers).filter(
      ([key]) => key.startsWith("condition-")
    );
    const habitAnswers = Object.entries(answers).filter(
      ([key]) => key.startsWith("habits-")
    );
    const appearanceAnswers = Object.entries(answers).filter(
      ([key]) => key.startsWith("appearance-")
    );

    // Calculate scores
    let brittleScore = 0;
    let drynessScore = 0;
    let damageScore = 0;
    let growthScore = 0;

    // Analyze condition answers
    const strength = answers["condition-1"];
    if (strength === "brittle") brittleScore += 3;
    if (strength === "weak") brittleScore += 2;
    if (strength === "moderate") brittleScore += 1;

    const peeling = answers["condition-2"];
    if (peeling === "often") damageScore += 3;
    if (peeling === "sometimes") damageScore += 2;
    if (peeling === "rarely") damageScore += 1;

    const cuticles = answers["condition-4"];
    if (cuticles === "dry") drynessScore += 3;
    if (cuticles === "damaged") drynessScore += 2;
    if (cuticles === "overgrown") drynessScore += 1;

    // Analyze habit answers
    const polishRemoval = answers["habits-4"];
    if (polishRemoval === "peel") damageScore += 3;
    if (polishRemoval === "acetone") drynessScore += 2;

    const moisturizing = answers["habits-5"];
    if (moisturizing === "rarely") drynessScore += 3;
    if (moisturizing === "weekly") drynessScore += 1;

    const cuticleCare = answers["habits-3"];
    if (cuticleCare === "cut") damageScore += 2;
    if (cuticleCare === "nothing") drynessScore += 2;

    const nailBiting = answers["habits-2"];
    if (nailBiting === "often") damageScore += 3;
    if (nailBiting === "sometimes") damageScore += 2;

    // Analyze appearance answers
    const growth = answers["appearance-3"];
    if (growth === "often") damageScore += 2;
    if (growth === "sometimes") damageScore += 1;

    const growthRate = answers["appearance-2"];
    if (growthRate === "very-slow") growthScore += 2;
    if (growthRate === "slow") growthScore += 1;

    // Determine overall diagnosis
    const totalScore = brittleScore + drynessScore + damageScore;
    let condition: string;
    let severity: "mild" | "moderate" | "severe";
    let description: string;
    let recommendations: string[];
    let productCategories: string[];

    if (totalScore >= 12 || damageScore >= 6) {
      condition = "Severely Damaged Nails";
      severity = "severe";
      description =
        "Your nails show significant signs of damage, brittleness, and dehydration. They require intensive care and treatment to restore their health.";
      recommendations = [
        "Use a strengthening treatment daily",
        "Apply cuticle oil 2-3 times per day",
        "Avoid harsh nail polish removers",
        "Stop biting or picking at nails",
        "Use a protective base coat before polish",
        "Consider taking a break from nail polish for 2-3 weeks",
        "Moisturize hands and nails multiple times daily",
      ];
      productCategories = ["strengthening", "cuticle-care", "moisturizing", "treatment"];
    } else if (totalScore >= 7 || drynessScore >= 4) {
      condition = "Dry and Brittle Nails";
      severity = "moderate";
      description =
        "Your nails are showing signs of dryness, brittleness, and need better hydration and care. With proper treatment, they can improve significantly.";
      recommendations = [
        "Apply cuticle oil daily",
        "Use a hydrating nail treatment",
        "Moisturize hands regularly",
        "Avoid acetone-based removers",
        "Use a strengthening base coat",
        "Don't cut cuticles, push them back gently",
      ];
      productCategories = ["cuticle-care", "moisturizing", "strengthening", "treatment"];
    } else if (brittleScore >= 3 || damageScore >= 3) {
      condition = "Weak Nails Needing Strength";
      severity = "moderate";
      description =
        "Your nails need strengthening and protection. They're showing early signs of weakness that can be addressed with proper care.";
      recommendations = [
        "Use a strengthening treatment",
        "Apply a protective base coat",
        "Be gentle when removing polish",
        "Keep nails trimmed to prevent breakage",
        "Use cuticle oil regularly",
      ];
      productCategories = ["strengthening", "treatment", "base-coat"];
    } else if (drynessScore >= 3) {
      condition = "Dry Nails and Cuticles";
      severity = "mild";
      description =
        "Your nails and cuticles need more hydration. Regular moisturizing and cuticle care will improve their condition.";
      recommendations = [
        "Apply cuticle oil daily",
        "Moisturize hands after washing",
        "Use a hydrating hand cream",
        "Avoid harsh soaps and chemicals",
      ];
      productCategories = ["cuticle-care", "moisturizing"];
    } else if (growthScore >= 2) {
      condition = "Slow Nail Growth";
      severity = "mild";
      description =
        "Your nails are healthy but growing slowly. A growth treatment can help accelerate nail growth and improve overall nail health.";
      recommendations = [
        "Use a nail growth treatment",
        "Maintain a balanced diet",
        "Keep nails well-moisturized",
        "Protect nails from excessive water exposure",
      ];
      productCategories = ["growth", "treatment"];
    } else {
      condition = "Generally Healthy Nails";
      severity = "mild";
      description =
        "Your nails are in good condition! Continue with your current care routine and consider preventive products to maintain their health.";
      recommendations = [
        "Continue regular moisturizing",
        "Use a protective base coat when wearing polish",
        "Maintain cuticle care routine",
        "Protect nails from harsh chemicals",
      ];
      productCategories = ["preventive", "base-coat", "cuticle-care"];
    }

    const diagnosisResult: Diagnosis = {
      condition,
      severity,
      description,
      recommendations,
      productCategories,
    };

    setDiagnosis(diagnosisResult);
    fetchRecommendedProducts(diagnosisResult.productCategories);
  };

  const fetchRecommendedProducts = async (categories: string[]) => {
    setIsLoadingProducts(true);
    try {
      // Fetch all products and filter by category names or keywords
      const res = await fetch("/api/products");
      if (res.ok) {
        const allProducts: Product[] = await res.json();
        
        // Filter products based on category names or product name/description keywords
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

        // If no specific matches, show featured products or all products
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
    setHasStarted(false);
    setCurrentStep(0);
    setAnswers({});
    setDiagnosis(null);
    setRecommendedProducts([]);
  };

  const handleStart = () => {
    setHasStarted(true);
  };

  if (showResults) {
    return (
      <div className="w-full">
        {/* Two Container Layout - Full Width */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 min-h-screen">
          {/* Left Container - Picture (50% width, full height, touches top) */}
          <div className="w-full h-[500px] lg:h-screen lg:sticky lg:top-0 bg-gray-100 overflow-hidden">
            <img
              src="/DSC_8219-v3.webp"
              alt="Nail care illustration"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Right Container - Diagnosis (50% width) */}
          <div className="w-full h-auto lg:min-h-screen p-8 lg:p-12 flex items-start bg-white overflow-y-auto">
            <div className="w-full max-w-2xl mx-auto">
              <div className="mb-8">
                <h1 className="text-4xl font-bold mb-4">Your Nail Diagnosis</h1>
                <p className="text-lg text-gray-600 mb-6">
                  Based on your responses, here's what we found:
                </p>
              </div>

              <Card className="mb-8">
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-2xl">{diagnosis.condition}</CardTitle>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                        diagnosis.severity === "severe"
                          ? "bg-red-100 text-red-800"
                          : diagnosis.severity === "moderate"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {diagnosis.severity.charAt(0).toUpperCase() + diagnosis.severity.slice(1)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-6">{diagnosis.description}</p>

                  <div className="mb-6">
                    <h3 className="font-semibold text-lg mb-3">Recommendations:</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      {diagnosis.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-6">Recommended Products</h2>
                {isLoadingProducts ? (
                  <div className="text-center py-12">Loading recommended products...</div>
                ) : recommendedProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600 mb-4">
                      No specific products found. Check out our full product range!
                    </p>
                    <Button onClick={() => router.push("/products")}>
                      View All Products
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {recommendedProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        id={product.id}
                        name={product.name}
                        price={product.price}
                        image={product.image}
                        images={product.images}
                        featured={product.featured}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4 justify-center mt-8">
                <Button onClick={restartDiagnosis} variant="outline">
                  Take Diagnosis Again
                </Button>
                <Button onClick={() => router.push("/products")}>
                  View All Products
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <div className="w-full">
        {/* Two Container Layout - Full Width */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 min-h-screen">
          {/* Left Container - Picture (50% width, full height, touches top) */}
          <div className="w-full h-[500px] lg:h-screen lg:sticky lg:top-0 bg-gray-100 overflow-hidden">
            <img
              src="/DSC_8219-v3.webp"
              alt="Nail care illustration"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Right Container - Diagnosis Welcome Content (50% width) */}
          <div className="w-full h-auto lg:min-h-screen p-8 lg:p-12 flex items-center bg-white overflow-y-auto">
            <div className="w-full">
              <Card className="border-0 shadow-none">
                <CardHeader>
                  <CardTitle className="text-2xl">Welcome to Your Nail Diagnosis</CardTitle>
                  <CardDescription>
                    We'll ask you a few questions about your nails to provide personalized recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-semibold">
                        1
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Answer Questions</h3>
                        <p className="text-sm text-gray-600">
                          We'll ask about your nail condition, care habits, and appearance
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-semibold">
                        2
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Get Your Diagnosis</h3>
                        <p className="text-sm text-gray-600">
                          Receive a detailed analysis of your nail health and condition
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-semibold">
                        3
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Product Recommendations</h3>
                        <p className="text-sm text-gray-600">
                          Discover products tailored to your specific nail care needs
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={handleStart}
                      className="w-full"
                      size="lg"
                    >
                      Start Diagnosis
                    </Button>
                  </div>

                  <p className="text-xs text-gray-500 text-center">
                    This will take approximately {Math.ceil(questions.length * 0.5)} minutes
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Two Container Layout - Full Width */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* Left Container - Picture (50% width, full height, touches top) */}
        <div className="w-full h-[500px] lg:h-screen lg:sticky lg:top-0 bg-gray-100 overflow-hidden">
          <img
            src="/DSC_8219-v3.webp"
            alt="Nail care illustration"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right Container - Questions (50% width) */}
        <div className="w-full h-auto lg:min-h-screen p-8 lg:p-12 flex items-center bg-white overflow-y-auto">
          <div className="w-full max-w-2xl mx-auto">
            <div className="mb-8">
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-black h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentStep + 1) / questions.length) * 100}%`,
                  }}
                />
              </div>
              <p className="text-sm text-gray-500">
                Question {currentStep + 1} of {questions.length}
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{currentQuestion.question}</CardTitle>
                <CardDescription>
                  {currentQuestion.category === "condition" && "About your nail condition"}
                  {currentQuestion.category === "habits" && "About your nail care habits"}
                  {currentQuestion.category === "appearance" && "About your nail appearance"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentQuestion.options.map((option) => {
                    const isSelected =
                      currentQuestion.type === "single"
                        ? answers[currentQuestion.id] === option.value
                        : (answers[currentQuestion.id] as string[] | undefined)?.includes(
                            option.value
                          );

                    return (
                      <button
                        key={option.value}
                        onClick={() => handleAnswer(option.value)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? "border-black bg-gray-50 font-medium"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between mt-8">
                  <Button
                    onClick={handleBack}
                    disabled={currentStep === 0}
                    variant="outline"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={
                      !answers[currentQuestion.id] ||
                      (currentQuestion.type === "multiple" &&
                        (answers[currentQuestion.id] as string[]).length === 0)
                    }
                  >
                    {isLastQuestion ? "Get Diagnosis" : "Next"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

