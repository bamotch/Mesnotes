// Structure de données de l'application
let applicationData = {
    annees: {
        "Licence 2 (2026-2027)": {
            "S1": [],
            "S2": []
        }
    },
    anneeCourante: "Licence 2 (2026-2027)",
    semestreCourant: "S1"
};

let fileHandle = null; // Référence API File System Access

// Initialisation au chargement de la page
window.onload = function() {
    let savedData = localStorage.getItem("notes_app_data_v2");
    if (savedData) {
        try {
            applicationData = JSON.parse(savedData);
        } catch (e) {
            console.error("Erreur de chargement des données", e);
        }
    }
    rafraichirSelecteurs();
    afficherMatiereCourantes();
};

function sauvegarderAuto() {
    localStorage.setItem("notes_app_data_v2", JSON.stringify(applicationData));
    sauvegarderFichierLie();
}

// Gestion des niveaux / années
function ajouterAnnee() {
    let nomAnnee = prompt("Entrez le nom du niveau (ex: Licence 3, Master 1) :");
    if (nomAnnee && nomAnnee.trim() !== "") {
        nomAnnee = nomAnnee.trim();
        if (!applicationData.annees[nomAnnee]) {
            applicationData.annees[nomAnnee] = { "S1": [], "S2": [] };
        }
        applicationData.anneeCourante = nomAnnee;
        applicationData.semestreCourant = "S1";
        sauvegarderAuto();
        rafraichirSelecteurs();
        afficherMatiereCourantes();
    }
}

function rafraichirSelecteurs() {
    let selectYear = document.getElementById("yearSelect");
    selectYear.innerHTML = "";
    for (let annee in applicationData.annees) {
        let option = document.createElement("option");
        option.value = annee;
        option.textContent = annee;
        if (annee === applicationData.anneeCourante) option.selected = true;
        selectYear.appendChild(option);
    }

    let selectSem = document.getElementById("semesterSelect");
    selectSem.value = applicationData.semestreCourant;
    document.getElementById("currentSemesterLabel").textContent = applicationData.semestreCourant === "S1" ? "Semestre 1" : "Semestre 2";
}

function changerAnnee() {
    applicationData.anneeCourante = document.getElementById("yearSelect").value;
    sauvegarderAuto();
    afficherMatiereCourantes();
}

function changerSemestre() {
    applicationData.semestreCourant = document.getElementById("semesterSelect").value;
    document.getElementById("currentSemesterLabel").textContent = applicationData.semestreCourant === "S1" ? "Semestre 1" : "Semestre 2";
    sauvegarderAuto();
    afficherMatiereCourantes();
}

// Récupération des matières du semestre courant
function getMatieresCourantes() {
    let anneeObj = applicationData.annees[applicationData.anneeCourante];
    if (!anneeObj) return [];
    if (!anneeObj[applicationData.semestreCourant]) {
        anneeObj[applicationData.semestreCourant] = [];
    }
    return anneeObj[applicationData.semestreCourant];
}

// Ajout d'une matière
function ajouterMatiere(event) {
    event.preventDefault();
    let name = document.getElementById("subjectName").value.trim();
    let coef = parseFloat(document.getElementById("subjectCoef").value);
    let hasTestLourd = document.getElementById("hasTestLourd").checked;

    if (!name || isNaN(coef)) return;

    let nouvelleMatiere = {
        id: Date.now(),
        nom: name,
        coef: coef,
        hasTestLourd: hasTestLourd,
        devoirs: [],
        noteTestLourd: null,
        photoTestLourd: null
    };

    getMatieresCourantes().push(nouvelleMatiere);
    sauvegarderAuto();
    document.getElementById("addSubjectForm").reset();
    afficherMatiereCourantes();
}

function supprimerMatiere(matiereId) {
    if (confirm("Voulez-vous vraiment supprimer cette matière ?")) {
        let matieres = getMatieresCourantes();
        applicationData.annees[applicationData.anneeCourante][applicationData.semestreCourant] = matieres.filter(m => m.id !== matiereId);
        sauvegarderAuto();
        afficherMatiereCourantes();
    }
}

