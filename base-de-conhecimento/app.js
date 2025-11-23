(() => {
    'use strict';

    // Estado da aplicação (Centralizado)
    const state = {
        dados: [],
        dadosFiltrados: [], // Mantemos uma cópia filtrada/ordenada
        categoriaSelecionada: 'todos'
    };

    // Cache de elementos do DOM (Melhora performance)
    const DOM = {
        container: document.getElementById('card-container'),
        contador: document.getElementById('contador-resultados'),
        inputBusca: document.getElementById('input-busca'),
        selectOrdenacao: document.getElementById('sort-select'),
        btnSearch: document.getElementById('btn-search'),
        btnClear: document.getElementById('btn-clear'),
        botoesCategoria: document.querySelectorAll('.btn-category')
    };

    // Mapeamento de Categorias para Tags
    const CATEGORIAS = {
        'linguagens': ['Language', 'Linguagem', 'Scripting', 'Programming Language'],
        'frameworks': ['Framework', 'Library', 'Biblioteca', 'UI Library', 'Frontend Framework', 'Web Framework', 'Backend Framework'],
        'bancos-dados': ['Database', 'SQL', 'NoSQL', 'Banco de Dados', 'ORM'],
        'devops': ['DevOps', 'Cloud', 'Containerization', 'Orchestration', 'IaC', 'CI/CD', 'Monitoring', 'Serverless'],
        'ia': ['AI', 'ML', 'Machine Learning', 'Deep Learning', 'LLM', 'NLP', 'Generative AI']
    };

    // Elementos do Modal
    const DOM_MODAL = {
        overlay: document.getElementById('modal-detalhes'),
        btnVoltarTop: document.getElementById('btn-voltar-top'),
        icon: document.getElementById('modal-icon'),
        titulo: document.getElementById('modal-titulo'),
        criacao: document.querySelector('#modal-criacao .text'),
        dev: document.querySelector('#modal-dev .text'),
        descricao: document.getElementById('modal-descricao'),
        codigo: document.getElementById('modal-codigo'),
        tags: document.getElementById('modal-tags'),
        links: document.getElementById('modal-links'),
        relacionados: document.getElementById('modal-relacionados')
    };

    // Função para abrir o modal
    const abrirDetalhes = (dado) => {
        console.log('Abrindo detalhes para:', dado.nome);
        // Popula os dados
        DOM_MODAL.icon.className = dado.icon;
        DOM_MODAL.titulo.textContent = dado.nome;
        DOM_MODAL.criacao.textContent = `Criado em ${dado.data_criacao}`;
        DOM_MODAL.dev.textContent = `Desenvolvido por ${dado.desenvolvedor}`;
        DOM_MODAL.descricao.textContent = dado.descricao;
        DOM_MODAL.codigo.textContent = dado.exemplo_codigo || '// Código não disponível';

        // Tags
        DOM_MODAL.tags.innerHTML = '';
        if (dado.tags) {
            dado.tags.forEach(tag => {
                const span = document.createElement('span');
                span.classList.add('tag');
                span.textContent = tag;
                DOM_MODAL.tags.appendChild(span);
            });
        }

        // Links Úteis
        DOM_MODAL.links.innerHTML = '';
        if (dado.links_uteis) {
            dado.links_uteis.forEach(link => {
                const a = document.createElement('a');
                a.href = link.url;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.classList.add('link-item');
                a.innerHTML = `<i class="fas fa-external-link-alt"></i> ${link.nome}`;
                DOM_MODAL.links.appendChild(a);
            });
        }

        // Tecnologias Relacionadas
        DOM_MODAL.relacionados.innerHTML = '';
        if (dado.tecnologias_relacionadas) {
            dado.tecnologias_relacionadas.forEach(nomeTech => {
                // Encontra o objeto da tech relacionada
                const techRelacionada = state.dados.find(t => t.nome === nomeTech);

                const div = document.createElement('div');
                div.classList.add('related-card');
                div.innerHTML = `
                    <h4>${nomeTech}</h4>
                    <p>${techRelacionada ? techRelacionada.descricao.substring(0, 60) + '...' : 'Ver detalhes'}</p>
                    <i class="fas fa-arrow-right arrow"></i>
                `;

                // Click para abrir a relacionada
                div.addEventListener('click', () => {
                    if (techRelacionada) {
                        abrirDetalhes(techRelacionada);
                    } else {
                        // Se não achar pelo nome exato (pode acontecer), tenta busca aproximada ou avisa
                        // Tenta buscar no state
                        const found = state.dados.find(d => d.nome.toLowerCase() === nomeTech.toLowerCase());
                        if (found) abrirDetalhes(found);
                    }
                });

                DOM_MODAL.relacionados.appendChild(div);
            });
        }

        // Mostra o modal
        DOM_MODAL.overlay.classList.remove('hidden');
        // Pequeno delay para a transição CSS funcionar (display: none -> block -> opacity)
        requestAnimationFrame(() => {
            DOM_MODAL.overlay.classList.add('active');
        });

        // Trava o scroll do body
        document.body.style.overflow = 'hidden';
    };

    const fecharDetalhes = () => {
        DOM_MODAL.overlay.classList.remove('active');
        setTimeout(() => {
            DOM_MODAL.overlay.classList.add('hidden');
            document.body.style.overflow = ''; // Destrava scroll
        }, 300); // Tempo da transição CSS
    };

    // Função segura para criar cards (Evita XSS e melhora performance)
    const criarCard = (dado) => {
        const article = document.createElement('article');
        article.classList.add('card');

        // Ícone
        const icon = document.createElement('i');
        icon.className = dado.icon;
        icon.setAttribute('aria-hidden', 'true'); // Acessibilidade: ícone decorativo

        // Título
        const h2 = document.createElement('h2');
        h2.textContent = dado.nome; // textContent previne injeção de HTML

        // Descrição
        const pDesc = document.createElement('p');
        pDesc.textContent = dado.descricao;

        // Meta Info (Criação estruturada)
        const divMeta = document.createElement('div');
        divMeta.classList.add('info-meta');

        const pCriacao = document.createElement('p');
        pCriacao.innerHTML = `<strong>Criação:</strong> ${dado.data_criacao}`; // Seguro pois ano_criacao é numérico/controlado

        const pDev = document.createElement('p');
        pDev.innerHTML = `<strong>Desenvolvedor:</strong> ${dado.desenvolvedor}`; // Seguro pois assumimos controle do JSON, mas textContent seria mais estrito

        divMeta.append(pCriacao, pDev);

        // Tags
        let divTags = null;
        if (dado.tags && dado.tags.length) {
            divTags = document.createElement('div');
            divTags.classList.add('tags');
            dado.tags.forEach(tag => {
                const span = document.createElement('span');
                span.classList.add('tag');
                span.textContent = tag;
                span.dataset.tag = tag; // Útil para o event delegation
                span.setAttribute('role', 'button'); // Acessibilidade
                span.setAttribute('tabindex', '0'); // Acessibilidade
                divTags.appendChild(span);
            });
        }

        // Botão Saiba Mais (Agora abre modal)
        const btn = document.createElement('button');
        btn.textContent = "Saiba mais";
        btn.classList.add('btn-saiba-mais'); // Classe para estilo se precisar, mas vamos usar o estilo do 'a'
        // Vamos estilizar como o link anterior
        btn.style.cssText = `
            margin-top: auto;
            display: inline-block;
            text-decoration: none;
            color: var(--cp-neon-cyan);
            font-family: 'Courier New', monospace;
            font-weight: bold;
            letter-spacing: 1px;
            border: 1px solid var(--cp-neon-cyan);
            padding: 0.8rem 1.5rem;
            width: fit-content;
            transition: all 0.3s ease;
            text-transform: uppercase;
            position: relative;
            overflow: hidden;
            z-index: 1;
            background: transparent;
            cursor: pointer;
        `;

        // Efeito hover via JS ou CSS global? Melhor CSS global, mas aqui inline para garantir compatibilidade rápida
        btn.onmouseenter = () => {
            btn.style.color = '#000';
            btn.style.background = 'var(--cp-neon-cyan)';
            btn.style.boxShadow = '0 0 20px var(--cp-neon-cyan)';
        };
        btn.onmouseleave = () => {
            btn.style.color = 'var(--cp-neon-cyan)';
            btn.style.background = 'transparent';
            btn.style.boxShadow = 'none';
        };

        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Evita bolha se tiver click no card
            abrirDetalhes(dado);
        });

        // Montagem do card
        article.append(icon, h2, pDesc, divMeta);
        if (divTags) article.appendChild(divTags);
        article.appendChild(btn);

        return article;
    };

    const renderizar = (lista) => {
        // Limpa o container de forma segura
        DOM.container.innerHTML = '';

        // Atualiza contador
        DOM.contador.textContent = `${lista.length} ${lista.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}`;

        if (lista.length === 0) {
            const msg = document.createElement('p');
            msg.style.cssText = "color: var(--cp-neon-cyan); text-align: center;";
            msg.textContent = "Nenhum resultado encontrado.";
            DOM.container.appendChild(msg);
            return;
        }

        // DocumentFragment: Insere tudo de uma vez no DOM (Muito mais rápido)
        const fragment = document.createDocumentFragment();
        lista.forEach(item => fragment.appendChild(criarCard(item)));
        DOM.container.appendChild(fragment);
    };

    const processarDados = () => {
        const termo = DOM.inputBusca.value.toLowerCase();
        const criterio = DOM.selectOrdenacao.value;
        const categoria = state.categoriaSelecionada;

        // Filtrar
        let resultados = state.dados.filter(dado => {
            // Filtro de Texto
            const matchTexto = dado.nome.toLowerCase().includes(termo) ||
                dado.descricao.toLowerCase().includes(termo) ||
                (dado.tags && dado.tags.some(tag => tag.toLowerCase().includes(termo)));

            // Filtro de Categoria
            let matchCategoria = true;
            if (categoria !== 'todos') {
                const tagsCategoria = CATEGORIAS[categoria];
                if (tagsCategoria) {
                    matchCategoria = dado.tags && dado.tags.some(tag => tagsCategoria.includes(tag));
                }
            }

            return matchTexto && matchCategoria;
        });

        // Ordenar
        resultados.sort((a, b) => {
            if (criterio === 'titulo') return a.nome.localeCompare(b.nome);
            if (criterio === 'ano_criacao') return b.data_criacao - a.data_criacao; // Decrescente
            if (criterio === 'ano_criacao_asc') return a.data_criacao - b.data_criacao; // Crescente
            return 0;
        });

        renderizar(resultados);
    };

    const setupListeners = () => {
        // Busca em tempo real
        DOM.inputBusca.addEventListener('input', processarDados);

        // Botão Pesquisar (opcional com input event, mas bom ter)
        DOM.btnSearch.addEventListener('click', processarDados);

        // Ordenação
        DOM.selectOrdenacao.addEventListener('change', processarDados);

        // Limpar
        DOM.btnClear.addEventListener('click', () => {
            DOM.inputBusca.value = '';
            processarDados();
        });

        // Categorias
        DOM.botoesCategoria.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active de todos
                DOM.botoesCategoria.forEach(b => b.classList.remove('active'));
                // Adiciona active ao clicado
                btn.classList.add('active');
                // Atualiza estado
                state.categoriaSelecionada = btn.dataset.category;
                // Reprocessa
                processarDados();
            });
        });

        // Event Delegation para as Tags (Performance)
        // Ao invés de um listener por tag, usamos um no container pai
        DOM.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('tag')) {
                DOM.inputBusca.value = e.target.dataset.tag;
                processarDados();
            }
        });

        // Acessibilidade para Tags (Enter key)
        DOM.container.addEventListener('keydown', (e) => {
            if (e.target.classList.contains('tag') && e.key === 'Enter') {
                DOM.inputBusca.value = e.target.dataset.tag;
                processarDados();
            }
        });

        // Listeners do Modal
        DOM_MODAL.btnVoltarTop.addEventListener('click', fecharDetalhes);
        DOM_MODAL.overlay.addEventListener('click', (e) => {
            if (e.target === DOM_MODAL.overlay || e.target.classList.contains('modal-overlay-bg')) {
                fecharDetalhes();
            }
        });
        // Tecla ESC para fechar
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && DOM_MODAL.overlay.classList.contains('active')) {
                fecharDetalhes();
            }
        });
    };

    const init = async () => {
        try {
            const response = await fetch('data.json');
            state.dados = await response.json();

            setupListeners();
            processarDados(); // Render inicial
        } catch (error) {
            console.error('Erro crítico na aplicação:', error);
            // Tenta buscar no caminho relativo caso o servidor esteja na raiz
            try {
                const response = await fetch('docs/data.json');
                state.dados = await response.json();
                setupListeners();
                processarDados();
            } catch (e) {
                DOM.container.innerHTML = '<p style="color: var(--cp-neon-pink); text-align: center;">Erro ao carregar dados. Verifique o console.</p>';
            }
        }
    };

    // Inicializa quando o DOM estiver pronto
    document.addEventListener('DOMContentLoaded', init);

})();