$(document).ready(function () {
    document.getElementById("myRange").disabled = true;
    $('#myRange').on("change", function () {
        $('#myRangeValue').html($(this).val());
        updateStackDisplay()
    });
})


// datayı parse ediyoruz.
function parseData() {
    const data = $("#data").val()
    var dataarray = data.split(' ')
    var parsedData = dataarray.map((text) => {
        return "[" + text.split('\t').reduce((accum, text1, index, readonly) => {
            if (index != readonly.length - 1) {
                return accum + text1 + ','
            } else {
                return accum + text1
            }
        }, '') + "];"
    }).filter((item) => { return item != "[,];" }).reduce((accum, text) => {
        accum += text
        return accum
    }, "")
    $("#data").val(parsedData.substring(0, parsedData.length - 1))
}


function rightClick() {


    if (document.getElementById("myRange").disabled || document.getElementById("myRange").value == document.getElementById("myRange").max) {
        //console.log("return")
        return
    } else {
        //console.log($("#myRange").val()+1)
        $("#myRange").val(parseInt($("#myRange").val()) + 1)
        $('#myRangeValue').html(document.getElementById("myRange").value);
        updateStackDisplay()
    }
}
function leftClick() {
    if (document.getElementById("myRange").disabled || document.getElementById("myRange").value == document.getElementById("myRange").min) {
        return
    } else {
        $("#myRange").val($("#myRange").val() - 1)
        $('#myRangeValue').html(document.getElementById("myRange").value);
        updateStackDisplay()
    }
}


// noktalar arası mesafeyi hesaplıyoruz.
stack = null // global yığın
function distfnc(a, b) { // noktalar arası mesafeyi hesaplıyoruz. 
    return Math.sqrt( 
        a.map(
            (item, index) => { 
                return Math.pow(item - b[index], 2) 
            })
            .reduce((accum, item) => {
                return accum += item
            }, 0)
    )
}


// noktalar arasındaki aralıklı sorgu
function RangedQuery(DB, distfnc, Q, eps){ // DB: veri kümesi, distfnc: mesafe fonksiyonu, Q: sorgulanacak nokta, eps: epsilon
    var neighbour= [] // komşu noktalar
    DB.forEach((pt)=>{ // veri kümesindeki her nokta için
        if(distfnc(pt.point,Q.point)<=eps){ // noktalar arası mesafe epsilon'dan küçükse
            neighbour=neighbour.concat(pt) // komşu noktalar listesine ekle
        } 
    })
    return neighbour // komşu noktaları döndür 
}


// DBSCAN fonksiyonu
function DBSCAN(data, epsilon, minpts, callbackAfterInitialize, callbackperDots, callbackSuccess, callbackFail) { // data: veri kümesi, epsilon: epsilon, minpts: minpts, callbackAfterInitialize: başlangıçta çalışacak fonksiyon, callbackperDots: her nokta için çalışacak fonksiyon, callbackSuccess: başarılı sonuç döndürdüğünde çalışacak fonksiyon, callbackFail: başarısız sonuç döndürdüğünde çalışacak fonksiyon
    var data = referencedataset // veri kümesi
    var clusterCounter = 0; // küme sayacı
    for (var i = 0; i < referencedataset.length; i++) { // veri kümesindeki her nokta için
        if (referencedataset[i].label != undefined) { // nokta zaten etiketlenmişse
            continue; // devam et
        }
        var neighbour = [] // komşu noktalar
        for (var j = 0; j < referencedataset.length; j++) { // veri kümesindeki her nokta için
            if (distfnc(referencedataset[i].point, referencedataset[j].point) <= epsilon) { // noktalar arası mesafe epsilon'dan küçükse
                neighbour.push(JSON.parse(JSON.stringify(referencedataset[j]))) // komşu noktalar listesine ekle
            }
        }
        if (neighbour.length < minpts) { // komşu nokta sayısı minpts'ten küçükse
            referencedataset[i].label = "noise" // noktayı gürültü olarak etiketle
            continue; // devam et
        }
        clusterCounter += 1 // küme sayacını arttır
        referencedataset[i].label = clusterCounter.toString() // noktayı küme etiketle 
        var seedset = JSON.parse(JSON.stringify(neighbour)) // neighbor noktaları seedset'e ata
        var finalSeedSet = [] // final seedset
        while (seedset.length != 0) { // seedset boş olana kadar
            var currentPt = seedset.pop() // seedsetten nokta çek
            if (currentPt.label == "noise") { // nokta gürültü ise
                currentPt.label = clusterCounter.toString() // noktayı küme etiketle
            }
            if (currentPt.label != undefined) { // nokta zaten etiketlenmişse
                continue; // devam et
            }
            currentPt.label = clusterCounter.toString() // noktayı küme etiketle
            finalSeedSet.push(JSON.parse(JSON.stringify(currentPt))) // noktayı final seedset'e ekle
            var thisneighbour = [] // bu noktanın komşu noktaları
            for (var j = 0; j < referencedataset.length; j++) { // veri kümesindeki her nokta için
                if (distfnc(referencedataset[i].point, referencedataset[j].point) <= epsilon) { // noktalar arası mesafe epsilon'dan küçükse
                    thisneighbour.push(JSON.parse(JSON.stringify(referencedataset[j]))) // noktayı komşu noktalar listesine ekle
                }
            }
            if (thisneighbour.length >= minpts) { // noktanın komşu nokta sayısı minpts'ten büyükse
                seedset.concat(thisneighbour) // noktaları seedset'e ekle
            }
        }
    }
}


