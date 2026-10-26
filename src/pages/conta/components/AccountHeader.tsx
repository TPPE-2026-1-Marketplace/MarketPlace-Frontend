import { Link } from "react-router-dom";

export default function AccountHeader() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
      <p className="text-xs text-[var(--foreground-secondary)]">
        <Link to="/" className="hover:text-[var(--foreground)]">
          Início
        </Link>{" "}
        / Minha conta
      </p>
      <h1 className="mt-2 font-serif text-3xl text-[var(--foreground)] sm:text-4xl">Minha conta</h1>
      <p className="mt-3 text-base text-[var(--foreground-secondary)]">
        Acompanhe seus pedidos e consulte as informações da sua conta.
      </p>
    </div>
  );
}
