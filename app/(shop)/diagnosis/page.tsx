"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";

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
      { value: "nothing", label: "I don&apos;t do anything" },
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
      { value: "never", label: "I don&apos;t use polish" },
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
  const { t, tArray } = useLanguage();
  const [hasStarted, setHasStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  // Map questions to translations
  const getQuestionTranslation = (questionId: string): string => {
    const translations: Record<string, string> = {
      "condition-1": t("nailDiagnosis.questions.strength"),
      "condition-2": t("nailDiagnosis.questions.peeling"),
      "condition-3": t("nailDiagnosis.questions.discoloration"),
      "condition-4": t("nailDiagnosis.questions.cuticles"),
      "condition-5": t("nailDiagnosis.questions.ridges"),
      "habits-1": t("nailDiagnosis.questions.polishFrequency"),
      "habits-2": t("nailDiagnosis.questions.biting"),
      "habits-3": t("nailDiagnosis.questions.cuticleCare"),
      "habits-4": t("nailDiagnosis.questions.polishRemoval"),
      "habits-5": t("nailDiagnosis.questions.moisturizing"),
      "appearance-1": t("nailDiagnosis.questions.nailShape"),
      "appearance-2": t("nailDiagnosis.questions.growthRate"),
      "appearance-3": t("nailDiagnosis.questions.lifting"),
    };
    return translations[questionId] || questions.find(q => q.id === questionId)?.question || "";
  };

  const getOptionTranslation = (value: string): string => {
    const translations: Record<string, string> = {
      "strong": t("nailDiagnosis.answers.strong"),
      "moderate": t("nailDiagnosis.answers.moderatelyStrong"),
      "weak": t("nailDiagnosis.answers.weak"),
      "brittle": t("nailDiagnosis.answers.brittle"),
      "never": t("nailDiagnosis.answers.never"),
      "rarely": t("nailDiagnosis.answers.rarely"),
      "sometimes": t("nailDiagnosis.answers.sometimes"),
      "often": t("nailDiagnosis.answers.often"),
      "none": t("nailDiagnosis.answers.noDiscoloration"),
      "yellow": t("nailDiagnosis.answers.yellowTint"),
      "white": t("nailDiagnosis.answers.whiteSpots"),
      "dark": t("nailDiagnosis.answers.darkSpots"),
      "healthy": t("nailDiagnosis.answers.healthyCuticles"),
      "dry": t("nailDiagnosis.answers.dryCuticles"),
      "overgrown": t("nailDiagnosis.answers.overgrown"),
      "damaged": t("nailDiagnosis.answers.damagedCuticles"),
      "smooth": t("nailDiagnosis.answers.smooth"),
      "vertical": t("nailDiagnosis.answers.verticalRidges"),
      "horizontal": t("nailDiagnosis.answers.horizontalRidges"),
      "bumps": t("nailDiagnosis.answers.bumps"),
      "rarely-year": t("nailDiagnosis.answers.rarelyYear"),
      "weekly": t("nailDiagnosis.answers.weekly"),
      "daily": t("nailDiagnosis.answers.daily"),
      "oil": t("nailDiagnosis.answers.useCuticleOil"),
      "push": t("nailDiagnosis.answers.pushBack"),
      "cut": t("nailDiagnosis.answers.cutCuticles"),
      "nothing": t("nailDiagnosis.answers.nothingCuticles"),
      "acetone-free": t("nailDiagnosis.answers.acetoneFree"),
      "acetone": t("nailDiagnosis.answers.acetoneBased"),
      "peel": t("nailDiagnosis.answers.peelOff"),
      "no-polish": t("nailDiagnosis.answers.noPolish"),
      "few-times": t("nailDiagnosis.answers.fewTimesWeek"),
      "once-week": t("nailDiagnosis.answers.onceWeek"),
      "rarely-never": t("nailDiagnosis.answers.rarelyNever"),
      "square": t("nailDiagnosis.answers.square"),
      "round": t("nailDiagnosis.answers.round"),
      "oval": t("nailDiagnosis.answers.oval"),
      "almond": t("nailDiagnosis.answers.almond"),
      "fast": t("nailDiagnosis.answers.veryFast"),
      "normal": t("nailDiagnosis.answers.normal"),
      "slow": t("nailDiagnosis.answers.slow"),
      "very-slow": t("nailDiagnosis.answers.verySlow"),
    };
    return translations[value] || value;
  };

  const getCategoryTranslation = (category: string): string => {
    if (category === "condition") return t("nailDiagnosis.categories.condition");
    if (category === "habits") return t("nailDiagnosis.categories.habits");
    if (category === "appearance") return t("nailDiagnosis.categories.appearance");
    return "";
  };

  const currentQuestion = questions[currentStep];
  const isLastQuestion = currentStep === questions.length - 1;

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
      recommendations = tArray("nailDiagnosis.results.recommendations.severelyDamaged");
      productCategories = ["strengthening", "cuticle-care", "moisturizing", "treatment"];
    } else if (totalScore >= 7 || drynessScore >= 4) {
      condition = "Dry and Brittle Nails";
      severity = "moderate";
      description =
        "Your nails are showing signs of dryness, brittleness, and need better hydration and care. With proper treatment, they can improve significantly.";
      recommendations = tArray("nailDiagnosis.results.recommendations.dryAndBrittle");
      productCategories = ["cuticle-care", "moisturizing", "strengthening", "treatment"];
    } else if (brittleScore >= 3 || damageScore >= 3) {
      condition = "Weak Nails Needing Strength";
      severity = "moderate";
      description =
        "Your nails need strengthening and protection. They&apos;re showing early signs of weakness that can be addressed with proper care.";
      recommendations = tArray("nailDiagnosis.results.recommendations.weakNails");
      productCategories = ["strengthening", "treatment", "base-coat"];
    } else if (drynessScore >= 3) {
      condition = "Dry Nails and Cuticles";
      severity = "mild";
      description =
        "Your nails and cuticles need more hydration. Regular moisturizing and cuticle care will improve their condition.";
      recommendations = tArray("nailDiagnosis.results.recommendations.dryNails");
      productCategories = ["cuticle-care", "moisturizing"];
    } else if (growthScore >= 2) {
      condition = "Slow Nail Growth";
      severity = "mild";
      description =
        "Your nails are healthy but growing slowly. A growth treatment can help accelerate nail growth and improve overall nail health.";
      recommendations = tArray("nailDiagnosis.results.recommendations.slowNailGrowth");
      productCategories = ["growth", "treatment"];
    } else {
      condition = "Generally Healthy Nails";
      severity = "mild";
      description =
        "Your nails are in good condition! Continue with your current care routine and consider preventive products to maintain their health.";
      recommendations = tArray("nailDiagnosis.results.recommendations.generallyHealthy");
      productCategories = ["preventive", "base-coat", "cuticle-care"];
    }

    const diagnosisResult: Diagnosis = {
      condition,
      severity,
      description,
      recommendations,
      productCategories,
    };

    // Store diagnosis in sessionStorage and navigate to results page
    sessionStorage.setItem("diagnosis_result", JSON.stringify(diagnosisResult));
    router.push("/diagnosis/results");
  };

  const restartDiagnosis = () => {
    setHasStarted(false);
    setCurrentStep(0);
    setAnswers({});
  };

  const handleStart = () => {
    setHasStarted(true);
  };


  if (!hasStarted) {
    return (
      <div className="w-full">
        {/* Two Container Layout - Full Width */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 min-h-screen">
          {/* Left Container - Picture (50% width, full height, touches top) */}
          <div className="w-full h-[500px] lg:h-screen lg:sticky lg:top-0 bg-gray-100 overflow-hidden">
            <Image
              src="/DSC_8219-v3.webp"
              alt="Nail care illustration"
              width={1920}
              height={1080}
              className="w-full h-full object-cover"
              priority
            />
          </div>

          {/* Right Container - Diagnosis Welcome Content (50% width) */}
          <div className="w-full h-auto lg:min-h-screen p-8 lg:p-12 flex items-center bg-white overflow-y-auto">
            <div className="w-full">
              <Card className="border-0 shadow-none">
                <CardHeader>
                  <CardTitle className="text-2xl">{t("nailDiagnosis.welcome.title")}</CardTitle>
                  <CardDescription>
                    {t("nailDiagnosis.welcome.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-semibold">
                        1
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{t("nailDiagnosis.welcome.answerQuestions")}</h3>
                        <p className="text-sm text-gray-600">
                          {t("nailDiagnosis.welcome.answerQuestionsDesc")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-semibold">
                        2
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{t("nailDiagnosis.welcome.getDiagnosis")}</h3>
                        <p className="text-sm text-gray-600">
                          {t("nailDiagnosis.welcome.getDiagnosisDesc")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-semibold">
                        3
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{t("nailDiagnosis.welcome.productRecommendations")}</h3>
                        <p className="text-sm text-gray-600">
                          {t("nailDiagnosis.welcome.productRecommendationsDesc")}
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
                      {t("nailDiagnosis.welcome.startDiagnosis")}
                    </Button>
                  </div>

                  <p className="text-xs text-gray-500 text-center">
                    {t("nailDiagnosis.welcome.timeEstimate")}
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
          <Image
            src="/DSC_8219-v3.webp"
            alt="Nail care illustration"
            width={1920}
            height={1080}
            className="w-full h-full object-cover"
            priority
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
                {t("nailDiagnosis.buttons.questionProgress").replace("{current}", String(currentStep + 1)).replace("{total}", String(questions.length))}
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{getQuestionTranslation(currentQuestion.id)}</CardTitle>
                <CardDescription>
                  {getCategoryTranslation(currentQuestion.category)}
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
                        {getOptionTranslation(option.value)}
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
                    {t("nailDiagnosis.buttons.back")}
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={
                      !answers[currentQuestion.id] ||
                      (currentQuestion.type === "multiple" &&
                        (answers[currentQuestion.id] as string[]).length === 0)
                    }
                  >
                    {isLastQuestion ? t("nailDiagnosis.buttons.getDiagnosis") : t("nailDiagnosis.buttons.next")}
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

