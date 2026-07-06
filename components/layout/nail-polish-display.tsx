"use client";

export function NailPolishDisplay() {
  return (
    <section className="relative h-[50vh] min-h-[280px] w-full overflow-hidden sm:h-[60vh] md:h-[70vh] lg:h-[85vh] xl:h-screen">
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

