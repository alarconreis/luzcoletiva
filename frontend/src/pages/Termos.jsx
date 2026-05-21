import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';

import PageMeta from '../components/PageMeta.jsx';
export default function Termos() {
  return (
    <>
      <PageMeta
      title="Termos de uso"
      description="Termos de uso da plataforma Luz Coletiva. Regras da comunidade, responsabilidades e limites de uso."
      path="/termos"
      />
      <section className="max-w-3xl mx-auto px-6 lg:px-10 py-16">
      <div className="flex items-center gap-3 mb-8">
        <FileText className="text-sky-600" size={32} />
        <h1 className="font-display font-bold text-4xl text-ink-900">Termos de Uso</h1>
      </div>
      <p className="text-sm text-ink-400 mb-8">Versão vigente: 2026-05-06</p>

      <article className="prose prose-ink max-w-none font-body text-ink-800 leading-relaxed space-y-5">
        <p>
          Bem-vindo à Luz Coletiva. Estes termos regem o uso da plataforma de ajuda mútua
          mantida sem fins lucrativos. Ao se cadastrar, você concorda com as condições
          abaixo. Se não concordar, por favor não utilize a plataforma.
        </p>

        <h2 className="font-display font-bold text-xl text-ink-900 mt-8">1. O que é a Luz Coletiva</h2>
        <p>
          A Luz Coletiva é uma plataforma que conecta pessoas que precisam de ajuda
          (solicitantes) com pessoas dispostas a oferecer ajuda (ajudantes), com foco em
          itens essenciais para educação e qualidade de vida (livros, material escolar,
          instrumentos musicais, roupas e calçados, itens de bebê, ração para pets).
          A plataforma é gratuita.
        </p>

        <h2 className="font-display font-bold text-xl text-ink-900 mt-8">2. Cadastro e elegibilidade</h2>
        <p>
          Para se cadastrar você precisa ter ao menos 18 anos, fornecer dados verdadeiros
          (nome, e-mail, CPF/CNPJ, RG, telefone) e enviar uma selfie e foto de documento
          para verificação de identidade. Cadastros suspeitos podem ser recusados ou
          suspensos pela equipe de moderação a qualquer momento.
        </p>

        <h2 className="font-display font-bold text-xl text-ink-900 mt-8">3. Conduta esperada</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Não usar a plataforma para fraudes, golpes, mendicância profissional ou solicitações não relacionadas aos fins permitidos.</li>
          <li>Não trocar contatos pessoais (telefone, e-mail, links externos) dentro do chat — toda combinação deve acontecer pela plataforma.</li>
          <li>Não publicar conteúdo ofensivo, ilegal, discriminatório ou que viole direitos de terceiros.</li>
          <li>Não tentar burlar limites técnicos, rate-limits, automação ou engenharia reversa da plataforma.</li>
        </ul>

        <h2 className="font-display font-bold text-xl text-ink-900 mt-8">4. Responsabilidade</h2>
        <p>
          A Luz Coletiva é uma plataforma de conexão. Não somos parte das transações entre
          usuários e não nos responsabilizamos pela qualidade, entrega ou condição de
          itens trocados. Em caso de problema, denuncie pela plataforma e a moderação irá
          analisar.
        </p>

        <h2 className="font-display font-bold text-xl text-ink-900 mt-8">5. Moderação e suspensão</h2>
        <p>
          Mensagens podem ser censuradas e contas podem ser suspensas ou excluídas pela
          equipe de moderação em caso de violação destes termos. Toda ação fica
          registrada em log de auditoria.
        </p>

        <h2 className="font-display font-bold text-xl text-ink-900 mt-8">6. Encerramento de conta</h2>
        <p>
          Você pode excluir sua conta a qualquer momento pelo painel ("Sair da Luz
          Coletiva"). A exclusão é irreversível e anonimiza imediatamente seus dados
          pessoais. Mensagens já enviadas em chats permanecem visíveis para os outros
          participantes, mas com sua identidade substituída por "Usuário removido".
        </p>

        <h2 className="font-display font-bold text-xl text-ink-900 mt-8">7. Tratamento de dados</h2>
        <p>
          O tratamento de dados pessoais é regido pela nossa{' '}
          <Link to="/privacidade" className="text-sky-600 hover:text-sky-800 underline">Política de Privacidade</Link>,
          que faz parte integrante destes termos.
        </p>

        <h2 className="font-display font-bold text-xl text-ink-900 mt-8">8. Alterações</h2>
        <p>
          Podemos atualizar estes termos. Quando isso acontecer, a versão será incrementada
          e você poderá ser solicitado a aceitar a nova versão para continuar usando a
          plataforma.
        </p>

        <h2 className="font-display font-bold text-xl text-ink-900 mt-8">9. Foro</h2>
        <p>
          Estes termos são regidos pelas leis brasileiras. Fica eleito o foro da comarca
          de São Paulo/SP para dirimir eventuais conflitos.
        </p>

        <p className="text-sm text-ink-700 mt-10">
          Dúvidas? Entre em contato com{' '}
          <a href="mailto:contato@luzcoletiva.com.br" className="text-sky-600 hover:text-sky-800 underline">
            contato@luzcoletiva.com.br
          </a>.
        </p>
      </article>
    </section>
    </>
  );
}