// DBSCAN Butonuna Basıldığında Çalışacak Fonksiyon
function handleClick() {
    //split data
    try {
        const data = $("#data").val()
        const minpts = parseInt($("#minpts").val())
        const dimension = parseInt($("#dimension").val())
        const epsilon = parseFloat($("#epsilon").val())
        //const epsilon = parseInt($("#epsilon").val())
        if (data == undefined || minpts == undefined || dimension == undefined || epsilon == undefined || data == "" || minpts == "" || dimension == "" || epsilon == "" || data == null || minpts == null || epsilon == null) {
            return alert("bir veya daha fazla parametreniz tanımsız!!")
        }
        
        const dataset = data.split(';')

        var referencedataset = dataset.reduce((accum, item, index) => {
            const pitem = item.substring(1, item.length - 1);
            const itemarr = pitem.split(',')
            const splitted = itemarr.reduce((accum1, val) => {
                
                accum1.push(parseFloat(val))
                return accum1
            }, [])

            accum.push({ point: splitted, label: undefined })
            return accum
        }, [])

        stack = new DataStack()
        stack.clearStack()
        stack.pushIteration({ data: referencedataset })
        
        clusterCounter=0; // küme sayacı
        for(var i=0;i<referencedataset.length;i++){ // veri kümesindeki her nokta için
            console.log(i) // nokta numarası
            if(referencedataset[i].label!=undefined){ // nokta zaten etiketlenmişse
                continue;
            }
            var neighbour=RangedQuery(referencedataset,distfnc,referencedataset[i],epsilon) // referencedataset[i] noktasının epsilon mesafesindeki komşu noktalar
            if(neighbour.length<minpts){ // komşu nokta sayısı minpts'ten küçükse
                referencedataset[i].label="noise" // noktayı gürültü olarak etiketle
                continue;
            }
            clusterCounter+=1 // küme sayacını arttır
            var Seedset=new Set() // Seedset isminde set oluştur
            for(var j=0;j<neighbour.length;j++){ // komşu noktaların her biri için
                Seedset.add(neighbour[j]) // Seedset'e ekle
            }
            Seedset.forEach((element)=>{ // Seedset'in her bir elemanı için
                if(element.label == "noise"){ // nokta gürültü ise
                    element.label=clusterCounter // noktayı küme etiketle
                    referencedataset=referencedataset.map((item)=>{
                        var eql=true
                        item.point.forEach((item1,index)=>{
                            //console.log(item1+""+element.point[index])
                            if(item1!==element.point[index]){
                                eql=false
                            }
                        })
                        if(eql){
                            //console.log("found")
                            item.label=element.label
                            return item
                        }else{
                            return item
                        }
                    })
                }
                //console.log(referencedataset)
                if(element.label!=undefined){ // nokta zaten etiketlenmişse
                    return
                }
                element.label=clusterCounter // noktayı küme etiketle
                referencedataset=referencedataset.map((item)=>{
                    var eql=true
                    item.point.forEach((item1,index)=>{
                        //console.log(item1+""+element.point[index])
                        if(item1!==element.point[index]){
                            eql=false
                        }
                    })
                    if(eql){
                        //console.log("found")
                        item.label=element.label
                        return item
                    }else{
                        return item
                    }
                })
                //console.log(referencedataset)
                var newNeighbour=RangedQuery(referencedataset, distfnc,element ,epsilon) // noktanın epsilon mesafesindeki komşu noktalar
                if(newNeighbour.length>=minpts){ // komşu nokta sayısı minpts'ten büyükse
                    for(var k=0;k<newNeighbour.length;k++){ // komşu noktaların her biri için
                        Seedset.add(newNeighbour[k]) // Seedset'e ekle
                    }
                }
                
                stack.pushIteration({data:referencedataset}) 
                //return;
                //throw "normal"
            })
            stack.pushIteration({data:referencedataset})
        }
        stack.pushIteration({data:referencedataset})
        console.log(referencedataset)
        document.getElementById("myRange").disabled = false;
        document.getElementById("myRange").max = stack.getHeight()
        document.getElementById("myRange").value = document.getElementById("myRange").max
        $("#myRangeValue").html(document.getElementById("myRange").value)
        updateStackDisplay()

    } catch (err) {
        return console.log(err)
    }
}


