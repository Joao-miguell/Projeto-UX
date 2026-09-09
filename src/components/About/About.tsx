import React from 'react';
import './About.css';

interface WcagCriterion {
  code: string;
  name: string;
  level: 'A' | 'AA' | 'AAA';
  principle: string;
  recommendation: string;
  ruleExcerpt: string;
  howItBreaks: string;
}

const WCAG_VIOLATIONS: WcagCriterion[] = [
  {
    code: '2.5.7',
    name: 'Movimentos de arrastar',
    level: 'AA',
    principle: 'Operável',
    recommendation: 'Modalidade de Entrada',
    ruleExcerpt:
      'Toda funcionalidade que dependa de um movimento de arrastar (drag and drop) também deve receber um método alternativo de uso para que a operação seja efetuada também através de acionamento via clique ou toque.',
    howItBreaks:
      'Para adicionar o produto ao carrinho, o usuário é obrigado a arrastar o item para trás (estilo estilingue) e soltar para arremessar. Não há botão de compra direta ou alternativa de clique único (single pointer), excluindo quem possui tremores motores, espasticidade ou usa ponteiros de cabeça e eye-trackers.',
  },
  {
    code: '2.1.1',
    name: 'Teclado',
    level: 'A',
    principle: 'Operável',
    recommendation: 'Acessível por teclado',
    ruleExcerpt:
      'Todas as funcionalidades devem ser acionadas via teclado, a menos que a funcionalidade não possibilite o controle apenas por teclado.',
    howItBreaks:
      'O minijogo foi programado exclusivamente para eventos de arrasto de mouse e gestos de toque na tela. Usuários que navegam estritamente por teclado (pessoas com deficiências motoras severas ou pessoas cegas com leitores de tela) ficam 100% impossibilitados de arremessar e, portanto, bloqueados de comprar.',
  },
  {
    code: '2.5.1',
    name: 'Gestos de acionamento',
    level: 'A',
    principle: 'Operável',
    recommendation: 'Modalidade de Entrada',
    ruleExcerpt:
      'Toda funcionalidade que exige um caminho tátil para ser acionada (exemplo: arrastar com o dedo em uma tela de toque) precisa também de um método alternativo que facilite a interação por quem não consegue efetuar o gesto.',
    howItBreaks:
      'A mecânica de arremesso exige um gesto baseado em trajetória/caminho contínuo (path-based gesture) para controlar ângulo e força, sem fornecer método alternativo de ponteiro simples (single-point activation) para acionar a compra.',
  },
  {
    code: '2.2.2',
    name: 'Colocar em pausa, parar, ocultar',
    level: 'A',
    principle: 'Operável',
    recommendation: 'Tempo suficiente',
    ruleExcerpt:
      'Qualquer elemento na tela que tenha movimento automático ou pisque e que dure mais do que 5 segundos, deve ter um tipo de controle onde a pessoa que o utiliza pode pausar, parar ou ocultar.',
    howItBreaks:
      'O cesto de compras oscila lateralmente sem parar na tela enquanto o usuário tenta mirar. Não há nenhuma opção ou controle para o usuário pausar, parar ou desacelerar o movimento automático do alvo.',
  },
  {
    code: '3.3.1 / 3.3.3',
    name: 'Identificação e sugestão de erro',
    level: 'A',
    principle: 'Compreensível',
    recommendation: 'Assistência a entrada',
    ruleExcerpt:
      'Sempre que uma mensagem de erro for exibida, ela deve identificar claramente o que gerou o erro de forma visual/audível e dar dicas claras de como resolver o problema.',
    howItBreaks:
      'Ao errar o arremesso, o jogo exibe mensagens frustrantes e vagas ("Errou feio! 😬", "Skill issue 💀") sem fornecer instruções claras sobre o motivo do erro (força inadequada, vento lateral) e sem disponibilizar uma via acessível para corrigir e concluir a compra.',
  },
  {
    code: '4.1.2',
    name: 'Nome, função, valor',
    level: 'A',
    principle: 'Robusto',
    recommendation: 'Compatível',
    ruleExcerpt:
      'Toda tecnologia assistiva faz uso das propriedades de nome, função e valor para identificar adequadamente os elementos. Qualquer componente customizado deve trazer essas marcações de forma adequada.',
    howItBreaks:
      'O componente interativo do arremesso, as coordenadas da bola e a posição dinâmica do cesto não possuem equivalentes semânticos nem notificações via leitores de tela (ARIA live regions), tornando a experiência invisível para tecnologias assistivas.',
  },
];

export const About: React.FC = () => {
  return (
    <section id="about" className="about-section" aria-label="Sobre o projeto e acessibilidade">
      <div className="about-inner">
        <header className="about-header">
          <span className="about-badge">Acessibilidade Digital</span>
          <h2 className="about-title">Critérios da WCAG Violados</h2>
          <p className="about-description">
            Em lojas convencionais, adicionar um produto é uma ação imediata de 1 clique.
            Neste experimento, a introdução intencional do minijogo de arremesso quebra critérios fundamentais
            das diretrizes <strong>WCAG 2.1 e 2.2</strong> catalogadas no{' '}
            <a
              href="https://guia-wcag.com"
              target="_blank"
              rel="noopener noreferrer"
              className="about-link"
            >
              Guia WCAG (guia-wcag.com)
            </a>:
          </p>
        </header>

        <div className="wcag-grid">
          {WCAG_VIOLATIONS.map((criterion) => (
            <article key={criterion.code} className="wcag-card">
              <div className="wcag-card-top">
                <div className="wcag-badges">
                  <span className={`wcag-level wcag-level-${criterion.level.toLowerCase()}`}>
                    Nível {criterion.level}
                  </span>
                  <span className="wcag-principle">
                    {criterion.principle} · {criterion.recommendation}
                  </span>
                </div>
                <h3 className="wcag-card-title">
                  {criterion.code} — {criterion.name}
                </h3>
              </div>

              <div className="wcag-card-body">
                <blockquote className="wcag-rule-quote" title="Regra segundo o Guia WCAG">
                  <span className="wcag-quote-label">O que diz a WCAG (guia-wcag.com):</span>
                  <p>"{criterion.ruleExcerpt}"</p>
                </blockquote>

                <div className="wcag-violation-detail">
                  <span className="wcag-violation-label">Como o projeto quebra essa regra:</span>
                  <p>{criterion.howItBreaks}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <footer className="about-footer-note">
          <p>
            Consulte a lista completa de critérios e referências no{' '}
            <a
              href="https://guia-wcag.com"
              target="_blank"
              rel="noopener noreferrer"
              className="about-link"
            >
              Guia WCAG Oficial
            </a>.
          </p>
        </footer>
      </div>
    </section>
  );
};
