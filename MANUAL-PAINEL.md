# Painel administrativo — Mulheres Curadas

Endereço: **https://www.mulherescuradas.com/admin/**

O painel é só da equipe. **O site público não muda nada**: a página inicial,
`/eventos`, a inscrição com QR code, o `/checkin` e o painel de inscrições
(`/painel`, com a senha própria) continuam exatamente como estão.

---

## 1. Configuração (uma vez só)

> **Já feito em 1º de novembro de 2026.** As tabelas, a função
> `admin-usuarios` e os cinco acessos abaixo já estão no projeto. Esta seção
> fica aqui só como registro, para o caso de um projeto novo.

Tudo no painel do Supabase do projeto `vdjovchltmyhuvlwxzwr`
(https://supabase.com/dashboard/project/vdjovchltmyhuvlwxzwr), menu
**SQL Editor** → **New query** → colar → **Run**. Nesta ordem:

| #   | O que colar                                                          | O que faz                                                                                                     |
| --- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 1   | `supabase/migrations/20261101120000_painel_administrativo.sql`       | Tabelas do painel, regras de segurança e o espaço das fotos.                                                  |
| 2   | `supabase/migrations/20261101130000_recepcao_e_checkin.sql`          | Papel de recepção, check-in pelo painel e o encontro de **9 de novembro** já cadastrado (CC Visão Profética). |
| 3   | `criar-acessos-painel.sql` (enviado à parte, **não fica no GitHub**) | Cria os logins da Karoline, do Juan e das 3 recepcionistas.                                                   |

Os três podem ser rodados de novo sem duplicar nada. Nenhum deles apaga dados
nem muda a tabela de inscrições (o 2 só acrescenta a coluna "quem confirmou a
entrada").

### Acessos criados pelo arquivo 3

| Pessoa             | Login                                                 | Acesso               |
| ------------------ | ----------------------------------------------------- | -------------------- |
| Karoline Rodrigues | karoline@mulherescuradas.com                          | Administração (tudo) |
| Juan               | juan@mulherescuradas.com                              | Administração (tudo) |
| Recepção 1, 2 e 3  | recepcao1@, recepcao2@, recepcao3@mulherescuradas.com | Só o check-in        |

As senhas iniciais vão na lista entregue junto com o arquivo. Cada pessoa troca
a sua clicando no próprio nome, no rodapé do menu do painel.

> Esses e-mails servem de login mesmo sem caixa de e-mail criada. Só o
> "Esqueci minha senha" depende de a caixa existir; sem ela, quem administra
> define uma senha nova em **Usuários e acesso** (ícone da chave).

### Função de usuários (para criar acessos pelo painel depois)

Menu **Edge Functions** → **Deploy a new function** → **Via Editor**, nome
`admin-usuarios`, colar `supabase/functions/admin-usuarios/index.ts` →
**Deploy**. Sem ela o resto do painel funciona; só a tela "Usuários e acesso"
avisa que falta.

### Recomendado no Supabase

- **Authentication → URL Configuration**: Site URL
  `https://www.mulherescuradas.com` e, em Redirect URLs,
  `https://www.mulherescuradas.com/admin/`.
- **Authentication → Sign In / Providers**: desligar **Allow new users to sign
  up** (só a equipe cria contas).

---

## 2. Check-in da entrada (recepção)

1. A recepcionista abre **mulherescuradas.com/admin** no celular e entra com o
   login dela. O painel abre direto no **Check-in da entrada** — é a única tela
   que ela vê.
2. **Ler QR code**: toca em _Abrir câmera_ e aponta para o QR do ingresso
   (no e-mail ou no print). Funciona no Android e no iPhone.
3. **Buscar nome**: digita parte do nome (sem precisar de acento) ou o código
   `MC-XXXX-XXXX` e toca em _Confirmar entrada_.
4. A tela responde na hora:
   - **verde** — entrada confirmada;
   - **amarelo** — o ingresso já foi usado (mostra a hora e quem confirmou);
   - **vermelho** — ingresso não encontrado.
5. O contador no topo mostra presenças / inscritas e se atualiza sozinho com
   as leituras das outras recepcionistas.

A recepção não vê e-mail nem telefone de ninguém, e ler o mesmo ingresso duas
vezes nunca conta duas presenças. As páginas antigas `/painel` e `/checkin`
(com a senha do painel de inscrições) continuam funcionando para quem não tem
login; quem está logada no `/admin` entra nelas sem senha.

---

## 3. O painel para a administração

| Seção                       | O que faz                                                                                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dashboard**               | Saudação, eventos (cadastrados, próximos, realizados), inscrições e vagas restantes, presenças confirmadas, fotos, últimas publicações e próximos eventos. |
| **Check-in da entrada**     | O mesmo da recepção.                                                                                                                                       |
| **Eventos**                 | Cadastrar, editar, excluir; banner; data e horário; local e endereço; programação; link de inscrição e WhatsApp; publicar e marcar como realizado.         |
| **Galeria de fotos**        | Álbuns, envio de várias fotos de uma vez na qualidade original, legenda, capa e ordem.                                                                     |
| **Mensagens e testemunhos** | Testemunhos, histórias, mensagens, reflexões e vídeos.                                                                                                     |
| **Conteúdo do site**        | História, missão, visão, valores, propósito, idealizadora, contatos e redes.                                                                               |
| **Equipe**                  | Pessoas da equipe com foto e função.                                                                                                                       |
| **Inscrições e sorteio**    | Abre o `/painel` de inscrições que já existia.                                                                                                             |
| **Usuários e acesso**       | Criar acesso (administração, edição ou recepção), mudar papel, definir nova senha, remover.                                                                |

Galeria, mensagens, conteúdo e equipe ficam **guardados no painel**: como o
site não muda, eles ainda não aparecem nas páginas públicas. Quando quiserem
colocar no ar, é só pedir — os dados já estarão lá.

---

## 4. Publicação

O site é publicado pelo GitHub Pages a cada alteração na branch `main`
(`.github/workflows/deploy-pages.yml`). O que é salvo no painel não precisa de
nova publicação: fica no Supabase e aparece na hora.

---

## 5. Segurança

- Login pelo **Supabase Auth**. Ter login não basta: só entra no painel quem
  está em `mc_equipe_acesso`, e cada papel só vê o que pode.
- As regras ficam no banco (RLS), não na tela: visitante só lê o que está
  publicado; editar é só para administração e edição; a recepção só usa as
  funções de check-in; ninguém se promove sozinho.
- O site usa apenas a chave **publishable** (pública). A `service_role` fica só
  dentro da função `admin-usuarios`, no Supabase.
- O arquivo de acessos tem senhas: guarde fora do GitHub (o repositório é
  público) e peça para cada pessoa trocar a senha no primeiro acesso.
