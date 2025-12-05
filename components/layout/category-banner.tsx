"use client";

import Link from "next/link";
import Image from "next/image";

interface CategoryPanel {
  image: string;
  text: string;
  link?: string;
  textPosition?: "center" | "bottom-left";
  textCase?: "uppercase" | "lowercase";
}

interface CategoryBannerProps {
  categories: CategoryPanel[];
}

export function CategoryBanner({ categories }: CategoryBannerProps) {
  return (
    <section className="w-full mt-2">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
        {categories.map((category, index) => {
          const content = (
            <div className="relative w-full h-[250px] sm:h-[300px] md:h-[350px] lg:h-[400px] overflow-hidden group cursor-pointer">
              <div className="relative w-full h-full">
                <Image
                  src={category.image}
                  alt={category.text}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 20vw"
                />
              </div>
              {index === 0 && (
                <div className="absolute inset-0 flex items-center justify-center z-10 p-4 pointer-events-none">
                  <div className="relative w-full h-full flex items-center justify-center">
                    <Image
                      src="/ETHOSLOGO.png"
                      alt="ETHOS Logo"
                      width={200}
                      height={200}
                      className="object-contain w-[60%] sm:w-[50%] md:w-[45%] lg:w-auto h-auto max-w-[200px]"
                      style={{ maxWidth: '100%', maxHeight: '100%' }}
                    />
                  </div>
                </div>
              )}
              {index === 1 && (
                <div className="absolute inset-0 flex items-center justify-center z-10 p-4 pointer-events-none">
                  <div className="relative w-full h-full flex items-center justify-center">
                    <Image
                      src="/biologo.png"
                      alt="BIO Logo"
                      width={200}
                      height={200}
                      className="object-contain w-[60%] sm:w-[50%] md:w-[45%] lg:w-auto h-auto max-w-[200px]"
                      style={{ maxWidth: '100%', maxHeight: '100%' }}
                    />
                  </div>
                </div>
              )}
              {index === 2 && (
                <div className="absolute inset-0 flex items-center justify-center z-10 p-4 pointer-events-none">
                  <div className="relative w-full h-full flex items-center justify-center">
                    <Image
                      src="/EVOLOGO.png"
                      alt="EVO Logo"
                      width={140}
                      height={140}
                      className="object-contain w-[50%] sm:w-[40%] md:w-[35%] lg:w-auto h-auto max-w-[140px]"
                      style={{ maxWidth: '100%', maxHeight: '100%' }}
                    />
                  </div>
                </div>
              )}
              {index === 3 && (
                <div className="absolute inset-0 flex items-center justify-center z-10 p-4 pointer-events-none">
                  <div className="relative w-full h-full flex items-center justify-center">
                    <Image
                      src="/SPALOGO.png"
                      alt="SPA Logo"
                      width={120}
                      height={120}
                      className="object-contain w-[45%] sm:w-[35%] md:w-[30%] lg:w-auto h-auto max-w-[120px]"
                      style={{ maxWidth: '100%', maxHeight: '100%' }}
                    />
                  </div>
                </div>
              )}
              {index === 4 && (
                <div className="absolute inset-0 flex items-center justify-center z-10 p-4 pointer-events-none">
                  <div className="relative w-full h-full flex items-center justify-center">
                    <Image
                      src="/geminilogo.png"
                      alt="Gemini Logo"
                      width={195}
                      height={195}
                      className="object-contain w-[60%] sm:w-[50%] md:w-[45%] lg:w-auto h-auto max-w-[195px]"
                      style={{ maxWidth: '100%', maxHeight: '100%' }}
                    />
                  </div>
                </div>
              )}
            </div>
          );

          return category.link ? (
            <Link key={index} href={category.link}>
              {content}
            </Link>
          ) : (
            <div key={index}>{content}</div>
          );
        })}
      </div>
    </section>
  );
}

