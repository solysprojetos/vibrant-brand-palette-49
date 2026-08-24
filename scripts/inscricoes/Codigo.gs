/**
 * Inscricoes Mulheres Curadas — Google Apps Script.
 *
 * Faz tres coisas, sem servidor e sem custo:
 *
 * 1. Recebe a inscricao vinda do site e grava uma linha na planilha.
 * 2. Manda para a inscrita um e-mail com o QR code dela (o "ingresso").
 * 3. No dia do encontro, ler esse QR abre uma pagina que mostra o nome e
 *    marca a presenca na planilha.
 *
 * Como instalar esta no README.md desta pasta.
 */

/** Aba da planilha onde as inscricoes sao gravadas. Criada sozinha na primeira vez. */
const ABA = "Inscricoes";

/** Para onde vai o aviso de cada inscricao nova. */
const EMAIL_ORGANIZACAO = "contato@mulherescuradas.com";

/** Nome que aparece como remetente dos e-mails. */
const REMETENTE = "Mulheres Curadas";

/** Colunas da planilha, nesta ordem. */
const COLUNAS = [
  "Data da inscricao",
  "Codigo",
  "Nome",
  "Telefone",
  "E-mail",
  "Frequenta igreja",
  "Igreja",
  "Presenca confirmada em",
];

/* ------------------------------------------------------------------ *
 * Entradas
 * ------------------------------------------------------------------ */

/** O site chama isto ao enviar o formulario. */
function doPost(e) {
  try {
    const dados = JSON.parse(e.postData.contents);
    const inscricao = registrar(dados);
    enviarIngresso(inscricao);
    avisarOrganizacao(inscricao);
    return json({ ok: true, codigo: inscricao.codigo });
  } catch (erro) {
    console.error(erro);
    return json({ ok: false, erro: String(erro) });
  }
}

/**
 * O QR code aponta para ca: .../exec?c=CODIGO
 *
 * Abrir esse endereco (a camera do celular faz isso sozinha ao ler o QR)
 * mostra o nome da inscrita e marca a presenca. Ler o mesmo QR de novo nao
 * duplica nada: a pagina avisa que a presenca ja tinha sido confirmada e a
 * que horas foi.
 */
function doGet(e) {
  const codigo = ((e && e.parameter && e.parameter.c) || "").toString().trim().toUpperCase();
  if (!codigo) return pagina("erro", "Código não informado", "Leia o QR code do ingresso.");

  const aba = planilha();
  const valores = aba.getDataRange().getValues();

  for (let i = 1; i < valores.length; i++) {
    if (String(valores[i][1]).toUpperCase() !== codigo) continue;

    const nome = valores[i][2];
    const jaConfirmada = valores[i][7];

    if (jaConfirmada) {
      return pagina(
        "aviso",
        nome,
        "Presença já confirmada em " + Utilities.formatDate(
          new Date(jaConfirmada),
          Session.getScriptTimeZone(),
          "dd/MM 'às' HH:mm"
        ) + "."
      );
    }

    aba.getRange(i + 1, 8).setValue(new Date());
    return pagina("ok", nome, "Presença confirmada. Bem-vinda!");
  }

  return pagina("erro", "Código não encontrado", "Confira a inscrição pela planilha.");
}

/* ------------------------------------------------------------------ *
 * Planilha
 * ------------------------------------------------------------------ */

function planilha() {
  const arquivo = SpreadsheetApp.getActiveSpreadsheet();
  let aba = arquivo.getSheetByName(ABA);

  if (!aba) {
    aba = arquivo.insertSheet(ABA);
    aba.appendRow(COLUNAS);
    aba.getRange(1, 1, 1, COLUNAS.length).setFontWeight("bold");
    aba.setFrozenRows(1);
  }

  return aba;
}

function registrar(dados) {
  const aba = planilha();
  const codigo = codigoNovo(aba);

  const inscricao = {
    codigo: codigo,
    nome: String(dados.nome || "").trim(),
    telefone: String(dados.telefone || "").trim(),
    email: String(dados.email || "").trim(),
    frequentaIgreja: dados.frequentaIgreja ? "Sim" : "Não",
    igreja: String(dados.igreja || "").trim(),
  };

  aba.appendRow([
    new Date(),
    inscricao.codigo,
    inscricao.nome,
    inscricao.telefone,
    inscricao.email,
    inscricao.frequentaIgreja,
    inscricao.igreja,
    "",
  ]);

  return inscricao;
}

/**
 * Codigo curto de 6 caracteres, sem as letras que se confundem com numero
 * (I, O, S) para o caso de alguem precisar ditar o codigo por telefone.
 * Repete o sorteio se por acaso cair um codigo que ja existe.
 */
