# Inscrições no Supabase

Projeto: `vdjovchltmyhuvlwxzwr` (https://vdjovchltmyhuvlwxzwr.supabase.co)

## O que existe aqui

- `migrations/20260827000000_cria_inscricoes.sql` — a tabela `public.inscricoes`.
- `functions/inscricao/index.ts` — a Edge Function que o formulário do site chama.
- `functions/painel/index.ts` — a Edge Function que serve o painel de inscrições.

## Como funciona

1. A visitante envia o formulário (`src/components/formulario-inscricao.tsx`).
2. O site faz `POST` em `https://vdjovchltmyhuvlwxzwr.supabase.co/functions/v1/inscricao`.
3. A função valida os dados, grava uma linha em `public.inscricoes` com um código
   curto de ingresso (ex.: `MC-K7QW-3PZT`) e manda o e-mail de confirmação.
4. O e-mail traz o QR code desse código e o código escrito por extenso, caso a
   imagem não carregue no aplicativo de e-mail.

## Por que o banco fica leve

A tabela guarda **só texto curto**: nome, telefone, e-mail, igreja e o código do
ingresso. O QR code **não é salvo** — nem imagem, nem base64, nem PDF. Ele é
desenhado na hora do envio, a partir do código, por
`api.qrserver.com`. Uma inscrição ocupa poucas centenas de bytes; mil inscrições
não chegam a 1 MB.

Há um índice único por e-mail: se a mesma pessoa se inscrever de novo, a linha
não duplica — o código do ingresso continua o mesmo e o e-mail é só reenviado.

## Segurança

RLS está ativo e a tabela **não tem nenhuma política**, então as chaves públicas
(anon/publishable) não leem nem escrevem nada. Só a Edge Function grava, usando a
`service_role` que o próprio runtime injeta.

## Segredos a configurar

No painel: **Edge Functions → inscricao → Secrets**.

| Segredo                                                                                     | Obrigatório             | Para que serve                                                                                       |
| ------------------------------------------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------- |
| `RESEND_API_KEY`                                                                            | sim, para o e-mail sair | chave da conta em https://resend.com                                                                 |
| `EMAIL_REMETENTE`                                                                           | recomendado             | ex.: `Mulheres Curadas <contato@mulherescuradas.com>` (o domínio precisa estar verificado no Resend) |
| `EMAIL_CONTATO`                                                                             | opcional                | endereço de resposta                                                                                 |
| `ENCONTRO_NOME`, `ENCONTRO_DATA`, `ENCONTRO_HORARIO`, `ENCONTRO_LOCAL`, `ENCONTRO_ENDERECO` | opcional                | aparecem no rodapé do e-mail; o que estiver vazio simplesmente não aparece                           |

Sem `RESEND_API_KEY` a inscrição **continua sendo gravada** — só o e-mail não
sai, e isso fica registrado nos logs da função (`email_enviado_em` fica nulo).

## Painel de inscrições (a página `/painel`)

O endereço `https://SEU-SITE/painel` mostra a lista de inscritas: nome, contato,
igreja, código do ingresso, se o e-mail saiu e a presença. Tem busca, botão para
baixar a planilha (CSV que abre no Excel) e um botão por linha para marcar
presença no dia do encontro.

A página não fala com o banco; ela chama a função `painel`, que exige a senha em
todo pedido. Configure o segredo **`PAINEL_SENHA`** em _Edge Functions → painel →
Secrets_ — enquanto ele não existir, o painel avisa que ainda não tem senha e não
mostra nada. Use uma senha longa, só sua.

A página fica fora dos buscadores (`noindex, nofollow`) e não há link para ela em
lugar nenhum do site; a senha digitada some quando você fecha a aba.

## Conferir as inscrições pelo painel do Supabase

Se preferir ver direto no banco: **Table Editor → inscricoes**, ou no SQL Editor:

```sql
select criado_em, nome, telefone, email, igreja, codigo, email_enviado_em, checkin_em
from public.inscricoes
order by criado_em desc;
```

## Presença no dia do encontro

O QR code do e-mail guarda o endereço `https://www.mulherescuradas.com/checkin/?c=CODIGO`.
Apontar a câmera comum do celular — a nativa, sem aplicativo nenhum — abre essa
página, que pede a senha do painel na primeira leitura e confirma a presença.
A senha fica guardada no aparelho, então as leituras seguintes confirmam
sozinhas; o botão "Sair" do painel apaga.

Ler o mesmo ingresso duas vezes não duplica nada: a página avisa que aquele
ingresso já tinha sido lido.

Dá para dar baixa também pelo painel, no botão "Marcar presença" de cada linha,
ou direto no banco:

```sql
update public.inscricoes set checkin_em = now() where codigo = 'MC-XXXX-XXXX';
```
