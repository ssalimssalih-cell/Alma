// ==================== CLIENT.JS - ALMA COFFEE SHOP (PARTIE 2) ====================

async function loadClientHistoriquePage() {
    var c = document.getElementById('clientDynamicContent'); if (!c) return;
    c.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-history"></i> Mon historique</h3></div><div id="clientOrdersList" style="text-align:center;padding:20px;">Chargement...</div></div>';
    if (!window.currentUserData) { var cont0 = document.getElementById('clientOrdersList'); if (cont0) cont0.innerHTML = '<p>Non connecté</p>'; return; }
    var uid = window.currentUserData.uid, clientName = (window.currentUserData.userData.prenom + ' ' + window.currentUserData.userData.nom).toLowerCase().trim(), clientEmail = (window.currentUserData.userData.email || '').toLowerCase().trim(), clientTelephone = (window.currentUserData.userData.telephone || '').trim();
    try {
        let cmdSnap, venteSnap;
        try {
            cmdSnap = await db.collection('commandes').where('clientId', '==', uid).get();
            venteSnap = await db.collection('ventes').where('clientId', '==', uid).get();
        } catch(e) {
            cmdSnap = await db.collection('commandes').get();
            venteSnap = await db.collection('ventes').get();
        }
        var all = [];
        cmdSnap.forEach(function(d) { var cmd = d.data(); if (cmd.clientId === uid) all.push({type: 'commande', data: cmd, date: cmd.createdAt}); });
        venteSnap.forEach(function(d) { var v = d.data(); if (v.clientId === uid) all.push({type: 'vente', data: v, date: v.createdAt}); });
        all.sort(function(a, b) { return (b.date?.seconds || 0) - (a.date?.seconds || 0); }); all = all.slice(0, 50);
        var cont = document.getElementById('clientOrdersList'); if (!cont) return;
        if (all.length === 0) { cont.innerHTML = '<p style="padding:40px;color:#94a3b8;"><i class="fas fa-inbox" style="font-size:2rem;display:block;margin-bottom:10px;"></i>Aucun historique</p>'; return; }
        var h = '<div class="table-container"><table class="data-table" style="font-size:0.75rem;"><thead><tr><th>Date</th><th>Type</th><th>N° Facture</th><th>Articles</th><th>Total</th><th>Vendeur</th><th>Paiement</th><th>Statut</th></tr></thead><tbody>';
        all.forEach(function(item) { var d = item.data, date = d.createdAt ? new Date(d.createdAt.seconds * 1000).toLocaleString('fr-FR') : '', type = item.type === 'commande' ? '<span class="status-warning">🛒 Commande</span>' : '<span style="color:#A67C52;">💰 Vente</span>', facture = d.factureNum || '-', arts = d.items ? d.items.map(function(it) { return it.quantite + 'x ' + escapeHtml(it.nom); }).join('<br>') : '-', vendeur = d.vendeur || d.createdBy || '-', paiement = d.paymentMethod === 'espece' ? 'Espèces' : d.paymentMethod === 'credit' ? 'Crédit' : d.paymentMethod === 'partiel' ? 'Partiel' : '-', statut = item.type === 'commande' ? (d.statut === 'valide' ? '✅ Validée' : d.statut === 'payé' ? '💵 Payée' : '⏳ En attente') : (d.paid ? '✅ Payé' : d.statutPaiement === 'crédit' ? '📋 Crédit' : d.statutPaiement === 'partiel' ? '🔶 Partiel' : '⏳ En attente'), sc = (statut.includes('✅') || statut.includes('💵')) ? '#16a34a' : '#d97706'; h += '<tr><td>' + date + '</td><td>' + type + '</td><td><small>' + facture + '</small></td><td><small>' + arts + '</small><td><strong>' + (d.total || 0).toFixed(2) + ' MAD</strong></td><td>' + vendeur + '</td><td>' + paiement + '</td><td><span style="color:' + sc + ';">' + statut + '</span></td></tr>'; });
        h += '</tbody></table></div>'; cont.innerHTML = h;
    } catch(e) { var cont2 = document.getElementById('clientOrdersList'); if (cont2) cont2.innerHTML = '<p style="color:#ef4444;">Erreur</p>'; }
}

