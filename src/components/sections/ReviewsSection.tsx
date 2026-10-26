
import React from "react";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";

export default function ReviewsSection() {
  return (
    <section className="py-14 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-gray-900 font-serif text-3xl" style={{ letterSpacing: "-0.02em" }}>
            O que nossas clientes dizem
          </h2>
          <p className="text-gray-500 text-sm mt-1 font-sans">
            Satisfação garantida em cada compra
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              name: "Maria S.",
              text: "Comprei o vestido de debutante e fiquei apaixonada! Qualidade incrível e chegou antes do prazo. Super recomendo a DK Festas!",
              stars: 5,
              tag: "Debutante",
            },
            {
              name: "Juliana C.",
              text: "Atendimento maravilhoso e vestido de formatura simplesmente perfeito. Recebi elogios a noite toda. Obrigada DK Festas!",
              stars: 5,
              tag: "Formatura",
            },
            {
              name: "Ana B.",
              text: "O vestido de casamento superou todas as expectativas. Me senti uma rainha! O caimento é impecável e o tecido é de altíssima qualidade.",
              stars: 5,
              tag: "Casamento",
            },
          ].map((t, i) => (
            <Card key={i} className="gap-3 rounded-none border-[var(--border)] bg-gray-50 p-6">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className="w-3.5 h-3.5 fill-[var(--action-primary)] text-[var(--action-primary)]"
                  />
                ))}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed italic">
                "{t.text}"
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="size-7">
                    <AvatarFallback className="text-xs font-medium">
                      {t.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-gray-900 text-sm font-medium">{t.name}</span>
                </div>
                <span className="bg-gray-200 text-gray-700 text-xs px-2.5 py-1">
                  {t.tag}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
