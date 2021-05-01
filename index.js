$(function () {
    var noeuds = [];                        // copie de la variables nodeDataArray
    // var liens = [];     
    var baseSolutionTable = [];             // copie de la solution de base
    var originalTable = [];                 // copie de la table original
    var nombreSource;                       // nombre des colonnes sources
    var $$ = go.GraphObject.make;

    /****************** CALCULER LES GAINS ********************/

    $("#calculGainBtn").click(function() {
        for(var i=0; i < baseSolutionTable.length; i++) {
            for(var j=0; j < baseSolutionTable[i].length; j++) {
                if(baseSolutionTable[i][j] == 0) {
                    if(parseInt(noeuds[i].value+originalTable[i][j]-noeuds[j+nombreSource].value) >= 0) {
                        $("ul#listeGains").append('<li class="ml-3"> £('+ noeuds[i].key +', '+ noeuds[j+nombreSource].key +') = '+
                            noeuds[i].value + '+' + originalTable[i][j] + '-' + noeuds[j+nombreSource].value + 
                            ' = P </li>')
                    }
                    else {
                        $("ul#listeGains").append('<li class="ml-3 text-danger"> £('+ noeuds[i].key +', '+ noeuds[j+nombreSource].key +') = '+
                            noeuds[i].value + '+' + originalTable[i][j] + '-' + noeuds[j+nombreSource].value + 
                            ' = '+ parseInt(noeuds[i].value+originalTable[i][j]-noeuds[j+nombreSource].value)
                        +'</li>')
                    }
                }
            }
        }
    });

    /************************************************* ///////////// \\\\\\\\\\\\\\ *********************************************/


    /****************** CODE POUR LE GRAPH EXECUTANT LE STEPPING STONE ********************/

    $("#getGraphBtn").click(function() {
        var array1 = [], array2 = [];   // pour stocker la valeur des entetes du tableau différement
        var nodeDataArray = [], linkDataArray = []; // ce sont les tableaux utilisés par gojs pour rendre la vue
        
        var diagram = new go.Diagram("myGraph");
        diagram.nodeTemplate =

        $$(go.Node, "Auto",
            { locationSpot: go.Spot.Center },
            new go.Binding("location", "loc", go.Point.parse),
            $$(go.Panel,
                $$(go.Shape, "RoundedRectangle", { fill: "lightgray", width: 60, height: 30 }), 
                $$(go.TextBlock,
                    { margin: 2, width: 15 },
                    new go.Binding("text", "value").makeTwoWay(),
                    { background: "yellow", alignment: go.Spot.TopLeft }
                )  
            ),  
            $$(go.TextBlock, { margin: 5 },
                new go.Binding("text", "key")),
        );

        diagram.linkTemplate =
            $$(go.Link,
                { curve: go.Link.Bezier },
                $$(go.Shape),
                $$(go.Shape, { toArrow: "OpenTriangle" }),
                $$(go.TextBlock,                        // this is a Link label
                    new go.Binding("text", "text"),
                    { segmentOffset: new go.Point(0, -10) }
                )
            );

        getTabTitleValue(array1, array2);
        nodeDataArray = array1.concat(array2);
        
        // Remplir le tableau linkDataArray pour lier les noeuds
        for(var i=0; i < baseSolutionTable.length; i++) {
            for(var j=0; j < baseSolutionTable[i].length; j++) {
                if(baseSolutionTable[i][j] != 0) {
                    // console.log("original value : "+originalTable[i][j]+'\n')
                    var data = { from: "", to: "", text: "" };
                    data.from = array1[i].key;
                    data.to = array2[j].key;
                    data.text = originalTable[i][j];
                    linkDataArray.push(data);
                }
            }
        }

        // Calculer la valeur de chaque noeud à partir des valeurs des liens
        while(!checkEmptyTitleNodeArrayValue(nodeDataArray)) {
            let index = getIndexOfMaximumValue(linkDataArray);
            var origin = linkDataArray[index].from;
            // Initialisation
            for(var i=0; i < nodeDataArray.length; i++) {
                if(nodeDataArray[i].key == origin)
                    nodeDataArray[i].value = 0;
            }
            // Remplir la destination à l'aide des noeuds sources non null
            for(var j=0; j < nodeDataArray.length; j++) {
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
        diagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);
        noeuds = [...nodeDataArray];
        // liens = [...linkDataArray];
    });

    // Receuille la liste des noeuds dans deux tableaux différents
    function getTabTitleValue(x, y) {
        var rang1=1, rang2=1;
        // recevoir la première liste des noeuds 
        $("#initialTable tbody tr th.labelle").each(function() {
            var data = { key: "", loc: "", value: null, type: "source"};
            data.key = $(this).text();
            data.loc = "50 "+rang1*100;
            x.push(data);
            rang1++;
        });
        nombreSource = rang1-1;
        // recevoir la deuxième liste des noeuds 
        $("#initialTable thead tr th.labelle").each(function() {
            var data = { key: "", loc: "", value: null, type: "destination"};
            data.key = $(this).text();
            data.loc = "270 "+rang2*70;
            y.push(data);
            rang2++;
        })
    }

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

        // COPIER LA VALEUR DES TABLEAUX AFIN DE GARDER L'ORIGINAL
        var copieC = c.map(function(arr) {
            return arr.slice();
        });
        var copieA = [...a];
        var copieB = [...b];
        

        x = minitab(copieA, copieB, copieC);

        baseSolutionTable = x.map(function(arr) {
            return arr.slice();
        });
        originalTable = c.map(function(arr) {
            return arr.slice();
        });
                // console.log("originaltable : "+originalTable);
        solutionDeBase(x, c);
        
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
        })
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
});