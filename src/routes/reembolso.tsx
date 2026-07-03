import { createFileRoute, Link } from "@tanstack/react-router";
import { PageLayout, Prose } from "@/components/PageLayout";
import { ShieldCheck, Clock, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/reembolso")({
  head: () => ({
    meta: [
      { title: "Política de Reembolso · ImportPro" },
      { name: "description", content: "Garantia incondicional de 7 dias. Veja como solicitar reembolso da ImportPro de forma simples e sem burocracia." },
      { property: "og:title", content: "Política de Reembolso · ImportPro" },
      { property: "og:description", content: "7 dias de garantia total. Reembolso de 100% do valor sem perguntas insistentes." },
    ],
  }),
  component: ReembolsoPage,
});

function ReembolsoPage() {
  return (
    <PageLayout
      eyebrow="Legal"
      title="Política de Reembolso"
      description="Última atualização: 1º de julho de 2026. Sua compra é protegida por garantia incondicional de 7 dias."
      crumbs={[{ label: "Início", to: "/" }, { label: "Reembolso" }]}
    >
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        {[
          { icon: ShieldCheck, title: "100% garantido", desc: "Devolvemos o valor integral pago." },
          { icon: Clock, title: "7 dias corridos", desc: "Contados a partir da confirmação do pagamento." },
          { icon: RefreshCw, title: "Sem burocracia", desc: "Basta pedir por e-mail dentro do prazo." },
        ].map((h) => (
          <div key={h.title} className="rounded-2xl border border-border/60 bg-background/40 p-5">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand/90 text-primary-foreground shadow-lg shadow-brand/30">
              <h.icon className="h-5 w-5" />
            </div>
            <div className="font-display text-base font-semibold text-foreground">{h.title}</div>
            <p className="mt-1 text-sm text-muted-foreground">{h.desc}</p>
          </div>
        ))}
      </div>

      <Prose>
        <h2>1. Garantia incondicional</h2>
        <p>
          Você tem <strong>7 dias corridos</strong> a partir da confirmação do pagamento para
          testar a plataforma ImportPro por completo. Se por qualquer motivo achar que não é para
          você, basta pedir o reembolso dentro desse prazo — devolvemos <strong>100% do valor
          pago</strong>, sem perguntas insistentes.
        </p>

        <h2>2. Como solicitar</h2>
        <ul>
          <li>Envie um e-mail para <strong>suporte@importpro.com.br</strong>.</li>
          <li>Informe o nome completo e o CPF usados na compra.</li>
          <li>Escreva apenas "Solicito reembolso" no assunto — não precisa justificar.</li>
        </ul>
        <p>Confirmamos o recebimento em até 1 dia útil.</p>

        <h2>3. Prazo do estorno</h2>
        <ul>
          <li><strong>Cartão de crédito:</strong> o estorno é solicitado à operadora em até 2 dias úteis. A exibição na fatura depende do ciclo do cartão (geralmente 1 a 2 faturas).</li>
          <li><strong>Pix:</strong> devolução em até 5 dias úteis na mesma chave usada no pagamento.</li>
        </ul>

        <h2>4. Após o prazo de 7 dias</h2>
        <p>
          Fora do prazo de garantia, como o produto é digital e de acesso vitalício, não realizamos
          reembolso. Ainda assim, se você tiver qualquer problema técnico ou de acesso, o suporte
          continua disponível — resolvemos.
        </p>

        <h2>5. Cancelamento</h2>
        <p>
          Não existe assinatura, mensalidade ou cobrança recorrente. Portanto, não há o que
          cancelar. O acesso permanece ativo mesmo que você deixe de usar por um tempo.
        </p>

        <p className="!mt-10">
          Dúvidas? <Link to="/contato">Fale com o suporte</Link>.
        </p>
      </Prose>
    </PageLayout>
  );
}
