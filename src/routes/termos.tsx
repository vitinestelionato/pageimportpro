import { createFileRoute } from "@tanstack/react-router";
import { PageLayout, Prose } from "@/components/PageLayout";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso · ImportPro" },
      { name: "description", content: "Termos de uso da plataforma ImportPro: direitos, deveres, limitações de responsabilidade e regras de utilização." },
      { property: "og:title", content: "Termos de Uso · ImportPro" },
      { property: "og:description", content: "Leia as regras de uso da plataforma ImportPro antes de contratar." },
    ],
  }),
  component: TermosPage,
});

function TermosPage() {
  return (
    <PageLayout
      eyebrow="Legal"
      title="Termos de Uso"
      description="Última atualização: 1º de julho de 2026. Ao usar a ImportPro, você concorda com os termos abaixo."
      crumbs={[{ label: "Início", to: "/" }, { label: "Termos" }]}
    >
      <Prose>
        <h2>1. Objeto</h2>
        <p>
          A <strong>ImportPro</strong> é uma plataforma digital que oferece ferramentas de apoio à
          importação de produtos da China: rede curada de fornecedores, calculadora de impostos,
          precificação, gestão de pedidos, radar de produtos e IA especialista. A ImportPro não é
          agente de carga, despachante aduaneiro, instituição financeira ou vendedora dos produtos
          exibidos.
        </p>

        <h2>2. Cadastro</h2>
        <p>
          Para usar a plataforma é necessário criar conta com dados verdadeiros e atualizados. Você
          é responsável pela guarda das credenciais e por toda atividade realizada em sua conta.
        </p>

        <h2>3. Plano e pagamento</h2>
        <ul>
          <li>O acesso é vendido em pagamento único, sem mensalidade ou renovação automática.</li>
          <li>O valor vigente é o exibido na página de checkout no momento da compra.</li>
          <li>A nota fiscal é emitida automaticamente após confirmação do pagamento.</li>
        </ul>

        <h2>4. Uso permitido</h2>
        <p>Você concorda em não:</p>
        <ul>
          <li>Utilizar a plataforma para atividades ilegais ou que violem direitos de terceiros.</li>
          <li>Compartilhar sua conta ou revender acesso a terceiros.</li>
          <li>Extrair dados de forma automatizada sem autorização (scraping).</li>
          <li>Interferir na segurança, integridade ou performance dos serviços.</li>
        </ul>

        <h2>5. Limitação de responsabilidade</h2>
        <p>
          As ferramentas da ImportPro são de apoio à decisão. Preços, câmbio, impostos, prazos e
          disponibilidade de fornecedores podem variar. A decisão de compra e a responsabilidade
          pela operação de importação (incluindo obrigações fiscais e alfandegárias) é sempre do
          usuário. A ImportPro não se responsabiliza por perdas decorrentes de decisões comerciais
          baseadas em estimativas apresentadas pela plataforma.
        </p>

        <h2>6. Propriedade intelectual</h2>
        <p>
          Todo o conteúdo, marca, layout e código da ImportPro é protegido por direitos autorais e
          demais leis aplicáveis. É proibida a reprodução total ou parcial sem autorização expressa.
        </p>

        <h2>7. Suspensão e rescisão</h2>
        <p>
          Podemos suspender ou encerrar contas em caso de violação destes termos, fraude ou uso
          abusivo, sem prejuízo das medidas legais cabíveis.
        </p>

        <h2>8. Alterações</h2>
        <p>
          Estes termos podem ser atualizados. Alterações relevantes serão comunicadas por e-mail
          e/ou dentro da plataforma. O uso contínuo após a comunicação implica concordância.
        </p>

        <h2>9. Foro</h2>
        <p>
          Fica eleito o foro da comarca de São Paulo/SP para dirimir quaisquer questões oriundas
          destes termos, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
        </p>
      </Prose>
    </PageLayout>
  );
}
