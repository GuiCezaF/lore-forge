import { getAuthBypassUrl, getGoogleAuthUrl } from "@/lib/public-env";
import { LandingHero } from "./components/landing-hero";

type HomeProps = {
  searchParams: Promise<{ auth?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const authUrl = getGoogleAuthUrl();
  const bypassUrl = getAuthBypassUrl();
  const isDev = process.env.NODE_ENV !== "production";
  const { auth } = await searchParams;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_center,_#180808_0%,_#09090b_60%,_#020202_100%)] px-6 py-10 text-white sm:px-10 lg:px-16 flex items-center justify-center">
      <main className="w-full flex flex-col justify-center py-10">
        <LandingHero
          authUrl={authUrl}
          bypassUrl={bypassUrl}
          isDev={isDev}
          authError={auth}
        />
      </main>
    </div>
  );
}