// Çıktıyı Güncelleyen Fonksiyon
function updateStackDisplay() {
    var data = stack.getIteration($("#myRange").val())
    //console.log(data)
    var newArr = []
    displayToTable(data.data, "#progressTable")
    TESTER = document.getElementById('progressGraph');
    var groupbylabel = data.data.reduce((accum, item, index) => {
        if (index == 0) {
            var newarr = [item]
            accum.push(newarr)
            return accum
        } else {
            for (var i = 0; i < accum.length; i++) {
                if (item.label == accum[i][0].label) {
                    accum[i].push(item)
                    return accum
                }
            }
            var newarr = [item]
            accum.push(newarr)
            return accum
        }

    }, [])
    console.log(groupbylabel)
    //console.log(groupbycenter)
    var DATAForPloty = []
    for (var i = 0; i < groupbylabel.length; i++) {
        var trace = {}
        trace.mode = 'markers'
        trace.type = 'scatter'
        var x = groupbylabel[i].map((item) => {
            return item.point[0]
        })
        var y = groupbylabel[i].map((item) => {
            return item.point[1]
        })

        trace.x = x
        trace.y = y
        var colorr = Math.round(Math.random() * 255)
        var colorg = Math.round(Math.random() * 255)
        var colorb = Math.round(Math.random() * 255)
        trace.marker = { color: 'rgb(' + colorr + '' + colorg + '' + colorb + ')' }
        DATAForPloty.push(trace)
    }
    Plotly.newPlot('progressGraph', DATAForPloty, {
        title: $("#myRange").val() + ' iterasyon',
        autosize: false,
        width: 500,
        height: 500,
    });
}


// tabloya yazdırıyoruz.
function displayToTable(data, target) {
    const finalTarget = target ? target : '#resulttable'
    var html = "<table border='1'><tr><th>koordinatlar</th><th>kümeler</th></tr>"
    data.forEach((element) => {
        html += "<tr><td>" + element.point + "</td><td>" + element.label + "</td></tr>"
    })
    html += "</table>"
    $(finalTarget).html(html)
}


// data alanını temizle.
function clearInput() {
    $('#data').val("")
}


class DataStack {
    constructor() {
        this.dstack = []
    }
    pushIteration(obj) {

        const clone = $.extend(true, {}, obj)
        this.dstack.push(clone)

    }
    clearStack() {
        this.dstack = []
    }
    getHeight() {
        return this.dstack.length
    }
    getIteration(id) {
        try {
            return this.dstack[id - 1]
        } catch (err) {
            return undefined
        }
    }
}