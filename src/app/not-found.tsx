import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="bg-canvas text-primary flex min-h-screen items-center justify-center px-6 py-16">
      <section className="mx-auto flex max-w-md flex-col items-center text-center">
        <Image
          src="/brand/lrp-method-logo.png"
          alt="LRP Method"
          width={190}
          height={46}
          priority
          className="h-auto w-44 object-contain sm:w-48"
        />
        <p className="text-accent mt-10 text-sm font-bold uppercase tracking-wide">Error 404</p>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Página no encontrada</h1>
        <p className="text-muted mt-4 text-base leading-7">
          La página que estás buscando no existe o fue movida. Volvé al inicio para seguir navegando.
        </p>
        <Link href="/" className="btn-primary mt-8 inline-flex items-center justify-center">
          Volver al inicio
        </Link>
      </section>
    </main>
  );
}
