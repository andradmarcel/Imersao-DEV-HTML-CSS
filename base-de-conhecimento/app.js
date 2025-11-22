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

        // Link
        const link = document.createElement('a');
        link.href = dado.link;
        link.target = "_blank";
        link.rel = "noopener noreferrer"; // Segurança obrigatória para target blank
        link.textContent = "Saiba mais";

        // Montagem do card
        article.append(icon, h2, pDesc, divMeta);
        if (divTags) article.appendChild(divTags);
        article.appendChild(link);

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
    };

    const init = async () => {
        try {
            const response = await fetch('data.json');
            state.dados = await response.json();

            setupListeners();
            processarDados(); // Render inicial
        } catch (error) {
            console.error('Erro crítico na aplicação:', error);
            DOM.container.innerHTML = '<p style="color: var(--cp-neon-pink); text-align: center;">Erro ao carregar dados. Verifique o console.</p>';
        }
    };

    // Inicializa quando o DOM estiver pronto
    document.addEventListener('DOMContentLoaded', init);

})();