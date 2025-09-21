import Image from "next/image";

export default function Home() {
    return (
        <section className="py-12 sm:py-16">
            <div className="mx-auto max-w-3xl text-center">
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
                    Task Manager
                </h1>
                <p className="mt-4 text-base sm:text-lg text-muted-foreground">
                    Organize your work, stay on top of priorities, and move faster with a clean,
                    modern task management experience. Leave the mindless work to the AI, and
                    utilize your talent to the best of your abilities.
                </p>
            </div>

            <div className="mt-10 sm:mt-12">
                <div
                    className="relative mx-auto max-w-5xl rounded-2xl border border-white/20 bg-white/10 backdrop-blur-lg shadow-2xl">
                    <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl">
                        <Image
                            alt="Application screenshot"
                            src="/hero-home.png"
                            width={1200}
                            height={675}
                            className="h-full w-full object-cover"
                            priority
                        />
                    </div>

                    <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10"/>
                </div>
            </div>

            <div className="mx-auto mt-8 max-w-3xl text-center text-sm text-muted-foreground">
                <p>
                    Log in to start creating tasks, tracking progress, and collaborating with your team.
                </p>
            </div>
        </section>
    );
}
