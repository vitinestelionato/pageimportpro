## O que vai funcionar de verdade

Foco nos módulos que geram valor imediato e podem ser 100% funcionais nesta iteração. Os demais viram "Em breve" com placeholder honesto (nada quebrado, nada mentiroso).

### Módulos 100% funcionais

1. **Gestão de Produtos** — CRUD completo
   - Adicionar produto (nome, link fornecedor, preço origem, moeda, peso, categoria, status, notas, imagem URL)
   - Listar com filtros (status: análise / importado / arquivado) e busca
   - Editar e excluir
   - Cards de estatísticas do dashboard puxam contagem real dessa tabela

2. **Calculadora de Impostos de Importação** — cliente
   - Valor do produto + frete + moeda origem → conversão via câmbio ao vivo
   - Aplica II (60%), ICMS por estado (seleção), taxa Correios
   - Mostra breakdown detalhado e custo final em BRL
   - Botão "salvar como produto" que já cria na tabela

3. **Câmbio ao vivo** (USD, EUR, CNY → BRL)
   - Server function chama API pública (awesomeapi.com.br, sem chave)
   - Cache de 5 min em memória
   - Widget no topo do dashboard + página dedicada com histórico

4. **Anotações**
   - Notas rápidas com título e corpo, ligadas ao usuário
   - Criar/editar/excluir, ordenadas por data

5. **Perfil + Meu Plano**
   - Editar nome e telefone
   - Ver plano atual, data de compra, provider (cakto)

### Módulos com placeholder honesto ("Em breve")

Catálogo, Favoritos, Fornecedores, Rastreio de Encomenda, Documentos, Produtos em Alta, Nichos Quentes, Concorrentes, Alertas. Cada um vira uma rota com uma tela limpa "Em desenvolvimento — próxima atualização" para não iludir o usuário.

### Detalhes técnicos

**Banco (migração nova):**

```text
public.products
  id uuid pk, user_id uuid → auth.users, name text, supplier_url text,
  origin_price numeric, origin_currency text (USD/CNY/EUR),
  weight_kg numeric, category text, status text (analise/importado/arquivado),
  image_url text, notes text, created_at, updated_at
  + RLS: dono só vê/edita o próprio + GRANTs padrão authenticated/service_role

public.notes
  id uuid pk, user_id uuid, title text, body text, created_at, updated_at
  + RLS/GRANTs iguais
```

**Server functions** (`src/lib/*.functions.ts` com `requireSupabaseAuth`):
- `products.functions.ts`: list, create, update, remove, stats
- `notes.functions.ts`: list, upsert, remove
- `exchange.functions.ts`: getRates (pública, sem auth, cache in-memory 5 min)

**Rotas novas** sob `_authenticated/`:
- `dashboard/produtos.tsx`
- `dashboard/calculadora.tsx`
- `dashboard/cambio.tsx`
- `dashboard/anotacoes.tsx`
- `dashboard/perfil.tsx`
- `dashboard/em-breve.tsx` (compartilhada para os módulos placeholder)

**Sidebar** do dashboard vira `<Link>` real com rota ativa destacada via `useRouterState`.

**Card de estatísticas** na home do dashboard passa a usar `useSuspenseQuery` com contagem real por status.

### Fora de escopo (fica para próxima)

- Comunidade / chat
- Rastreio de encomenda com API dos Correios
- Documentos com upload no storage
- Tendências geradas por IA
- Notificações e alertas
- Toggle light/dark real (o botão fica visual)

Se aprovar, implemento tudo isto em uma leva.