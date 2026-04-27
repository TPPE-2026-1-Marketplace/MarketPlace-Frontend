export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="mb-2 border border-white/20 px-5 py-3">
          <span className="text-2xl font-bold tracking-[0.4em] text-white">DK FASHION</span>
        </div>
        <h1 className="text-4xl font-light tracking-widest text-white sm:text-5xl">
          Hello, World
        </h1>
        <p className="mt-2 text-sm tracking-[0.2em] text-white/50 uppercase">
          Em breve, sua nova loja de vestidos
        </p>
      </div>
    </main>
  );
}
