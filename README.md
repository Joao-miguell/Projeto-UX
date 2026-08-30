# 🏀 DUNK SHOP

> **Protótipo Acadêmico — Disciplina de UX (Experiência do Usuário)**

Loja virtual fictícia onde o usuário **precisa fazer uma cesta de basquete** para adicionar um produto ao carrinho.

---

## 🎯 Objetivo

Demonstrar o impacto da **fricção proposital** em uma jornada de compra.

Em lojas convencionais, adicionar um produto ao carrinho é uma ação de 1 clique. Neste projeto, essa ação foi transformada em um **minijogo de arremesso de basquete** — criando uma experiência intencionalmente mais difícil para provocar reflexão sobre princípios de UX como:

- Affordance
- Feedback visual e imediato
- Carga cognitiva
- Gamificação
- Microinterações
- Fricção na jornada do usuário

---

## 🛠️ Tecnologias

| Tecnologia | Uso |
|---|---|
| React 18 | Interface e componentes |
| TypeScript | Tipagem estática |
| Vite | Build e dev server |
| CSS (puro) | Estilização, animações |
| requestAnimationFrame | Física do arremesso |

**Sem backend. Sem banco de dados. Sem APIs externas.**

---

## 🚀 Como executar

```bash
# Clone ou abra o projeto
cd Projeto-UX

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse: **http://localhost:5173**

---

## 🏀 Como funciona a mecânica

### Fluxo obrigatório

```
Produto → Clique em "Comprar" → Minijogo abre
    → Arraste a bola → Solte para arremessar
        → ACERTO → Produto entra no carrinho ✅
        → ERRO   → Mensagem + Tentar novamente 🔄
```

### Física do arremesso

A simulação usa cálculos simples de física 2D:

- **Posição inicial**: canto inferior esquerdo da quadra
- **Velocidade**: definida pelo vetor do arrastar (direção + força)
- **Gravidade**: constante aplicada a cada frame em `requestAnimationFrame`
- **Colisão**: zona invisível ao redor do aro — a bola precisa passar pelo centro em trajetória descendente

A dificuldade é moderada: arremessos bem direcionados têm boa chance de acertar, mas arremessos aleatórios quase sempre erram.

---

## 🎓 Relação com UX

| Conceito de UX | Como aparece no projeto |
|---|---|
| **Fricção** | Comprar exige esforço físico/cognitivo além de 1 clique |
| **Affordance** | A bola e a cesta comunicam o que fazer sem instruções |
| **Feedback imediato** | Animação + mensagem a cada acerto ou erro |
| **Gamificação** | Placar de arremessos e cestas da sessão |
| **Carga cognitiva** | O usuário precisa pensar em direção e força |
| **Microinterações** | Aro vibra, bola gira, confetes aparecem no acerto |
| **Visibilidade do sistema** | Barra de força mostra o poder do arremesso em tempo real |

---

## 📁 Estrutura do projeto

```
src/
├── components/
│   ├── Header/         # Topo da página com navegação e carrinho
│   ├── Hero/           # Seção inicial com apresentação do conceito
│   ├── ProductCard/    # Card individual de produto
│   ├── ProductGrid/    # Grade de produtos
│   ├── BasketGame/     # Modal do minijogo de arremesso ← NÚCLEO
│   ├── Cart/           # Drawer lateral do carrinho
│   └── About/          # Seção explicando o experimento de UX
├── hooks/
│   ├── useCart.ts      # Estado e ações do carrinho
│   └── useBasketGame.ts # Física e estado do jogo
├── data/
│   └── products.ts     # Catálogo de produtos fictícios
└── types/
    └── index.ts        # Tipos TypeScript compartilhados
```

---

*Projeto desenvolvido para fins acadêmicos. Sem funcionalidade comercial real.*
