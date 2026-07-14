# Portal de PDFs

Aplicação Next.js para consultar PDFs por código de acesso de seis dígitos. O bucket do Supabase permanece privado e a API gera URLs assinadas com validade curta.

## Configuração local

1. Execute, em ordem, `supabase/migrations/001_criar_tabelas.sql`, `002_portal_documentos.sql` e `003_planejamento_documentos.sql` no SQL Editor do Supabase.
2. Copie `.env.example` para `.env.local` e preencha as variáveis.
3. Instale e execute:

```powershell
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Formato gravado pelo aplicativo Python

O bucket esperado é `documentos-pdf`, privado. Ao enviar um PDF, o app desktop deve:

1. Criar ou localizar o registro em `codigos_acesso`.
2. Enviar o arquivo para um caminho único, como `<codigo_id>/<uuid>.pdf`.
3. Inserir em `documentos_pdf.url_arquivo` somente esse caminho interno, não uma URL pública.

Exemplo de registro:

```sql
insert into public.documentos_pdf (titulo, url_arquivo, codigo_id)
values ('Planejamento semanal.pdf', 'UUID-DO-CODIGO/UUID-DO-ARQUIVO.pdf', 'UUID-DO-CODIGO');
```

## Deploy na Vercel

Importe a pasta `portal-pdfs` como projeto e cadastre estas variáveis no ambiente Production:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL` (a mesma URL do projeto)
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (chave publicável, segura para o navegador)
- `SUPABASE_STORAGE_BUCKET` (`documentos-pdf`)
- `SIGNED_URL_TTL_SECONDS` (`300`, por exemplo)
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET` (valor aleatório com pelo menos 32 caracteres)

Nunca prefixe a service role com `NEXT_PUBLIC_`. Ela deve existir somente no ambiente do servidor.

O upload administrativo múltiplo usa URLs temporárias assinadas. Por isso o navegador recebe apenas a URL do projeto e a chave publicável; a chave secreta continua restrita ao backend. São aceitos até 20 PDFs por lote, com até 50 MB por arquivo.

## Administração

Acesse `/admin` e entre com `ADMIN_USERNAME` e `ADMIN_PASSWORD`. A sessão fica em cookie assinado, `HttpOnly`, `SameSite=Strict`, com duração de oito horas. Todas as operações de listagem, criação, alteração, exclusão e upload são novamente validadas nas APIs do servidor.

O upload administrativo mantém o bucket privado e grava em `url_arquivo` o caminho interno do objeto. A URL de leitura é criada apenas quando o destinatário valida o código, evitando links públicos permanentes.

## Segurança

- As tabelas usam RLS e não possuem políticas para `anon` ou `authenticated`.
- O frontend fala apenas com `/api/verify-code`.
- A mensagem de falha é a mesma para códigos inexistentes, inativos ou expirados.
- As URLs assinadas expiram em poucos minutos.
- Antes de abrir o portal publicamente, aplique rate limiting na rota (por exemplo, Vercel Firewall ou Upstash), pois códigos de seis dígitos podem ser enumerados.
