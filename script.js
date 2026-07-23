// Structure globale des données
let applicationData = {
    annees: {
        "Licence 2 (2026-2027)": []
    },
    anneeCourante: "Licence 2 (2026-2027)"
};

let fileHandle = null; // Pour le File System Access API

// Initialisation au chargement de la page
window.onload = function() {
    let savedData = localStorage.getItem("notes_app_data");
    if (savedData) {
        applicationData = JSON.parse(savedData);
    }
    rafraichirSélecteurAnnees();
    afficherMatiereCourantes();
};

function sauvegarderAuto() {
    localStorage.setItem("notes_app_data", JSON.stringify(applicationData));
    sauvegarderFichierLie();
}

// Ajouter une nouvelle année
function ajouterAnnee() {
    let nomAnnee = prompt("Entrez le nom de la nouvelle année / niveau (ex: Licence 3) :");
    if (nomAnnee && !applicationData.annees[nomAnnee]) {
        applicationData.annees[nomAnnee] = [];
        applicationData.anneeCourante = nomAnnee;
        sauvegarderAuto();
        rafraichirSélecteurAnnees();
        afficherMatiereCourantes();
    }
}

function rafraichirSélecteurAnnees() {
    let select = document.getElementById("yearSelect");
    select.innerHTML = "";
    for (let annee in applicationData.annees) {
        let option = document.createElement("option");
        option.value = annee;
        option.textContent = annee;
        if (annee === applicationData.anneeCourante) option.selected = true;
        select.appendChild(option);
    }
}

function changerAnnee() {
    let select = document.getElementById("yearSelect");
    applicationData.anneeCourante = select.value;
    sauvegarderAuto();
    afficherMatiereCourantes();
}

// Gestion des matières
function ajouterMatiere(event) {
    event.preventDefault();
    let name = document.getElementById("subjectName").value;
    let coef = parseFloat(document.getElementById("subjectCoef").value);
    let hasTestLourd = document.getElementById("hasTestLourd").checked;

    let nouvelleMatiere = {
        id: Date.now(),
        nom: name,
        coef: coef,
        hasTestLourd: hasTestLourd,
        devoirs: [],
        noteTestLourd: null
    };

    applicationData.annees[applicationData.anneeCourante].push(nouvelleMatiere);
    sauvegarderAuto();
    document.getElementById("addSubjectForm").reset();
    afficherMatiereCourantes();
}

function afficherMatiereCourantes() {
    let container = document.getElementById("subjectsList");
    container.innerHTML = "";
    let matieres = applicationData.annees[applicationData.anneeCourante] || [];

    matieres.forEach((mat) => {
        let card = document.createElement("div");
        card.className = "card subject-card";
        
        let html = `<h3>${mat.nom} (Coef: ${mat.coef})</h3>`;
        html += `<p>Type: ${mat.hasTestLourd ? "Devoir(s) + Test Lourd" : "Devoir(s) uniquement"}</p>`;
        
        html += `<div class="notes-container"><h4>Devoirs :</h4>`;
        mat.devoirs.forEach((d, idx) => {
            html += `<div class="note-item">
                <span>Devoir ${idx + 1} :</span>
                <input type="number" step="0.25" min="0" max="20" value="${d.valeur !== null ? d.valeur : ''}" onchange="mettreAJourDevoir(${mat.id}, ${idx}, this.value)">
                <input type="file" accept="image/*" onchange="ajouterPhotoDevoir(${mat.id}, ${idx}, event)">
            </div>`;
        });
        html += `<button onclick="ajouterDevoir(${mat.id})" class="btn-secondary">+ Ajouter un devoir</button>`;
        
        if (mat.hasTestLourd) {
            html += `<h4 style="margin-top:10px;">Test Lourd :</h4>
            <div class="note-item">
                <input type="number" step="0.25" min="0" max="20" value="${mat.noteTestLourd !== null ? mat.noteTestLourd : ''}" onchange="mettreAJourTestLourd(${mat.id}, this.value)">
                <input type="file" accept="image/*" onchange="ajouterPhotoTL(${mat.id}, event)">
            </div>`;
        }

        html += `</div>`;
        html += `<div class="result-box">Moyenne du module : <span id="avg-${mat.id}">--</span> / 20</div>`;
        
        card.innerHTML = html;
        container.appendChild(card);
    });
}

function ajouterDevoir(matiereId) {
    let mat = applicationData.annees[applicationData.anneeCourante].find(m => m.id === matiereId);
    if (mat) {
        mat.devoirs.push({ valeur: null, photo: null });
        sauvegarderAuto();
        afficherMatiereCourantes();
    }
}

function mettreAJourDevoir(matiereId, devoirIndex, valeur) {
    let mat = applicationData.annees[applicationData.anneeCourante].find(m => m.id === matiereId);
    if (mat) {
        mat.devoirs[devoirIndex].valeur = valeur !== "" ? parseFloat(valeur) : null;
        sauvegarderAuto();
    }
}

function mettreAJourTestLourd(matiereId, valeur) {
    let mat = applicationData.annees[applicationData.anneeCourante].find(m => m.id === matiereId);
    if (mat) {
        mat.noteTestLourd = valeur !== "" ? parseFloat(valeur) : null;
        sauvegarderAuto();
    }
}

// Calcul des moyennes
function calculerMoyennes() {
    let matieres = applicationData.annees[applicationData.anneeCourante] || [];
    let totalPoints = 0;
    let totalCoefs = 0;

    matieres.forEach((mat) => {
        let devoirsValides = mat.devoirs.map(d => d.valeur).filter(v => v !== null && !isNaN(v));
        let moyDevoirs = 0;

        if (devoirsValides.length > 0) {
            moyDevoirs = devoirsValides.reduce((a, b) => a + b, 0) / devoirsValides.length;
        } else if (mat.hasTestLourd && mat.noteTestLourd !== null) {
            moyDevoirs = mat.noteTestLourd;
        }

        let moyModule = 0;

        if (!mat.hasTestLourd) {
            moyModule = moyDevoirs;
        } else {
            let tl = mat.noteTestLourd !== null ? mat.noteTestLourd : 0;
            if (mat.coef % 2 !== 0) {
                // Coefficient Impair (ex: 3) -> 2 pour Test Lourd, 1 pour Devoirs
                moyModule = ((tl * 2) + (moyDevoirs * 1)) / 3;
            } else {
                // Coefficient Pair (ex: 2) -> 60% Test Lourd, 40% Devoirs
                moyModule = (tl * 0.60) + (moyDevoirs * 0.40);
            }
        }

        document.getElementById(`avg-${mat.id}`).textContent = moyModule.toFixed(2);
        totalPoints += moyModule * mat.coef;
        totalCoefs += mat.coef;
    });

    let overall = totalCoefs > 0 ? (totalPoints / totalCoefs).toFixed(2) : "--";
    document.getElementById("overallAverage").textContent = overall;
}

// Export / Import JSON classique
function exporterJSON() {
    let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(applicationData, null, 2));
    let downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `sauvegarde_notes_${applicationData.anneeCourante}.json`);
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
            rafraichirSélecteurAnnees();
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
            console.log("Sélection de fichier annulée.");
        }
    } else {
        alert("L'API File System Direct n'est pas supportée par ce navigateur. Utilisez le bouton Télécharger Sauvegarde.");
    }
}

async function sauvegarderFichierLie() {
    if (fileHandle) {
        try {
            const writable = await fileHandle.createWritable();
            await writable.write(JSON.stringify(applicationData, null, 2));
            await writable.close();
        } catch (err) {
            console.error("Impossible d'écrire dans le fichier lié", err);
        }
    }
      }
              
