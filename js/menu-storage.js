/*
 * Camada de persistência (DEMO, apenas front-end).
 * Guarda o cardápio editado pelo painel no localStorage.
 * Carregar DEPOIS de dados.js e ANTES de app.js.
 */
var MenuStore = (function () {

    var CHAVE = 'cardapio_menu';
    var PADRAO = JSON.parse(JSON.stringify(MENU));

    function clonar(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    // retorna o cardápio completo (inclui itens inativos) - usado no painel
    function carregar() {
        try {
            var salvo = localStorage.getItem(CHAVE);
            if (salvo) {
                return JSON.parse(salvo);
            }
        } catch (e) { }
        return clonar(PADRAO);
    }

    function salvar(menu) {
        localStorage.setItem(CHAVE, JSON.stringify(menu));
    }

    function restaurar() {
        localStorage.removeItem(CHAVE);
        return clonar(PADRAO);
    }

    // retorna apenas itens ativos - usado no site público
    function publico() {
        var menu = carregar();
        var resultado = {};
        for (var cat in menu) {
            resultado[cat] = [];
            for (var i = 0; i < menu[cat].length; i++) {
                if (menu[cat][i].ativo !== false) {
                    resultado[cat].push(menu[cat][i]);
                }
            }
        }
        return resultado;
    }

    return {
        carregar: carregar,
        salvar: salvar,
        restaurar: restaurar,
        publico: publico
    };

})();

// o site público passa a usar o cardápio salvo pelo painel
MENU = MenuStore.publico();

