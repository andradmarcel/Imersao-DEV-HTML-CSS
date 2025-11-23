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

    // Elementos do Modal (Atualizado com novos campos)
    const DOM_MODAL = {
        overlay: document.getElementById('modal-detalhes'),
        btnVoltarTop: document.getElementById('btn-voltar-top'),
        icon: document.getElementById('modal-icon'),
        titulo: document.getElementById('modal-titulo'),
        criacao: document.querySelector('#modal-criacao .text'),
        dev: document.querySelector('#modal-dev .text'),
        // Novos campos adicionados
        licenca: document.querySelector('#modal-licenca .text'),
        popularidade: document.querySelector('#modal-popularidade .text'),
        casosUso: document.getElementById('modal-casos-uso'),

        descricao: document.getElementById('modal-descricao'),
        codigo: document.getElementById('modal-codigo'),
        tags: document.getElementById('modal-tags'),
        links: document.getElementById('modal-links'),
        relacionados: document.getElementById('modal-relacionados')
    };

    // Função para abrir o modal
    const abrirDetalhes = (dado) => {
        console.log('Abrindo detalhes para:', dado.nome);

        // Popula os dados básicos
        DOM_MODAL.icon.className = dado.icon;
        DOM_MODAL.titulo.textContent = dado.nome;
        DOM_MODAL.criacao.textContent = `Criado em ${dado.data_criacao}`;
        DOM_MODAL.dev.textContent = `Desenvolvido por ${dado.desenvolvedor}`;

        // Popula Novos Dados (Metadados)
        DOM_MODAL.licenca.textContent = dado.licenca || 'N/A';
        DOM_MODAL.popularidade.textContent = dado.popularidade || 'Desconhecida';

        // Lógica da Descrição (Detalhada ou Fallback)
        // Usamos innerHTML para permitir formatação básica se vier do JSON
        DOM_MODAL.descricao.innerHTML = dado.descricao_detalhada || dado.descricao;

        DOM_MODAL.codigo.textContent = dado.exemplo_codigo || '// Código não disponível';

        // Renderiza Casos de Uso (Novo)
        DOM_MODAL.casosUso.innerHTML = '';
        if (dado.casos_uso && dado.casos_uso.length) {
            dado.casos_uso.forEach(uso => {
                const span = document.createElement('span');
                span.className = 'use-case-tag'; // Classe CSS que criamos
                span.textContent = uso;
                DOM_MODAL.casosUso.appendChild(span);
            });
        } else {
            DOM_MODAL.casosUso.innerHTML = '<span style="color: var(--cp-text-dim); font-size: 0.9rem;">Uso geral</span>';
        }

        // Tags
        DOM_MODAL.tags.innerHTML = '';
        if (dado.tags) {
            dado.tags.forEach(tag => {
                const span = document.createElement('span');
                span.classList.add('tag');
                span.textContent = tag;
                // Adicionando atributos para funcionalidade de clique
                span.dataset.tag = tag;
                span.setAttribute('role', 'button');
                span.setAttribute('tabindex', '0');
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

                // Fallback seguro para a descrição no card relacionado
                const descCurta = techRelacionada
                    ? (techRelacionada.descricao.substring(0, 60) + '...')
                    : 'Ver detalhes';

                div.innerHTML = `
                    <h4>${nomeTech}</h4>
                    <p>${descCurta}</p>
                    <i class="fas fa-arrow-right arrow"></i>
                `;

                // Click para abrir a relacionada
                div.addEventListener('click', () => {
                    if (techRelacionada) {
                        // Pequeno delay para transição suave entre modais
                        DOM_MODAL.overlay.classList.remove('active');
                        setTimeout(() => {
                            abrirDetalhes(techRelacionada);
                        }, 200);
                    } else {
                        // Tenta buscar no state caso o nome não seja exato
                        const found = state.dados.find(d => d.nome.toLowerCase() === nomeTech.toLowerCase());
                        if (found) abrirDetalhes(found);
                    }
                });

                DOM_MODAL.relacionados.appendChild(div);
            });
        }

        // Mostra o modal
        DOM_MODAL.overlay.classList.remove('hidden');
        // Pequeno delay para a transição CSS funcionar
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

    // Função segura para criar cards
    const criarCard = (dado) => {
        const article = document.createElement('article');
        article.classList.add('card');

        // Ícone
        const icon = document.createElement('i');
        icon.className = dado.icon;
        icon.setAttribute('aria-hidden', 'true');

        // Título
        const h2 = document.createElement('h2');
        h2.textContent = dado.nome;

        // Descrição (sempre usa a curta no card para manter padrão visual)
        const pDesc = document.createElement('p');
        pDesc.textContent = dado.descricao;

        // Meta Info
        const divMeta = document.createElement('div');
        divMeta.classList.add('info-meta');

        const pCriacao = document.createElement('p');
        pCriacao.innerHTML = `<strong>Criação:</strong> ${dado.data_criacao}`;

        const pDev = document.createElement('p');
        // Usando createTextNode para mais segurança (Best Practice)
        const strongDev = document.createElement('strong');
        strongDev.textContent = 'Dev: ';
        pDev.appendChild(strongDev);
        pDev.appendChild(document.createTextNode(dado.desenvolvedor));

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
                span.dataset.tag = tag;
                span.setAttribute('role', 'button');
                span.setAttribute('tabindex', '0');
                divTags.appendChild(span);
            });
        }

        // Botão Saiba Mais
        const btn = document.createElement('button');
        btn.textContent = "Saiba mais";
        btn.classList.add('btn-saiba-mais');

        // Estilo inline mantido para garantir compatibilidade imediata
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
            e.stopPropagation();
            abrirDetalhes(dado);
        });

        // Montagem do card
        article.append(icon, h2, pDesc, divMeta);
        if (divTags) article.appendChild(divTags);
        article.appendChild(btn);

        return article;
    };

    const renderizar = (lista) => {
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
            // Filtro de Texto (Nome, Descrição ou Tags)
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

    // Função de Debounce para otimizar a busca
    const debounce = (func, wait) => {
        let timeout;
        return function (...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    };

    const setupListeners = () => {
        // Busca em tempo real (com Debounce de 300ms)
        DOM.inputBusca.addEventListener('input', debounce(processarDados, 300));

        // Botão Pesquisar
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
                DOM.botoesCategoria.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.categoriaSelecionada = btn.dataset.category;
                processarDados();
            });
        });

        // Event Delegation para as Tags (Container Principal)
        DOM.container.addEventListener('click', (e) => {
            const tagElement = e.target.closest('.tag');
            if (tagElement) {
                DOM.inputBusca.value = tagElement.dataset.tag;
                processarDados();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });

        // Event Delegation para as Tags do Modal
        DOM_MODAL.tags.addEventListener('click', (e) => {
            if (e.target.classList.contains('tag')) {
                fecharDetalhes();
                DOM.inputBusca.value = e.target.dataset.tag;
                processarDados();
                window.scrollTo({ top: 0, behavior: 'smooth' });
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
            // Tenta carregar data.json
            // Nota: Se estiver usando GitHub Pages na pasta docs, o caminho pode precisar de ajuste dependendo de onde o index está.
            // Como os arquivos estão na mesma pasta (docs/), 'data.json' deve funcionar.
            const response = await fetch('data.json');
            if (!response.ok) throw new Error('Falha na rede');

            state.dados = await response.json();

            setupListeners();
            processarDados(); // Render inicial
        } catch (error) {
            console.error('Erro crítico na aplicação:', error);
            DOM.container.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <p style="color: var(--cp-neon-pink); font-size: 1.2rem;">
                        <i class="fas fa-exclamation-triangle"></i> Erro ao carregar dados.
                    </p>
                    <p style="color: var(--cp-text-dim);">Verifique se o arquivo data.json está na mesma pasta ou check o console.</p>
                </div>
            `;
        }
    };

    // Inicializa quando o DOM estiver pronto
    document.addEventListener('DOMContentLoaded', init);

})();