// Affichage dynamique des matières
function afficherMatiereCourantes() {
    let container = document.getElementById("subjectsList");
    container.innerHTML = "";
    let matieres = getMatieresCourantes();

    if (matieres.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color:var(--text-muted); padding:30px; background:#fff; border-radius:12px;">
            <i class="fa-solid fa-folder-open" style="font-size:2.5rem; margin-bottom:10px;"></i>
            <p>Aucune matière ajoutée pour ce semestre. Utilisez le formulaire ci-dessus pour commencer.</p>
        </div>`;
        return;
    }

    matieres.forEach((mat) => {
        let card = document.createElement("div");
        card.className = "card subject-card";

        let html = `
            <div>
                <div class="subject-header">
                    <span class="subject-title">${mat.nom}</span>
                    <span class="coef-badge">Coef: ${mat.coef}</span>
                </div>
                <div class="subject-type">
                    <i class="fa-solid fa-layer-group"></i> ${mat.hasTestLourd ? "Devoir(s) + Test Lourd" : "Devoirs uniquement"}
                </div>

                <!-- Section Devoirs -->
                <div class="section-title"><i class="fa-solid fa-pen"></i> Devoirs :</div>
                <div class="notes-list">`;

        mat.devoirs.forEach((d, idx) => {
            html += `
                <div class="note-row">
                    <span style="font-size:0.85rem; font-weight:600;">Devoir ${idx + 1}</span>
                    <input type="number" class="note-input" step="0.25" min="0" max="20" placeholder="--/20" value="${d.valeur !== null ? d.valeur : ''}" onchange="mettreAJourDevoir(${mat.id}, ${idx}, this.value)">
                    <div class="btn btn-secondary file-upload-btn" title="Joindre la photo de la copie">
                        <i class="fa-solid fa-camera"></i>
                        <input type="file" accept="image/*" onchange="ajouterPhotoDevoir(${mat.id}, ${idx}, event)">
                    </div>
                    ${d.photo ? `<img src="${d.photo}" class="image-preview" onclick="ouvrirImage('${d.photo}')" title="Voir la photo">` : ''}
                    <button onclick="supprimerDevoir(${mat.id}, ${idx})" class="btn btn-danger-sm" title="Supprimer ce devoir"><i class="fa-solid fa-trash"></i></button>
                </div>`;
        });

        html += `
                </div>
                <button onclick="ajouterDevoir(${mat.id})" class="btn btn-secondary btn-block" style="margin-top:10px; font-size:0.85rem;">
                    <i class="fa-solid fa-plus"></i> Ajouter un devoir
                </button>`;

        // Section Test Lourd si activée
        if (mat.hasTestLourd) {
            html += `
                <div class="section-title" style="margin-top:15px;"><i class="fa-solid fa-file-signature"></i> Test Lourd :</div>
                <div class="note-row">
                    <span style="font-size:0.85rem; font-weight:600;">Test Lourd</span>
                    <input type="number" class="note-input" step="0.25" min="0" max="20" placeholder="--/20" value="${mat.noteTestLourd !== null ? mat.noteTestLourd : ''}" onchange="mettreAJourTestLourd(${mat.id}, this.value)">
                    <div class="btn btn-secondary file-upload-btn" title="Joindre la photo de la copie">
                        <i class="fa-solid fa-camera"></i>
                        <input type="file" accept="image/*" onchange="ajouterPhotoTL(${mat.id}, event)">
                    </div>
                    ${mat.photoTestLourd ? `<img src="${mat.photoTestLourd}" class="image-preview" onclick="ouvrirImage('${mat.photoTestLourd}')" title="Voir la photo">` : ''}
                </div>`;
        }

        html += `
            </div>
            <div>
                <div class="module-avg-box">
                    Moyenne : <span id="avg-${mat.id}" class="module-avg-val">--</span> / 20
                </div>
                <button onclick="supprimerMatiere(${mat.id})" class="btn btn-danger-sm btn-block" style="margin-top:8px;">
                    <i class="fa-solid fa-trash"></i> Supprimer le module
                </button>
            </div>`;

        card.innerHTML = html;
        container.appendChild(card);
    });
}

// Fonctions de modification des devoirs / notes
function ajouterDevoir(matiereId) {
    let mat = getMatieresCourantes().find(m => m.id === matiereId);
    if (mat) {
        mat.devoirs.push({ valeur: null, photo: null });
        sauvegarderAuto();
        afficherMatiereCourantes();
    }
}

function supprimerDevoir(matiereId, idx) {
    let mat = getMatieresCourantes().find(m => m.id === matiereId);
    if (mat) {
        mat.devoirs.splice(idx, 1);
        sauvegarderAuto();
        afficherMatiereCourantes();
    }
}

function mettreAJourDevoir(matiereId, devoirIndex, valeur) {
    let mat = getMatieresCourantes().find(m => m.id === matiereId);
    if (mat) {
        mat.devoirs[devoirIndex].valeur = valeur !== "" ? parseFloat(valeur) : null;
        sauvegarderAuto();
    }
}

function mettreAJourTestLourd(matiereId, valeur) {
    let mat = getMatieresCourantes().find(m => m.id === matiereId);
    if (mat) {
        mat.noteTestLourd = valeur !== "" ? parseFloat(valeur) : null;
        sauvegarderAuto();
    }
}

// Gestion de la sauvegarde des photos en Base64
function ajouterPhotoDevoir(matiereId, idx, event) {
    let file = event.target.files[0];
    if (!file) return;
    let reader = new FileReader();
    reader.onload = function(e) {
        let mat = getMatieresCourantes().find(m => m.id === matiereId);
        if (mat) {
            mat.devoirs[idx].photo = e.target.result;
            sauvegarderAuto();
            afficherMatiereCourantes();
        }
    };
    reader.readAsDataURL(file);
}

function ajouterPhotoTL(matiereId, event) {
    let file = event.target.files[0];
    if (!file) return;
    let reader = new FileReader();
    reader.onload = function(e) {
        let mat = getMatieresCourantes().find(m => m.id === matiereId);
        if (mat) {
            mat.photoTestLourd = e.target.result;
            sauvegarderAuto();
            afficherMatiereCourantes();
        }
    };
    reader.readAsDataURL(file);
}

function ouvrirImage(dataUrl) {
    let w = window.open("");
    w.document.write(`<img src="${dataUrl}" style="max-width:100%; height:auto;">`);
}

// Algorithme de calcul
function calculerMoyenneListeMatieres(matieres) {
    let totalPoints = 0;
    let totalCoefs = 0;

    matieres.forEach((mat) => {
        let devoirsValides = mat.devoirs.map(d => d.valeur).filter(v => v !== null && !isNaN(v));
        let moyDevoirs = 0;

        if (devoirsValides.length > 0) {
            moyDevoirs = devoirsValides.reduce((a, b) => a + b, 0) / devoirsValides.length;
        } else if (mat.hasTestLourd && mat.noteTestLourd !== null) {
            // Pas de devoirs : la note du test lourd devient la note du devoir
            moyDevoirs = mat.noteTestLourd;
        }

        let moyModule = 0;

        if (!mat.hasTestLourd) {
            moyModule = moyDevoirs;
        } else {
            let tl = mat.noteTestLourd !== null ? mat.noteTestLourd : 0;
            if (mat.coef % 2 !== 0) {
                // Coefficient Impair (ex: 3) -> 2 pour Test Lourd, 1 pour Devoir
                moyModule = ((tl * 2) + (moyDevoirs * 1)) / 3;
            } else {
                // Coefficient Pair (ex: 2) -> 60% Test Lourd, 40% Devoirs
                moyModule = (tl * 0.60) + (moyDevoirs * 0.40);
            }
        }

        let elAvg = document.getElementById(`avg-${mat.id}`);
        if (elAvg) elAvg.textContent = moyModule.toFixed(2);

        totalPoints += moyModule * mat.coef;
        totalCoefs += mat.coef;
    });

    return { totalPoints, totalCoefs, moyenne: totalCoefs > 0 ? totalPoints / totalCoefs : null };
}

function calculerMoyennes() {
    let resSemestre = calculerMoyenneListeMatieres(getMatieresCourantes());
    document.getElementById("semesterAverage").textContent = resSemestre.moyenne !== null ? resSemestre.moyenne.toFixed(2) : "--";

    let anneeObj = applicationData.annees[applicationData.anneeCourante];
    let resS1 = calculerMoyenneListeMatieres(anneeObj["S1"] || []);
    let resS2 = calculerMoyenneListeMatieres(anneeObj["S2"] || []);

    let totalPointsAnnee = (resS1.totalPoints || 0) + (resS2.totalPoints || 0);
    let totalCoefsAnnee = (resS1.totalCoefs || 0) + (resS2.totalCoefs || 0);

    let moyAnnuelle = totalCoefsAnnee > 0 ? (totalPointsAnnee / totalCoefsAnnee).toFixed(2) : "--";
    document.getElementById("overallAverage").textContent = moyAnnuelle;
}

// Exportation / Importation JSON
function exporterJSON() {
    let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(applicationData, null, 2));
    let downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `sauvegarde_notes_${applicationData.anneeCourante.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function importerJSON(event) {
    let file = event.target.files[0];
    if (!file) return;
    let reader = new FileReader();
    reader.onload = function(e) {
        try {
            applicationData = JSON.parse(e.target.result);
            sauvegarderAuto();
            rafraichirSelecteurs();
            afficherMatiereCourantes();
            alert("Sauvegarde chargée avec succès !");
        } catch (err) {
            alert("Erreur lors de la lecture du fichier de sauvegarde.");
        }
    };
    reader.readAsText(file);
}

// File System Access API
async function sauvegarderFichierDirect() {
    if ('showSaveFilePicker' in window) {
        try {
            fileHandle = await window.showSaveFilePicker({
                suggestedName: `sauvegarde_notes.json`,
                types: [{ description: 'Fichier JSON', accept: { 'application/json': ['.json'] } }]
            });
            await sauvegarderFichierLie();
            alert("Fichier local lié avec succès ! Les modifications y seront synchronisées.");
        } catch (err) {
            console.log("Sélection annulée.");
        }
    } else {
        alert("L'API File System Direct n'est pas supportée par ce navigateur. Utilisez le bouton Sauvegarder (.json).");
    }
}

async function sauvegarderFichierLie() {
    if (fileHandle) {
        try {
            const writable = await fileHandle.createWritable();
            await writable.write(JSON.stringify(applicationData, null, 2));
            await writable.close();
        } catch (err) {
            console.error("Erreur d'écriture dans le fichier", err);
        }
    }
}
