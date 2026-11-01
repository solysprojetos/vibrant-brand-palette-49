# Painel administrativo — Mulheres Curadas

Endereço: **https://www.mulherescuradas.com/admin/**

Pelo painel a equipe atualiza o site sozinha, sem programador: eventos, fotos,
testemunhos, textos institucionais, equipe, contatos e acessos. Tudo o que é
salvo aparece no site na hora.

O que **já existia continua igual**: a página inicial, a inscrição com QR code,
o check-in e o painel de inscrições (`/painel`, com senha própria). O painel novo
só acrescenta coisas.

---

## 1. Configuração (uma vez só, cerca de 10 minutos)

Tudo é feito no painel do Supabase do projeto
`vdjovchltmyhuvlwxzwr` (https://supabase.com/dashboard/project/vdjovchltmyhuvlwxzwr).

### 1.1 Criar as tabelas do painel

1. Menu **SQL Editor** → **New query**.
2. Copie todo o conteúdo do arquivo
   `supabase/migrations/20261101120000_painel_administrativo.sql` e cole.
3. Clique em **Run**. Deve aparecer "Success".

Pode rodar de novo sem medo: o arquivo não apaga nada e não mexe na tabela de
inscrições (só acrescenta uma permissão de leitura para quem entrar no painel).

### 1.2 Criar a primeira administradora

1. Menu **Authentication** → **Users** → **Add user** → **Create new user**.
2. Preencha o e-mail e uma senha forte e marque **Auto Confirm User**.
3. Volte ao **SQL Editor** e rode (trocando o e-mail e o nome):

```sql
insert into public.mc_equipe_acesso (user_id, nome, email, papel)
select id, 'Pastora Karoline Rodrigues', email, 'admin'
from auth.users
where email = 'EMAIL-DA-ADMINISTRADORA@exemplo.com';
```

Pronto: com esse e-mail e senha já dá para entrar em `/admin/`. As próximas
pessoas da equipe são criadas pelo próprio painel (item 1.3).

### 1.3 Publicar a função de usuários (para "Usuários e acesso")

Criar login para outra pessoa exige uma chave secreta que nunca pode ficar no
site. Por isso essa parte roda numa função do Supabase.

1. Menu **Edge Functions** → **Deploy a new function** → **Via Editor**.
2. Nome da função: `admin-usuarios`.
3. Apague o exemplo, cole todo o conteúdo de
   `supabase/functions/admin-usuarios/index.ts` e clique em **Deploy**.

(Quem usa o terminal pode rodar `supabase functions deploy admin-usuarios`.)

Enquanto ela não estiver publicada, a tela "Usuários e acesso" avisa isso — o
resto do painel funciona normalmente.

### 1.4 Endereços do login e recuperação de senha

Menu **Authentication** → **URL Configuration**:

- **Site URL**: `https://www.mulherescuradas.com`
- **Redirect URLs**: acrescente `https://www.mulherescuradas.com/admin/`

Assim o link de "Esqueci minha senha" volta para o painel.

### 1.5 Fechar o cadastro público (recomendado)

Menu **Authentication** → **Sign In / Providers** → desligue
**Allow new users to sign up**. Só a equipe cria contas, pelo painel.

---

## 2. Usando o painel

| Seção                       | O que dá para fazer                                                                                                                                                                                                                                                                          |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dashboard**               | Números do site (eventos, fotos, mensagens, contatos não lidos, inscrições), últimas publicações, próximos eventos e atalhos.                                                                                                                                                                |
| **Eventos**                 | Cadastrar, editar e excluir; banner; data e horário de início e fim; local, endereço e mapa; programação (com ordem); informações adicionais; link de inscrição e WhatsApp; publicar/despublicar; marcar como realizado. O site separa sozinho em _próximos_, _em andamento_ e _realizados_. |
| **Galeria de fotos**        | Criar álbuns (título, descrição, data, evento); enviar várias fotos de uma vez (arrastando ou escolhendo); legenda em cada foto; estrela para a foto de capa; arrastar ou usar as setas para mudar a ordem; excluir fotos ou o álbum. As fotos ficam na **qualidade original**.              |
| **Mensagens e testemunhos** | Testemunhos, histórias de transformação, mensagens de fé, reflexões e vídeos (link do YouTube ou Vimeo). Marque **Destaque** para o texto aparecer nos depoimentos da página inicial.                                                                                                        |
| **Conteúdo do site**        | História, missão, visão, valores, propósito, foto; idealizadora (nome, texto e foto); mensagem da idealizadora; e-mail, Instagram, WhatsApp, endereço e mapa.                                                                                                                                |
| **Equipe**                  | Pessoas exibidas na página Sobre, com foto, função e ordem.                                                                                                                                                                                                                                  |
| **Contatos recebidos**      | Mensagens do formulário de contato. Responder por e-mail ou WhatsApp com um toque; marcar como lida; excluir. O número dourado no menu mostra as não lidas.                                                                                                                                  |
| **Inscrições**              | Abre o painel de inscrições que já existia (`/painel`), com check-in, sorteio e planilha.                                                                                                                                                                                                    |
| **Usuários e acesso**       | (só administradoras) Criar acesso para a equipe, escolher o papel, definir nova senha e remover acesso.                                                                                                                                                                                      |

**Papéis**: _Administradora_ faz tudo, inclusive gerenciar acessos. _Editora_
cuida de todo o conteúdo, mas não mexe em acessos.

Clicando no próprio nome (embaixo, no menu) cada pessoa troca a sua senha e o
nome usado na saudação do dashboard.

### Páginas novas do site

- `/sobre/` — história, missão, visão, valores, propósito, idealizadora e equipe.
- `/eventos/` — o bloco do encontro que já existia, seguido dos eventos do painel.
  Cada evento tem página própria (`/eventos/?e=...`) com programação, mapa,
  inscrição e WhatsApp.
- `/galeria/` — álbuns em grade editorial, foto ampliada com setas, deslizar no
  celular e botão de compartilhar.
- `/mensagens/` — testemunhos, mensagens, reflexões e vídeos, com filtro.
- `/contato/` — Instagram, WhatsApp, e-mail, endereço e formulário.

Na página inicial foram acrescentados só links (menu, rodapé, "Conheça nossa
história", "Ver a galeria completa"). Os depoimentos da home passam a mostrar os
testemunhos marcados como destaque; sem nenhum destaque, continuam os de antes.

> Dica: o encontro de 9 de novembro continua aparecendo pelo bloco fixo de
> `/eventos/`. Se cadastrar esse mesmo encontro no painel, ele aparece duas
> vezes — deixe-o como rascunho ou cadastre a partir do próximo.

---

## 3. Publicação

O site é publicado automaticamente pelo GitHub Pages a cada alteração na
branch `main` (workflow `.github/workflows/deploy-pages.yml`). O conteúdo do
painel **não precisa de nova publicação**: ele é lido do Supabase na hora.

Para testar no computador:

```bash
bun install
```

```bash
bun run dev
```

Para apontar o site para outro projeto do Supabase, defina no build as
variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.

---

## 4. Segurança

- O login é do **Supabase Auth**. Ter login não basta: só entra no painel quem
  está na tabela `mc_equipe_acesso`.
- As regras (**RLS**) ficam no banco, não na tela: visitante só lê o que está
  publicado e só pode **enviar** contato (nunca ler); escrever, apagar e ver
  rascunhos é só para a equipe. Ninguém consegue se promover a administradora.
- As imagens ficam no bucket `mc-imagens`: qualquer pessoa vê pela URL, mas só a
  equipe envia, troca ou apaga — e o bucket não pode ser listado. Aceita apenas
  imagens de até 25 MB.
- O site usa apenas a chave **publishable** (pública por natureza). A chave
  `service_role` fica só dentro da função `admin-usuarios`, no Supabase.
- As páginas `/admin/` ficam fora dos buscadores (`noindex`).
