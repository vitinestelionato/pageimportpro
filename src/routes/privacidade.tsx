import { createFileRoute } from "@tanstack/react-router";
import { PageLayout, Prose } from "@/components/PageLayout";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade · ImportPro" },
      { name: "description", content: "Como a ImportPro coleta, usa, armazena e protege dados pessoais dos usuários, em conformidade com a LGPD." },
      { property: "og:title", content: "Política de Privacidade · ImportPro" },
      { property: "og:description", content: "Nossa política de tratamento de dados, cookies e direitos do titular conforme a LGPD." },
    ],
  }),
  component: PrivacidadePage,
});

function PrivacidadePage() {
  return (
    <PageLayout
      eyebrow="Legal"
      title="Política de Privacidade"
      description="Última atualização: 1º de julho de 2026. Esta política descreve como tratamos seus dados na ImportPro."
      crumbs={[{ label: "Início", to: "/" }, { label: "Privacidade" }]}
    >
      <Prose>
        <p>
          A <strong>ImportPro Tecnologia Ltda.</strong> ("ImportPro", "nós") leva a sério a proteção
          de dados pessoais. Esta política explica como coletamos, usamos, armazenamos e
          compartilhamos informações dos usuários da plataforma, em conformidade com a Lei Geral de
          Proteção de Dados (Lei nº 13.709/2018 – LGPD).
        </p>

        <h2>1. Dados que coletamos</h2>
        <ul>
          <li><strong>Cadastro:</strong> nome, e-mail, CPF, telefone.</li>
          <li><strong>Pagamento:</strong> processado por parceiros certificados (Stripe/Pagar.me). Não armazenamos número completo de cartão.</li>
          <li><strong>Uso da plataforma:</strong> páginas visitadas, ferramentas utilizadas, buscas de produto, cálculos e pedidos gerenciados.</li>
          <li><strong>Comunicação:</strong> conteúdo de mensagens de suporte e interações com a IA especialista.</li>
          <li><strong>Cookies:</strong> identificadores para sessão, preferências e métricas agregadas.</li>
        </ul>

        <h2>2. Como usamos seus dados</h2>
        <ul>
          <li>Prestar e operar os serviços contratados.</li>
          <li>Personalizar recomendações de fornecedores e produtos.</li>
          <li>Garantir segurança, prevenir fraude e cumprir obrigações legais.</li>
          <li>Enviar comunicações operacionais e, mediante consentimento, novidades e conteúdos.</li>
        </ul>

        <h2>3. Compartilhamento</h2>
        <p>
          Não vendemos dados pessoais. Compartilhamos apenas com processadores necessários para a
          operação (hospedagem, meio de pagamento, e-mail transacional, analytics agregado),
          sempre sob contrato e cláusulas de proteção de dados.
        </p>

        <h2>4. Armazenamento e segurança</h2>
        <p>
          Utilizamos criptografia em trânsito (TLS) e em repouso, autenticação segura, controle de
          acesso mínimo e monitoramento contínuo. Armazenamos os dados pelo tempo necessário à
          prestação do serviço e cumprimento de obrigações legais e fiscais.
        </p>

        <h2>5. Cookies</h2>
        <p>
          Utilizamos cookies essenciais para o funcionamento do site e, mediante seu consentimento,
          cookies de desempenho e personalização. Você pode revisar sua escolha a qualquer momento
          pelo banner exibido na primeira visita.
        </p>

        <h2>6. Seus direitos (LGPD)</h2>
        <ul>
          <li>Confirmar existência de tratamento.</li>
          <li>Acessar, corrigir, anonimizar ou eliminar dados.</li>
          <li>Solicitar portabilidade.</li>
          <li>Revogar consentimento a qualquer momento.</li>
        </ul>
        <p>
          Para exercer qualquer direito, escreva para <strong>dpo@importpro.com.br</strong>.
        </p>

        <h2>7. Encarregado (DPO)</h2>
        <p>
          Nosso encarregado de dados pode ser contatado pelo e-mail acima. Responderemos em até 15
          dias úteis conforme previsto na LGPD.
        </p>

        <h2>8. Alterações desta política</h2>
        <p>
          Podemos atualizar esta política para refletir mudanças legais, técnicas ou de negócio.
          Alterações relevantes serão comunicadas por e-mail e/ou dentro da plataforma.
        </p>
      </Prose>
    </PageLayout>
  );
}
