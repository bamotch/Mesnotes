/* ==========================================================================
   1. STRUCTURE DES DONNÉES & INITIALISATION
   ========================================================================== */

let applicationData = {
    anneeCourante: "Licence 1",
    semestreCourant: "S1",
    annees: {
        "Licence 1": {
            "S1": [],
            "S2": []
        }
    }
};

let currentEntryMode = 'notes'; // 'notes' ou 'direct'

// Initialisation au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
    chargerDonneesLocales();
    initialiserSelects();
    afficherMatiereCourantes();
});

/* ==========================================================================
   2. GESTION DES NIVEAUX ET SEMESTRES
   ========================================================================== */

function initialiserSelects() {
    let yearSelect = document.getElementById("yearSelect");
    yearSelect.innerHTML = "";

    Object.keys(applicationData.annees).forEach((annee) => {
        let option = document.createElement("option");
        option.value = annee;
        option.textContent = annee;
        if (annee === applicationData.anneeCourante) option.selected = true;
        yearSelect.appendChild(option);
    });

    document.getElementById("semesterSelect").value = applicationData.semestreCourant;
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

function ajouterAnnee() {
    let nomNouveau = prompt("Entrez le nom du nouveau niveau (ex: Licence 2, Master 1) :");
    if (nomNouveau && nomNouveau.trim() !== "") {
        nomNouveau = nomNouveau.trim();
        if (!applicationData.annees[nomNouveau]) {
            applicationData.annees[nomNouveau] = { "S1": [], "S2": [] };
            applicationData.anneeCourante = nomNouveau;
            applicationData.semestreCourant = "S1";
            sauvegarderAuto();
            initialiserSelects();
            afficherMatiereCourantes();
        } else {
            alert("Ce niveau existe déjà !");
        }
    }
}

function getMatieresCourantes() {
    return applicationData.annees[applicationData.anneeCourante][applicationData.semestreCourant];
}

/* ==========================================================================
   3. BASCULEMENT MODE DE SAISIE & AJOUT DE MATIÈRE
   ========================================================================== */

function basculerModeSaisie(mode) {
    currentEntryMode = mode;
    let directGroup = document.getElementById('directAvgGroup');
    let notesGroup = document.getElementById('notesGroup');
    let directAvgInput = document.getElementById('directAverage');

    if (mode === 'direct') {
        directGroup.style.display = 'flex';
        notesGroup.style.display = 'none';
        directAvgInput.required = true;
    } else {
        directGroup.style.display = 'none';
        notesGroup.style.display = 'flex';
        directAvgInput.required = false;
    }
}

function ajouterMatiere(event) {
    event.preventDefault();
    let name = document.getElementById("subjectName").value.trim();
    let coef = parseFloat(document.getElementById("subjectCoef").value);

    if (!name || isNaN(coef)) return;

    let nouvelleMatiere = {
        id: Date.now(),
        nom: name,
        coef: coef,
        mode: currentEntryMode, // 'notes' ou 'direct'
        moyenneDirecte: currentEntryMode === 'direct' ? parseFloat(document.getElementById("directAverage").value) : null,
        hasTestLourd: currentEntryMode === 'notes' ? document.getElementById("hasTestLourd").checked : false,
        devoirs: [],
        noteTestLourd: null
    };

    getMatieresCourantes().push(nouvelleMatiere);
    sauvegarderAuto();
    document.getElementById("addSubjectForm").reset();
    basculerModeSaisie('notes');
    afficherMatiereCourantes();
}

/* ==========================================================================
   4. GESTION DES NOTES ET MODIFICATIONS
   ========================================================================== */

function ajouterDevoir(matiereId) {
    let mat = getMatieresCourantes().find(m => m.id === matiereId);
    if (!mat) return;

    let noteStr = prompt(`Entrez la note de devoir pour ${mat.nom} (/20) :`);
    if (noteStr !== null && noteStr.trim() !== "") {
        let note = parseFloat(noteStr.replace(',', '.'));
        if (!isNaN(note) && note >= 0 && note <= 20) {
            mat.devoirs.push({ id: Date.now(), valeur: note });
            sauvegarderAuto();
            afficherMatiereCourantes();
        } else {
            alert("Veuillez entrer une note valide entre 0 et 20.");
        }
    }
}

function modifierDevoir(matiereId, devoirId) {
    let mat = getMatieresCourantes().find(m => m.id === matiereId);
    if (!mat) return;

    let dev = mat.devoirs.find(d => d.id === devoirId);
    if (!dev) return;

    let nouvelleNoteStr = prompt("Modifier la note de devoir (/20) :", dev.valeur);
    if (nouvelleNoteStr !== null && nouvelleNoteStr.trim() !== "") {
        let note = parseFloat(nouvelleNoteStr.replace(',', '.'));
        if (!isNaN(note) && note >= 0 && note <= 20) {
            dev.valeur = note;
            sauvegarderAuto();
            afficherMatiereCourantes();
        } else {
            alert("Veuillez entrer une note valide entre 0 et 20.");
        }
    }
}

function supprimerDevoir(matiereId, devoirId) {
    let mat = getMatieresCourantes().find(m => m.id === matiereId);
    if (!mat) return;

    mat.devoirs = mat.devoirs.filter(d => d.id !== devoirId);
    sauvegarderAuto();
    afficherMatiereCourantes();
}

function enregistrerTestLourd(matiereId) {
    let mat = getMatieresCourantes().find(m => m.id === matiereId);
    if (!mat) return;

    let ancVal = mat.noteTestLourd !== null ? mat.noteTestLourd : "";
    let noteStr = prompt(`Note du Test Lourd pour ${mat.nom} (/20) :`, ancVal);

    if (noteStr !== null && noteStr.trim() !== "") {
        let note = parseFloat(noteStr.replace(',', '.'));
        if (!isNaN(note) && note >= 0 && note <= 20) {
            mat.noteTestLourd = note;
            sauvegarderAuto();
            afficherMatiereCourantes();
        } else {
            alert("Veuillez entrer une note valide entre 0 et 20.");
        }
    }
}

function modifierMoyenneDirecte(matiereId) {
    let mat = getMatieresCourantes().find(m => m.id === matiereId);
    if (!mat) return;

    let noteStr = prompt(`Modifier la moyenne du module ${mat.nom} (/20) :`, mat.moyenneDirecte);
    if (noteStr !== null && noteStr.trim() !== "") {
        let note = parseFloat(noteStr.replace(',', '.'));
        if (!isNaN(note) && note >= 0 && note <= 20) {
            mat.moyenneDirecte = note;
            sauvegarderAuto();
            afficherMatiereCourantes();
        }
    }
}

function supprimerMatiere(matiereId) {
    if (confirm("Voulez-vous vraiment supprimer cette matière ?")) {
        let matieres = getMatieresCourantes();
        let index = matieres.findIndex(m => m.id === matiereId);
        if (index !== -1) {
            matieres.splice(index, 1);
            sauvegarderAuto();
            afficherMatiereCourantes();
        }
    }
}

/* ==========================================================================
   5. LOGIQUE DES CALCULS (FORMULES EXACTES PAIR / IMPAIR)
   ========================================================================== */

function calculerMoyenneListeMatieres(matieres) {
    let totalPoints = 0;
    let totalCoefs = 0;

    matieres.forEach((mat) => {
        let moyModule = 0;

        // MODE 1 : Saisie Directe de la Moyenne
        if (mat.mode === 'direct') {
            moyModule = mat.moyenneDirecte !== null ? mat.moyenneDirecte : 0;
        } 
        // MODE 2 : Saisie Détaillée (Devoirs + Test Lourd)
        else {
            let devoirsValides = mat.devoirs.map(d => d.valeur).filter(v => v !== null && !isNaN(v));
            let moyDevoirs = 0;

            if (devoirsValides.length > 0) {
                moyDevoirs = devoirsValides.reduce((a, b) => a + b, 0) / devoirsValides.length;
            } else if (mat.hasTestLourd && mat.noteTestLourd !== null) {
                moyDevoirs = mat.noteTestLourd;
            }

            if (!mat.hasTestLourd) {
                moyModule = moyDevoirs;
            } else {
                let tl = mat.noteTestLourd !== null ? mat.noteTestLourd : 0;
                
                if (mat.coef % 2 !== 0) {
                    // COEFFICIENT IMPAIR (ex: 3)
                    // (Test Lourd * 2 + Moyenne Devoirs * 1) / Coef
                    moyModule = ((tl * 2) + (moyDevoirs * 1)) / mat.coef;
                } else {
                    // COEFFICIENT PAIR (ex: 2)
                    // (Test Lourd * 60 + Moyenne Devoirs * 40) / 100
                    moyModule = ((tl * 60) + (moyDevoirs * 40)) / 100;
                }
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
    // 1. Moyenne du Semestre Courant
    let matieresSemestre = getMatieresCourantes();
    let resSemestre = calculerMoyenneListeMatieres(matieresSemestre);

    let elSemAvg = document.getElementById("semesterAverage");
    if (resSemestre.moyenne !== null) {
        elSemAvg.textContent = resSemestre.moyenne.toFixed(2);
    } else {
        elSemAvg.textContent = "--";
    }

    // 2. Moyenne Annuelle : (Moyenne S1 + Moyenne S2) / 2
    let anneeObj = applicationData.annees[applicationData.anneeCourante];
    let resS1 = calculerMoyenneListeMatieres(anneeObj["S1"] || []);
    let resS2 = calculerMoyenneListeMatieres(anneeObj["S2"] || []);

    let elOverall = document.getElementById("overallAverage");
    if (resS1.moyenne !== null && resS2.moyenne !== null) {
        let moyAnnee = (resS1.moyenne + resS2.moyenne) / 2;
        elOverall.textContent = moyAnnee.toFixed(2);
    } else if (resS1.moyenne !== null) {
        elOverall.textContent = resS1.moyenne.toFixed(2);
    } else if (resS2.moyenne !== null) {
        elOverall.textContent = resS2.moyenne.toFixed(2);
    } else {
        elOverall.textContent = "--";
    }
}

/* ==========================================================================
   6. AFFICHAGE DYNAMIQUE DE LA LISTE DES MATIÈRES
   ========================================================================== */

function afficherMatiereCourantes() {
    let listContainer = document.getElementById("subjectsList");
    listContainer.innerHTML = "";
    let matieres = getMatieresCourantes();

    if (matieres.length === 0) {
        listContainer.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 2rem;">Aucun module enregistré pour ce semestre.</div>`;
        calculerMoyennes();
        return;
    }

    matieres.forEach((mat) => {
        let card = document.createElement("div");
        card.className = "subject-card";

        let contentHTML = `
            <div class="subject-header">
                <div>
                    <span class="subject-title">${mat.nom}</span>
                    <span class="subject-badge">Coef: ${mat.coef}</span>
                </div>
                <button onclick="supprimerMatiere(${mat.id})" class="btn btn-danger-sm" title="Supprimer la matière">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
            <div class="notes-list">
        `;

        if (mat.mode === 'direct') {
            contentHTML += `
                <div class="note-item">
                    <span>Moyenne Directe :</span>
                    <strong>${mat.moyenneDirecte !== null ? mat.moyenneDirecte + ' / 20' : 'Non renseignée'}</strong>
                    <button onclick="modifierMoyenneDirecte(${mat.id})" class="btn btn-secondary" style="padding:2px 6px; font-size:0.75rem;">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                </div>
            `;
        } else {
            // Affichage Devoirs
            contentHTML += `<div style="font-size:0.85rem; font-weight:bold; color:var(--text-muted);">Devoirs :</div>`;
            if (mat.devoirs.length === 0) {
                contentHTML += `<div class="note-item" style="color:var(--text-muted);">Aucune note de devoir</div>`;
            } else {
                mat.devoirs.forEach((d, index) => {
                    contentHTML += `
                        <div class="note-item">
                            <span>Devoir ${index + 1} : <strong>${d.valeur} / 20</strong></span>
                            <div>
                                <button onclick="modifierDevoir(${mat.id}, ${d.id})" class="btn btn-secondary" style="padding:2px 6px; font-size:0.75rem;"><i class="fa-solid fa-pen"></i></button>
                                <button onclick="supprimerDevoir(${mat.id}, ${d.id})" class="btn btn-danger-sm" style="padding:2px 6px; font-size:0.75rem;"><i class="fa-solid fa-xmark"></i></button>
                            </div>
                        </div>
                    `;
                });
            }
            contentHTML += `
                <button onclick="ajouterDevoir(${mat.id})" class="btn btn-outline-light" style="color:var(--primary-color); border-color:var(--primary-color); margin-top:5px; font-size:0.8rem;">
                    <i class="fa-solid fa-plus"></i> Ajouter Devoir
                </button>
            `;

            // Affichage Test Lourd
            if (mat.hasTestLourd) {
                contentHTML += `<div style="font-size:0.85rem; font-weight:bold; color:var(--text-muted); margin-top:10px;">Test Lourd :</div>`;
                contentHTML += `
                    <div class="note-item">
                        <span>Note TL : <strong>${mat.noteTestLourd !== null ? mat.noteTestLourd + ' / 20' : 'Non saisie'}</strong></span>
                        <button onclick="enregistrerTestLourd(${mat.id})" class="btn btn-secondary" style="padding:2px 6px; font-size:0.75rem;">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                    </div>
                `;
            }
        }

        contentHTML += `
            </div>
            <div style="border-top:1px solid var(--border-color); padding-top:8px; text-align:right; font-weight:bold; font-size:0.95rem;">
                Moyenne Module : <span id="avg-${mat.id}">--</span> / 20
            </div>
        `;

        card.innerHTML = contentHTML;
        listContainer.appendChild(card);
    });

    calculerMoyennes();
}

/* ==========================================================================
   7. RÉINITIALISATION ET SAUVEGARDE (LOCALSTORAGE & JSON)
   ========================================================================== */

function reinitialiserSemestre() {
    if (confirm(`Voulez-vous réinitialiser toutes les matières du ${applicationData.semestreCourant} ?`)) {
        applicationData.annees[applicationData.anneeCourante][applicationData.semestreCourant] = [];
        sauvegarderAuto();
        afficherMatiereCourantes();
    }
}

function reinitialiserNiveau() {
    if (confirm(`Voulez-vous réinitialiser TOUT le niveau ${applicationData.anneeCourante} (S1 et S2) ?`)) {
        applicationData.annees[applicationData.anneeCourante] = { "S1": [], "S2": [] };
        sauvegarderAuto();
        afficherMatiereCourantes();
    }
}

function sauvegarderAuto() {
    localStorage.setItem("carnetNotesData", JSON.stringify(applicationData));
}

function chargerDonneesLocales() {
    let localData = localStorage.getItem("carnetNotesData");
    if (localData) {
        try {
            applicationData = JSON.parse(localData);
        } catch (e) {
            console.error("Erreur de lecture du LocalStorage", e);
        }
    }
}

function exporterJSON() {
    let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(applicationData, null, 2));
    let downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Carnet_Notes_${applicationData.anneeCourante}.json`);
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
            let data = JSON.parse(e.target.result);
            if (data.annees) {
                applicationData = data;
                sauvegarderAuto();
                initialiserSelects();
                afficherMatiereCourantes();
                alert("Données importées avec succès !");
            } else {
                alert("Format de fichier JSON invalide.");
            }
        } catch (err) {
            alert("Erreur lors de la lecture du fichier JSON.");
        }
    };
    reader.readAsText(file);
}

function sauvegarderFichierDirect() {
    exporterJSON();
}

/* ==========================================================================
   8. GENERATION ET EXPORTATION PDF PROFESSIONNEL
   ========================================================================== */

function exporterPDF() {
    let anneeNom = applicationData.anneeCourante;
    let anneeObj = applicationData.annees[anneeNom];

    let matieresS1 = anneeObj["S1"] || [];
    let matieresS2 = anneeObj["S2"] || [];

    let resS1 = calculerMoyenneListeMatieres(matieresS1);
    let resS2 = calculerMoyenneListeMatieres(matieresS2);

    // Calcul de la Moyenne Annuelle : (Moyenne S1 + Moyenne S2) / 2
    let moyAnnee = "--";
    if (resS1.moyenne !== null && resS2.moyenne !== null) {
        moyAnnee = ((resS1.moyenne + resS2.moyenne) / 2).toFixed(2);
    } else if (resS1.moyenne !== null) {
        moyAnnee = resS1.moyenne.toFixed(2);
    } else if (resS2.moyenne !== null) {
        moyAnnee = resS2.moyenne.toFixed(2);
    }

    // Création du conteneur HTML éphémère pour le rendu du PDF
    let container = document.createElement("div");
    container.id = "pdfTemplate";

    let htmlContent = `
        <div class="pdf-header">
            <h1>RELEVÉ DE NOTES ET RÉSULTATS ACADÉMIQUES</h1>
            <p><strong>Niveau :</strong> ${anneeNom} | <strong>Date d'édition :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
        </div>
    `;

    // Fonction interne pour générer le tableau d'un semestre
    function genererTableauSemestre(nomSemestre, matieres, resSemestre) {
        if (matieres.length === 0) {
            return `<div class="pdf-section-title">${nomSemestre}</div><p style="font-size:12px; color:#64748b;">Aucun module enregistré pour ce semestre.</p>`;
        }

        let tableHtml = `
            <div class="pdf-section-title">${nomSemestre}</div>
            <table class="pdf-table">
                <thead>
                    <tr>
                        <th>Module / Matière</th>
                        <th class="center">Coef</th>
                        <th>Détail des Notes</th>
                        <th class="center">Moyenne Module</th>
                    </tr>
                </thead>
                <tbody>
        `;

        matieres.forEach((mat) => {
            let detailNotes = "";
            let moyModule = 0;

            if (mat.mode === 'direct') {
                detailNotes = "Saisie Directe";
                moyModule = mat.moyenneDirecte !== null ? mat.moyenneDirecte : 0;
            } else {
                let devList = mat.devoirs.map(d => `${d.valeur}/20`).join(', ');
                let tlStr = mat.hasTestLourd ? ` | TL: ${mat.noteTestLourd !== null ? mat.noteTestLourd + '/20' : 'N/A'}` : '';
                detailNotes = (devList ? `Devoirs: [${devList}]` : 'Aucun devoir') + tlStr;

                // Calcul selon pair / impair
                let devoirsValides = mat.devoirs.map(d => d.valeur).filter(v => v !== null && !isNaN(v));
                let moyDevoirs = devoirsValides.length > 0 ? devoirsValides.reduce((a, b) => a + b, 0) / devoirsValides.length : (mat.noteTestLourd || 0);
                let tl = mat.noteTestLourd !== null ? mat.noteTestLourd : 0;

                if (!mat.hasTestLourd) {
                    moyModule = moyDevoirs;
                } else if (mat.coef % 2 !== 0) {
                    moyModule = ((tl * 2) + (moyDevoirs * 1)) / mat.coef;
                } else {
                    moyModule = ((tl * 60) + (moyDevoirs * 40)) / 100;
                }
            }

            tableHtml += `
                <tr>
                    <td><strong>${mat.nom}</strong></td>
                    <td class="center">${mat.coef}</td>
                    <td>${detailNotes}</td>
                    <td class="center"><strong>${moyModule.toFixed(2)} / 20</strong></td>
                </tr>
            `;
        });

        let moySemStr = resSemestre.moyenne !== null ? `${resSemestre.moyenne.toFixed(2)} / 20` : '--';

        tableHtml += `
                </tbody>
            </table>
            <div style="text-align: right; font-weight: bold; font-size: 13px; margin-bottom: 15px;">
                Moyenne Générale ${nomSemestre} : <span style="color:#2563eb;">${moySemStr}</span>
            </div>
        `;

        return tableHtml;
    }

    // Ajout du S1 et S2
    htmlContent += genererTableauSemestre("SEMESTRE 1 (S1)", matieresS1, resS1);
    htmlContent += genererTableauSemestre("SEMESTRE 2 (S2)", matieresS2, resS2);

    // Synthèse Annuelle Finale (S1 + S2) / 2
    htmlContent += `
        <div class="pdf-summary-box">
            <span>SYNTHÈSE ANNUELLE (${anneeNom})</span>
            <span>Moyenne Générale (S1 + S2) / 2 : <span class="highlight">${moyAnnee} / 20</span></span>
        </div>
    `;

    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    // Configuration et téléchargement du PDF
    let options = {
        margin:       10,
        filename:     `Releve_Notes_${anneeNom.replace(/\s+/g, '_')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(options).from(container).save().then(() => {
        document.body.removeChild(container);
    });
}
