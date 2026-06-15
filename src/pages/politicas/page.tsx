
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Truck, RefreshCw, Shield, MessageCircle, Clock, FileText, ChevronRight } from "lucide-react";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const sections = [
  { id: "entrega", label: "Entrega e Frete" },
  { id: "trocas", label: "Trocas e Devoluções" },
  { id: "pagamento", label: "Formas de Pagamento" },
  { id: "lgpd", label: "Proteção de Dados (LGPD)" },
  { id: "contato", label: "Atendimento" },
];

export default function PoliticasPage() {
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const id = window.location.hash.replace("#", "");
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f8f8] font-sans">
      {/* Header */}
      <div className="bg-[#1a1a1a] text-white py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
            <Link to="/" className="hover:text-gray-300 transition-colors">
              Início
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-400">Políticas e Diretrizes</span>
          </div>
          <h1 className="text-white mb-2 font-serif text-3xl" style={{ letterSpacing: "-0.02em" }}>
            Políticas e Diretrizes
          </h1>
          <p className="text-gray-400 text-sm max-w-lg">
            Informações sobre entrega, trocas, devoluções, formas de pagamento e proteção de dados
            da DK Festas.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar navigation */}
          <aside className="lg:w-56 shrink-0">
            <div className="bg-white border border-gray-100 p-4 sticky top-24">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Seções</p>
              <nav className="space-y-0.5">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-[#1a1a1a] hover:bg-gray-50 transition-colors"
                  >
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                    {s.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 space-y-8">
            {/* Entrega */}
            <section id="entrega" className="bg-white border border-gray-100 p-8 scroll-mt-24">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-10 h-10 bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-gray-900 mb-1 font-serif text-xl">Entrega e Frete</h2>
                  <p className="text-gray-500 text-sm">Informações sobre envio e prazo</p>
                </div>
              </div>

              <div className="space-y-5 text-sm text-gray-600 leading-relaxed">
                <div className="p-4 bg-[#1a1a1a] text-white">
                  <p className="text-xs tracking-widest uppercase mb-1 text-gray-400">
                    Área de cobertura
                  </p>
                  <p className="text-sm">
                    Realizamos entregas <strong>exclusivamente no Distrito Federal (DF)</strong>.
                    Para outras regiões, não há disponibilidade de envio no momento.
                  </p>
                </div>

                <div>
                  <h3 className="text-gray-800 mb-2 font-serif text-lg">Modalidades de Entrega</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-4 border border-gray-100">
                      <FileText className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-gray-800">PAC — Correios</p>
                        <p className="text-gray-500 text-xs mt-0.5">
                          Prazo estimado: 3 a 5 dias úteis para o DF
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 border border-gray-100">
                      <Truck className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-gray-800">SEDEX — Correios</p>
                        <p className="text-gray-500 text-xs mt-0.5">
                          Prazo estimado: 1 a 2 dias úteis para o DF
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-gray-800 mb-2 font-serif text-lg">Prazo de Processamento</h3>
                  <p>
                    Os pedidos são processados em até <strong>1 dia útil</strong> após a confirmação
                    do pagamento. O prazo de entrega começa a contar a partir da postagem nos Correios.
                  </p>
                </div>

                <div>
                  <h3 className="text-gray-800 mb-2 font-serif text-lg">Retirada na Loja</h3>
                  <p>
                    Também é possível retirar o pedido diretamente em nossa loja física em Brasília.
                    Entre em contato via WhatsApp para combinar o horário e receber o código de
                    validação para retirada.
                  </p>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-100">
                  <p className="text-amber-700 text-xs">
                    <strong>Atenção:</strong> Não nos responsabilizamos por atrasos causados pelos
                    Correios, greves ou situações de força maior. Acompanhe seu pedido pelo código
                    de rastreio enviado por e-mail.
                  </p>
                </div>
              </div>
            </section>

            {/* Trocas e Devoluções */}
            <section id="trocas" className="bg-white border border-gray-100 p-8 scroll-mt-24">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-10 h-10 bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-gray-900 mb-1 font-serif text-xl">Trocas e Devoluções</h2>
                  <p className="text-gray-500 text-sm">Conforme CDC (Lei 8.078/90)</p>
                </div>
              </div>

              <div className="space-y-5 text-sm text-gray-600 leading-relaxed">
                <div className="p-4 border-l-4 border-[#1a1a1a] bg-gray-50">
                  <p className="text-gray-900 mb-1">
                    Direito de Arrependimento — 7 dias corridos
                  </p>
                  <p>
                    De acordo com o <strong>Art. 49 do Código de Defesa do Consumidor (CDC)</strong>,
                    o cliente tem o direito de desistir da compra realizada online em até{" "}
                    <strong>7 (sete) dias corridos</strong>, contados a partir do recebimento do
                    produto, sem necessidade de justificativa.
                  </p>
                </div>

                <div>
                  <h3 className="text-gray-800 mb-2 font-serif text-lg">Como solicitar troca ou devolução</h3>
                  <ol className="space-y-2 list-decimal list-inside text-gray-600">
                    <li>
                      Entre em contato via <strong>WhatsApp</strong> ou e-mail em até 7 dias corridos
                      do recebimento.
                    </li>
                    <li>
                      Informe o número do pedido e o motivo da solicitação.
                    </li>
                    <li>
                      Envie fotos do produto (embalagem + peça) para análise.
                    </li>
                    <li>
                      Aguarde nossa confirmação com as instruções de envio de retorno.
                    </li>
                    <li>
                      Após recebermos e verificarmos o produto, processaremos o reembolso ou a troca.
                    </li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-gray-800 mb-2 font-serif text-lg">Condições para troca ou devolução</h3>
                  <ul className="space-y-1.5 text-gray-600">
                    {[
                      "Produto sem uso e sem marcas de uso",
                      "Com todas as etiquetas originais",
                      "Embalagem original preservada",
                      "Acompanhado da nota fiscal",
                      "Solicitação dentro do prazo de 7 dias corridos",
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-[#1a1a1a] rounded-full shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-gray-800 mb-2 font-serif text-lg">Reembolso</h3>
                  <p>
                    O reembolso será realizado pelo mesmo meio de pagamento utilizado na compra em até
                    7 dias úteis após a aprovação da devolução. Para pagamentos via PIX, o estorno
                    será feito via transferência para a chave PIX informada pelo cliente.
                  </p>
                </div>
              </div>
            </section>

            {/* Formas de Pagamento */}
            <section id="pagamento" className="bg-white border border-gray-100 p-8 scroll-mt-24">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-10 h-10 bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-gray-900 mb-1 font-serif text-xl">Formas de Pagamento</h2>
                  <p className="text-gray-500 text-sm">Opções disponíveis no e-commerce</p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-gray-600">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 border border-gray-100">
                    <p className="text-gray-800 mb-1">Cartão de Crédito</p>
                    <p className="text-gray-500 text-xs">
                      Parcelamento em até 12x sem juros. Aceitamos as principais bandeiras: Visa,
                      Mastercard, Elo, American Express.
                    </p>
                  </div>
                  <div className="p-4 border border-gray-100">
                    <p className="text-gray-800 mb-1">Cartão de Débito</p>
                    <p className="text-gray-500 text-xs">
                      Pagamento à vista via cartão de débito. Principais bandeiras aceitas.
                    </p>
                  </div>
                  <div className="p-4 border border-gray-100 sm:col-span-2">
                    <p className="text-gray-800 mb-1">PIX</p>
                    <p className="text-gray-500 text-xs">
                      Pagamento instantâneo via QR Code. O pedido é processado imediatamente após
                      a confirmação do PIX. Chave: <strong>contato@dkfestas.com.br</strong>
                    </p>
                  </div>
                </div>

                <p className="text-gray-400 text-xs">
                  Todas as transações são protegidas por criptografia SSL. Não armazenamos dados de
                  cartão de crédito em nossos servidores.
                </p>
              </div>
            </section>

            {/* LGPD */}
            <section id="lgpd" className="bg-white border border-gray-100 p-8 scroll-mt-24">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-10 h-10 bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-gray-900 mb-1 font-serif text-xl">Proteção de Dados Pessoais</h2>
                  <p className="text-gray-500 text-sm">Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018)</p>
                </div>
              </div>

              <div className="space-y-5 text-sm text-gray-600 leading-relaxed">
                <p>
                  A <strong>DK Festas</strong> está comprometida com a proteção e privacidade dos
                  dados pessoais de seus clientes, em conformidade com a Lei Geral de Proteção de
                  Dados Pessoais (LGPD — Lei 13.709/2018).
                </p>

                <div>
                  <h3 className="text-gray-800 mb-2 font-serif text-lg">Dados coletados e finalidade</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border border-gray-100">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left p-3 text-gray-700 border-b border-gray-100">
                            Dado coletado
                          </th>
                          <th className="text-left p-3 text-gray-700 border-b border-gray-100">
                            Finalidade
                          </th>
                          <th className="text-left p-3 text-gray-700 border-b border-gray-100">
                            Base legal
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ["Nome completo", "Emissão de nota fiscal e identificação", "Execução de contrato"],
                          ["CPF", "Faturamento fiscal e conformidade legal", "Obrigação legal"],
                          ["Endereço (DF)", "Logística e entrega do pedido", "Execução de contrato"],
                          ["E-mail", "Comunicação sobre pedido e suporte", "Execução de contrato"],
                          ["Telefone/WhatsApp", "Atendimento e suporte ao cliente", "Legítimo interesse"],
                        ].map(([dado, final, base], i) => (
                          <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="p-3 text-gray-700">{dado}</td>
                            <td className="p-3 text-gray-500">{final}</td>
                            <td className="p-3 text-gray-500">{base}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-gray-800 mb-2 font-serif text-lg">Seus direitos (art. 18 da LGPD)</h3>
                  <ul className="space-y-1.5">
                    {[
                      "Confirmação e acesso aos seus dados pessoais",
                      "Correção de dados incompletos ou desatualizados",
                      "Anonimização, bloqueio ou eliminação de dados desnecessários",
                      "Portabilidade dos dados a outro fornecedor",
                      "Eliminação dos dados tratados com seu consentimento",
                      "Informação sobre o compartilhamento dos dados",
                      "Revogação do consentimento a qualquer momento",
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-[#1a1a1a] rounded-full shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-gray-800 mb-2 font-serif text-lg">Compartilhamento de dados</h3>
                  <p>
                    Seus dados poderão ser compartilhados apenas com os <strong>Correios</strong>{" "}
                    (para fins de entrega) e com as <strong>operadoras de pagamento</strong> (para
                    processamento financeiro). Não comercializamos dados pessoais.
                  </p>
                </div>

                <div>
                  <h3 className="text-gray-800 mb-2 font-serif text-lg">Encarregado de Proteção de Dados (DPO)</h3>
                  <p>
                    Para exercer seus direitos ou esclarecer dúvidas sobre o tratamento de seus dados,
                    entre em contato pelo e-mail <strong>lgpd@dkfestas.com.br</strong> ou via WhatsApp.
                  </p>
                </div>

                <div className="p-3 bg-gray-50 border border-gray-100 text-xs text-gray-500">
                  <strong>Nota:</strong> A DK Festas não é destinada à coleta de Informações
                  Pessoais Identificáveis (PII) sensíveis ou à prestação de serviços financeiros
                  regulados. Esta plataforma é um protótipo de e-commerce de vestidos de festa.
                </div>
              </div>
            </section>

            {/* Atendimento */}
            <section id="contato" className="bg-white border border-gray-100 p-8 scroll-mt-24">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-10 h-10 bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-gray-900 mb-1 font-serif text-xl">Central de Atendimento</h2>
                  <p className="text-gray-500 text-sm">Fale com a nossa equipe</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 border border-gray-100 text-center">
                    <div className="w-12 h-12 flex items-center justify-center mx-auto mb-3" style={{ color: "#25D366" }}>
                      <WhatsAppIcon className="w-8 h-8" />
                    </div>
                    <p className="text-gray-900 text-sm mb-1">WhatsApp (Humanizado)</p>
                    <p className="text-gray-500 text-xs mb-3">
                      Atendimento direto com nossa equipe. Sem robôs.
                    </p>
                    <a
                      href="https://wa.me/5561999999999?text=Olá!%20Gostaria%20de%20atendimento%20da%20DK%20Festas."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm text-white transition-colors"
                      style={{ backgroundColor: "#25D366" }}
                    >
                      <WhatsAppIcon className="w-4 h-4" />
                      Falar no WhatsApp
                    </a>
                  </div>

                  <div className="p-5 border border-gray-100 text-center">
                    <div className="w-12 h-12 bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-600">
                      <Clock className="w-6 h-6" />
                    </div>
                    <p className="text-gray-900 text-sm mb-1">Horário de Atendimento</p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Segunda a Sexta: 09h às 18h</p>
                      <p>Sábado: 09h às 14h</p>
                      <p className="text-gray-400 mt-2">Horário de Brasília (BRT)</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-100 text-sm text-gray-600">
                  <p className="text-gray-800 mb-1">E-mail</p>
                  <p className="text-gray-500 text-xs">contato@dkfestas.com.br</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Respondemos em até 24 horas em dias úteis.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
