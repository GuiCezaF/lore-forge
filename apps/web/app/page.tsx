import { LandingHero } from "./components/landing-hero";

export default function Home() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
  const authUrl = `${apiUrl}/auth/google`;
  const bypassUrl = `${apiUrl}/auth/bypass`;
  const isDev = process.env.NODE_ENV !== "production";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_center,_#180808_0%,_#09090b_60%,_#020202_100%)] px-6 py-10 text-white sm:px-10 lg:px-16 flex items-center justify-center">
      <main className="w-full flex flex-col justify-center py-10">
        <LandingHero authUrl={authUrl} bypassUrl={bypassUrl} isDev={isDev} />
      </main>
    </div>
  );
}