async function loadClientParametresPage() {
    var c = document.getElementById('clientDynamicContent');
    if (!c) return;
    if (!window.currentUserData) { c.innerHTML = '<div class="content-card"><p>Non connecté</p></div>'; return; }
    var clientData = null;
    var clientDocId = null;
    var userEmail = window.currentUserData.userData.email;
    try {
        var clientSnap = await db.collection('clients').where('email', '==', userEmail).get();
        if (!clientSnap.empty) { clientDocId = clientSnap.docs[0].id; clientData = clientSnap.docs[0].data(); }
    } catch(e) { console.error('Erreur chargement profil:', e); }
    if (!clientData) clientData = window.currentUserData.userData;
    var dateCreated = clientData.createdAt ? new Date(clientData.createdAt.seconds * 1000).toLocaleString('fr-FR') : 'N/A';
    var h = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-user-circle"></i> Mon Profil</h3></div>';
    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:0.9rem;">';
    h += '<div><strong>ID:</strong> ' + (clientDocId ? clientDocId.substring(0, 8) : 'N/A') + '</div>';
    h += '<div><strong>Nom:</strong> ' + escapeHtml(clientData.nom || '') + '</div>';
    h += '<div><strong>Prénom:</strong> ' + escapeHtml(clientData.prenom || '') + '</div>';
    h += '<div><strong>Username:</strong> @' + escapeHtml(clientData.username || '') + '</div>';
    h += '<div><strong>Genre:</strong> ' + escapeHtml(clientData.genre || '-') + '</div>';
    h += '<div><strong>Adresse:</strong> ' + escapeHtml(clientData.adresse || '-') + '</div>';
    h += '<div><strong>Email:</strong> ' + escapeHtml(clientData.email || '') + '</div>';
    h += '<div><strong>Tél:</strong> ' + escapeHtml(clientData.telephone || '-') + '</div>';
    h += '<div><strong>WhatsApp:</strong> ' + escapeHtml(clientData.whatsapp || '-') + '</div>';
    h += '<div><strong>Facebook:</strong> ' + escapeHtml(clientData.facebook || '-') + '</div>';
    h += '<div><strong>Instagram:</strong> ' + escapeHtml(clientData.instagram || '-') + '</div>';
    h += '<div><strong>Points Fidélité:</strong> ' + (clientData.pointsFidelite || 0) + '</div>';
    h += '<div><strong>Allergies:</strong> ' + (clientData.allergies ? clientData.allergies.join(', ') : '-') + '</div>';
    h += '<div><strong>Aime:</strong> ' + (clientData.aime ? clientData.aime.join(', ') : '-') + '</div>';
    h += '<div><strong>Déteste:</strong> ' + (clientData.deteste ? clientData.deteste.join(', ') : '-') + '</div>';
    h += '<div><strong>Date créé:</strong> ' + dateCreated + '</div>';
    h += '</div>';
    h += '<div style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap;">';
    h += '<button class="btn-add" onclick="clientOpenEditProfile()"><i class="fas fa-edit"></i> Modifier mon profil</button>';
    h += '<button class="btn-save" onclick="clientOpenChangePassword()"><i class="fas fa-lock"></i> Changer mot de passe</button>';
    h += '</div>';
    h += '</div>';
    c.innerHTML = h;
    window.clientProfileData = clientData;
    window.clientProfileDocId = clientDocId;
}

function clientOpenEditProfile() {
    var data = window.clientProfileData || window.currentUserData.userData;
    var h = '';
    h += '<div class="form-row"><div class="form-group"><label>Nom *</label><input type="text" id="clientEditNom" value="' + escapeHtml(data.nom || '') + '" required></div><div class="form-group"><label>Prénom *</label><input type="text" id="clientEditPrenom" value="' + escapeHtml(data.prenom || '') + '" required></div></div>';
    h += '<div class="form-row"><div class="form-group"><label>Genre</label><select id="clientEditGenre"><option value="">-</option><option value="M" ' + (data.genre === 'M' ? 'selected' : '') + '>M</option><option value="F" ' + (data.genre === 'F' ? 'selected' : '') + '>F</option></select></div><div class="form-group"><label>Adresse</label><input type="text" id="clientEditAdresse" value="' + escapeHtml(data.adresse || '') + '"></div></div>';
    h += '<div class="form-row"><div class="form-group"><label>Téléphone</label><input type="text" id="clientEditTel" value="' + escapeHtml(data.telephone || '') + '"></div><div class="form-group"><label>WhatsApp</label><input type="text" id="clientEditWhatsapp" value="' + escapeHtml(data.whatsapp || '') + '"></div></div>';
    h += '<div class="form-row"><div class="form-group"><label>Facebook</label><input type="text" id="clientEditFacebook" value="' + escapeHtml(data.facebook || '') + '"></div><div class="form-group"><label>Instagram</label><input type="text" id="clientEditInstagram" value="' + escapeHtml(data.instagram || '') + '"></div></div>';
    h += '<div class="form-row"><div class="form-group"><label>Allergies (virgules)</label><input type="text" id="clientEditAllergies" value="' + (data.allergies ? data.allergies.join(', ') : '') + '" placeholder="gluten, lactose"></div><div class="form-group"><label>Aime (virgules)</label><input type="text" id="clientEditAime" value="' + (data.aime ? data.aime.join(', ') : '') + '" placeholder="café, thé"></div></div>';
    h += '<div class="form-row"><div class="form-group"><label>Déteste (virgules)</label><input type="text" id="clientEditDeteste" value="' + (data.deteste ? data.deteste.join(', ') : '') + '" placeholder="oignon, tomate"></div></div>';
    h += '<button class="btn-cancel" onclick="closeModal()">Annuler</button><button class="btn-save" onclick="clientSaveProfile()">Enregistrer</button>';
    openModal('✏️ Modifier mon profil', h);
}

