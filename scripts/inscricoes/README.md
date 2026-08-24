# Inscrições com QR code

Como ligar o formulário do site a uma planilha do Google, de graça e sem
servidor. Depois de pronto:

- cada inscrição vira uma linha na sua planilha;
- a mulher recebe no celular um e-mail com o QR code dela;
- no dia do encontro você lê o QR e a presença é confirmada na planilha.

Leva uns 10 minutos, uma vez só.

## 1. Criar a planilha

1. Abra <https://sheets.new> — nasce uma planilha em branco no seu Drive.
2. Dê um nome a ela, por exemplo **Inscrições Mulheres Curadas**.

Não precisa criar colunas: o script cria sozinho na primeira inscrição.

## 2. Colar o script

1. Na planilha, vá em **Extensões › Apps Script**.
2. Apague o `function myFunction() {}` que aparece.
3. Cole todo o conteúdo do arquivo `Codigo.gs` que está nesta pasta.
4. Clique no disquete para salvar.

## 3. Publicar

1. No canto superior direito, clique em **Implantar › Nova implantação**.
2. No ícone de engrenagem, escolha **App da Web**.
3. Preencha:
   - **Executar como:** Eu (seu e-mail)
   - **Quem pode acessar:** **Qualquer pessoa**
4. Clique em **Implantar**.
5. O Google vai pedir autorização. Aceite. Na tela de aviso, clique em
   **Avançado › Acessar (não seguro)** — esse aviso aparece porque o script é
   seu e não passou por revisão do Google; é esperado.
6. Copie o endereço que termina em `/exec`.

## 4. Ligar o site

No arquivo `src/config/conteudo.ts`, cole o endereço:

```ts
export const ENDPOINT_INSCRICAO = "https://script.google.com/macros/s/.../exec";
```

Publique o site. Pronto — a próxima inscrição já cai na planilha.

> **Antes de publicar, atualize a Política de Privacidade.** A partir daqui os
> dados passam a ser guardados e enviados pelo Google (Planilhas e Gmail), e a
> leitura do QR registra a hora em que a inscrita entrou no encontro. Hoje o
> texto diz que nada é compartilhado, o que deixa de ser verdade. O arquivo é
> `src/routes/politica-de-privacidade.tsx` e tem um lembrete no topo.

## No dia do encontro

Abra a câmera do celular e aponte para o QR code da inscrita. Vai abrir uma
página com o nome dela e a confirmação. Ler o mesmo QR duas vezes não duplica
nada: a página avisa que a presença já tinha sido confirmada e a que horas.

Se o celular dela estiver sem bateria, o código de 6 letras que está no e-mail
resolve: procure por ele na coluna **Código** da planilha.

## Se precisar mudar o script depois

Edite, salve e vá em **Implantar › Gerenciar implantações › (lápis) › Versão:
Nova versão › Implantar**. O endereço continua o mesmo — não precisa mexer no
site de novo.

## Limites

O Gmail comum envia até 100 e-mails por dia (contas Workspace, 1.500). Cada
inscrição gasta dois: um para a inscrita e um aviso para vocês. Ou seja, até
50 inscrições por dia numa conta comum. Acima disso, as que passarem do limite
ficam registradas na planilha mas sem e-mail — e o site continua mostrando a
confirmação normalmente.
