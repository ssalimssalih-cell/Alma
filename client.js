// ==================== CLIENT.JS - ALMA COFFEE SHOP ====================
var clientCart = [];
var clientCategoriesList = [];
var clientProductsList = [];
var clientSelectedCategory = 'all';
var clientCurrentProductId = null;

var clientEpicesList = ['Normal', 'Moins épicé', 'Très épicé', 'Sans épice'];
var clientSelList = ['Normal', 'Moins de sel', 'Sans sel'];

var allStockData = [];

function clientNavigate(page) {
    var items = document.querySelectorAll('#clientPage .nav-item');
    items.forEach(function(item) { item.classList.remove('active'); });
    if (page === 'commander' && items[0]) items[0].classList.add('active');
    else if (page === 'historique' && items[1]) items[1].classList.add('active');
    else if (items[2]) items[2].classList.add('active');
    document.getElementById('clientPageTitle').textContent = page === 'commander' ? 'Commander' : page === 'historique' ? 'Mon historique' : 'Paramètres';
    if (page === 'commander') loadClientCommanderPage();
    else if (page === 'historique') loadClientHistoriquePage();
    else loadClientParametresPage();
}

// ==================== PAGE COMMANDER ====================
async function loadClientCommanderPage() {
    var c = document.getElementById('clientDynamicContent'); if (!c) return;
    clientCart = []; clientSelectedCategory = 'all';

    let cachedCategories = await CacheDB.getAll('categories');
    let cachedProducts = await CacheDB.getAll('products');
    if (cachedCategories.length) clientCategoriesList = cachedCategories.map(function(cat) {
        return { id: cat.id, nom: cat.nom, imageBase64: cat.imageBase64, recette: cat.recette || false };
    });
    if (cachedProducts.length) clientProductsList = cachedProducts.filter(p => p.disponible !== false);
    renderClientPOS();

    try {
        const [cs, ps] = await Promise.all([
            db.collection('categories').get(),
            db.collection('products').get()
        ]);
        clientCategoriesList = [];
        cs.forEach(d => {
            let cat = { id: d.id, nom: d.data().nom, imageBase64: d.data().imageBase64, recette: d.data().recette || false };
            clientCategoriesList.push(cat);
            CacheDB.set('categories', d.id, cat);
        });
        clientProductsList = [];
        ps.forEach(d => {
            const dd = d.data();
            if (dd.disponible !== false) {
                let prod = { id: d.id, nom: dd.nom, prixVente: dd.prixVente||0, prixPromo: dd.prixPromo||0, stock: dd.stock, categorie: dd.categorie||'', imageBase64: dd.imageBase64||'' };
                clientProductsList.push(prod);
                CacheDB.set('products', d.id, prod);
            }
        });
        renderClientPOS();
    } catch(e) { console.error('Erreur mise à jour catalogue client', e); }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function clientAddToCartOrOpenOptions(pid) {
    var p = clientProductsList.find(function(x) { return x.id === pid; });
    if (!p) return;
    if (p.stock !== undefined && p.stock <= 0) {
        alert('Rupture de stock');
        return;
    }
    var cat = clientCategoriesList.find(function(c) { return c.nom === p.categorie; });
    var isRecette = cat && cat.recette === true;

    if (isRecette) {
        clientCurrentProductId = pid;
        clientOpenOptionsModal(pid);
    } else {
        var existing = clientCart.find(function(x) { return x.id === pid; });
        if (existing) {
            if (p.stock !== undefined && existing.quantite >= p.stock) { alert('Stock insuffisant'); return; }
            existing.quantite += 1;
        } else {
            var pr = p.prixPromo && p.prixPromo > 0 ? p.prixPromo : p.prixVente;
            clientCart.push({id: p.id, nom: p.nom, prixUnitaire: pr, quantite: 1, categorie: p.categorie||'', sauces: [], interdits: [], epice: 'Normal', sel: 'Normal'});
        }
        renderClientPOS();
    }
}

async function clientOpenOptionsModal(pid) {
    var p = clientProductsList.find(function(x) { return x.id === pid; });
    if (!p) return;
    if (p.stock !== undefined && p.stock <= 0) { alert('Rupture de stock'); return; }

    if (typeof allStockData === 'undefined' || allStockData.length === 0) {
        try {
            const snap = await db.collection('stock').orderBy('nom').get();
            allStockData = [];
            snap.forEach(d => { let dd = d.data(); dd.id = d.id; allStockData.push(dd); });
        } catch(e) { console.error(e); }
    }

    try {
        const doc = await db.collection('products').doc(pid).get();
        if (doc.exists) {
            var productData = doc.data();
            var productIngredients = productData.ingredients || [];
        } else {
            var productIngredients = [];
        }
    } catch(e) { var productIngredients = []; }

    var grouped = {};
    productIngredients.forEach(function(ing) {
        var stockItem = allStockData.find(function(s) { return s.id === ing.idStock; });
        var cat = stockItem ? stockItem.categorie : 'Autre';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(ing.nom);
    });
    var order = ['Sauces', 'Légumes', 'Fruits', 'Viande', 'Poulet', 'Poisson'];
    var sortedCats = Object.keys(grouped).sort(function(a, b) {
        var idxA = order.indexOf(a), idxB = order.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
    });

    clientCurrentProductId = pid;
    var h = '<h4>' + escapeHtml(p.nom) + '</h4>';
    if (sortedCats.length === 0) {
        h += '<div style="margin-bottom:12px;color:#94a3b8;">Aucun ingrédient à exclure</div>';
    } else {
        sortedCats.forEach(function(cat) {
            h += '<div style="margin-bottom:12px;"><label style="font-weight:600;">🥫 ' + escapeHtml(cat) + '</label><div style="display:flex;flex-wrap:wrap;gap:5px;">';
            grouped[cat].forEach(function(ing) {
                h += '<label style="display:flex;align-items:center;gap:4px;padding:5px 8px;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer;font-size:0.75rem;">';
                h += '<input type="checkbox" class="client-interdit-check" value="' + escapeHtml(ing) + '"> ' + escapeHtml(ing);
                h += '</label>';
            });
            h += '</div></div>';
        });
    }

    h += '<div style="margin-bottom:12px;"><label style="font-weight:600;">🌶️ Épices:</label><div style="display:flex;flex-wrap:wrap;gap:5px;">';
    clientEpicesList.forEach(function(s, idx) {
        h += '<label style="display:flex;align-items:center;gap:4px;padding:5px 8px;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer;font-size:0.75rem;"><input type="radio" name="client-epice" value="' + s + '" ' + (idx === 0 ? 'checked' : '') + '> ' + s + '</label>';
    });
    h += '</div></div>';
    h += '<div style="margin-bottom:12px;"><label style="font-weight:600;">🧂 Sel:</label><div style="display:flex;flex-wrap:wrap;gap:5px;">';
    clientSelList.forEach(function(s, idx) {
        h += '<label style="display:flex;align-items:center;gap:4px;padding:5px 8px;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer;font-size:0.75rem;"><input type="radio" name="client-sel" value="' + s + '" ' + (idx === 0 ? 'checked' : '') + '> ' + s + '</label>';
    });
    h += '</div></div>';

    h += '<div style="text-align:right;"><button class="btn-cancel" onclick="closeModal()">Annuler</button><button class="btn-save" onclick="clientConfirmOptions()">Ajouter</button></div>';
    openModal('Personnaliser - ' + escapeHtml(p.nom), h);
}

function clientConfirmOptions() {
    var interdits = []; document.querySelectorAll('.client-interdit-check:checked').forEach(function(cb) { interdits.push(cb.value); });
    var epice = document.querySelector('input[name="client-epice"]:checked'); epice = epice ? epice.value : 'Normal';
    var sel = document.querySelector('input[name="client-sel"]:checked'); sel = sel ? sel.value : 'Normal';
    var p = clientProductsList.find(function(x) { return x.id === clientCurrentProductId; });
    if (!p) { closeModal(); return; }
    var ex = clientCart.find(function(x) { return x.id === clientCurrentProductId; });
    if (ex) {
        if (p.stock !== undefined && ex.quantite >= p.stock) { alert('Stock insuffisant'); closeModal(); return; }
        ex.quantite += 1;
    } else {
        var pr = p.prixPromo && p.prixPromo > 0 ? p.prixPromo : p.prixVente;
        clientCart.push({id: p.id, nom: p.nom, prixUnitaire: pr, quantite: 1, categorie: p.categorie||'', sauces: [], interdits: interdits, epice: epice, sel: sel});
    }
    closeModal(); renderClientPOS();
}

function renderClientPOS() {
    var c = document.getElementById('clientDynamicContent'); if (!c) return;
    var total = clientCalculateTotal();
    var h = '<div class="pos-container"><div class="pos-products-panel"><div class="pos-categories-bar"><button class="pos-cat-btn '+(clientSelectedCategory==='all'?'active':'')+'" onclick="clientFilterCategory(\'all\')"><i class="fas fa-th-large"></i> Tous</button>';
    for (var i = 0; i < clientCategoriesList.length; i++) { var ca = clientCategoriesList[i]; var ac = clientSelectedCategory===ca.nom?'active':''; var ih = ca.imageBase64?'<img src="'+escapeHtml(ca.imageBase64)+'" alt="'+escapeHtml(ca.nom)+'">':'<i class="fas fa-folder"></i>'; h += '<button class="pos-cat-btn '+ac+'" onclick="clientFilterCategory(\''+escapeHtml(ca.nom).replace(/'/g,"\\'")+'\')">'+ih+' '+escapeHtml(ca.nom)+'</button>'; }
    h += '</div><div class="pos-products-grid">';
    var f = clientProductsList; if (clientSelectedCategory!=='all') f = clientProductsList.filter(function(p){return p.categorie===clientSelectedCategory;});
    if (f.length===0) { h += '<div style="grid-column:1/-1;text-align:center;padding:40px;">Aucun produit</div>'; }
    else { for (var j = 0; j < f.length; j++) { var p = f[j]; var pr = p.prixPromo&&p.prixPromo>0?p.prixPromo:p.prixVente; var hp = p.prixPromo&&p.prixPromo>0; h += '<div class="pos-product-card" onclick="clientAddToCartOrOpenOptions(\''+p.id+'\')">'; if (p.imageBase64) h += '<div class="pos-product-img"><img src="'+escapeHtml(p.imageBase64)+'" alt="'+escapeHtml(p.nom)+'"></div>'; else h += '<div class="pos-product-img pos-product-placeholder"><i class="fas fa-coffee"></i></div>'; h += '<div class="pos-product-info"><span class="pos-product-name">'+escapeHtml(p.nom)+'</span><span class="pos-product-price">'; if (hp) h += '<span class="pos-old-price">'+p.prixVente.toFixed(2)+'</span> <span class="pos-promo-price">'+pr.toFixed(2)+' MAD</span>'; else h += pr.toFixed(2)+' MAD'; h += '</span></div></div>'; } }
    h += '</div></div><div class="pos-cart-panel"><div class="pos-cart-header"><h3><i class="fas fa-shopping-cart"></i> Mon Panier <span class="pos-cart-badge">'+clientCart.length+'</span></h3><button class="pos-clear-btn" onclick="clientClearCart()"><i class="fas fa-trash-alt"></i> Vider</button></div><div class="pos-cart-items">';
    if (clientCart.length===0) { h += '<div class="pos-cart-empty"><i class="fas fa-shopping-basket"></i><p>Panier vide</p></div>'; }
    else { for (var k = 0; k < clientCart.length; k++) { var it = clientCart[k]; var opts = ''; if (it.interdits&&it.interdits.length>0) opts += ' <span style="color:#ef4444;font-size:0.6rem;">🚫'+escapeHtml(it.interdits.join(','))+'</span>'; if (it.epice&&it.epice!=='Normal') opts += ' <span style="color:#d97706;font-size:0.6rem;">🌶️'+escapeHtml(it.epice)+'</span>'; if (it.sel&&it.sel!=='Normal') opts += ' <span style="color:#4f46e5;font-size:0.6rem;">🧂'+escapeHtml(it.sel)+'</span>'; h += '<div class="pos-cart-item"><div class="pos-cart-item-info"><span class="pos-cart-item-name">'+escapeHtml(it.nom)+opts+'</span><span class="pos-cart-item-price">'+it.prixUnitaire.toFixed(2)+' MAD/u</span></div><div class="pos-cart-item-actions"><button class="pos-qty-btn" onclick="clientUpdateQty('+k+',-1)"><i class="fas fa-minus"></i></button><span class="pos-qty-value">'+it.quantite+'</span><button class="pos-qty-btn" onclick="clientUpdateQty('+k+',1)"><i class="fas fa-plus"></i></button><button class="pos-remove-btn" onclick="clientRemoveItem('+k+')"><i class="fas fa-times"></i></button></div><span class="pos-cart-item-total">'+(it.prixUnitaire*it.quantite).toFixed(2)+' MAD</span></div>'; } }
    h += '</div><div class="pos-cart-footer"><div class="pos-cart-total-row"><span>Total</span><span>'+total.toFixed(2)+' MAD</span></div><button class="pos-validate-btn" onclick="clientValidateOrder()" '+(clientCart.length===0?'disabled':'')+'><i class="fas fa-check-circle"></i> Commander</button></div></div></div>';
    c.innerHTML = h;
}

function clientFilterCategory(ca) { clientSelectedCategory = ca; renderClientPOS(); }
function clientUpdateQty(i, ch) { var it = clientCart[i]; if (!it) return; var p = clientProductsList.find(function(x) { return x.id === it.id; }); var nq = it.quantite + ch; if (nq <= 0) clientCart.splice(i, 1); else { if (p && p.stock !== undefined && nq > p.stock) { alert('Stock max: ' + p.stock); return; } it.quantite = nq; } renderClientPOS(); }
function clientRemoveItem(i) { clientCart.splice(i, 1); renderClientPOS(); }
function clientCalculateTotal() { var t = 0; for (var i = 0; i < clientCart.length; i++) t += clientCart[i].prixUnitaire * clientCart[i].quantite; return t; }
function clientClearCart() { clientCart = []; renderClientPOS(); }

async function clientValidateOrder() {
    if (clientCart.length === 0) { alert('Votre panier est vide'); return; }
    var total = clientCalculateTotal(); var ud = window.currentUserData ? window.currentUserData.userData : {};
    var orderData = {
        items: JSON.parse(JSON.stringify(clientCart)),
        total: total,
        clientId: window.currentUserData ? window.currentUserData.uid : null,
        clientName: ud.prenom + ' ' + ud.nom,
        clientEmail: ud.email,
        clientTelephone: ud.telephone,
        statut: 'en_attente',
        source: 'client',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    await CacheDB.write('commandes', null, orderData, 'add');
    alert('✅ Commande envoyée !\nTotal: ' + total.toFixed(2) + ' MAD');
    clientCart = [];
    renderClientPOS();
    CacheDB.sync();
}
