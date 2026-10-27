/** "Orientação" do Figma (750:93): lembra que as ações de edição dependem do perfil. */
export default function AccessNotice() {
  return (
    <aside className="flex flex-col gap-2 bg-[var(--background-store)] p-4 text-xs">
      <p className="leading-4 font-medium tracking-[0.5px] text-[var(--foreground)]">
        Acesso conforme o perfil do usuário
      </p>
      <p className="leading-[18px] text-[var(--foreground-secondary)]">
        As ações de edição são exibidas apenas para os perfis autorizados.
      </p>
    </aside>
  );
}