function codigoNovo(aba) {
  const alfabeto = "ABCDEFGHJKLMNPQRTUVWXYZ23456789";
  const usados = aba
    .getRange(1, 2, Math.max(aba.getLastRow(), 1), 1)
    .getValues()
    .map(function (linha) {
      return String(linha[0]);
    });

  for (let tentativa = 0; tentativa < 50; tentativa++) {
    let codigo = "";
    for (let i = 0; i < 6; i++) {
      codigo += alfabeto.charAt(Math.floor(Math.random() * alfabeto.length));
    }
    if (usados.indexOf(codigo) === -1) return codigo;
  }

  throw new Error("Não foi possível gerar um código novo.");
}

/* ------------------------------------------------------------------ *
 * E-mails
 * ------------------------------------------------------------------ */

/**
 * O QR e baixado na hora do envio e vai anexado ao e-mail, nao como link.
 * Assim ele continua aparecendo mesmo que o aplicativo de e-mail bloqueie
 * imagens externas, e nao depende do servico de QR seguir no ar depois.
 */
function enviarIngresso(inscricao) {
  if (!inscricao.email) return;

  const endereco = ScriptApp.getService().getUrl() + "?c=" + inscricao.codigo;
  const qr = UrlFetchApp.fetch(
    "https://quickchart.io/qr?size=600&margin=2&text=" + encodeURIComponent(endereco)
  ).getBlob().setName("ingresso.png");

  const primeiroNome = inscricao.nome.split(/\s+/)[0] || "";
  const saudacao = primeiroNome
    ? primeiroNome.charAt(0) + primeiroNome.slice(1).toLowerCase()
    : "";

  const html =
    '<div style="font-family:Georgia,serif;color:#3a2a25;max-width:480px;margin:0 auto;padding:24px">' +
    '<h1 style="font-size:24px;color:#76382e;margin:0 0 16px">Sua vaga está garantida' +
    (saudacao ? ", " + saudacao : "") +
    "!</h1>" +
    '<p style="font-size:15px;line-height:1.6">Guarde este e-mail. No dia do encontro, ' +
    "mostre o QR code abaixo na entrada — é ele que confirma sua presença.</p>" +
    '<div style="text-align:center;margin:28px 0">' +
    '<img src="cid:qr" alt="QR code da sua inscrição" style="width:220px;height:220px">' +
    '<p style="font-size:13px;color:#7a6a63;margin-top:10px">Código: <strong>' +
    inscricao.codigo +
    "</strong></p></div>" +
    '<p style="font-size:13px;color:#7a6a63;line-height:1.6">Se o QR não abrir, é só dizer ' +
    "seu nome e o código acima na entrada.</p>" +
    '<p style="font-size:14px;margin-top:24px">Com carinho,<br><strong>Mulheres Curadas</strong></p>' +
    "</div>";

  MailApp.sendEmail({
    to: inscricao.email,
    subject: "Sua inscrição está confirmada — Mulheres Curadas",
    htmlBody: html,
    inlineImages: { qr: qr },
    // Copia porque o mesmo blob ja vai embutido no corpo: anexado tambem, o
    // QR fica salvo no celular mesmo se ela abrir o e-mail sem internet.
    attachments: [qr.copyBlob().setName("ingresso-" + inscricao.codigo + ".png")],
    name: REMETENTE,
  });
}

function avisarOrganizacao(inscricao) {
  MailApp.sendEmail({
    to: EMAIL_ORGANIZACAO,
    subject: "Nova inscrição: " + inscricao.nome,
    body: [
      "Nome: " + inscricao.nome,
      "Telefone: " + inscricao.telefone,
      "E-mail: " + inscricao.email,
      "Frequenta igreja: " + inscricao.frequentaIgreja,
      inscricao.igreja ? "Igreja: " + inscricao.igreja : "",
      "",
      "Código do ingresso: " + inscricao.codigo,
    ]
      .filter(String)
      .join("\n"),
    name: REMETENTE,
  });
}

/* ------------------------------------------------------------------ *
 * Respostas
 * ------------------------------------------------------------------ */

function json(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/** Pagina que a pessoa da portaria ve depois de ler o QR. */
function pagina(tipo, titulo, mensagem) {
  const cores = { ok: "#2f7d5a", aviso: "#b07d2b", erro: "#a33a3a" };
  const cor = cores[tipo] || cores.erro;

  const html =
    '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    "<title>Confirmação — Mulheres Curadas</title></head>" +
    '<body style="margin:0;background:#fbf7f2;font-family:system-ui,-apple-system,sans-serif;' +
    'display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px">' +
    '<div style="text-align:center;max-width:420px">' +
    '<div style="font-size:56px;line-height:1">' +
    (tipo === "ok" ? "&#10003;" : tipo === "aviso" ? "!" : "&#10005;") +
    "</div>" +
    '<h1 style="font-size:28px;color:' +
    cor +
    ';margin:16px 0 8px">' +
    escapar(titulo) +
    "</h1>" +
    '<p style="font-size:16px;color:#5a4a44;line-height:1.5">' +
    escapar(mensagem) +
    "</p></div></body></html>";

  return HtmlService.createHtmlOutput(html).addMetaTag(
    "viewport",
    "width=device-width, initial-scale=1"
  );
}

function escapar(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
