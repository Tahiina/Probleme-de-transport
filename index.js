$(function () {
    
    // En cliquant sur le bouton minitab
    $("#minitabBtn").click(function() {
        var a = [];
        var b = [];
        var c = [];

        var x = [];

        getTablesValues(a, b, c);

        x = minitab(a, b, c);
        console.log("x:"+x);
        solutionDeBase(x, c, a, b);
    });

    function resolve() {
        var a= [];  // Quantité disponible
        var b= [];  // Quantité demandée
        var c= [];

        var x=[];   // solution de base
    }

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

        console.log("tableau a: "+ a);
        console.log("tableau b: "+ b);
        console.log("tableau c: "+ c);
    }

    function minitab(a, b, c) {
        var x = initMatrix(c); // initialiser la matrice 

        for(var i=0; i < c.length; i++) {
            var row = c[i];
            while(a[i] != 0) {
                var indexMin = indexOfMin(row, b); // Cherche l'index de minimum de la ligne
                for(var j=0; j < c[i].length; j++) {
                    if(j==indexMin) {
                        if(a[i] < b[j]) {
                            x[i][j] = a[i];
                            a[i] = 0;
                            b[j] -= x[i][j];
                        }
                        else {
                            x[i][j] = b[j];
                            a[i] -= x[i][j];
                            b[j] = 0; 
                        }
                    }
                }
            }
        }
        return x;
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

    function solutionDeBase(x, c, a, b) {
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
        var index = 0;
        var min;
        // for(var i=0; b[i]==0; i++) {
        //     index++;
        // }
        // for(var i = index; i < tableau.length; i++) {
        //     if(b[i]!=0) {
        //         if(tableau[i] < tableau[index]) index = i;
        //     }
        // }
        tableau.forEach(element => {
            element.forEach(value => {
                if(value < min) {
                    min = value;
                    index = indexOf(value);
                }
            })
        });
        return index;
    }

});