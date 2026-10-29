/* ==========================================================================
   Ambiente do site. Em PRODUÇÃO deixe `modoDesenvolvedor: false` (padrão).

   O "modo desenvolvedor" (botão "Entrar como desenvolvedor" no login) é só uma ferramenta de teste LOCAL:
   - não usa Firebase, não cria conta, não aparece no ranking e não grava nada no banco;
   - guarda os dados num espaço isolado do navegador (chave "briif:progress:dev-local");
   - por isso não dá privilégio nenhum sobre dados reais: quem protege o banco são as regras do Firestore.
   Ele só aparece quando o site roda em localhost/127.0.0.1 OU quando esta flag é true (use true só num ambiente
   de testes/staging, nunca no site público). Uma sessão "dev" gravada à mão no navegador é descartada se o ambiente
   não permitir.
   ========================================================================== */
window.BRIIF_AMBIENTE = {
  modoDesenvolvedor: false
};
