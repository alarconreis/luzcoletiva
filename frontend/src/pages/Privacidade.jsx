import { ShieldCheck } from 'lucide-react';

import PageMeta from '../components/PageMeta.jsx';
export default function Privacidade() {
  return (
    <>
      <PageMeta
      title="Política de privacidade"
      description="Política de privacidade da Luz Coletiva, em conformidade com a LGPD. Como tratamos seus dados pessoais e por quanto tempo."
      path="/privacidade"
      />
      <section className="max-w-3xl mx-auto px-6 lg:px-10 py-16">
      <div className="flex items-center gap-3 mb-8">
        <ShieldCheck className="text-sky-600" size={32} />
        <h1 className="font-display font-bold text-4xl text-ink-900">Política de Privacidade</h1>
      </div>
      <p className="text-sm text-ink-400 mb-8">
        Versão vigente: 2026-05-06 — em conformidade com a LGPD (Lei 13.709/2018).
      </p>

      <article className="prose prose-ink max-w-none font-body text-ink-800 leading-relaxed space-y-5">
        <p>
          Esta política descreve como a Luz Coletiva trata os dados pessoais dos usuários
          em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD).
        </p>

        <h2 className="font-display font-bold text-xl text-ink-900 mt-8">1. Quem somos (controlador)</h2>
        <p>
          A Luz Coletiva é a controladora dos dados pessoais coletados pela plataforma,
          conforme Art. 5º, VI da LGPD. Para questões sobre seus dados, entre em contato
          com nosso encarregado pelo e-mail{' '}
          <a href="mailto:contato@luzcoletiva.com.br" className="text-sky-600 hover:text-sky-800 underline">
            contato@luzcoletiva.com.br
          </a>.
        </p>

        <h2 className="font-display font-bold text-xl text-ink-900 mt-8">2. Quais dados coletamos</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Identificação:</strong> nome completo, e-mail, telefone, CPF/CNPJ, RG.</li>
          <li><strong>Dado biométrico (sensível):</strong> selfie e análise de prova de vida e correspondência facial com o documento, exclusivamente para verificação de identidade.</li>
          <li><strong>Foto do documento:</strong> imagem do RG/CNH ou cartão CNPJ.</li>
          <li><strong>Dados de uso:</strong> conteúdo dos chats com outros usuários, pedidos publicados, ofertas feitas, avaliações trocadas, denúncias.</li>
          <li><strong>Logs técnicos:</strong> endereço IP de cadastro, login, denúncia; user-agent; horários de acesso.</li>
        </ul>

        <h2 className="font-display font-bold text-xl text-ink-900 mt-8">3. Bases legais e finalidade</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Consentimento (Art. 7º, I)</strong> — para tratamento de dados em geral, expresso no cadastro.</li>
          <li><strong>Consentimento específico (Art. 11, I)</strong> — para tratamento de dado biométrico (selfie + face match), expresso na tela de verificação.</li>
          <li><strong>Execução de contrato (Art. 7º, V)</strong> — para entregar o serviço (conexão entre solicitante e ajudante).</li>
          <li><strong>Legítimo interesse (Art. 7º, IX)</strong> — para prevenção a fraude, moderação de conteúdo e segurança da rede.</li>
          <li><strong>Cumprimento de obrigação legal (Art. 7º, II)</strong> — para reter logs de acesso e moderação pelo prazo exigido por lei (ex.: Marco Civil da Internet, 6 meses).</li>
        </ul>

        <h2 className="font-display font-bold text-xl text-ink-900 mt-8">4. Com quem compartilhamos</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Outros usuários da plataforma</strong> — nome (anonimizado em listas públicas), avaliações, mensagens trocadas no chat.</li>
          <li><strong>Provedor de IA (Anthropic)</strong> — imagens da selfie e do documento são enviadas para análise automatizada de identidade. As imagens não são usadas para treino, conforme contrato com o fornecedor.</li>
          <li><strong>Provedor de e-mail (Resend)</strong> — endereço de e-mail e nome para envio de notificações transacionais.</li>
          <li><strong>Provedor de SMS (ClickSend)</strong> — número de telefone para envio de OTP de login.</li>
          <li><strong>Não vendemos nem cedemos dados a terceiros para fins comerciais.</strong></li>
        </ul>

        <h2 className="font-display font-bold text-xl text-ink-900 mt-8">5. Por quanto tempo guardamos</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Selfie e foto do documento:</strong> apagadas até 30 dias após verificação aprovada.</li>
          <li><strong>Dados cadastrais:</strong> enquanto a conta estiver ativa.</li>
          <li><strong>Mensagens, pedidos e ofertas:</strong> mantidos enquanto a conta existir, anonimizados após exclusão da conta.</li>
          <li><strong>Logs de login e auditoria:</strong> 6 meses (Marco Civil da Internet).</li>
        </ul>

        <h2 className="font-display font-bold text-xl text-ink-900 mt-8">6. Seus direitos (Art. 18 da LGPD)</h2>
        <p>Você pode exercer a qualquer momento, direto pelo painel ou pelo e-mail acima:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Confirmação e acesso</strong> — saber se tratamos seus dados e exportar uma cópia (botão "Exportar meus dados" no painel).</li>
          <li><strong>Correção</strong> — corrigir dados incompletos ou desatualizados pela tela de perfil.</li>
          <li><strong>Anonimização e eliminação</strong> — solicitar a exclusão da conta (botão "Excluir minha conta" no painel). A exclusão é imediata e irreversível.</li>
          <li><strong>Portabilidade</strong> — exportar seus dados em formato legível (JSON).</li>
          <li><strong>Revogação de consentimento</strong> — basta excluir a conta.</li>
          <li><strong>Informação sobre compartilhamento</strong> — listado na seção 4 desta política.</li>
        </ul>

        <h2 className="font-display font-bold text-xl text-ink-900 mt-8">7. Segurança</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Conexões via HTTPS (TLS).</li>
          <li>Senhas armazenadas com hash bcrypt (custo 12).</li>
          <li>Imagens de verificação cifradas em repouso.</li>
          <li>Sessão com JWT de duração curta + lista de revogação.</li>
          <li>Logs de tentativas de acesso e ações administrativas.</li>
        </ul>

        <h2 className="font-display font-bold text-xl text-ink-900 mt-8">8. Cookies e armazenamento local</h2>
        <p>Usamos:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Cookie de sessão</strong> (HTTP-only, SameSite strict) para autenticação. Necessário para o funcionamento da plataforma — não pode ser desativado.</li>
          <li><strong>Armazenamento local</strong> (<code>localStorage</code>) para preferência de consentimento de analytics e dados auxiliares de sessão.</li>
        </ul>
        <p>Não usamos cookies de rastreamento publicitário nem fingerprinting.</p>

        <h2 className="font-display font-bold text-xl text-ink-900 mt-8">9. Analytics (com consentimento)</h2>
        <p>
          Utilizamos <strong>Google Analytics 4</strong> (Google LLC, EUA) para entender como a plataforma é usada e melhorá-la.
          O GA só é carregado <strong>após você aceitar</strong> o banner de consentimento exibido em sua primeira visita.
        </p>
        <p><strong>Dados coletados pelo GA quando ativo:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Páginas visitadas (URL e título)</li>
          <li>Tempo de permanência</li>
          <li>Tipo de dispositivo, navegador e sistema operacional</li>
          <li>País/região (sem cidade nem coordenadas precisas)</li>
          <li>Endereço IP <strong>anonimizado</strong> (último octeto removido antes da coleta)</li>
          <li>Origem do tráfego (link de onde você veio)</li>
        </ul>
        <p><strong>Dados NÃO coletados:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Conteúdo de pedidos</li>
          <li>Mensagens entre usuários</li>
          <li>Informações de pagamento</li>
          <li>Documentos enviados (RG, selfie)</li>
          <li>E-mails, telefones ou nomes</li>
        </ul>
        <p>
          <strong>Base legal (LGPD art. 7º, I):</strong> consentimento livre, informado e inequívoco, fornecido por meio do banner de cookies.
        </p>
        <p>
          <strong>Transferência internacional:</strong> Os dados são processados em servidores do Google nos Estados Unidos. O Google adere a salvaguardas adequadas (cláusulas contratuais padrão da UE). Mais detalhes na{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:text-sky-800 underline">
            Política de Privacidade do Google
          </a>.
        </p>
        <p><strong>Como revogar o consentimento:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Limpe os cookies/armazenamento local deste site no seu navegador</li>
          <li>O banner reaparecerá e você poderá optar novamente</li>
        </ul>
        <p>
          <strong>Retenção:</strong> 14 meses (padrão GA4, configurado pelo administrador).
        </p>

        <h2 className="font-display font-bold text-xl text-ink-900 mt-8">10. Crianças e adolescentes</h2>
        <p>
          A plataforma não é destinada a menores de 18 anos. Caso identifiquemos cadastro
          de menor sem autorização dos responsáveis, a conta será removida imediatamente.
        </p>

        <h2 className="font-display font-bold text-xl text-ink-900 mt-8">11. Encarregado de dados (DPO)</h2>
        <p>
          Para exercer seus direitos, sanar dúvidas ou registrar reclamações sobre o
          tratamento de dados:
        </p>
        <p>
          📧{' '}
          <a href="mailto:contato@luzcoletiva.com.br" className="text-sky-600 hover:text-sky-800 underline">
            contato@luzcoletiva.com.br
          </a>
        </p>
        <p>
          Você também pode registrar reclamação diretamente na ANPD (Autoridade Nacional
          de Proteção de Dados) pelo site{' '}
          <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:text-sky-800 underline">
            gov.br/anpd
          </a>.
        </p>

        <h2 className="font-display font-bold text-xl text-ink-900 mt-8">12. Notificação de incidente</h2>
        <p>
          Em caso de incidente de segurança que possa acarretar risco aos titulares,
          comunicaremos a ANPD e os usuários afetados em prazo razoável, conforme Art. 48
          da LGPD.
        </p>

        <h2 className="font-display font-bold text-xl text-ink-900 mt-8">12. Alterações</h2>
        <p>
          Esta política pode ser atualizada. A versão vigente sempre estará disponível
          nesta página, com a data de revisão. Mudanças relevantes serão comunicadas por
          e-mail.
        </p>
      </article>
    </section>
    </>
  );
}
