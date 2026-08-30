import React from 'react';
import './About.css';

export const About: React.FC = () => {
  return (
    <section id="about" className="about-section" aria-label="Sobre o projeto">
      <div className="about-inner">
        <h2 className="about-title">Regras de UX Quebradas</h2>
        <ul className="ux-rules-list">
          <li><strong>Eficiência e Velocidade:</strong> O fluxo de compra deixou de ser 1-clique para exigir destreza motora.</li>
          <li><strong>Previsibilidade:</strong> O usuário não tem certeza se o item será adicionado ao carrinho (pode errar o arremesso).</li>
          <li><strong>Minimização de Fricção:</strong> Adicionar uma barreira (minijogo) entre a intenção de compra e a conversão.</li>
          <li><strong>Carga Cognitiva Reduzida:</strong> Exige cálculo mental de força e trajetória em vez de um simples reconhecimento de botão.</li>
          <li><strong>Acessibilidade Motora:</strong> Usuários com dificuldades motoras teriam extrema dificuldade para comprar.</li>
        </ul>
      </div>
    </section>
  );
};
