$(function () {
    
    var baseSolutionTable = [];
    var originalTable = [];
    var $$ = go.GraphObject.make;
    /****************** CODE POUR LE GRAPH EXECUTANT LE STEPPING STONE ********************/

    $("#findOptimalBtn").click(function() {
        var array1 = [], array2 = [];   // pour stocker la valeur des entetes du tableau différement
        var nodeDataArray = [], linkDataArray = []; // ce sont les tableaux utilisés par gojs pour rendre la vue
        
        var diagram = new go.Diagram("myGraph");
        diagram.nodeTemplate =

        $$(go.Node, "Auto",
            { locationSpot: go.Spot.Center },
            new go.Binding("location", "loc", go.Point.parse),
            $$(go.Shape, "RoundedRectangle", { fill: "lightgray" }),
            $$(go.TextBlock, { margin: 5 },
                new go.Binding("text", "key"))
        );

        diagram.linkTemplate =
            $$(go.Link,
                { curve: go.Link.Bezier },
                $$(go.Shape),
                $$(go.Shape, { toArrow: "OpenTriangle" }),
                $$(go.TextBlock,                        // this is a Link label
                    new go.Binding("text", "text"),
                    { segmentIndex : Math.random() },
                    {segmentFraction : Math.random() }
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
        diagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);
    });

    // Receuille la liste des noeuds dans deux tableaux différents
    function getTabTitleValue(x, y) {
        var rang1=1, rang2=1;
        // recevoir la première liste des noeuds 
        $("#initialTable tbody tr th.labelle").each(function() {
            var data = { key: "", loc: ""};
            data.key = $(this).text();
            data.loc = "50 "+rang1*80;
            x.push(data);
            rang1++;
        });

        // recevoir la deuxième liste des noeuds 
        $("#initialTable thead tr th.labelle").each(function() {
            var data = { key: "", loc: ""};
            data.key = $(this).text();
            data.loc = "250 "+rang2*60;
            y.push(data);
            rang2++;
        })
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