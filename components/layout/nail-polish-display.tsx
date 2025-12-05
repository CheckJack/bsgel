"use client";

export function NailPolishDisplay() {
  return (
    <section className="w-full h-[60vh] sm:h-[70vh] md:h-[80vh] lg:h-screen relative overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/1adult.mp4" type="video/mp4" />
      </video>
    </section>
  );
}