async function clientSaveProfile() {
    var nom = document.getElementById('clientEditNom').value.trim();
    var prenom = document.getElementById('clientEditPrenom').value.trim();
    if (!nom || !prenom) { alert('Nom et Prénom obligatoires'); return; }
    var updatedData = {
        nom: nom, prenom: prenom,
        genre: document.getElementById('clientEditGenre').value,
        adresse: document.getElementById('clientEditAdresse').value,
        telephone: document.getElementById('clientEditTel').value,
        whatsapp: document.getElementById('clientEditWhatsapp').value,
        facebook: document.getElementById('clientEditFacebook').value,
        instagram: document.getElementById('clientEditInstagram').value,
        allergies: document.getElementById('clientEditAllergies').value.split(',').map(function(s) { return s.trim(); }).filter(Boolean),
        aime: document.getElementById('clientEditAime').value.split(',').map(function(s) { return s.trim(); }).filter(Boolean),
        deteste: document.getElementById('clientEditDeteste').value.split(',').map(function(s) { return s.trim(); }).filter(Boolean),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    try {
        var docId = window.clientProfileDocId;
        if (docId) {
            await CacheDB.write('clients', docId, updatedData, 'update');
            await CacheDB.write('users', window.currentUserData.uid, { nom: nom, prenom: prenom, telephone: updatedData.telephone }, 'update');
        } else {
            updatedData.email = window.currentUserData.userData.email;
            updatedData.username = window.currentUserData.userData.username;
            updatedData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            var newDocId = await CacheDB.write('clients', null, updatedData, 'add');
            window.clientProfileDocId = newDocId;
        }
        window.currentUserData.userData.nom = nom;
        window.currentUserData.userData.prenom = prenom;
        window.clientProfileData = updatedData;
        alert('✅ Profil mis à jour !');
        closeModal();
        loadClientParametresPage();
        CacheDB.sync();
    } catch(e) { alert('Erreur: ' + e.message); }
}

function clientOpenChangePassword() {
    var h = '<div class="form-row"><div class="form-group"><label>Mot de passe actuel</label><input type="password" id="clientOldPassword" required></div></div>';
    h += '<div class="form-row"><div class="form-group"><label>Nouveau mot de passe</label><input type="password" id="clientNewPassword" required minlength="6"></div></div>';
    h += '<div class="form-row"><div class="form-group"><label>Confirmer nouveau mot de passe</label><input type="password" id="clientConfirmPassword" required minlength="6"></div></div>';
    h += '<button class="btn-cancel" onclick="closeModal()">Annuler</button><button class="btn-save" onclick="clientChangePassword()">Changer le mot de passe</button>';
    openModal('🔒 Changer mot de passe', h);
}

async function clientChangePassword() {
    var oldPass = document.getElementById('clientOldPassword').value;
    var newPass = document.getElementById('clientNewPassword').value;
    var confirmPass = document.getElementById('clientConfirmPassword').value;
    if (!oldPass || !newPass || !confirmPass) { alert('Tous les champs sont obligatoires'); return; }
    if (newPass.length < 6) { alert('Le nouveau mot de passe doit contenir au moins 6 caractères'); return; }
    if (newPass !== confirmPass) { alert('Les mots de passe ne correspondent pas'); return; }
    var user = auth.currentUser;
    if (!user) { alert('Vous n\'êtes pas connecté'); return; }
    var credential = firebase.auth.EmailAuthProvider.credential(user.email, oldPass);
    try {
        await user.reauthenticateWithCredential(credential);
        await user.updatePassword(newPass);
        alert('✅ Mot de passe changé avec succès !');
        closeModal();
    } catch(e) {
        if (e.code === 'auth/wrong-password') alert('❌ Mot de passe actuel incorrect');
        else alert('Erreur: ' + e.message);
    }
}

console.log('☕ Alma Coffee Shop - Client JS prêt');
