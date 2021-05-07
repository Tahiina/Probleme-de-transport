$(function () {
    var noeuds = [];                        // copie de la variables nodeDataArray
    var gainMaximum = {};     
    var baseSolutionTable = [];             // copie de la solution de base
    var originalTable = [];                 // copie de la table original
    var nombreSource;                       // nombre des colonnes sources
    var $$ = go.GraphObject.make;

    /****************** CALCULER LES GAINS ********************/

    $("#appliquerGain").click(function() {
        const gain = gainMaximum.coefficient;
        for(var i=0; i < gainMaximum.chemin.length; i++) {
            var ligne = gainMaximum.chemin[i].ligne;
            var colonne = gainMaximum.chemin[i].colonne;
            if(gainMaximum.chemin[i].marque == '+') {
                if(baseSolutionTable[ligne][colonne] == "E")
                    baseSolutionTable[ligne][colonne] = gain; 
                else
                    baseSolutionTable[ligne][colonne] += gain;
            }
            else {
                if(baseSolutionTable[ligne][colonne] != "E")
                    baseSolutionTable[ligne][colonne] -= gain;
            }
                
        }
        if(estUnCasDegenere(noeuds, baseSolutionTable))
            addALink(baseSolutionTable, noeuds);
            
        // Appliquer la modification dans le tableau
        solutionDeBase(baseSolutionTable, originalTable);
        $("#graph-container").html("");
        $("#listeGains").html("");
        $("#appliquerGain").hide();
        $("#getGraphBtn").show();
    });

    $("#calculGainBtn").click(function() {
        var listChemin = [];
        var indexOfMaximumGain;
        var copieTableBaseSolution = baseSolutionTable.map(function(arr) {
            return arr.slice();
        });
        $("ul#listeGains").html("");
        for(var i=0; i < baseSolutionTable.length; i++) {
            for(var j=0; j < baseSolutionTable[i].length; j++) {
                if(baseSolutionTable[i][j] == 0) {
                    var resultat = noeuds[i].value+originalTable[i][j]-noeuds[j+nombreSource].value;
                    if(resultat >= 0) {
                        $("ul#listeGains").append('<li class="ml-3"> £('+ noeuds[i].key +', '+ noeuds[j+nombreSource].key +') = '+
                            noeuds[i].value + '+' + originalTable[i][j] + '-' + noeuds[j+nombreSource].value + 
                            ' = P </li>')
                    }
                    // Si il y a des valeurs négatives, nous allons calculer les gains
                    else {
                        var chemin = marquage(copieTableBaseSolution, i, j);
                        var coefficient = findTheMinimumValueOfChemin(chemin);
                        // Si c'est égale à Eupsilone
                        if(coefficient == "E"){
                            listChemin.push({ coefficient: coefficient, gain: "-E", chemin: chemin});
                            $("ul#listeGains").append('<li class="ml-3 text-danger"> £('+ noeuds[i].key +', '+ noeuds[j+nombreSource].key +') = '+
                                noeuds[i].value + '+' + originalTable[i][j] + '-' + noeuds[j+nombreSource].value + 
                                ' = '+ resultat + '<br>  => Gain = ' + resultat + 'x' + coefficient + ' = ' + "-E"
                            +'</li>')
                        }
                        else {
                            listChemin.push({ coefficient: coefficient, gain: parseInt(resultat*coefficient), chemin: chemin});
                            $("ul#listeGains").append('<li class="ml-3 text-danger"> £('+ noeuds[i].key +', '+ noeuds[j+nombreSource].key +') = '+
                                noeuds[i].value + '+' + originalTable[i][j] + '-' + noeuds[j+nombreSource].value + 
                                ' = '+ resultat + '<br>  => Gain = ' + resultat + 'x' + coefficient + ' = ' + parseInt(resultat*coefficient)
                            +'</li>')
                        }
                    }
                }
            }
        }
        if(listChemin.length > 0) {
            indexOfMaximumGain = findIndexOfMaximumOfGain(listChemin);
            gainMaximum = listChemin[indexOfMaximumGain];   // On initialise la variable global gainMaximum
            $("#calculGainBtn").hide();
            $("#appliquerGain").show();
        }
        else {
            $("#divInsert").html('<h5 class="text-center font-weight-bold text-uppercase py-2">Félicitation, le transport est optimal</h5>');
        }

    });

    function marquage(tableau, row, col) {
        var chemin = [];
        var stop = false;
        var target = 'ligne';
        var data = {ligne: row, colonne: col, value: tableau[row][col], marque: '+'}; // premier chemin
        var ligneActuel = row;
        var colonneActuel = col;
        chemin.push(data);

        while(!stop) {
            if(target == 'ligne') {
                for(var i=0; i < tableau.length; i++) {
                    if(tableau[i][colonneActuel] != 0 && i != ligneActuel ) {
                        if(i == row && colonneActuel != col) {
                            chemin.push({ligne: i, colonne: colonneActuel, value: tableau[i][colonneActuel], marque: '-'});
                            stop = true; // on sort de la boucle
                            break;
                        }
                        if(isTheCorrectWayForLine(tableau, i, colonneActuel, row)) {
                            chemin.push({ligne: i, colonne: colonneActuel, value: tableau[i][colonneActuel], marque: '-'});
                            ligneActuel = i;
                            target = 'colonne';
                        }
                    }
                }
            }
            else {
                for(var j=0; j < tableau[ligneActuel].length; j++) {
                    if(j != colonneActuel && tableau[ligneActuel][j] != 0 && isTheCorrectwayForColumn(tableau, ligneActuel, j, row)) {
                        chemin.push({ligne: ligneActuel, colonne: j, value: tableau[ligneActuel][j], marque: '+'});
                        colonneActuel = j;
                        target = 'ligne';
                    }
                }
            }
        }
        return chemin;
    }

    // Au cas où on doit, choisir entre différents chemin, cette fonction va nous permettre de trouver le bon pour la colonne
    function isTheCorrectwayForColumn(table, ligne, colonne, finalRow) {
        for(var i=0; i < table.length; i++) {
            // On vérifie si on est déjà de retour à la case depart (on a terminé) ===>>> on verifie si la ligne correspond à la ligne de depart
            if(i == finalRow && table[i][colonne] != 0) return true;
            if(i != ligne && table[i][colonne] != 0)
                if(isTheCorrectWayForLine(table, i, colonne, finalRow)) 
                    return true;
        }
        return false;
    }
    // Au cas où on doit, choisir entre différents chemin, cette fonction va nous permettre de trouver le bon pour la ligne 
    function isTheCorrectWayForLine(table, ligne,colonne, finalRow) {
        for(var i=0; i < table[ligne].length; i++) {
            if(i != colonne && table[ligne][i] != 0)
                if(isTheCorrectwayForColumn(table, ligne, i, finalRow)) 
                    return true;
        }
        return false;
    }

    // Recherche du minimum dans le marquage -
    function findTheMinimumValueOfChemin(chemin) {
        var minimum = chemin[1].value;
        for(var i=1; i < chemin.length; i++) {
            if(chemin[i].value == "E" && chemin[i].marque == '-') {
                minimum = chemin[i].value;
            }
            if(chemin[i].value != "E" && chemin[i].value < minimum && chemin[i].marque == '-') minimum = chemin[i].value;
        }
        return minimum;
    }

    //Recherche du gain maximal avant de l'appliquer 
    function findIndexOfMaximumOfGain(liste) {
        var max = liste[0].gain;
        var index = 0;
        for(var i=1; i < liste.length; i++) {
            if(max != "-E" && liste[i].gain != "-E") {
                if(max > liste[i].gain) {   // on utilise l'operateur > car c'est un nombre negative, alors le maximum de gain sera le plus petit
                    max = liste[i].gain;
                    index = i;
                }
            }
            if(max == "-E" && liste[i].gain != "-E") { // on change la valeur de max par le premier nombre différent de -E
                max = liste[i].gain;
                index = i;
            }
        }
        return index;
    }

    /************************************************* ///////////// \\\\\\\\\\\\\\ *********************************************/
    // CAS DEGENERES

    function estUnCasDegenere(noeuds, table) {
        var nombreLiens = 0;
        for(var i=0; i < table.length; i++) {
            for(var j=0; j < table[i].length; j++) {
                if(table[i][j] != 0) nombreLiens++;
            }
        }
        return (nombreLiens != noeuds.length-1);
    }

    function addALink(table) {
        for(var k=0; k < nombreSource; k++) {
            for(var i=0; i < table.length; i++) {
                if(k == i && !checkIfThereIsALink(table, i)) {
                    insertEupsilonIntoThisLine(table, i);
                    return;
                }
            }
        }
    }

    // Ajout de l'Eupsilon pour pallier le cas dégénéré
    function insertEupsilonIntoThisLine(table, row) {
        for(var j=0; j < table[row].length; j++) {
            if(table[row][j] == 0) {
                table[row][j] = "E";
                return;
            }
        }
    }

    // Verifier si cette ligne est en lien avec les autres
    function checkIfThereIsALink(table, row) {
        for(var j=0; j < table[row].length; j++) {
            if(table[row][j] != 0) {
                for(var i=0; i < table.length; i++) {
                    if(table[i][j] != 0) {
                        for(var k=0; k < table.length; k++) {
                            if(k!=row && table[k][j] != 0) return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    /****************** CODE POUR LE GRAPH EXECUTANT LE STEPPING STONE ********************/

    $("#getGraphBtn").click(function() {
        var array1 = [], array2 = [];   // pour stocker la valeur des entetes du tableau différement
        var nodeDataArray = [], linkDataArray = []; // ce sont les tableaux utilisés par gojs pour rendre la vue
        // On supprime d'abord son contenu puis on le reajoute pour eviter l'erreur durant la creation du diagram
        $("#graph-container").html("");
        $("#graph-container").append('<div id="myGraph" style="width:100%; height:500px"></div>');
        var diagram = $$(go.Diagram, "myGraph");
        diagram.nodeTemplate = $$(go.Node, "Auto",
                                    { locationSpot: go.Spot.Center },
                                    new go.Binding("location", "loc", go.Point.parse),
                                    $$(go.Panel,
                                        $$(go.Shape, "RoundedRectangle", { fill: "lightgray", width: 80, height: 30 }), 
                                        $$(go.TextBlock,
                                            { margin: 2, width: 25 },
                                            new go.Binding("text", "value"),
                                            { background: "yellow", alignment: go.Spot.TopLeft }
                                        )  
                                    ),
                                    $$(go.TextBlock, { margin: 5 },
                                        new go.Binding("text", "key")),
                                );
        diagram.linkTemplate = $$(go.Link,
                                    { curve: go.Link.Bezier },
                                    $$(go.Shape),
                                    $$(go.TextBlock,                        // this is a Link label
                                        new go.Binding("text", "text"),
                                        { segmentOffset: new go.Point(0, -10) }
                                    )
                                );

        nodeDataArray = ObtenirLesTitresDuTableau(array1, array2);
            
        creerLesLiensEtMettreAJourLesValeursDesNoeuds(baseSolutionTable, nodeDataArray, linkDataArray, array1, array2);

        diagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);
        noeuds = [...nodeDataArray];    // On copie la valeur de nodeDataArray dans la variable principale noeud 
        
        $("#getGraphBtn").hide();
        $("#calculGainBtn").show();
    });

    function creerLesLiensEtMettreAJourLesValeursDesNoeuds (baseSolutionTable, nodeDataArray, linkDataArray, enteteHorizontale, enteteVerticale) {
        // Remplir le tableau linkDataArray pour lier les noeuds
        for(var i=0; i < baseSolutionTable.length; i++) {
            for(var j=0; j < baseSolutionTable[i].length; j++) {
                if(baseSolutionTable[i][j] != 0) {
                    var data = { from: "", to: "", text: "" };
                    data.from = enteteHorizontale[i].key;
                    data.to = enteteVerticale[j].key;
                    data.text = originalTable[i][j];
                    linkDataArray.push(data);
                }
            }
        }
        let index = getIndexOfMaximumValue(linkDataArray);      // On recherche le lien possédant la valeur maximale
        var origin = linkDataArray[index].from;
        // Initialisation du point de départ
        for(var i=0; i < nodeDataArray.length; i++) {
            if(nodeDataArray[i].key == origin)
                nodeDataArray[i].value = 0;
        }
        // Calculer la valeur de chaque noeud à partir des valeurs des liens
        while(!checkEmptyTitleNodeArrayValue(nodeDataArray)) {  // on execute l'algo tant qu'il y a encore des noeuds qui ne possède aucune valeur
            
            for(var j=0; j < nodeDataArray.length; j++) {
                // Remplir la destination à l'aide des noeuds sources non null
                if(nodeDataArray[j].type == "source" && nodeDataArray[j].value != null) {
                    for(var k=0; k < linkDataArray.length; k++) {
                        if(linkDataArray[k].from == nodeDataArray[j].key) {
                            var val = nodeDataArray[j].value;
                            for(var i=0; i < nodeDataArray.length; i++) {
                                if(nodeDataArray[i].key == linkDataArray[k].to && nodeDataArray[i].type == "destination" && nodeDataArray[i].value == null) { 
                                    nodeDataArray[i].value = val + linkDataArray[k].text;
                                }
                            }
                        }
                    }
                }
                // Remplir les noeuds sources à l'aide des noeuds de destinations non null
                if(nodeDataArray[j].type == "destination" && nodeDataArray[j].value != null) {
                    for(var k=0; k < linkDataArray.length; k++) {
                        if(nodeDataArray[j].key == linkDataArray[k].to && nodeDataArray[j].value != null) {
                            var val = nodeDataArray[j].value;
                            for(var l=0; l < nodeDataArray.length; l++) {
                                if(nodeDataArray[l].key == linkDataArray[k].from && nodeDataArray[l].value == null) {
                                    nodeDataArray[l].value = val - linkDataArray[k].text;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Receuille la liste des noeuds dans deux tableaux différents
    function ObtenirLesTitresDuTableau(x, y) {
        var rang1=1, rang2=1;
        // recevoir la première liste des noeuds 
        $("#initialTable tbody tr th.labelle").each(function() {
            var data = { key: "", loc: "", value: null, type: "source"};
            data.key = $(this).text();
            data.loc = "50 "+rang1*100;
            x.push(data);
            rang1++;
        });
        // nombreSource = rang1-1;
        // recevoir la deuxième liste des noeuds 
        $("#initialTable thead tr th.labelle").each(function() {
            var data = { key: "", loc: "", value: null, type: "destination"};
            data.key = $(this).text();
            data.loc = "270 "+rang2*70;
            y.push(data);
            rang2++;
        })
        return x.concat(y);
    }

    // Verifier si le noeud possède deja une valeur différent de null
    function checkEmptyTitleNodeArrayValue(tableau) {
        for(var i=0; i < tableau.length; i++) {
            if(tableau[i].value == null) return false;
        }
        return true;
    }

    // Obtenir l'index de la valeur maximum dans le tableau linkDataArray
    function getIndexOfMaximumValue(tableau) {
        var max = tableau[0].text;
        var index = 0;
        for(var i=1; i < tableau.length; i++) {
            if( max < tableau[i].text) { 
                max = tableau[i].text;
                index = i; 
            }
        } 
        return index;
    }

    /************************************************* ///////////// \\\\\\\\\\\\\\ *********************************************/

    // En cliquant sur le bouton minitab
    $("#minitabBtn").click(function() {
        var a = [], b = [], c = [], x = [];

        getTablesValues(a, b, c);
        nombreSource = a.length;
        // COPIER LA VALEUR DES TABLEAUX AFIN DE GARDER L'ORIGINAL
        var copieC = c.map(function(arr) {
            return arr.slice();
        });
        var copieA = [...a];
        var copieB = [...b];
        var table = a.concat(b);

        x = minitab(copieA, copieB, copieC);

        baseSolutionTable = x.map(function(arr) {
            return arr.slice();
        });
        originalTable = c.map(function(arr) {
            return arr.slice();
        });
        
        if(estUnCasDegenere(table, baseSolutionTable))
            addALink(baseSolutionTable);
            
        solutionDeBase(baseSolutionTable, c);

        $("#minitabBtn").hide();
        $("#bhammerBtn").hide();
        $("#getGraphBtn").show();
    });

    function getTablesValues(a, b, c) {
        $("#initialTable tbody tr").each(function() {
            var data = [];
            $(this).find("td").each(function() {
                data.push(parseInt($(this).html()));
            });

            $(this).find("th.a").each(function() {
                a.push(parseInt($(this).html()));
            });

            c.push(data);
        });

        $("#initialTable tfoot tr th.b").each(function() {
            b.push(parseInt($(this).html()));
        });
    }

    function minitab(a, b, c) {
        var x = initMatrix(c); // initialiser la matrice
        
        while(!checkTabNull(a) && !checkTabNull(b)) {
            var indexMin = indexOfMin(c); // Cherche l'index de minimum du tableau
            
            if(a[indexMin.ligne] < b[indexMin.colonne]) {
                x[indexMin.ligne][indexMin.colonne] = a[indexMin.ligne];
                a[indexMin.ligne] = 0;
                b[indexMin.colonne] -= x[indexMin.ligne][indexMin.colonne];
                for(var i = 0; i < b.length; i++) {
                    c[indexMin.ligne][i] = 0;
                }
            }
            else {
                x[indexMin.ligne][indexMin.colonne] = b[indexMin.colonne];
                b[indexMin.colonne] = 0;
                a[indexMin.ligne] -= x[indexMin.ligne][indexMin.colonne];
                for(var j = 0; j < a.length; j++) {
                    c[j][indexMin.colonne] = 0;
                }
            }
        }
        return x;
    }

    function checkTabNull(tableau) {
        for(var i=0; i < tableau.length; i++) {
            if(tableau[i] != 0) 
                return false;
        }
        return true;
    }

    function calculerZ(c, x) {
        var z = 0;
        for(var i=0; i < c.length; i++) {
            for(var j=0; j < c[i].length; j++) {
                z += c[i][j]*x[i][j];
            }
        }
        return z;
    }

    function solutionDeBase(x, c) {
        var i=0;
        var j=0;
        $("#tableBaseSolution tbody tr").each(function() {
            $(this).find("td").each(function() {
                if(x[i][j]==0)
                    $(this).html('-');
                else
                    $(this).html(x[i][j]);
                j++;
            });
            i++;
            j=0;
        });
        $("#total").html(calculerZ(c, x));
    }

    function initMatrix(v) {
        var y = [];
        for(var i=0; i < v.length; i++) {
            var k = [];
            for(var j=0; j < v[i].length; j++) {
                k[j] = 0;
            }
            y.push(k);
        }
        return y;
    }

    function indexOfMin(tableau) {
        var index = {
            ligne:0,
            colonne:0
        };
        var min = Math.max(...[].concat(...tableau));
        for(var i=0; i < tableau.length; i++) {
            for(var j=0; j < tableau[i].length; j++) {
                if(tableau[i][j] <= min && tableau[i][j] != 0) {
                    min = tableau[i][j];
                    index.ligne = i;
                    index.colonne = j;
                }
            }
        }
        return index;
    }

    /************************************************* ///////////// \\\\\\\\\\\\\\ *********************************************/
    // BALLAS HAMMER

    $("#bhammerBtn").click(function () {
        var a = [], b = [], c = [], x = [];

        getTablesValues(a, b, c);
        nombreSource = a.length;
        // COPIER LA VALEUR DES TABLEAUX AFIN DE GARDER L'ORIGINAL
        var copieC = c.map(function(arr) {
            return arr.slice();
        });
        var copieA = [...a];
        var copieB = [...b];
        var table = a.concat(b);

        x = bhammer(copieA, copieB, copieC);

        baseSolutionTable = x.map(function(arr) {
            return arr.slice();
        });
        originalTable = c.map(function(arr) {
            return arr.slice();
        });
        
        if(estUnCasDegenere(table, baseSolutionTable))
            addALink(baseSolutionTable);
            
        solutionDeBase(baseSolutionTable, c);

        $("#minitabBtn").hide();
        $("#bhammerBtn").hide();
        $("#getGraphBtn").show();
    });

    function bhammer(a,b,tableauC){
        var x = initMatrix(tableauC);
        // var c =  setMatrix(c);// copier le matrice c
        var c = tableauC.map(function(arr) {
            return arr.slice();
        });
        var counter = 1;
    
        while(counter < (a.length+b.length)){
    
            var tc = c[0].map((_, colIndex) => c.map(row => row[colIndex])); // transposé de c
    
            var a1 = diffMin(c,a); // différence entre les minimums lignes
            var b1 = diffMin(tc,b);  // différence entre les minimums colones
    
            var max = getMax(a1,b1); // trouver maximum entre le tableau a1 et b1
            var indexRow = getIndexOfMaximum(a1); // trouver l'index maximum dans le tableau a1
            var indexCol = getIndexOfMaximum(b1); // trouver l'index maximum dans le tableau b1
    
            /* trouver l'index de minimum à la différence maximale */
            if(max == a1[indexRow]){
                var rowTab = maka_ny_ligne(c,indexRow);
                indexCol = rowTab.indexOf(Math.min.apply(null, rowTab.filter(n => n != 0)));
                
            } else if(max == b1[indexCol]){
                var columnTab = maka_ny_colone(c,indexCol);
                indexRow = columnTab.indexOf(Math.min.apply(null, columnTab.filter(n => n != 0)));
            }
    
            /**/
            for (var i = 0; i < c.length; i++) {
                for (var j = 0; j < c[i].length; j++) {
                    if(i==indexRow && j==indexCol){
                        if(a[i]<b[j]){
                            x[i][j] = a[i];
                            a[i] = 0;
                            b[j] = b[j] - x[i][j];
                            remplirLigneZero(c,i,b.length); // fenoina zéro ny ligne zay efa vita 
                        } else {
                            x[i][j] = b[j];
                            a[i] = a[i] - x[i][j]; 
                            b[j] = 0;
                            remplirColZero(c,j,a.length); // fenoina zéro ny colone zay efa vita 
                        }
    
                    }
                }
            }
            counter++;
        }
        return x;
    }
    
    function diffMin(c,arr){
        var res = [];
        for (var i = 0; i < arr.length; i++) {
            if(arr[i]!=0){
                var min = Math.min.apply(null, c[i].filter(n => n != 0));
                var secondMin = 0;
                if(minimumDuplicate(c[i])) 
                    secondMin = min; // Si le minimum est dupliqué
                else 
                    secondMin = Math.min.apply(null, c[i].filter(n => (n != min)&&(n != 0)));
                res.push(secondMin-min);
            } else 
                res.push(0);
        }
        return res;
    }
    
    function minimumDuplicate(arr){
        var min = Math.min.apply(null, arr.filter(n => n != 0));
        var counter = 0;
        for (var i = 0; i < arr.length; i++) {
            if(arr[i]==min){
                counter++;
            }
        }
        return (counter!=1);
    }
    
    function getMax(a,b){
        var max_a = Math.max.apply(null, a);
        var max_b = Math.max.apply(null, b);
        return Math.max(max_a,max_b);
    }
    
    function getIndexOfMaximum(arr){
        var max = Math.max.apply(null, arr);
        return arr.indexOf(max);
    }
    
    function remplirColZero(c,index, rowLength){
        for (var i = 0; i < rowLength; i++) {
            c[i][index] = 0;
        }
    }
    
    function remplirLigneZero(c,index, colLength){
        for (var i = 0; i < colLength; i++) {
            c[index][i] = 0;
        }
    }
    
    function maka_ny_colone(matrice, col){
       var column = [];
       for(var i=0; i<matrice.length; i++){
          column.push(matrice[i][col]);
       }
       return column;
    }
    
    function maka_ny_ligne(matrice, row){
       return matrice[row];
    }

});