$(document).ready(function () {
    painel.init();
});

var painel = {

    menu: {},
    categoria: 'todos',
    busca: '',
    excluindo: null,

    categorias: {
        burgers: 'Burgers',
        pizzas: 'Pizzas',
        churrasco: 'Churrasco',
        steaks: 'Steaks',
        bebidas: 'Bebidas',
        sobremesas: 'Sobremesas'
    },

    init: function () {
        painel.menu = MenuStore.carregar();
        painel.montarAbas();
        painel.montarSelectCategorias();
        painel.renderizar();

        $("#txtBusca").on('input', function () {
            painel.busca = $(this).val().toLowerCase();
            painel.renderizar();
        });

        $("#btnNovo").on('click', function () { painel.abrirModal(null, null); });
        $("#btnCancelar").on('click', function () { $("#modalItem").addClass('hidden'); });
        $("#btnSalvar").on('click', painel.salvar);

        $("#btnCancelarExcluir").on('click', function () { $("#modalExcluir").addClass('hidden'); });
        $("#btnConfirmarExcluir").on('click', painel.confirmarExclusao);

        $("#btnRestaurar").on('click', function () {
            if (confirm('Restaurar o cardápio original? As alterações feitas serão perdidas.')) {
                painel.menu = MenuStore.restaurar();
                painel.renderizar();
                painel.mensagem('Cardápio restaurado.', 'green');
            }
        });

        $("#fileImagem").on('change', painel.lerImagem);
        $("#txtImagem").on('input', function () { painel.preview($(this).val()); });

        // delegação de eventos da tabela
        $("#listaItens").on('click', '.btn-editar', function () {
            painel.abrirModal($(this).data('cat'), $(this).data('id'));
        });
        $("#listaItens").on('click', '.btn-excluir-item', function () {
            painel.pedirExclusao($(this).data('cat'), $(this).data('id'));
        });
        $("#listaItens").on('change', '.chk-ativo', function () {
            painel.alternarAtivo($(this).data('cat'), $(this).data('id'), $(this).is(':checked'));
        });
        $("#abasCategorias").on('click', 'a', function () {
            painel.categoria = $(this).data('cat');
            painel.montarAbas();
            painel.renderizar();
        });
    },

    montarAbas: function () {
        var html = painel.aba('todos', 'Todos');
        $.each(painel.categorias, function (chave, nome) {
            html += painel.aba(chave, nome);
        });
        $("#abasCategorias").html(html);
    },

    aba: function (chave, nome) {
        var ativo = painel.categoria === chave ? ' active' : '';
        return '<a href="javascript:void(0)" data-cat="' + chave + '" class="btn btn-white btn-sm' + ativo + '">' + nome + '</a>';
    },

    montarSelectCategorias: function () {
        var html = '';
        $.each(painel.categorias, function (chave, nome) {
            html += '<option value="' + chave + '">' + nome + '</option>';
        });
        $("#selCategoria").html(html);
    },

    formatarPreco: function (v) {
        return 'R$ ' + Number(v).toFixed(2).replace('.', ',');
    },

    // caminhos relativos (./img/...) partem da raiz do site; no painel precisam de ../
    src: function (img) {
        if (img && img.indexOf('./') === 0) { return '.' + img; }
        return img || '';
    },

    escapar: function (t) {
        return $('<div/>').text(t == null ? '' : t).html();
    },

    renderizar: function () {
        var html = '';
        var total = 0;

        $.each(painel.menu, function (cat, itens) {
            if (painel.categoria !== 'todos' && painel.categoria !== cat) { return; }

            $.each(itens, function (i, item) {
                var texto = (item.name + ' ' + (item.dsc || '')).toLowerCase();
                if (painel.busca && texto.indexOf(painel.busca) === -1) { return; }

                total++;
                var ativo = item.ativo !== false;

                html += '<tr class="' + (ativo ? '' : 'inativo') + '">' +
                    '<td><img src="' + painel.escapar(painel.src(item.img)) + '" onerror="this.style.visibility=\'hidden\'" /></td>' +
                    '<td><b>' + painel.escapar(item.name) + '</b><br><small>' + painel.escapar(painel.categorias[cat] || cat) + '</small></td>' +
                    '<td class="col-dsc">' + painel.escapar(item.dsc) + '</td>' +
                    '<td><b>' + painel.formatarPreco(item.price) + '</b></td>' +
                    '<td class="text-center"><input type="checkbox" class="chk-ativo" data-cat="' + cat + '" data-id="' + painel.escapar(item.id) + '" ' + (ativo ? 'checked' : '') + ' /></td>' +
                    '<td class="text-center">' +
                    '<span class="btn-icone btn-editar" title="Editar" data-cat="' + cat + '" data-id="' + painel.escapar(item.id) + '"><i class="fas fa-pencil-alt"></i></span>' +
                    '<span class="btn-icone excluir btn-excluir-item" title="Excluir" data-cat="' + cat + '" data-id="' + painel.escapar(item.id) + '"><i class="fas fa-trash-alt"></i></span>' +
                    '</td></tr>';
            });
        });

        $("#listaItens").html(html);
        if (total === 0) { $("#listaVazia").removeClass('hidden'); } else { $("#listaVazia").addClass('hidden'); }
    },

    localizar: function (cat, id) {
        var lista = painel.menu[cat] || [];
        for (var i = 0; i < lista.length; i++) {
            if (lista[i].id === id) { return i; }
        }
        return -1;
    },

    abrirModal: function (cat, id) {
        $("#fileImagem").val('');

        if (id) {
            var idx = painel.localizar(cat, id);
            var item = painel.menu[cat][idx];
            $("#tituloModal").text('Editar item');
            $("#itemIdOriginal").val(item.id);
            $("#itemCategoriaOriginal").val(cat);
            $("#selCategoria").val(cat);
            $("#txtNome").val(item.name);
            $("#txtDescricao").val(item.dsc);
            $("#txtPreco").val(Number(item.price).toFixed(2).replace('.', ','));
            $("#txtImagem").val(item.img && item.img.indexOf('data:') === 0 ? '' : item.img);
            $("#chkAtivo").prop('checked', item.ativo !== false);
            painel.preview(item.img);
            painel.imagemBase64 = item.img && item.img.indexOf('data:') === 0 ? item.img : null;
        } else {
            $("#tituloModal").text('Novo item');
            $("#itemIdOriginal").val('');
            $("#itemCategoriaOriginal").val('');
            $("#selCategoria").val(painel.categoria !== 'todos' ? painel.categoria : 'burgers');
            $("#txtNome, #txtDescricao, #txtPreco, #txtImagem").val('');
            $("#chkAtivo").prop('checked', true);
            painel.preview('');
            painel.imagemBase64 = null;
        }

        $("#modalItem").removeClass('hidden');
        $("#txtNome").focus();
    },

    preview: function (src) {
        if (src) { $("#previewImagem").attr('src', painel.src(src)).removeClass('hidden'); }
        else { $("#previewImagem").addClass('hidden'); }
    },

    // lê a imagem escolhida e reduz (máx. 400px) para caber no localStorage
    lerImagem: function () {
        var arquivo = this.files[0];
        if (!arquivo) { return; }

        var leitor = new FileReader();
        leitor.onload = function (e) {
            var img = new Image();
            img.onload = function () {
                var max = 400;
                var escala = Math.min(1, max / Math.max(img.width, img.height));
                var canvas = document.createElement('canvas');
                canvas.width = Math.round(img.width * escala);
                canvas.height = Math.round(img.height * escala);
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);

                painel.imagemBase64 = canvas.toDataURL('image/jpeg', 0.8);
                $("#txtImagem").val('');
                painel.preview(painel.imagemBase64);
            };
            img.src = e.target.result;
        };
        leitor.readAsDataURL(arquivo);
    },

    gerarId: function (nome) {
        var slug = nome.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        return (slug || 'item') + '-' + Date.now().toString(36);
    },

    salvar: function () {
        var nome = $.trim($("#txtNome").val());
        var dsc = $.trim($("#txtDescricao").val());
        var preco = parseFloat(($("#txtPreco").val() || '').replace(/\./g, '').replace(',', '.'));
        var cat = $("#selCategoria").val();
        var img = painel.imagemBase64 || $.trim($("#txtImagem").val());

        if (!nome) { painel.mensagem('Informe o nome do item.'); $("#txtNome").focus(); return; }
        if (isNaN(preco) || preco < 0) { painel.mensagem('Informe um preço válido.'); $("#txtPreco").focus(); return; }
        if (!img) { painel.mensagem('Informe uma imagem (arquivo ou URL).'); return; }

        var idOriginal = $("#itemIdOriginal").val();
        var catOriginal = $("#itemCategoriaOriginal").val();

        var item = {
            id: idOriginal || painel.gerarId(nome),
            img: img,
            name: nome,
            dsc: dsc,
            price: preco,
            ativo: $("#chkAtivo").is(':checked')
        };

        if (idOriginal) {
            // remove da categoria antiga (permite trocar de categoria)
            var idx = painel.localizar(catOriginal, idOriginal);
            if (catOriginal === cat && idx >= 0) {
                painel.menu[cat][idx] = item;
            } else {
                if (idx >= 0) { painel.menu[catOriginal].splice(idx, 1); }
                painel.menu[cat].push(item);
            }
        } else {
            if (!painel.menu[cat]) { painel.menu[cat] = []; }
            painel.menu[cat].push(item);
        }

        if (!painel.persistir()) { return; }

        $("#modalItem").addClass('hidden');
        painel.renderizar();
        painel.mensagem(idOriginal ? 'Item atualizado.' : 'Item adicionado.', 'green');
    },

    alternarAtivo: function (cat, id, ativo) {
        var idx = painel.localizar(cat, id);
        if (idx >= 0) {
            painel.menu[cat][idx].ativo = ativo;
            painel.persistir();
            painel.renderizar();
        }
    },

    pedirExclusao: function (cat, id) {
        var idx = painel.localizar(cat, id);
        if (idx < 0) { return; }
        painel.excluindo = { cat: cat, id: id };
        $("#lblExcluir").text(painel.menu[cat][idx].name);
        $("#modalExcluir").removeClass('hidden');
    },

    confirmarExclusao: function () {
        var e = painel.excluindo;
        if (e) {
            var idx = painel.localizar(e.cat, e.id);
            if (idx >= 0) { painel.menu[e.cat].splice(idx, 1); }
            painel.persistir();
            painel.renderizar();
            painel.mensagem('Item excluído.', 'green');
        }
        painel.excluindo = null;
        $("#modalExcluir").addClass('hidden');
    },

    persistir: function () {
        try {
            MenuStore.salvar(painel.menu);
            return true;
        } catch (e) {
            painel.mensagem('Sem espaço no navegador. Use uma imagem menor ou uma URL.');
            return false;
        }
    },

    mensagem: function (texto, cor) {
        var id = 'msg-' + Date.now();
        $("#container-mensagens").append('<div id="' + id + '" class="animated fadeInDown toast ' + (cor || 'red') + '">' + texto + '</div>');
        setTimeout(function () {
            $("#" + id).removeClass('fadeInDown').addClass('fadeOutUp');
            setTimeout(function () { $("#" + id).remove(); }, 800);
        }, 3000);
    }

};

