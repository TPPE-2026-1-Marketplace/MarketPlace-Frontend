
import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Mail, Clock } from "lucide-react";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="bg-[#111111] text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="mb-5 flex flex-col items-start justify-center">
              <div className="bg-white px-3 py-1 flex flex-col items-center justify-center inline-flex">
                <span className="text-[#1a1a1a] font-serif text-lg leading-none tracking-widest">DK</span>
                <span className="text-[#1a1a1a] text-[8px] tracking-[0.2em] uppercase leading-none mt-0.5">Fashion</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-gray-500">
              Sua loja especializada em vestidos de festa de alta qualidade.
              Tornando cada momento especial ainda mais inesquecível.
            </p>
            <p className="text-xs text-gray-600 mt-3 tracking-wider uppercase">
              Enviamos para todo o DF
            </p>
            <div className="flex gap-3 mt-5">
              <a
                href="https://www.instagram.com/dkvestidos/?hl=pt-br"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 border border-gray-700 flex items-center justify-center hover:border-gray-400 hover:text-gray-200 transition-colors"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>
              <a
                href="https://www.google.com/maps/place/DK+FASHION+MODA+FESTA/@-15.8428578,-48.1760582,12z/data=!4m6!3m5!1s0x935a33e68a9b97e5:0x3b9c4ddb95bd806c!8m2!3d-15.8428578!4d-48.0442223!15sCgpESyBGQVNISU9OWgwiCmRrIGZhc2hpb26SAQ5jbG90aGluZ19zdG9yZeABAA?shorturl=1"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 border border-gray-700 flex items-center justify-center hover:border-gray-400 hover:text-gray-200 transition-colors"
                title="Localização da Loja"
              >
                <MapPin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Collections */}
          <div>
            <h3 className="text-gray-200 mb-5 text-xs tracking-widest uppercase">Coleções</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: "Debutante", path: "/produtos?categoria=debutante" },
                { label: "Formatura", path: "/produtos?categoria=formatura" },
                { label: "Casamento", path: "/produtos?categoria=casamento" },
                { label: "Festa", path: "/produtos?categoria=festa" },
                { label: "Todos os Vestidos", path: "/produtos" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.path}
                    className="text-gray-500 hover:text-gray-200 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li className="pt-1 border-t border-gray-800">
                <p className="text-gray-600 text-xs uppercase tracking-widest mb-2 mt-1">Comprimento</p>
              </li>
              {[
                { label: "Midi", path: "/produtos?tipo=midi" },
                { label: "Longo", path: "/produtos?tipo=longo" },
                { label: "Longuete", path: "/produtos?tipo=longuete" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.path}
                    className="text-gray-500 hover:text-gray-200 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-gray-200 mb-5 text-xs tracking-widest uppercase">Atendimento</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: "Como Comprar", path: "/politicas" },
                { label: "Trocas e Devoluções", path: "/politicas" },
                { label: "Formas de Pagamento", path: "/politicas" },
                { label: "Entrega (Correios)", path: "/politicas" },
                { label: "Proteção de Dados (LGPD)", path: "/politicas" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.path}
                    className="text-gray-500 hover:text-gray-200 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-gray-200 mb-5 text-xs tracking-widest uppercase">Contato</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                <span className="text-gray-500">
                  Brasília — Distrito Federal
                </span>
              </li>
              <li>
                <a
                  href="https://api.whatsapp.com/send/?phone=5561996856892&text=Eu+gostaria+de+saber+mais+informa%C3%A7%C3%B5es+sobre&type=phone_number&app_absent=0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-gray-500 hover:text-[#25D366] transition-colors"
                >
                  <WhatsAppIcon className="w-4 h-4 shrink-0" />
                  <span>(61) 9 9685-6892</span>
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="text-gray-500">contato@dkfestas.com.br</span>
              </li>
            </ul>
            <div className="mt-5 p-4 border border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-3.5 h-3.5 text-gray-500" />
                <p className="text-gray-300 text-xs">Horário de Atendimento</p>
              </div>
              <p className="text-gray-500 text-xs">Seg–Sex: 09h às 18h</p>
              <p className="text-gray-500 text-xs">Sábado: 09h às 14h</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <p>© 2026 DK Festas. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <Link to="/politicas" className="hover:text-gray-400 transition-colors">
              Política de Privacidade
            </Link>
            <span>·</span>
            <span>CNPJ: 00.000.000/0001-00</span>
          </div>
        </div>
      </div>

      {/* WhatsApp floating button (mobile) */}
      <a
        href="https://api.whatsapp.com/send/?phone=5561996856892&text=Eu+gostaria+de+saber+mais+informa%C3%A7%C3%B5es+sobre&type=phone_number&app_absent=0"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 lg:hidden w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#20bf5a] transition-colors"
        title="Falar no WhatsApp"
      >
        <WhatsAppIcon className="w-7 h-7" />
      </a>
    </footer>
  );
}
