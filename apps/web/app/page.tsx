import { LandingHero } from "./components/landing-hero";

export default function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#172554,_#050816_48%,_#020617)] px-6 py-10 text-white sm:px-10 lg:px-16">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center py-10">
        <LandingHero />
      </main>
    </div>
  );
}
