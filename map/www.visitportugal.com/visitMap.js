var completed = 0;
var realHost = "https://www.visitportugal.com";
var scriptSolr = "https://www.visitportugal.com" + '/sites/all/modules/util_helper/querySolr.php';
var first_time = true;
var regiao_first_time = true;
var localidade_first_time = true;
var points_so_far = 0;
var context_menu_lat = ''; var context_menu_lng = '';
var isParsed = false;


var defaultLat = 39.554883;
var defaultLon = -7.976074;


jQuery.fn.highlight = function(pat) {
    function innerHighlight(node, pat) {
        var skip = 0;
        if (node.nodeType == 3) {
            var pos = node.data.toUpperCase().indexOf(pat);
            if (pos >= 0) {
                var spannode = document.createElement('span');
                spannode.className = 'highlight';
                var middlebit = node.splitText(pos);
                var endbit = middlebit.splitText(pat.length);
                var middleclone = middlebit.cloneNode(true);
                spannode.appendChild(middleclone);
                middlebit.parentNode.replaceChild(spannode, middlebit);
                skip = 1;
            }
        } else if (node.nodeType == 1 && node.childNodes && !/(script|style)/i.test(node.tagName)) {
            for (var i = 0; i < node.childNodes.length; ++i) {
                i += innerHighlight(node.childNodes[i], pat);
            }
        }
        return skip;
    }
    return this.length && pat && pat.length ? this.each(function() {
        innerHighlight(this, pat.toUpperCase());
    }) : this;
};

jQuery.fn.removeHighlight = function() {
    return this.find("span.highlight").each(function() {
        this.parentNode.firstChild.nodeName;
        with(this.parentNode) {
            replaceChild(this.firstChild, this);
            normalize();
        }
    }).end();
};

String.prototype.ltrim = function(chars) {
    chars = chars || "\\s*";
    return this.replace(new RegExp("^[" + chars + "]+", "g"), "");
}

String.prototype.rtrim = function(chars) {
    chars = chars || "\\s*";
    return this.replace(new RegExp("[" + chars + "]+$", "g"), "");
}
String.prototype.trim = function(chars) {
    return this.rtrim(chars).ltrim(chars);
}

function charAtIndex(c) {
    return String.fromCharCode('A'.charCodeAt(0) + c);
}

function secondsToTime(secs) {
    var hours = Math.floor(secs / (60 * 60));

    var divisor_for_minutes = secs % (60 * 60);
    var minutes = Math.floor(divisor_for_minutes / 60);

    var divisor_for_seconds = divisor_for_minutes % 60;
    var seconds = Math.ceil(divisor_for_seconds);

    if (hours < 10) {
        hours = '0' + hours;
    }

    if (minutes < 10) {
        minutes = '0' + minutes;
    }

    if (seconds < 10) {
        seconds = '0' + seconds;
    }

    var obj = {
        "h": hours,
        "m": minutes,
        "s": seconds
    };
    return obj;
}


function getBrowserName() {
    var browserName = navigator.appName;
    var navigatorAgent = navigator.userAgent;
    // In Firefox, the true version is after "Firefox" 
    if ((verOffset = navigatorAgent.indexOf("Firefox")) != -1) {
        browserName = "Firefox";
    }
    // In MSIE, the true version is after "MSIE" in userAgent
    else if ((verOffset = navigatorAgent.indexOf("MSIE")) != -1) {
        browserName = "Internet Explorer";
    }
    // In Chrome, the true version is after "Chrome" 
    else if ((verOffset = navigatorAgent.indexOf("Chrome")) != -1) {
        browserName = "Chrome";
    }
    // In Opera, the true version is after "Opera" or after "Version"
    else if ((verOffset = navigatorAgent.indexOf("Opera")) != -1) {
        browserName = "Opera";
    }
    // In Safari, the true version is after "Safari" or after "Version" 
    else if ((verOffset = navigatorAgent.indexOf("Safari")) != -1) {
        browserName = "Safari";
    }
    // In most other browsers, "name/version" is at the end of userAgent 
    else if ((nameOffset = navigatorAgent.lastIndexOf(' ') + 1) <
        (verOffset = navigatorAgent.lastIndexOf('/'))) {
        browserName = navigatorAgent.substring(nameOffset, verOffset);
        if (browserName.toLowerCase() == browserName.toUpperCase()) {
            browserName = navigator.appName;
        }
    }
    return browserName;
};

function hideLoading() {
    if (first_time) {
        first_time = false;
        LoadURLParams();
    } else {
        $('#mapLoadingBackground').animate({
            opacity: 0.0
        }, 300, function() {
            $('#mapLoading').hide();
            $('#mapLoadingBackground').hide();
        });
        $('#mapLoadingBackground').css("-ms-filter", "'progid:DXImageTransform.Microsoft.Alpha(Opacity=0)'");
    };
}

if (typeof window.gettext != "function") {
    var gettext = function(str) {
        // Dummy translation function
        return str;
    };
}



function fillRegionsOptions() {
    const json = `[{"tid":"21","name":"Azores","parent":"0","coord_x":"-28.000000","coord_y":"38.650002"},{"tid":"35","name":"Alentejo","parent":"0","coord_x":"-8.100000","coord_y":"38.599998"},{"tid":"93","name":"Algarve","parent":"0","coord_x":"-8.200000","coord_y":"37.200001"},{"tid":"118","name":"Centro de Portugal","parent":"0","coord_x":"-8.200000","coord_y":"39.900002"},{"tid":"204","name":"Lisboa Region","parent":"0","coord_x":"-8.900000","coord_y":"38.700001"},{"tid":"278","name":"Madeira","parent":"0","coord_x":"-16.905905","coord_y":"32.647472"},{"tid":"285","name":"Porto and the North","parent":"0","coord_x":"-7.650000","coord_y":"41.490002"}]`
    const parsedJson = JSON.parse(json);
    parsedJson.forEach(obj => {
        $('#regionsSelect').append('<option data-lat="' + obj.coord_y + '" data-lon="' + obj.coord_x + '" value="' + obj.tid + '">' + obj.name + '</option>');
    });
    
    Foundation.libs.forms.refresh_custom_select($('#regionsSelect'), true);
    completed += 1;
    if (completed >= 3) {
        hideLoading();
    }
    
    var selected_text = "";
    $('#regionsSelect').change(function(event) {
        value = parseInt($('#regionsSelect :selected').attr('value'));
        if (value != -1) {
            lat = $('#regionsSelect :selected').attr('data-lat');
            lon = $('#regionsSelect :selected').attr('data-lon');

            latlon = new L.latLng(parseFloat(lat), parseFloat(lon));

            visitMaps.map.panTo(latlon);
        }
        $('#localitySelect').val(-1);
        $('option[value!=-1]', $('#localitySelect')).remove();
        for (i = 0; i < visitMaps.localitiesList[value].length; i++) {
            obj = visitMaps.localitiesList[value][i];
            $('#localitySelect').append('<option data-lat="' + obj.coord_y + '" data-lon="' + obj.coord_x + '" value="' + obj.tid + '">' + obj.name + '</option>');

            Foundation.libs.forms.refresh_custom_select($('#localitySelect'), true);
        }
    });

    return false;
}

function fillLocalitiesOptions(selected_value,go) {
            const json = `[{"tid":"205","name":"Abrantes","parent":"118","coord_x":"-8.198365","coord_y":"39.462814"},{"tid":"119","name":"\u00c1gueda","parent":"118","coord_x":"-8.447428","coord_y":"40.575218"},{"tid":"120","name":"Aguiar da Beira","parent":"118","coord_x":"-7.544277","coord_y":"40.817608"},{"tid":"36","name":"Alandroal","parent":"35","coord_x":"-7.403472","coord_y":"38.702435"},{"tid":"121","name":"Albergaria-a-Velha","parent":"118","coord_x":"-8.478642","coord_y":"40.692291"},{"tid":"94","name":"Albufeira","parent":"93","coord_x":"-8.252890","coord_y":"37.088085"},{"tid":"37","name":"Alc\u00e1cer do Sal","parent":"35","coord_x":"-8.510471","coord_y":"38.372284"},{"tid":"206","name":"Alcanena","parent":"118","coord_x":"-8.669691","coord_y":"39.458530"},{"tid":"207","name":"Alcoba\u00e7a","parent":"118","coord_x":"-8.979454","coord_y":"39.550339"},{"tid":"208","name":"Alcochete","parent":"204","coord_x":"-8.961281","coord_y":"38.755344"},{"tid":"95","name":"Alcoutim","parent":"93","coord_x":"-7.472889","coord_y":"37.470478"},{"tid":"209","name":"Alenquer","parent":"118","coord_x":"-9.008928","coord_y":"39.055717"},{"tid":"291","name":"Alf\u00e2ndega da F\u00e9","parent":"285","coord_x":"-6.964584","coord_y":"41.342018"},{"tid":"292","name":"Alij\u00f3","parent":"285","coord_x":"-7.475306","coord_y":"41.276901"},{"tid":"96","name":"Aljezur","parent":"93","coord_x":"-8.803839","coord_y":"37.318481"},{"tid":"38","name":"Aljustrel","parent":"35","coord_x":"-8.166733","coord_y":"37.877361"},{"tid":"210","name":"Almada","parent":"204","coord_x":"-9.159185","coord_y":"38.682293"},{"tid":"97","name":"Almancil","parent":"93","coord_x":"-8.028655","coord_y":"37.086479"},{"tid":"122","name":"Almeida","parent":"118","coord_x":"-6.905403","coord_y":"40.725609"},{"tid":"211","name":"Almeirim","parent":"35","coord_x":"-8.629879","coord_y":"39.208351"},{"tid":"39","name":"Almod\u00f4var","parent":"35","coord_x":"-8.060043","coord_y":"37.511761"},{"tid":"212","name":"Alpiar\u00e7a","parent":"35","coord_x":"-8.583574","coord_y":"39.259533"},{"tid":"98","name":"Alte","parent":"93","coord_x":"-8.176670","coord_y":"37.236115"},{"tid":"40","name":"Alter do Ch\u00e3o","parent":"35","coord_x":"-7.659429","coord_y":"39.200768"},{"tid":"124","name":"Alvai\u00e1zere","parent":"118","coord_x":"-8.382165","coord_y":"39.825184"},{"tid":"41","name":"Alvito","parent":"35","coord_x":"-7.991874","coord_y":"38.255997"},{"tid":"213","name":"Amadora","parent":"204","coord_x":"-9.239579","coord_y":"38.759464"},{"tid":"293","name":"Amarante","parent":"285","coord_x":"-8.077037","coord_y":"41.270382"},{"tid":"294","name":"Amares","parent":"285","coord_x":"-8.347647","coord_y":"41.631950"},{"tid":"125","name":"Anadia","parent":"118","coord_x":"-8.435278","coord_y":"40.440418"},{"tid":"22","name":"Angra do Hero\u00edsmo","parent":"21","coord_x":"-27.221115","coord_y":"38.655384"},{"tid":"126","name":"Ansi\u00e3o","parent":"118","coord_x":"-8.435806","coord_y":"39.911354"},{"tid":"295","name":"Arcos de Valdevez","parent":"285","coord_x":"-8.418035","coord_y":"41.845718"},{"tid":"127","name":"Arganil","parent":"118","coord_x":"-8.054230","coord_y":"40.217850"},{"tid":"99","name":"Arma\u00e7\u00e3o de P\u00eara","parent":"93","coord_x":"-8.358887","coord_y":"37.102406"},{"tid":"296","name":"Armamar","parent":"285","coord_x":"-7.692970","coord_y":"41.108952"},{"tid":"286","name":"Arouca","parent":"285","coord_x":"-8.246299","coord_y":"40.928223"},{"tid":"42","name":"Arraiolos","parent":"35","coord_x":"-7.985721","coord_y":"38.724369"},{"tid":"43","name":"Arronches","parent":"35","coord_x":"-7.284875","coord_y":"39.123035"},{"tid":"214","name":"Arruda dos Vinhos","parent":"118","coord_x":"-9.076902","coord_y":"38.984837"},{"tid":"128","name":"Aveiro","parent":"118","coord_x":"-8.642220","coord_y":"40.643921"},{"tid":"44","name":"Avis","parent":"35","coord_x":"-7.890836","coord_y":"39.055504"},{"tid":"215","name":"Azambuja","parent":"35","coord_x":"-8.869303","coord_y":"39.069309"},{"tid":"297","name":"Bai\u00e3o","parent":"285","coord_x":"-8.035724","coord_y":"41.162292"},{"tid":"298","name":"Barcelos","parent":"285","coord_x":"-8.618493","coord_y":"41.534058"},{"tid":"45","name":"Barrancos","parent":"35","coord_x":"-6.977489","coord_y":"38.133064"},{"tid":"217","name":"Barreiro","parent":"204","coord_x":"-9.078585","coord_y":"38.662312"},{"tid":"218","name":"Batalha","parent":"118","coord_x":"-8.824290","coord_y":"39.657906"},{"tid":"46","name":"Beja","parent":"35","coord_x":"-7.863075","coord_y":"38.014996"},{"tid":"130","name":"Belmonte","parent":"118","coord_x":"-7.349496","coord_y":"40.358547"},{"tid":"219","name":"Benavente","parent":"35","coord_x":"-8.809075","coord_y":"38.982010"},{"tid":"221","name":"Bombarral","parent":"118","coord_x":"-9.156376","coord_y":"39.268543"},{"tid":"48","name":"Borba","parent":"35","coord_x":"-7.457584","coord_y":"38.804970"},{"tid":"299","name":"Boticas","parent":"285","coord_x":"-7.665480","coord_y":"41.688526"},{"tid":"300","name":"Braga","parent":"285","coord_x":"-8.425066","coord_y":"41.550648"},{"tid":"301","name":"Bragan\u00e7a","parent":"285","coord_x":"-6.755275","coord_y":"41.805477"},{"tid":"131","name":"Bu\u00e7aco","parent":"118","coord_x":"-8.361597","coord_y":"40.379436"},{"tid":"302","name":"Cabeceiras de Basto","parent":"285","coord_x":"-8.015695","coord_y":"41.549381"},{"tid":"222","name":"Cadaval","parent":"118","coord_x":"-9.103466","coord_y":"39.243591"},{"tid":"223","name":"Caldas da Rainha","parent":"118","coord_x":"-9.136231","coord_y":"39.404808"},{"tid":"303","name":"Caminha","parent":"285","coord_x":"-8.838976","coord_y":"41.877037"},{"tid":"49","name":"Campo Maior","parent":"35","coord_x":"-7.069960","coord_y":"39.013233"},{"tid":"132","name":"Cantanhede","parent":"118","coord_x":"-8.593609","coord_y":"40.347626"},{"tid":"304","name":"Carrazeda de Ansi\u00e3es","parent":"285","coord_x":"-7.305393","coord_y":"41.243149"},{"tid":"134","name":"Carregal do Sal","parent":"118","coord_x":"-8.000511","coord_y":"40.434254"},{"tid":"224","name":"Cartaxo","parent":"35","coord_x":"-8.789096","coord_y":"39.162865"},{"tid":"225","name":"Cascais","parent":"204","coord_x":"-9.422468","coord_y":"38.698246"},{"tid":"135","name":"Castanheira de P\u00eara","parent":"118","coord_x":"-8.212233","coord_y":"40.006405"},{"tid":"136","name":"Castelo Branco","parent":"118","coord_x":"-7.492888","coord_y":"39.824581"},{"tid":"287","name":"Castelo de Paiva","parent":"285","coord_x":"-8.273155","coord_y":"41.040958"},{"tid":"50","name":"Castelo de Vide","parent":"35","coord_x":"-7.454896","coord_y":"39.416302"},{"tid":"137","name":"Castelo Mendo","parent":"118","coord_x":"-6.950965","coord_y":"40.592201"},{"tid":"138","name":"Castelo Novo","parent":"118","coord_x":"-7.495643","coord_y":"40.077587"},{"tid":"139","name":"Castelo Rodrigo","parent":"118","coord_x":"-6.963916","coord_y":"40.876595"},{"tid":"140","name":"Castro Daire","parent":"118","coord_x":"-7.934203","coord_y":"40.898010"},{"tid":"100","name":"Castro Marim","parent":"93","coord_x":"-7.443211","coord_y":"37.218987"},{"tid":"51","name":"Castro Verde","parent":"35","coord_x":"-8.085712","coord_y":"37.698269"},{"tid":"141","name":"Celorico da Beira","parent":"118","coord_x":"-7.393843","coord_y":"40.635834"},{"tid":"305","name":"Celorico de Basto","parent":"285","coord_x":"-7.987683","coord_y":"41.391754"},{"tid":"226","name":"Chamusca","parent":"35","coord_x":"-8.482020","coord_y":"39.356106"},{"tid":"306","name":"Chaves","parent":"285","coord_x":"-7.469811","coord_y":"41.739998"},{"tid":"307","name":"Cinf\u00e3es","parent":"285","coord_x":"-8.090334","coord_y":"41.072258"},{"tid":"142","name":"Coimbra","parent":"118","coord_x":"-8.427385","coord_y":"40.210056"},{"tid":"143","name":"Condeixa-a-Nova","parent":"118","coord_x":"-8.498328","coord_y":"40.115208"},{"tid":"144","name":"Con\u00edmbriga","parent":"118","coord_x":"-8.490038","coord_y":"40.098938"},{"tid":"228","name":"Const\u00e2ncia","parent":"118","coord_x":"-8.338954","coord_y":"39.475662"},{"tid":"229","name":"Coruche","parent":"35","coord_x":"-8.526178","coord_y":"38.958546"},{"tid":"230","name":"Costa de Caparica","parent":"204","coord_x":"-9.229812","coord_y":"38.642696"},{"tid":"145","name":"Covilh\u00e3","parent":"118","coord_x":"-7.505889","coord_y":"40.280838"},{"tid":"52","name":"Crato","parent":"35","coord_x":"-7.645200","coord_y":"39.285961"},{"tid":"53","name":"Cuba","parent":"35","coord_x":"-7.892077","coord_y":"38.166023"},{"tid":"146","name":"Curia","parent":"118","coord_x":"-8.461963","coord_y":"40.427780"},{"tid":"54","name":"Elvas","parent":"35","coord_x":"-7.162524","coord_y":"38.880314"},{"tid":"231","name":"Entroncamento","parent":"118","coord_x":"-8.469376","coord_y":"39.465252"},{"tid":"232","name":"Ericeira","parent":"204","coord_x":"-9.417285","coord_y":"38.963890"},{"tid":"308","name":"Espinho","parent":"285","coord_x":"-8.642497","coord_y":"41.006336"},{"tid":"309","name":"Esposende","parent":"285","coord_x":"-8.781453","coord_y":"41.530968"},{"tid":"147","name":"Estarreja","parent":"118","coord_x":"-8.569335","coord_y":"40.754250"},{"tid":"233","name":"Estoril","parent":"204","coord_x":"-9.403907","coord_y":"38.707970"},{"tid":"55","name":"Estremoz","parent":"35","coord_x":"-7.588733","coord_y":"38.842770"},{"tid":"56","name":"\u00c9vora","parent":"35","coord_x":"-7.908758","coord_y":"38.571564"},{"tid":"310","name":"Fafe","parent":"285","coord_x":"-8.167740","coord_y":"41.451221"},{"tid":"101","name":"Faro","parent":"93","coord_x":"-7.933701","coord_y":"37.018032"},{"tid":"234","name":"F\u00e1tima","parent":"118","coord_x":"-8.665296","coord_y":"39.625488"},{"tid":"311","name":"Felgueiras","parent":"285","coord_x":"-8.196918","coord_y":"41.365898"},{"tid":"58","name":"Ferreira do Alentejo","parent":"35","coord_x":"-8.117297","coord_y":"38.059345"},{"tid":"235","name":"Ferreira do Z\u00eazere","parent":"118","coord_x":"-8.290741","coord_y":"39.693176"},{"tid":"148","name":"Figueira da Foz","parent":"118","coord_x":"-8.857521","coord_y":"40.152531"},{"tid":"149","name":"Figueira de Castelo Rodrigo","parent":"118","coord_x":"-6.962561","coord_y":"40.896484"},{"tid":"150","name":"Figueir\u00f3 dos Vinhos","parent":"118","coord_x":"-8.276426","coord_y":"39.902889"},{"tid":"151","name":"Fornos de Algodres","parent":"118","coord_x":"-7.538847","coord_y":"40.621616"},{"tid":"312","name":"Freixo de Espada \u00e0 Cinta","parent":"285","coord_x":"-6.806549","coord_y":"41.091789"},{"tid":"59","name":"Fronteira","parent":"35","coord_x":"-7.648283","coord_y":"39.057129"},{"tid":"279","name":"Funchal","parent":"278","coord_x":"-16.905905","coord_y":"32.647472"},{"tid":"152","name":"Fund\u00e3o","parent":"118","coord_x":"-7.497842","coord_y":"40.139149"},{"tid":"60","name":"Gavi\u00e3o","parent":"35","coord_x":"-7.934460","coord_y":"39.465721"},{"tid":"153","name":"G\u00f3is","parent":"118","coord_x":"-8.110245","coord_y":"40.154774"},{"tid":"236","name":"Goleg\u00e3","parent":"35","coord_x":"-8.485291","coord_y":"39.404922"},{"tid":"313","name":"Gondomar","parent":"285","coord_x":"-8.527875","coord_y":"41.140503"},{"tid":"154","name":"Gouveia","parent":"118","coord_x":"-7.593406","coord_y":"40.494476"},{"tid":"61","name":"Gr\u00e2ndola","parent":"35","coord_x":"-8.567490","coord_y":"38.176258"},{"tid":"155","name":"Guarda","parent":"118","coord_x":"-7.267009","coord_y":"40.538300"},{"tid":"314","name":"Guimar\u00e3es","parent":"285","coord_x":"-8.294543","coord_y":"41.443130"},{"tid":"23","name":"Horta","parent":"21","coord_x":"-28.624830","coord_y":"38.539886"},{"tid":"156","name":"Idanha-a-Nova","parent":"118","coord_x":"-7.237459","coord_y":"39.922153"},{"tid":"157","name":"Idanha-a-Velha","parent":"118","coord_x":"-7.143968","coord_y":"39.996868"},{"tid":"24","name":"Ilha da Graciosa","parent":"21","coord_x":"-28.004028","coord_y":"39.085506"},{"tid":"280","name":"Ilha da Madeira","parent":"278","coord_x":"-16.905905","coord_y":"32.647472"},{"tid":"25","name":"Ilha das Flores","parent":"21","coord_x":"-31.127666","coord_y":"39.452553"},{"tid":"281","name":"Ilha de Porto Santo","parent":"278","coord_x":"-16.333616","coord_y":"33.059647"},{"tid":"26","name":"Ilha de Santa Maria","parent":"21","coord_x":"-25.143597","coord_y":"36.952934"},{"tid":"27","name":"Ilha de S\u00e3o Jorge","parent":"21","coord_x":"-28.205318","coord_y":"38.680038"},{"tid":"28","name":"Ilha de S\u00e3o Miguel","parent":"21","coord_x":"-25.682659","coord_y":"37.734947"},{"tid":"29","name":"Ilha do Corvo","parent":"21","coord_x":"-31.111750","coord_y":"39.672028"},{"tid":"30","name":"Ilha do Faial","parent":"21","coord_x":"-28.624979","coord_y":"38.539871"},{"tid":"31","name":"Ilha do Pico","parent":"21","coord_x":"-28.251375","coord_y":"38.393944"},{"tid":"32","name":"Ilha Terceira","parent":"21","coord_x":"-27.220774","coord_y":"38.654354"},{"tid":"158","name":"\u00cdlhavo","parent":"118","coord_x":"-8.669685","coord_y":"40.600723"},{"tid":"102","name":"Lagoa","parent":"93","coord_x":"-8.452965","coord_y":"37.134819"},{"tid":"103","name":"Lagos","parent":"93","coord_x":"-8.673839","coord_y":"37.101685"},{"tid":"315","name":"Lamego","parent":"285","coord_x":"-7.809141","coord_y":"41.097187"},{"tid":"238","name":"Leiria","parent":"118","coord_x":"-8.808893","coord_y":"39.744560"},{"tid":"159","name":"Linhares da Beira","parent":"118","coord_x":"-7.462515","coord_y":"40.540100"},{"tid":"239","name":"Lisboa","parent":"204","coord_x":"-9.139776","coord_y":"38.720528"},{"tid":"104","name":"Loul\u00e9","parent":"93","coord_x":"-8.022892","coord_y":"37.138966"},{"tid":"240","name":"Loures","parent":"204","coord_x":"-9.168231","coord_y":"38.830425"},{"tid":"241","name":"Lourinh\u00e3","parent":"118","coord_x":"-9.312543","coord_y":"39.241764"},{"tid":"160","name":"Lous\u00e3","parent":"118","coord_x":"-8.248108","coord_y":"40.114765"},{"tid":"316","name":"Lousada","parent":"285","coord_x":"-8.280853","coord_y":"41.277870"},{"tid":"161","name":"Luso","parent":"118","coord_x":"-8.377368","coord_y":"40.383881"},{"tid":"242","name":"Ma\u00e7\u00e3o","parent":"118","coord_x":"-7.996491","coord_y":"39.554356"},{"tid":"317","name":"Macedo de Cavaleiros","parent":"285","coord_x":"-6.959896","coord_y":"41.539101"},{"tid":"243","name":"Mafra","parent":"204","coord_x":"-9.333214","coord_y":"38.941570"},{"tid":"318","name":"Maia","parent":"285","coord_x":"-8.622187","coord_y":"41.232857"},{"tid":"162","name":"Mangualde","parent":"118","coord_x":"-7.761961","coord_y":"40.605419"},{"tid":"163","name":"Manteigas","parent":"118","coord_x":"-7.538477","coord_y":"40.401859"},{"tid":"319","name":"Marco de Canaveses","parent":"285","coord_x":"-8.149258","coord_y":"41.185406"},{"tid":"320","name":"Marialva","parent":"118","coord_x":"-7.233432","coord_y":"40.910164"},{"tid":"244","name":"Marinha Grande","parent":"118","coord_x":"-8.931654","coord_y":"39.749989"},{"tid":"62","name":"Marv\u00e3o","parent":"35","coord_x":"-7.376604","coord_y":"39.394341"},{"tid":"322","name":"Matosinhos","parent":"285","coord_x":"-8.689859","coord_y":"41.181213"},{"tid":"164","name":"Mealhada","parent":"118","coord_x":"-8.451912","coord_y":"40.377644"},{"tid":"323","name":"Meda","parent":"118","coord_x":"-7.259985","coord_y":"40.964081"},{"tid":"324","name":"Melga\u00e7o","parent":"285","coord_x":"-8.260303","coord_y":"42.114319"},{"tid":"63","name":"Melides","parent":"35","coord_x":"-8.728119","coord_y":"38.147057"},{"tid":"64","name":"M\u00e9rtola","parent":"35","coord_x":"-7.662788","coord_y":"37.639210"},{"tid":"325","name":"Mes\u00e3o Frio","parent":"285","coord_x":"-7.886512","coord_y":"41.161106"},{"tid":"165","name":"Mira","parent":"118","coord_x":"-8.735808","coord_y":"40.428299"},{"tid":"166","name":"Miranda do Corvo","parent":"118","coord_x":"-8.333603","coord_y":"40.093384"},{"tid":"326","name":"Miranda do Douro","parent":"285","coord_x":"-6.274595","coord_y":"41.494484"},{"tid":"327","name":"Mirandela","parent":"285","coord_x":"-7.182266","coord_y":"41.485813"},{"tid":"328","name":"Mogadouro","parent":"285","coord_x":"-6.713117","coord_y":"41.340748"},{"tid":"329","name":"Moimenta da Beira","parent":"285","coord_x":"-7.612618","coord_y":"40.980843"},{"tid":"245","name":"Moita","parent":"204","coord_x":"-8.990512","coord_y":"38.652012"},{"tid":"330","name":"Moledo do Minho","parent":"285","coord_x":"-8.864108","coord_y":"41.847801"},{"tid":"331","name":"Mon\u00e7\u00e3o","parent":"285","coord_x":"-8.482190","coord_y":"42.078789"},{"tid":"105","name":"Monchique","parent":"93","coord_x":"-8.555841","coord_y":"37.319527"},{"tid":"332","name":"Mondim de Basto","parent":"285","coord_x":"-7.953818","coord_y":"41.412441"},{"tid":"65","name":"Monforte","parent":"35","coord_x":"-7.439484","coord_y":"39.052856"},{"tid":"167","name":"Monfortinho","parent":"118","coord_x":"-6.915895","coord_y":"40.003609"},{"tid":"168","name":"Monsanto","parent":"118","coord_x":"-7.115328","coord_y":"40.039089"},{"tid":"66","name":"Monsaraz","parent":"35","coord_x":"-7.380538","coord_y":"38.443478"},{"tid":"333","name":"Montalegre","parent":"285","coord_x":"-7.791044","coord_y":"41.824642"},{"tid":"106","name":"Monte Gordo","parent":"93","coord_x":"-7.452496","coord_y":"37.180519"},{"tid":"246","name":"Monte Real","parent":"118","coord_x":"-8.863019","coord_y":"39.850880"},{"tid":"68","name":"Montemor-o-Novo","parent":"35","coord_x":"-8.216261","coord_y":"38.647148"},{"tid":"169","name":"Montemor-o-Velho","parent":"118","coord_x":"-8.684223","coord_y":"40.173481"},{"tid":"247","name":"Montijo","parent":"204","coord_x":"-8.973032","coord_y":"38.705444"},{"tid":"69","name":"Mora","parent":"35","coord_x":"-8.165840","coord_y":"38.944839"},{"tid":"170","name":"Mort\u00e1gua","parent":"118","coord_x":"-8.230795","coord_y":"40.396641"},{"tid":"70","name":"Moura","parent":"35","coord_x":"-7.449662","coord_y":"38.140766"},{"tid":"71","name":"Mour\u00e3o","parent":"35","coord_x":"-7.342902","coord_y":"38.382614"},{"tid":"334","name":"Mur\u00e7a","parent":"285","coord_x":"-7.454416","coord_y":"41.407673"},{"tid":"171","name":"Murtosa","parent":"118","coord_x":"-8.638583","coord_y":"40.737411"},{"tid":"248","name":"Nazar\u00e9","parent":"118","coord_x":"-9.071867","coord_y":"39.600384"},{"tid":"172","name":"Nelas","parent":"118","coord_x":"-7.852043","coord_y":"40.532505"},{"tid":"73","name":"Nisa","parent":"35","coord_x":"-7.648552","coord_y":"39.517971"},{"tid":"250","name":"\u00d3bidos","parent":"118","coord_x":"-9.157201","coord_y":"39.361103"},{"tid":"74","name":"Odemira","parent":"35","coord_x":"-8.641494","coord_y":"37.596554"},{"tid":"251","name":"Odivelas","parent":"204","coord_x":"-9.182675","coord_y":"38.789597"},{"tid":"252","name":"Oeiras","parent":"204","coord_x":"-9.311732","coord_y":"38.691753"},{"tid":"253","name":"Oleiros","parent":"118","coord_x":"-7.914047","coord_y":"39.917686"},{"tid":"108","name":"Olh\u00e3o","parent":"93","coord_x":"-7.841961","coord_y":"37.027325"},{"tid":"288","name":"Oliveira de Azem\u00e9is","parent":"285","coord_x":"-8.477610","coord_y":"40.840088"},{"tid":"174","name":"Oliveira de Frades","parent":"118","coord_x":"-8.176466","coord_y":"40.733009"},{"tid":"175","name":"Oliveira do Bairro","parent":"118","coord_x":"-8.493696","coord_y":"40.517143"},{"tid":"176","name":"Oliveira do Hospital","parent":"118","coord_x":"-7.862279","coord_y":"40.359707"},{"tid":"254","name":"Our\u00e9m","parent":"118","coord_x":"-8.577056","coord_y":"39.656551"},{"tid":"75","name":"Ourique","parent":"35","coord_x":"-8.224623","coord_y":"37.651463"},{"tid":"177","name":"Ovar","parent":"118","coord_x":"-8.626084","coord_y":"40.860703"},{"tid":"336","name":"Pa\u00e7os de Ferreira","parent":"285","coord_x":"-8.374637","coord_y":"41.277664"},{"tid":"255","name":"Palmela","parent":"204","coord_x":"-8.901289","coord_y":"38.569016"},{"tid":"178","name":"Pampilhosa da Serra","parent":"118","coord_x":"-7.951617","coord_y":"40.045773"},{"tid":"337","name":"Paredes","parent":"285","coord_x":"-8.331588","coord_y":"41.206146"},{"tid":"338","name":"Paredes de Coura","parent":"285","coord_x":"-8.561780","coord_y":"41.912914"},{"tid":"179","name":"Pedrog\u00e3o Grande","parent":"118","coord_x":"-8.142876","coord_y":"39.918694"},{"tid":"180","name":"Penacova","parent":"118","coord_x":"-8.280298","coord_y":"40.270535"},{"tid":"339","name":"Penafiel","parent":"285","coord_x":"-8.285450","coord_y":"41.206310"},{"tid":"181","name":"Penalva do Castelo","parent":"118","coord_x":"-7.695626","coord_y":"40.676739"},{"tid":"182","name":"Penamacor","parent":"118","coord_x":"-7.170482","coord_y":"40.168377"},{"tid":"340","name":"Penedono","parent":"285","coord_x":"-7.394549","coord_y":"40.989578"},{"tid":"183","name":"Penela","parent":"118","coord_x":"-8.390672","coord_y":"40.029335"},{"tid":"256","name":"Peniche","parent":"118","coord_x":"-9.380745","coord_y":"39.356430"},{"tid":"341","name":"Peso da R\u00e9gua","parent":"285","coord_x":"-7.787478","coord_y":"41.160061"},{"tid":"342","name":"Pinh\u00e3o","parent":"285","coord_x":"-7.547674","coord_y":"41.192387"},{"tid":"184","name":"Pinhel","parent":"118","coord_x":"-7.068127","coord_y":"40.774086"},{"tid":"185","name":"Pi\u00f3d\u00e3o","parent":"118","coord_x":"-7.824722","coord_y":"40.229782"},{"tid":"257","name":"Pombal","parent":"118","coord_x":"-8.627831","coord_y":"39.914742"},{"tid":"34","name":"Ponta Delgada","parent":"21","coord_x":"-25.682629","coord_y":"37.734951"},{"tid":"343","name":"Ponte da Barca","parent":"285","coord_x":"-8.417983","coord_y":"41.807693"},{"tid":"344","name":"Ponte de Lima","parent":"285","coord_x":"-8.584338","coord_y":"41.767307"},{"tid":"76","name":"Ponte de Sor","parent":"35","coord_x":"-8.010494","coord_y":"39.248646"},{"tid":"77","name":"Portalegre","parent":"35","coord_x":"-7.430914","coord_y":"39.292336"},{"tid":"78","name":"Portel","parent":"35","coord_x":"-7.703882","coord_y":"38.308743"},{"tid":"109","name":"Portim\u00e3o","parent":"93","coord_x":"-8.536924","coord_y":"37.140785"},{"tid":"345","name":"Porto","parent":"285","coord_x":"-8.629256","coord_y":"41.158039"},{"tid":"79","name":"Porto Covo","parent":"35","coord_x":"-8.792148","coord_y":"37.850574"},{"tid":"258","name":"Porto de M\u00f3s","parent":"118","coord_x":"-8.817468","coord_y":"39.602451"},{"tid":"346","name":"P\u00f3voa de Lanhoso","parent":"285","coord_x":"-8.270182","coord_y":"41.576447"},{"tid":"347","name":"P\u00f3voa de Varzim","parent":"285","coord_x":"-8.763905","coord_y":"41.379539"},{"tid":"259","name":"Proen\u00e7a-a-Nova","parent":"118","coord_x":"-7.924330","coord_y":"39.750206"},{"tid":"110","name":"Quarteira","parent":"93","coord_x":"-8.104811","coord_y":"37.073364"},{"tid":"80","name":"Redondo","parent":"35","coord_x":"-7.545325","coord_y":"38.648357"},{"tid":"81","name":"Reguengos de Monsaraz","parent":"35","coord_x":"-7.533900","coord_y":"38.425522"},{"tid":"348","name":"Resende","parent":"285","coord_x":"-7.964453","coord_y":"41.105618"},{"tid":"349","name":"Ribeira de Pena","parent":"285","coord_x":"-7.795873","coord_y":"41.521309"},{"tid":"261","name":"Rio Maior","parent":"35","coord_x":"-8.938128","coord_y":"39.336727"},{"tid":"350","name":"Sabrosa","parent":"285","coord_x":"-7.576853","coord_y":"41.268234"},{"tid":"186","name":"Sabugal","parent":"118","coord_x":"-7.090537","coord_y":"40.351761"},{"tid":"111","name":"Sagres","parent":"93","coord_x":"-8.937517","coord_y":"37.009361"},{"tid":"262","name":"Salvaterra de Magos","parent":"35","coord_x":"-8.792646","coord_y":"39.028568"},{"tid":"187","name":"Santa Comba D\u00e3o","parent":"118","coord_x":"-8.133796","coord_y":"40.395756"},{"tid":"351","name":"Santa Maria da Feira","parent":"285","coord_x":"-8.542112","coord_y":"40.924637"},{"tid":"352","name":"Santa Marta de Penagui\u00e3o","parent":"285","coord_x":"-7.787991","coord_y":"41.210335"},{"tid":"263","name":"Santar\u00e9m","parent":"35","coord_x":"-8.683809","coord_y":"39.235569"},{"tid":"82","name":"Santiago do Cac\u00e9m","parent":"35","coord_x":"-8.696630","coord_y":"38.016743"},{"tid":"353","name":"Santo Tirso","parent":"285","coord_x":"-8.474302","coord_y":"41.341515"},{"tid":"112","name":"S\u00e3o Br\u00e1s de Alportel","parent":"93","coord_x":"-7.888304","coord_y":"37.152542"},{"tid":"289","name":"S\u00e3o Jo\u00e3o da Madeira","parent":"285","coord_x":"-8.492376","coord_y":"40.903179"},{"tid":"354","name":"S\u00e3o Jo\u00e3o da Pesqueira","parent":"285","coord_x":"-7.404804","coord_y":"41.148388"},{"tid":"264","name":"S\u00e3o Martinho do Porto","parent":"118","coord_x":"-9.134419","coord_y":"39.512405"},{"tid":"188","name":"S\u00e3o Pedro do Sul","parent":"118","coord_x":"-8.064436","coord_y":"40.760883"},{"tid":"265","name":"Sardoal","parent":"118","coord_x":"-8.161532","coord_y":"39.534004"},{"tid":"189","name":"S\u00e1t\u00e3o","parent":"118","coord_x":"-7.732783","coord_y":"40.742054"},{"tid":"190","name":"Seia","parent":"118","coord_x":"-7.709377","coord_y":"40.416176"},{"tid":"266","name":"Seixal","parent":"204","coord_x":"-9.105380","coord_y":"38.643097"},{"tid":"355","name":"Sernancelhe","parent":"285","coord_x":"-7.493668","coord_y":"40.899384"},{"tid":"83","name":"Serpa","parent":"35","coord_x":"-7.596914","coord_y":"37.942944"},{"tid":"267","name":"Sert\u00e3","parent":"118","coord_x":"-8.098713","coord_y":"39.806660"},{"tid":"268","name":"Sesimbra","parent":"204","coord_x":"-9.103017","coord_y":"38.444145"},{"tid":"269","name":"Set\u00fabal","parent":"204","coord_x":"-8.888035","coord_y":"38.527134"},{"tid":"191","name":"Sever do Vouga","parent":"118","coord_x":"-8.370666","coord_y":"40.734219"},{"tid":"113","name":"Silves","parent":"93","coord_x":"-8.440108","coord_y":"37.188629"},{"tid":"84","name":"Sines","parent":"35","coord_x":"-8.865865","coord_y":"37.956772"},{"tid":"270","name":"Sintra","parent":"204","coord_x":"-9.381097","coord_y":"38.803158"},{"tid":"271","name":"Sobral de Monte Agra\u00e7o","parent":"118","coord_x":"-9.151403","coord_y":"39.018826"},{"tid":"192","name":"Sortelha","parent":"118","coord_x":"-7.215056","coord_y":"40.329376"},{"tid":"193","name":"Soure","parent":"118","coord_x":"-8.627131","coord_y":"40.059532"},{"tid":"85","name":"Sousel","parent":"35","coord_x":"-7.676114","coord_y":"38.953659"},{"tid":"194","name":"T\u00e1bua","parent":"118","coord_x":"-8.028667","coord_y":"40.360271"},{"tid":"356","name":"Tabua\u00e7o","parent":"285","coord_x":"-7.567263","coord_y":"41.117153"},{"tid":"357","name":"Tarouca","parent":"285","coord_x":"-7.774214","coord_y":"41.017181"},{"tid":"114","name":"Tavira","parent":"93","coord_x":"-7.648334","coord_y":"37.127556"},{"tid":"358","name":"Terras de Bouro","parent":"285","coord_x":"-8.308328","coord_y":"41.719147"},{"tid":"272","name":"Tomar","parent":"118","coord_x":"-8.413643","coord_y":"39.603760"},{"tid":"195","name":"Tondela","parent":"118","coord_x":"-8.079265","coord_y":"40.516819"},{"tid":"359","name":"Torre de Moncorvo","parent":"285","coord_x":"-7.051730","coord_y":"41.174858"},{"tid":"273","name":"Torres Novas","parent":"118","coord_x":"-8.539416","coord_y":"39.479218"},{"tid":"274","name":"Torres Vedras","parent":"118","coord_x":"-9.259580","coord_y":"39.092262"},{"tid":"196","name":"Trancoso","parent":"118","coord_x":"-7.348438","coord_y":"40.778950"},{"tid":"360","name":"Trofa","parent":"285","coord_x":"-8.559621","coord_y":"41.337318"},{"tid":"86","name":"Tr\u00f3ia","parent":"35","coord_x":"-8.900155","coord_y":"38.489899"},{"tid":"197","name":"Vagos","parent":"118","coord_x":"-8.680950","coord_y":"40.554939"},{"tid":"290","name":"Vale de Cambra","parent":"285","coord_x":"-8.393324","coord_y":"40.849541"},{"tid":"361","name":"Valen\u00e7a","parent":"285","coord_x":"-8.642227","coord_y":"42.026890"},{"tid":"362","name":"Valongo","parent":"285","coord_x":"-8.497887","coord_y":"41.189476"},{"tid":"363","name":"Valpa\u00e7os","parent":"285","coord_x":"-7.311446","coord_y":"41.608444"},{"tid":"87","name":"Vendas Novas","parent":"35","coord_x":"-8.456398","coord_y":"38.679054"},{"tid":"88","name":"Viana do Alentejo","parent":"35","coord_x":"-8.002503","coord_y":"38.333431"},{"tid":"364","name":"Viana do Castelo","parent":"285","coord_x":"-8.828434","coord_y":"41.692604"},{"tid":"365","name":"Vidago","parent":"285","coord_x":"-7.570803","coord_y":"41.641075"},{"tid":"89","name":"Vidigueira","parent":"35","coord_x":"-7.799622","coord_y":"38.211006"},{"tid":"366","name":"Vieira do Minho","parent":"285","coord_x":"-8.141049","coord_y":"41.634373"},{"tid":"275","name":"Vila de Rei","parent":"118","coord_x":"-8.146860","coord_y":"39.675995"},{"tid":"115","name":"Vila do Bispo","parent":"93","coord_x":"-8.910431","coord_y":"37.082893"},{"tid":"367","name":"Vila do Conde","parent":"285","coord_x":"-8.743780","coord_y":"41.352009"},{"tid":"368","name":"Vila Flor","parent":"285","coord_x":"-7.152581","coord_y":"41.307526"},{"tid":"276","name":"Vila Franca de Xira","parent":"204","coord_x":"-8.988951","coord_y":"38.955631"},{"tid":"277","name":"Vila Nova da Barquinha","parent":"118","coord_x":"-8.433592","coord_y":"39.459293"},{"tid":"369","name":"Vila Nova de Cerveira","parent":"285","coord_x":"-8.745188","coord_y":"41.940567"},{"tid":"370","name":"Vila Nova de Famalic\u00e3o","parent":"285","coord_x":"-8.519436","coord_y":"41.408783"},{"tid":"371","name":"Vila Nova de Foz C\u00f4a","parent":"285","coord_x":"-7.138699","coord_y":"41.082764"},{"tid":"372","name":"Vila Nova de Gaia","parent":"285","coord_x":"-8.618198","coord_y":"41.135159"},{"tid":"90","name":"Vila Nova de Milfontes","parent":"35","coord_x":"-8.782265","coord_y":"37.724293"},{"tid":"198","name":"Vila Nova de Paiva","parent":"118","coord_x":"-7.730494","coord_y":"40.851254"},{"tid":"199","name":"Vila Nova de Poiares","parent":"118","coord_x":"-8.258967","coord_y":"40.211205"},{"tid":"373","name":"Vila Pouca de Aguiar","parent":"285","coord_x":"-7.644160","coord_y":"41.500561"},{"tid":"374","name":"Vila Praia de \u00c2ncora","parent":"285","coord_x":"-8.853520","coord_y":"41.812775"},{"tid":"375","name":"Vila Real","parent":"285","coord_x":"-7.753212","coord_y":"41.298042"},{"tid":"116","name":"Vila Real de Santo Ant\u00f3nio","parent":"93","coord_x":"-7.416197","coord_y":"37.194321"},{"tid":"200","name":"Vila Velha de R\u00f3d\u00e3o","parent":"118","coord_x":"-7.672459","coord_y":"39.654877"},{"tid":"376","name":"Vila Verde","parent":"285","coord_x":"-8.431941","coord_y":"41.652439"},{"tid":"91","name":"Vila Vi\u00e7osa","parent":"35","coord_x":"-7.418599","coord_y":"38.779804"},{"tid":"117","name":"Vilamoura","parent":"93","coord_x":"-8.122456","coord_y":"37.102505"},{"tid":"377","name":"Vimioso","parent":"285","coord_x":"-6.527799","coord_y":"41.584778"},{"tid":"378","name":"Vinhais","parent":"285","coord_x":"-7.000452","coord_y":"41.835003"},{"tid":"202","name":"Viseu","parent":"118","coord_x":"-7.912637","coord_y":"40.657326"},{"tid":"379","name":"Vizela","parent":"285","coord_x":"-8.309599","coord_y":"41.376549"},{"tid":"203","name":"Vouzela","parent":"118","coord_x":"-8.109176","coord_y":"40.723072"},{"tid":"92","name":"Zambujeira do Mar","parent":"35","coord_x":"-8.785097","coord_y":"37.524284"}]`
            visitMaps.localitiesList = {};
            const parsedJson = JSON.parse(json);
            parsedJson.forEach(obj => {
                if (!visitMaps.localitiesList[obj.parent])
                    visitMaps.localitiesList[obj.parent] = [];
                visitMaps.localitiesList[obj.parent].push({
                    tid: obj.tid,
                    coord_x: obj.coord_x,
                    coord_y: obj.coord_y,
                    name: obj.name
                });
            });

            // Seleccionar opção caso tenha sido passada como parametro
            if (!isNaN(selected_value)) {
                $('#localitySelect').val(selected_value);
                if (go !== false){
                  $('#btn_ok').click();
                }
            };

            Foundation.libs.forms.refresh_custom_select($('#localitySelect'), true);
            completed += 1;
            if (completed >= 3) {
                hideLoading();
            }


    $('#localitySelect').change(function(event) {
        value = $('#localitySelect :selected').attr('value');
        if (value != -1) {
            lat = $('#localitySelect :selected').attr('data-lat');
            lon = $('#localitySelect :selected').attr('data-lon');
            latlon = new L.latLng(parseFloat(lat), parseFloat(lon));

            visitMaps.map.panTo(latlon);
        }
    });
    return false;
}

function fillCategoriesOptions() {
    const json = `[{"tid":"490","name":"Accommodation","parent":"0"},{"tid":"485","name":"Activities","parent":"0"},{"tid":"3","name":"Bars and Discotheques","parent":"0"},{"tid":"486","name":"Baths, Spas and Thalassotherapy","parent":"0"},{"tid":"404","name":"Beaches","parent":"0"},{"tid":"574","name":"Brochures Maps and Videos","parent":"0"},{"tid":"388","name":"Casinos","parent":"0"},{"tid":"389","name":"Embassies and Delegations","parent":"0"},{"tid":"479","name":"Events","parent":"0"},{"tid":"478","name":"Gardens, Parks and Forests ","parent":"0"},{"tid":"385","name":"Golf","parent":"0"},{"tid":"395","name":"Marinas and Harbours","parent":"0"},{"tid":"402","name":"Museums, Monuments and Sites","parent":"0"},{"tid":"488","name":"Other Interesting Features","parent":"0"},{"tid":"482","name":"Protected Areas","parent":"0"},{"tid":"507","name":"Regular Transport Services","parent":"0"},{"tid":"515","name":"Rent-a-Car and Caravans","parent":"0"},{"tid":"405","name":"Restaurants and Caf\u00e9s","parent":"0"},{"tid":"511","name":"Science and Knowledge","parent":"0"},{"tid":"400","name":"Theme Parks","parent":"0"},{"tid":"396","name":"Tour Operators","parent":"0"},{"tid":"562","name":"Tours and Other Tourism Services","parent":"0"},{"tid":"480","name":"Towns and Villages","parent":"0"},{"tid":"410","name":"Transport Companies","parent":"0"},{"tid":"409","name":"Transport Terminals","parent":"0"},{"tid":"477","name":"Travel Agencies","parent":"0"},{"tid":"397","name":"Useful Contacts","parent":"0"},{"tid":"517","name":"Zoos and Aquariums","parent":"0"}]`
    visitMaps.categoryList = {};
    const parsedJson = JSON.parse(json);
    parsedJson.forEach(obj => {
        $('#poiCategoryList').append('<label class="poiCategorySelectable"><input type="checkbox" value="' + obj.tid + '"> ' + obj.name + '</label>');
        visitMaps.categoryList[obj.tid] = obj.name;
    });
    completed += 1;
    if (completed >= 3) {
        hideLoading();
    }
    
    return false;
}

function updateAvailableLocalities() {
    $.each(regionLocality, function(i, obj) {
        $('#localitySelect').append('<option value="' + obj.tid + '">' + obj.name + '</option>');
        index = $.inArray(obj.parent, regionLocalityList);
        regionLocality[index][i] = obj.tid;
    });
}

function getURLParameter(param) {
    return decodeURI(
        (RegExp(param + '=' + '(.+?)(&|$)').exec(location.search) || [, null])[1]
    );
}

function ToGeographic(mercatorX_lon, mercatorY_lat) {
    if (Math.abs(mercatorX_lon) < 180 && Math.abs(mercatorY_lat) < 90)
        return;

    if ((Math.abs(mercatorX_lon) > 20037508.3427892) || (Math.abs(mercatorY_lat) > 20037508.3427892))
        return;

    x = mercatorX_lon;
    y = mercatorY_lat;
    num3 = x / 6378137.0;
    num4 = num3 * 57.295779513082323;
    num5 = Math.floor(((num4 + 180.0) / 360.0));
    num6 = num4 - (num5 * 360.0);
    num7 = 1.5707963267948966 - (2.0 * Math.atan(Math.exp((-1.0 * y) / 6378137.0)));
    mercatorX_lon = num6;
    mercatorY_lat = num7 * 57.295779513082323;

    return [mercatorX_lon, mercatorY_lat];
}

function ToWebMercator(mercatorX_lon, mercatorY_lat) {
    if ((Math.abs(mercatorX_lon) > 180 || Math.abs(mercatorY_lat) > 90))
        return;

    num = mercatorX_lon * 0.017453292519943295;
    x = 6378137.0 * num;
    a = mercatorY_lat * 0.017453292519943295;

    mercatorX_lon = x;
    mercatorY_lat = 3189068.5 * Math.log((1.0 + Math.sin(a)) / (1.0 - Math.sin(a)));
}

var myCrs = L.CRS.EPSG900913;
myCrs.scale = function(t) {
    return 512 * Math.pow(2, t);
};

visitMaps = new function() {
    this.sidePanelState = 0;
    this.map = null;
    this.poisList = [];
    this.routeLineLayer = null;
    this.markersLayer = null;

    this.markerIcon = L.Icon.extend({
        options: {
            shadowUrl: '',
            iconSize: [32, 32],
            shadowSize: [0, 0],
            iconAnchor: [16, 28],
            shadowAnchor: [0, 0],
            popupAnchor: [0, -30]
        }
    });

    this.init = function() {

        function zeroPad(number, length) {
            number = String(number);
            zeros = [];
            for (i = 0; i < length; ++i) {
                zeros.push('0');
            }
            return zeros.join('').substring(0, length - number.length) + number;
        }

        function tileYPad(value) {
            return zeroPad(Math.floor(value / 1000000), 3) + '/' + zeroPad(Math.floor(value / 1000), 3) + '/' + zeroPad(Math.floor(value % 1000), 3);
        }

        funcLayer = new L.TileLayer.Functional(function(view) {
            tileZ = Math.floor(view.zoom);
            tileX = Math.floor(view.tile.column);
            tileY = Math.floor(view.tile.row);

            components = [
                zeroPad(tileZ, 2),
                zeroPad(parseInt(tileX / 1000000), 3),
                zeroPad((parseInt(tileX / 1000) % 1000), 3),
                zeroPad((parseInt(tileX) % 1000), 3),
                tileYPad(Math.floor(Math.pow(2, tileZ) - 1 - parseInt(tileY))) + '.png'
            ];

            joinedComponents = components.join("/");

            url = "https://map{s}.infoportugal.info/cache/visit/{c}".replace('{c}', joinedComponents).replace('{s}', view.subdomain);
            return url;
        }, {
            subdomains: '7',
            tileSize: 512,
            crs: myCrs,
            // attribution: '&copy; 2013 <a href="http://www.infoportugal.pt">InfoPortugal S.A.</a>'
        });

        this.map = new L.Map('bigMap', {
            center: new L.LatLng(39.554883, -7.976074),
            zoom: 6,
            minZoom: 5,
            maxZoom: 18,
            layers: [funcLayer],
            maxBounds: new L.LatLngBounds([
                [48.865628, -42.453278],
                [28.305603, 13.302581]
            ]),
            crs: myCrs
        });


        // MAP CLICK
        this.map.on('click', function(e){
          $('#mouse-menu:visible').fadeOut(200);
        })

        this.map.on('contextmenu', function(e){
          var clickX = e.originalEvent.clientX;
          var clickY = e.originalEvent.clientY;
          context_menu_lat = e.latlng.lat;
          context_menu_lng = e.latlng.lng;
          $('#mouse-menu').css('top', clickY);
          $('#mouse-menu').css('left', clickX);
          $('#mouse-menu').fadeIn(200);
        })

        this.initMarkersLayer();
        this.initRouteLayer();
    };

    this.parseURLParameters = function(marker) {
        lat = parseFloat(decodeURIComponent(getURLParameter('lat')).replace(',', '.'));
        lng = parseFloat(decodeURIComponent(getURLParameter('lon')).replace(',', '.'));

        if ( (lat === parseFloat(lat)) && (lng === parseFloat(lng)) ) {
          processed = getURLParameter('processed');

          // if (processed == 0) {
              geojson = {
                  'geometry': {
                      'coordinates': [lng, lat]
                  }
              }
              if (marker === false) {
                //marker = visitMaps.addMarker(geojson, realHost + '/sites/all/themes/visitportugaltheme/img/pin_mapa.png');
                var nome_poi = getURLParameter('poiname');
                var url_poi = getURLParameter('poiurl');

                var saiba_mais_text = $('#know-more-message').text();
                var calcular_percurso_text = $('#calculate-route-message').text();
                var popup = new L.Popup();
                var HTML = '<div class="popupTitle"><a class="popupCloseButton" href="#" onclick="visitMaps.map.closePopup(); return false;"></a><label class="popupTitleText">' + nome_poi + '</label></div>' +
                    '    <div style="clear:both"></div>' +
                    '</div>' +
                    '<div class="popupOptions">' +
                    '    <a href="' + url_poi + '" target="_blank"><div class="popupOption" style="float:left; border-right:1px solid black">' + saiba_mais_text + '<div class="popupArrow"></div></div></a>' +
                    '    <a href="#" onclick="return routeQuery.routeTo([' + lng + ',' + lat + '],\'' + nome_poi + '\');"><div class="popupOption" style="float: right">' + calcular_percurso_text + '<div class="popupArrow"></div></div></a>' +
                    '    <div style="clear:both"></div>' +
                    '</div>';
                popup.setContent(HTML);

                marker = visitMaps.addMarker(geojson, realHost + '/sites/all/themes/visitportugaltheme/img/pin_mapa.png', popup, {
                    closeButton: false,
                    minWidth: 256
                });

              };
              
              visitMaps.map.setView(new L.LatLng(lat, lng), 12);
          // } else {
          //     // DOESN'T ADD MARKER (has locality coords)
          //     if (isNaN(lat) || isNaN(lng)) {
          //         //console.log("É NAN 375");
          //         lat = defaultLat;
          //         lng = defaultLon;
          //     }
          //     //visitMaps.map.setView(new L.LatLng(lat, lng), 8);
          //     visitMaps.map.setView(new L.LatLng(lat, lng), 6);
          // }

        };
        isParsed = true;
    };

    this.geocodingJSONPCallback = function(JSON) {
        points_so_far = points_so_far + 1;
        // Criar GeoJSON
        var geojson = {
            'geometry': {
                'coordinates': [parseFloat(JSON.geometry.coordinates[1]), parseFloat(JSON.geometry.coordinates[0])],
                'type': 'Point'
            }
        };

        // Adicionar Marker
        // Adicionar aos RoutePoints
        // Adicionar aos inputs
        var arr_pos = points_list.indexOf(JSON.geometry.coordinates[1] + ',' + JSON.geometry.coordinates[0]);
        if (!isNaN(arr_pos)) {
            routeQuery.routePoints[arr_pos] = geojson;
            if (arr_pos == 0) {
                // Start point
                $('.routeBox.startPoint').val(JSON.locality);
                routeQuery.markerList[arr_pos] = visitMaps.addMarker(routeQuery.routePoints[arr_pos], realHost + '/sites/all/themes/visitportugaltheme/img/pin_mapa_origem.png');
            } else if (arr_pos == (points_list.length - 1)) {
                // End Point
                $('.routeBox.endPoint').val(JSON.locality);
                routeQuery.markerList[arr_pos] = visitMaps.addMarker(routeQuery.routePoints[arr_pos], realHost + '/sites/all/themes/visitportugaltheme/img/pin_mapa_destino.png');
            } else {
                // Mid Point
                $('.routeBox[data-index=' + (arr_pos) + ']').val(JSON.locality);
                markerHTML = '<div class="mapIcon routeMidMapIcon">' + $('.routeMidIcon:eq(' + arr_pos + ')').clone().html() + '</div>';
                routeQuery.markerList[arr_pos] = visitMaps.addMarker(routeQuery.routePoints[arr_pos], null, markerHTML);
            };
        } else {
            console.log('err');
        };

        //if (routeQuery.markerList.length == points_list.length) {
        if (points_so_far == points_list.length){
            $("#btn_ok_percurso").click();
            points_so_far == -10000;
        };
    };

    this.geocodingJSONPCallbackTextboxValues = function(JSON) {
        // Criar GeoJSON
        var geojson = {
            'geometry': {
                'coordinates': [parseFloat(JSON.geometry.coordinates[1]), parseFloat(JSON.geometry.coordinates[0])],
                'type': 'Point'
            }
        };

        // Adicionar Marker
        // Adicionar aos RoutePoints
        // Adicionar aos inputs
        var arr_pos = points_list.indexOf(JSON.geometry.coordinates[1] + ',' + JSON.geometry.coordinates[0]);
        if (!isNaN(arr_pos)) {
            if (arr_pos == 0) {
                // Start point
                $('.routeBox.startPoint').val(JSON.locality);
            } else if (arr_pos == (points_list.length - 1)) {
                // End Point
                $('.routeBox.endPoint').val(JSON.locality);
            } else {
                // Mid Point
                $('.routeBox[data-index=' + (arr_pos) + ']').val(JSON.locality);
            };
        } else {
            console.log('err');
        };


    };

    this.requestGeoJSONP = function(src) {
        elementId = 'IPMapsJSONPReq';

        var script = document.getElementById(elementId);
        if (script) {
            script.parentNode.removeChild(script);
        }
        script = document.createElement("script");
        script.src = src;
        script.id = elementId;
        script.type = "text/javascript";
        script.charset = "utf-8";
        var head = document.getElementsByTagName("head")[0];
        setTimeout(function () {
            head.appendChild(script);
        }, 200);
    };



    this.highlight = function(element) {
        entity_id = parseInt($(element).attr('data-entity'));
        for (i = 0; i < visitMaps.poisList.length; i++) {
            marker = visitMaps.poisList[i];
            if (marker.vID == entity_id) {
                marker.setIcon(new visitMaps.markerIcon({
                    iconUrl: realHost + '/sites/all/themes/visitportugaltheme/img/pin_mapa_origem.png'
                }));
                marker.setZIndexOffset(10000);
                return false;
            }
        }
        return false;
    };

    this.unhighlight = function(element) {
        entity_id = parseInt($(element).attr('data-entity'));
        for (i = 0; i < visitMaps.poisList.length; i++) {
            marker = visitMaps.poisList[i];
            if (marker.vID == entity_id) {
                marker.setIcon(new visitMaps.markerIcon({
                    iconUrl: realHost + '/sites/all/themes/visitportugaltheme/img/pin_mapa.png'
                }));
                marker.setZIndexOffset(0);
                return false;
            }
        }
        return false;
    };

    this.focus = function(element) {
        entity_id = parseInt($(element).attr('data-entity'));
        for (i = 0; i < visitMaps.poisList.length; i++) {
            marker = visitMaps.poisList[i];
            if (marker.vID == entity_id) {
                visitMaps.map.setView(marker.getLatLng(), 15);
                marker.openPopup();
            }
        }
        return false;
    }

    //Miracles do happen. This should be used as the default add marker routine. A seperate addHTMLMarker should be done.
    //The HTML var in this one refers to both popup HTML, and marker HTML if no iconurl is defined. swing-and-a-miss
    this.addMarker = function(poi, iconurl, HTML, popupOptions) {
        marker = null;
        if (typeof popupOptions === "undefined") {
            popupOptions = null;
        }

        if (iconurl) {
            marker = L.marker(visitMaps.geoJSONToLatLng(poi), {
                icon: new visitMaps.markerIcon({
                    iconUrl: iconurl
                })
            });
        } else {
            htmlIcon = new L.HtmlIcon({
                html: HTML,
                iconAnchor: [16, 28],
                popupAnchor: [0, -30]
            });

            marker = L.marker(visitMaps.geoJSONToLatLng(poi), {
                icon: htmlIcon
            });
        }

        if (HTML && (popupOptions !== null)) {
            marker.bindPopup(HTML, popupOptions);
        }

        //marker.addTo(this.map);
        this.markersLayer.addLayer(marker);
        this.poisList.push(marker);

        return marker;
    };

    this.clearMarkersLayer = function() {
        visitMaps.markersLayer.clearLayers();
        this.poisList = [];
    };

    this.initMarkersLayer = function() {
        /*
          this.markersLayer = L.markerClusterGroup({
        maxClusterRadius: 120,
        iconCreateFunction: function (cluster) {
          return L.divIcon({ html: cluster.getChildCount(), className: 'markerCluster', iconSize: L.point(40, 40) });
        },
        //Disable all of the defaults:
        spiderfyOnMaxZoom: false, showCoverageOnHover: false, zoomToBoundsOnClick: false
    });
*/
        this.markersLayer = L.markerClusterGroup();
        this.map.addLayer(this.markersLayer);
    };

    this.initRouteLayer = function() {
        var routeStyle = {
            "color": "#030066",
            "weight": 6,
            "opacity": 1
        };

        this.routeLineLayer = L.geoJson(null, {
            style: routeStyle
        }).addTo(this.map);
    };

    this.clearRouteLayer = function() {
        visitMaps.routeLineLayer.clearLayers();
    };

    this.toggleSidePanel = function() {
        if (!this.sidePanelState) {
            $("#_visitMapsSidePanel").css('background-color', 'white');
            $("#_visitMapsSidePanel").css('width', '320px');
            $("#_visitMapsSidePanel").css('left', '-267px');

            $("#_visitMapsSidePanelContainer").animate({
                width: "320",
            }, 200, function() {});

            $("#optionsButtons").animate({
                left: "320",
            }, 200, function() {});

            $("#_visitMapsSidePanel").animate({
                left: "0",
                height: "100%"
            }, 200, function() {
                $('#_visitMapsSidePanel .menuControls').css('background-image', "url('/sites/all/themes/visitportugaltheme/img/seta_colapsar.png')");
            });

            $(".leaflet-left").animate({
                left: "340",
            }, 200, function() {});
            visitMaps.map.panBy(new L.Point(-160, 0))
        } else {
            $("#_visitMapsSidePanelContainer").animate({
                width: "0",
            }, 200, function() {});

            $("#optionsButtons").animate({
                left: "53",
            }, 200, function() {});

            $("#_visitMapsSidePanel").animate({
                left: "-267",
                height: "53"
            }, 200, function() {
                $(this).css('background-color', '');
                $(this).css('left', '0px');
                $(this).css('width', '53px');
                $('#_visitMapsSidePanel .menuControls').css('background-image', "url('/sites/all/themes/visitportugaltheme/img/seta_expandir.png')");
            });

            $(".leaflet-left").animate({
                left: "20",
            }, 200, function() {});
            visitMaps.map.panBy(new L.Point(160, 0))

        }
        this.sidePanelState = !this.sidePanelState;

        return false;
    };

    this.geoJSONToLatLng = function(geoJSON) {
        geoJSON = geoJSON || null;
        if (geoJSON) {
            if (geoJSON.geometry) {
                // if(isNaN(geoJSON.geometry.coordinates[1]) || isNaN(geoJSON.geometry.coordinates[0]) ){
                //   //console.log("É NAN 552");
                // }


                return new L.LatLng(geoJSON.geometry.coordinates[1], geoJSON.geometry.coordinates[0]);
            } else {
                throw "Invalid geoJSON or no Geometry to parse. Did you pass a single feature?"
                return false;
            }
        } else {
            throw "No geoJSON to parse";
            return false;
        }
    };

    this.addToResults = function() {};

    this.clearAllLayers = function() {
        visitMaps.clearMarkersLayer();
        visitMaps.clearRouteLayer();
    };

};

var visitPoisQuery = new function() {
    this.target = scriptSolr;

    this.submitSearchQuery = function() {
        generateUrl();
        maxResults = 100000;
        textQuery = $('#searchBox').val();
        regionTID = $('#regionsSelect').val();
        localityTID = $('#localitySelect').val();

        if (typeof textQuery === "undefined" || textQuery === '') {
            textQuery = '*';
        }


        url = this.target;
        url += "?q=" + textQuery;
        url += '&fq=!geos_geocoords:"-8.381903171539307E-8,-1.6763806343078613E-7"';
        url += "&fq=ss_language:" + $("div.perfil_language_code").html();
        //url += "&qf=ts_poi_nome^1000 ts_tipologia^999 ts_perfil^0 ts_poi_descritivo^200  tm_tab_generica_value^100";

        if (regionTID != -1 && regionTID != null) {
            url += "+tid:" + regionTID;
        }
        if (localityTID != -1 && localityTID != null) {
            url += "+tid:" + localityTID;
        }
        var s_tipologia = "";
        var first = true;
        categoriesLength = $('input:checked', $('#poiCategoryList')).length;
        if (categoriesLength > 0) {
            url += "+(";
            $('input:checked', $('#poiCategoryList')).each(function() {
                url += 'tid:' + $(this).val() + ' OR ';
                if (first) {
                    s_tipologia = $(this).val();
                    first = false;
                } else {
                    s_tipologia = s_tipologia + ";" + $(this).val();
                }
            });
            url = url.substr(0, url.length - 3);
            url += ')';
        }

        url += "&rows=" + maxResults + "&start=0";
        url += "&wt=json&json.wrf=visitPoisQuery.VisitPoisJSONPCallback";

        if (textQuery === '*' && (url.indexOf('tid:') == -1)) {
            $('#searchErrorMessage').animate({
                opacity: 1
            }, 150);
            $('#searchErrorMessage').css("-ms-filter", "'progid:DXImageTransform.Microsoft.Alpha(Opacity=1)'");
        } else {
            $('#searchErrorMessage').css('opacity', 0);
            $('#searchErrorMessage').css("-ms-filter", "'progid:DXImageTransform.Microsoft.Alpha(Opacity=0)'");

            /*
            $('#mapLoadingImage').attr('src', '/sites/all/themes/visitportugaltheme/img/search-loader.gif');
            $('#mapLoading').removeClass('mapLoadingBoxUseless');
            $('#mapLoading').addClass('mapLoadingBox');
            */

            $('#mapLoading').show();
            $('#mapLoadingBackground').show();
            $('#mapLoadingBackground').animate({
                opacity: 0.2
            }, 300);
            $('#mapLoadingBackground').css("-ms-filter", "'progid:DXImageTransform.Microsoft.Alpha(Opacity=20)'");

            // REGISTAR PEDIDO NA TABELA LOGS_PESQUISAS
            //var ip = ($("#node_details_user_ip").html().trim());
            var ip = "";
            try {
                ip = ($("#node_details_user_ip a").html().trim());
            } catch (e) {
                ip = ($("#node_details_user_ip").html().trim());
            }
            var pais = (readCookie("freegeoip_country_code"));
            var keywords = $('#searchBox').val();
            var regiao = regionTID;
            var localidade = localityTID;
            var tipologia = "Pois";
            var subtipo_tipologia = s_tipologia;
            var latitude = visitMaps.map.getCenter().lat;
            var longitude = visitMaps.map.getCenter().lng;
            var atributos = "";
            var browser = getBrowserName();
            var idioma = ($(".perfil_language_code").html().trim());

            try {
                $.post("/relatorios/log_query_solr", {
                        _ip: ip,
                        _pais: pais,
                        _keywords: keywords,
                        _regiao: regiao,
                        _localidade: localidade,
                        _tipologia: tipologia,
                        _subtipo_tipologia: subtipo_tipologia,
                        _latitude: latitude,
                        _longitude: longitude,
                        _atributos: atributos,
                        _browser: browser,
                        _idioma: idioma,
                        _proximidade: 0,
                        _tipo_pesquisa: 'Mapa'
                    })
                    .done(function(data) {
                        // console.log( "done: " );
                    });
            } catch (e) {

            }

            // FIM REGISTAR PEDIDO NA TABELA LOGS_PESQUISAS

            this.requestJSONP(url);
        }

        return false;
    };

    this.submitNearbySearchQuery = function() {
        maxResults = 100;
        textQuery = $('#searchBox').val();
        regionTID = $('#regionsSelect').val();
        localityTID = $('#localitySelect').val();

        if (typeof textQuery === "undefined" || textQuery === '') {
            textQuery = '*';
        }

        url = this.target;
        url += "?q=" + textQuery;
        url += "&fq=ss_language:" + $("div.perfil_language_code").html();

        if (regionTID != -1 && regionTID != null) {
          url += "+tid:" + regionTID;
        }
        if (localityTID != -1 && localityTID != null) {
          url += "+tid:" + localityTID;
        }

        var s_tipologia = "";
        var first = true;
        categoriesLength = $('input:checked', $('#poiCategoryList')).length;
        if (categoriesLength > 0) {
            url += "+(";
            $('input:checked', $('#poiCategoryList')).each(function() {
                url += 'tid:' + $(this).val() + ' OR ';
                if (first) {
                    s_tipologia = $(this).val();
                    first = false;
                } else {
                    s_tipologia = s_tipologia + ";" + $(this).val();
                }
            });
            url = url.substr(0, url.length - 3);
            url += ')';
        }

        url += "&fq={!geofilt+sfield=geos_geocoords}";
        //url += "&qf=ts_poi_nome^1000 ts_tipologia^999 ts_perfil^0 ts_poi_descritivo^200  tm_tab_generica_value^100";
        url += "&pt=" + visitMaps.map.getCenter().lat + "," + visitMaps.map.getCenter().lng;
        url += "&sfield=geos_geocoords";
        url += "&d=100";

        url += '&sort=label+asc';

        url += "&rows=" + maxResults + "&start=0";

        url += "&wt=json&json.wrf=visitPoisQuery.VisitPoisJSONPCallback";

        if (textQuery === '*' && (url.indexOf('tid:') == -1)) {
            $('#searchErrorMessage').animate({
                opacity: 1
            }, 150);
            $('#searchErrorMessage').css("-ms-filter", "'progid:DXImageTransform.Microsoft.Alpha(Opacity=1)'");
        } else {
            $('#searchErrorMessage').css('opacity', 0);
            $('#searchErrorMessage').css("-ms-filter", "'progid:DXImageTransform.Microsoft.Alpha(Opacity=0)'");

            /*
            $('#mapLoadingImage').attr('src', '/sites/all/themes/visitportugaltheme/img/nearby.png');
            $('#mapLoading').removeClass('mapLoadingBox');
            $('#mapLoading').addClass('mapLoadingBoxUseless');
            */

            $('#mapLoading').show();
            $('#mapLoadingBackground').show();
            $('#mapLoadingBackground').animate({
                opacity: 0.2
            }, 300);
            $('#mapLoadingBackground').css("-ms-filter", "'progid:DXImageTransform.Microsoft.Alpha(Opacity=20)'");



            // REGISTAR PEDIDO NA TABELA LOGS_PESQUISAS
            //var ip = ($("#node_details_user_ip").html().trim());
            var ip = "";
            try {
                ip = ($("#node_details_user_ip a").html().trim());
            } catch (e) {
                ip = ($("#node_details_user_ip").html().trim());
            }
            var pais = (readCookie("freegeoip_country_code"));
            var keywords = $('#searchBox').val();
            var regiao = regionTID;
            var localidade = localityTID;
            var tipologia = "Pois";
            var subtipo_tipologia = s_tipologia;
            var latitude = visitMaps.map.getCenter().lat;
            var longitude = visitMaps.map.getCenter().lng;
            var atributos = "";
            var browser = getBrowserName();
            var idioma = ($(".perfil_language_code").html().trim());

            try {
                $.post("/relatorios/log_query_solr", {
                        _ip: ip,
                        _pais: pais,
                        _keywords: keywords,
                        _regiao: regiao,
                        _localidade: localidade,
                        _tipologia: tipologia,
                        _subtipo_tipologia: subtipo_tipologia,
                        _latitude: latitude,
                        _longitude: longitude,
                        _atributos: atributos,
                        _browser: browser,
                        _idioma: idioma,
                        _proximidade: 1,
                        _tipo_pesquisa: 'Mapa'
                    })
                    .done(function(data) {
                        // console.log( "done: " );
                    });
            } catch (e) {

            }

            // FIM REGISTAR PEDIDO NA TABELA LOGS_PESQUISAS
            this.requestJSONP(url);
        }

        return false;
    };

    this.clearAll = function() {
        visitMaps.clearAllLayers();

        visitPoisQuery.clearSearchForm();
        visitPoisQuery.clearResults();
        return false;
    };

    this.clearSearchForm = function() {
        points_list = [];
        cords_arr = [];
        $('#regionsSelect').val(-1);
        $('#localitySelect').val(-1)
        $('#radiusSelect').val(-1);
        $('#results').empty();
        $('input:checked', $('#poiCategoryList')).each(function() {
            $(this).prop('checked', false);
        });
        $('#searchBox').val("");

        Foundation.libs.forms.refresh_custom_select($('#regionsSelect'), true);
        Foundation.libs.forms.refresh_custom_select($('#localitySelect'), true);

        $('.options-buttons').css('display', 'none');
        return false;
    };

    this.clearResults = function() {
        $('#results').empty();

        return false;
    };

    this.VisitPoisJSONPCallback = function(JSON) {
        visitMaps.clearMarkersLayer();
        visitPoisQuery.clearResults();

        results = JSON.response.docs;

        bounds = new L.LatLngBounds();

        $('.resultsHeaderCount').text(results.length);

        for (var i = 0, len = results.length; i < len; i++) {
            elem = results[i];

            var realUrl = elem.url.replace('www2.visitportugal.com', 'www.visitportugal.com');
            realUrl = elem.url.replace('http://','').replace('https://','').replace('www.','').replace('visitportugal.com/','/').replace('visitportugal.pt/','/').replace('visitportugal.eu/','/').replace('portugal.travel/','/').replace('visitportugal.travel/','/');

            // NEED TO VALIDATE COORDS!!!
            if (typeof elem.geos_geocoords !== "undefined" && elem.geos_geocoords != null) {
                geos = elem.geos_geocoords.split(',');
                if (geos[0] > 0) {

                    // if(isNaN(geos[0]) || isNaN(geos[1]) ){
                    //   //console.log("É NAN 765");
                    // }


                    latlon = new L.latLng(geos[0], geos[1]);
                    bounds.extend(latlon);

                    geojson = {
                        'geometry': {
                            'coordinates': [geos[1], geos[0]]
                        }
                    }

                    //Marker
                    popup = new L.Popup();
                    var saiba_mais_text = $('#know-more-message').text();
                    var calcular_percurso_text = $('#calculate-route-message').text();
                    HTML = '<div class="popupTitle"><a class="popupCloseButton" href="#" onclick="visitMaps.map.closePopup(); return false;"></a><label class="popupTitleText">' + elem.ts_poi_nome + '</label></div>' +
                        '    <div style="clear:both"></div>' +
                        '</div>' +
                        '<div class="popupOptions">' +
                        '    <a href="' + realUrl + '" target="_blank"><div class="popupOption" style="float:left; border-right:1px solid black">' + saiba_mais_text + '<div class="popupArrow"></div></div></a>' +
                        '    <a href="#" onclick="return routeQuery.routeTo([' + geos[1] + ',' + geos[0] + '],\'' + elem.ts_poi_nome + '\');"><div class="popupOption" style="float: right">' + calcular_percurso_text + '<div class="popupArrow"></div></div></a>' +
                        '    <div style="clear:both"></div>' +
                        '</div>';
                    popup.setContent(HTML);

                    marker = visitMaps.addMarker(geojson, realHost + '/sites/all/themes/visitportugaltheme/img/pin_mapa.png', popup, {
                        closeButton: false,
                        minWidth: 256
                    });
                    marker.vID = elem.entity_id;
                }

                //Result list
                for (j = 0; j < elem.im_field_poi_tipo.length; j++) {
                    tid = elem.im_field_poi_tipo[j];
                    resultHTML = '' +
                        '<a class="resultLink" href="#" data-entity="' + elem.entity_id + '" onmouseout="return visitMaps.unhighlight(this);" onmouseover="return visitMaps.highlight(this);" onclick="return visitMaps.focus(this);">' +
                        '<div class="result">' +
                        '    <div class="resultIcon"></div>' +
                        '    <label class="resultText">' + elem.ts_poi_nome +
                        '    </label>' +
                        '</div></a>';
                    master = $('.IPcollapsable[tid=' + tid + ']');
                    if (master.length == 0) {
                        categoryName = visitMaps.categoryList[tid];
                        if (typeof categoryName === "undefined" || categoryName == null)
                            continue;
                        $('#results').append('' +
                            '<div class="IPcollapsable" tid="' + tid + '">' +
                            '    <div class="collapsableHeader">' +
                            '        <div class="colIcon"></div>' +
                            '        <div class="colToggle"></div>' +
                            '        <div class="collapsableHeaderText">' + categoryName + ' (<span class="categoryCount">0</span>)</div>' +
                            '    </div>' +
                            '    <div class="collapsableResults"></div>' +
                            '</div>' +
                            '<div class="hDivider halfMargins"></div>');
                        master = $('.IPcollapsable[tid=' + tid + ']');
                        IPCollapsable.applyToElement(master);
                    }
                    $('.collapsableResults', master).append(resultHTML);
                    $('.categoryCount', master).text($('.result', master).length);
                }
            }
        }

        $('.IPcollapsable:last').next().remove();

        $('.IPcollapsable:not(:first)').each(function() {
            IPCollapsable.close(this);
        });

        if (results.length > 0) {
            $('.hDivider:first', '#searchResultsForm').show();
            visitMaps.map.options.zoomAnimationThreshold = 20;
            visitMaps.map.fitBounds(bounds, {
                animate: true,
                duration: 1,
                paddingTopLeft: new L.Point(320, 40),
                paddingTopRight: new L.Point(0, 8)
            });
        } else {
            $('.hDivider:first', '#searchResultsForm').hide();
        }
        visitPoisQuery.toggleSearchForm(true, true);

        $('#mapLoadingBackground').animate({
            opacity: 0.0
        }, 300, function() {
            $('#mapLoading').hide();
            $('#mapLoadingBackground').hide();

        });
        $('#mapLoadingBackground').css("-ms-filter", "'progid:DXImageTransform.Microsoft.Alpha(Opacity=0)'");

        //SHOW OPTIONS BUTTONS
        var leftOffset = $('#_visitMapsSidePanelToggle').offset().left;
        var leftPos = (leftOffset + 53) + "px";
        var topPos = "20px";

        $('.print').css('display', 'none');
        $('.options-buttons').css({
            left: leftPos,
            top: topPos
        }).fadeIn(100);

    };

    this.requestJSONP = function(src) {
        mSelf = routeQuery;
        elementId = 'IPVPReq'

        var script = document.getElementById(elementId);
        if (script) script.parentNode.removeChild(script);
        script = document.createElement("script");
        script.src = src;
        script.id = elementId;
        script.type = "text/javascript";
        script.charset = "utf-8";
        var head = document.getElementsByTagName("head")[0];
        head.appendChild(script);
    };

    this.toggleSearchForm = function(hide, animation) {
        if (hide) {
            $('#searchForm').animate({
                'left': '-320px'
            }, 200, function() {
                $(this).hide();
            });
            $('#searchResultsForm').css({
                'left': '320px',
                'position': 'absolute',
                'top': '0px',
                'width': '280px',
                'display': 'block'
            });
            if (animation) {
                $('#searchResultsForm').animate({
                    'left': '0px'
                }, 200, function() {});
            } else {
                $('#searchResultsForm').css('left', '0px');
            }
        } else {
            if (animation) {
                $('#searchResultsForm').animate({
                    'left': '320px'
                }, 200, function() {
                    $(this).hide();
                });
            } else {
                $('#searchResultsForm').css('left', '320px');
            }

            $('#searchForm').css('left', '-320px');
            $('#searchForm').css('display', 'inline');
            if (animation) {
                $('#searchForm').animate({
                    'left': '0px'
                }, 200, function() {});
            } else {
                $('#searchForm').css('left', '0px');
            }
        }
        return false;
    };

    this.categories = [];

    this.addToResults = function(category, name) {
        if ($.inArray(category, this.categories)) {
            $('.' + category, '#results').append('' +
                '<div class="resultContainer">' +
                '   <div class="rightCaret"></div>' +
                '   <div class="resultText">' +
                name +
                '   </div>' +
                '</div>');
        }
    };

    //AutocompleteHandlers
    this.shouldSelectFirst = false;
    this.parseQuery = function(value) {
        url = "";

        url += "&q=" + value;
        url += '&fq=!geos_geocoords:"-8.381903171539307E-8,-1.6763806343078613E-7"';
        url += "&fq=ss_language:" + $("div.perfil_language_code").html();
        regionTID = $('#regionsSelect').val();
        if (regionTID != -1 && regionTID != null) {
            url += "+tid:" + regionTID;
        }
        localityTID = $('#localitySelect').val();
        if (localityTID != -1 && localityTID != null) {
            url += "+tid:" + localityTID;
        }
        $('input:checked', $('#poiCategoryList')).each(function() {
            url += "+tid:" + $(this).val();
        });
        url += "&wt=json";

        return url;
    };

    this.parseResults = function(JSON, autocomplete) {
        if (JSON.response.docs.length == 0) {
            return false;
        }
        for (i = 0; i < JSON.response.docs.length; i++) {
            workingObject = JSON.response.docs[i];
            autocomplete.addResult(workingObject.ts_poi_nome, workingObject.ts_poi_morada, i);
        }

        return JSON.response.docs;
    };

    this.selectedResult = function(selected) {
        //visitMaps.clearAllLayers();

        IPAutocomplete.textfield.val(selected.ts_poi_nome);
    };

    this.resultSelected = function(result) {
        if (!result.geos_geocoords) {
            return;
        };
        geos = result.geos_geocoords.split(',');
        if (geos[0] > 0) {
            latlon = new L.latLng(geos[0], geos[1]);

            //criar geojson
            geojson = {
                'geometry': {
                    'coordinates': [parseFloat(geos[1].replace(",",'.')), parseFloat(geos[0].replace(",",'.')),]
                }
            }
            var nome_poi = result.poi_nome;
            var url_poi = result.site + "/" + result.path_alias; 
            
            var saiba_mais_text = $('#know-more-message').text();
            var calcular_percurso_text = $('#calculate-route-message').text();
            var popup = new L.Popup();
            var HTML = '<div class="popupTitle"><a class="popupCloseButton" href="#" onclick="visitMaps.map.closePopup(); return false;"></a><label class="popupTitleText">' + nome_poi + '</label></div>' +
                '    <div style="clear:both"></div>' +
                '</div>' +
                '<div class="popupOptions">' +
                '    <a href="' + url_poi + '" target="_blank"><div class="popupOption" style="float:left; border-right:1px solid black">' + saiba_mais_text + '<div class="popupArrow"></div></div></a>' +
                '    <a href="#" onclick="return routeQuery.routeTo([' + geos[1] + ',' + geos[0] + '],\'' + nome_poi + '\');"><div class="popupOption" style="float: right">' + calcular_percurso_text + '<div class="popupArrow"></div></div></a>' +
                '    <div style="clear:both"></div>' +
                '</div>';

            popup.setContent(HTML);

            visitMaps.markersLayer.clearLayers();
            marker = visitMaps.addMarker(geojson, realHost + '/sites/all/themes/visitportugaltheme/img/pin_mapa.png', popup, {
                closeButton: false,
                minWidth: 256
            });

            visitMaps.map.panTo(latlon);
        }

        
   
    };

    this.submitQuery = function() {
        visitPoisQuery.submitSearchQuery();
        return false;
    };
}

var routeQuery = new function() {
    this.target = "https://routing.infoportugal.info/routing.json";
    this.APIKEY = "8e650a0aff802a10cc25d079c7fdeffaa14447aa";

    this.routePoints = [];
    this.routePoints[1] = undefined;
    this.markerList = [];
    this.markerList[1] = undefined;

    this.routeManeuvers = '';
    this.durationStr = '';
    this.distanceStr = '';
    this.fromToStr = '';
    this.duration = null;
    this.distance = null;

    this.addMidPoint = function() {
        mSelf = routeQuery;
        routeQuery.routePoints;

        oldLength = mSelf.routePoints.length;
        mSelf.routePoints[mSelf.routePoints.length] = mSelf.routePoints[mSelf.routePoints.length - 1];
        mSelf.markerList[mSelf.markerList.length] = mSelf.markerList[mSelf.markerList.length - 1];
        mSelf.routePoints[oldLength - 1] = null;
        mSelf.markerList[oldLength - 1] = null;
        newCell = $('#dummyMidPointCell').clone();
        newCell.removeAttr('id');
        pointIndex = mSelf.routePoints.length - 2;
        $('.midPointLabel', newCell).text(charAtIndex(pointIndex - 1));
        $('#routePoints').append(newCell);
        $(newCell).addClass('routeMidPoint');
        $('.routeBox', newCell).attr('data-index', pointIndex);
        $('.routeBox', newCell).focus(function() {
            IPAutocomplete.init(this, routeQuery, {
                target: 'https://api3.infoportugal.info/geocoding.json',
                fallbacktarget: 'https://api3.infoportugal.info/geocoding.json',
                limit: 6,
                args: {
                    api_key: '8e650a0aff802a10cc25d079c7fdeffaa14447aa'
                }
            });
        });
        routeQuery.routePoints;
    };

    this.routeTo = function(geos, name) {
        geojson = {
            'geometry': {
                'coordinates': [geos[0], geos[1]]
            }
        }
        tabHost.switchToTab($('#routeTab'), 1);
        //$('.routeBox.endPoint').prop('disabled', true);
        $('.routeBox.endPoint').val(name);

        len = routeQuery.markerList.length - 1;
        routeQuery.routePoints[len] = geojson;
        routeQuery.markerList[len] = visitMaps.addMarker(routeQuery.routePoints[len], realHost + '/sites/all/themes/visitportugaltheme/img/pin_mapa_destino.png');
    };

    this.submitRouteQuery = function() {
        //'this' may come from a timer or an input event. It may be tainted
        generateUrl();
        mSelf = routeQuery;
        if (mSelf.routePoints.length >= 2 && typeof mSelf.routePoints[0] !== "undefined" && typeof mSelf.routePoints[mSelf.routePoints.length - 1] !== "undefined") {
            bounds = new L.LatLngBounds();
            for (var i = 0; i < mSelf.routePoints.length; i++) {
                geoJSON = mSelf.routePoints[i];
                latLng = visitMaps.geoJSONToLatLng(geoJSON);
                bounds.extend(latLng);
            }
            visitMaps.map.options.zoomAnimationThreshold = 20;
            visitMaps.map.fitBounds(bounds, {
                animate: true,
                duration: 1,
                paddingTopLeft: new L.Point(320, 40),
                paddingTopRight: new L.Point(0, 8)
            });
            url = mSelf.target;
            url += "?callback=" + "routeQuery.JSONPCallback";
            url += "&api_key=" + mSelf.APIKEY;
            url += "&from=" + mSelf.routePoints[0].geometry.coordinates[0] + "," + mSelf.routePoints[0].geometry.coordinates[1];
            url += "&stops=";
            for (var i = 1; i <= mSelf.routePoints.length - 2; i++) {
                url += mSelf.routePoints[i].geometry.coordinates[0] + "," + mSelf.routePoints[i].geometry.coordinates[1] + "|";
            }
            url = url.substring(0, url.length - 1);
            url += "&to=" + mSelf.routePoints[mSelf.routePoints.length - 1].geometry.coordinates[0] + "," + mSelf.routePoints[mSelf.routePoints.length - 1].geometry.coordinates[1];
            url += "&type=" + $('input:radio[name=vOption]:checked').val();
            url += "&tolls=" + $('input:radio[name=tOption]:checked').val();
            mSelf.requestJSONP(url);
        }
        return false;
    };

    this.clearAll = function() {
        routeQuery.clearRouteForm();
        routeQuery.clearResults();
        visitMaps.clearAllLayers();
        return false;
    };

    this.clearRouteForm = function() {
        routeQuery.routePoints = [];
        routeQuery.routePoints[1] = undefined;
        routeQuery.markerList = [];
        routeQuery.markerList[1] = undefined;
        $('.routeBox').val('');
        $('.routeOption > input[value=0]').prop('checked', true);
        $('.tollOption > input[value=1]').prop('checked', true);
        $('.routeMidPoint').remove();

        $('.options-buttons').css('display', 'none');
        return false;
    };

    this.clearResults = function() {
        $('#results').empty();
    };

    this.toggleRouteForm = function(hide, animation) {
        if (hide) {
            $('#routeForm').animate({
                'left': '-320px'
            }, 200, function() {
                $(this).hide();
            });
            $('#routingResultsForm').css({
                'left': '320px',
                'position': 'absolute',
                'top': '0px',
                'width': '280px',
                'display': 'block'
            });
            if (animation) {
                $('#routingResultsForm').animate({
                    'left': '0px'
                }, 200, function() {});
            } else {
                $('#routingResultsForm').css('left', '0px');
            }
        } else {
            if (animation) {
                $('#routingResultsForm').animate({
                    'left': '320px'
                }, 200, function() {
                    $(this).hide();
                });
            } else {
                $('#routingResultsForm').css('left', '320px');
            }
            $('#routeForm').css('left', '-320px');
            $('#routeForm').css('display', 'inline');
            if (animation) {
                $('#routeForm').animate({
                    'left': '0px'
                }, 200, function() {});
            } else {
                $('#routeForm').css('left', '0px');
            }
        }
        return false;
    };



    this.addManeuvers = function() {
        var maneuvers = routeQuery.routeManeuvers;
        $('#maneuvers').empty();

        if (maneuvers.features.length == 0) {
            $('.no_maneuvers').show();
            return;
        }else{
            $('.no_maneuvers').hide();
        };


        lang = $("div.perfil_language_code").html().split("-")[0];
        for (var i = 0; i < maneuvers.features.length; i++) {
            maneuver = maneuvers.features[i];

            if (this.maneuversStrings[lang][maneuver.properties.type]) {
                switch (maneuver.properties.type) {
                    case 'From':
                        $('#maneuvers').append('' +
                            '<div class="routeIcon routeStartIcon"></div>' +
                            '<div class="routeHeaderText" style="font-weight:bold;">' + this.maneuversStrings[lang][maneuver.properties.type].toUpperCase() + ' ' + $('.routeBox.startPoint').val().toUpperCase() + '</div>');
                        break;
                    default:
                        $('#maneuvers').append('' +
                            '<div class="routeHeaderText">' + i + '. ' + this.maneuversStrings[lang][maneuver.properties.type].toUpperCase() + ' ' + maneuver.properties.description.toUpperCase() + '</div>');
                        break;
                }
            }
        }

          lastManeuver = maneuvers.features[maneuvers.features.length - 1].properties.description;
          $('#maneuvers').append('' +
              '<div class="routeIcon routeEndIcon"></div>' +
              '<div class="routeHeaderText">' + this.maneuversStrings[lang]['Arrival'].toUpperCase() + ' ' + $('.routeBox.endPoint').val().toUpperCase() + '</div>');

            // routeQuery.fromToStr = maneuvers.features[0].properties.description + " - " + lastManeuver;
          routeQuery.fromToStr =  $('.routeBox.startPoint').val().toUpperCase() + " - " + $('.routeBox.endPoint').val().toUpperCase();

          $("#routeResultHeaderText").text(routeQuery.fromToStr + ' (' + routeQuery.distanceStr + '; ' + routeQuery.durationStr + ')');


          //SHOW OPTIONS BUTTONS
          var leftOffset = $('#_visitMapsSidePanelToggle').offset().left;
          var leftPos = (leftOffset + 53) + "px";
          var topPos = "20px";

          $('.print').css('display', 'block');
          $('.print').on('click', function() {
              z_t_x(printMap());
              //printMap();
          });
          $('.options-buttons').css({
              left: leftPos,
              top: topPos
          }).fadeIn(100);
    };

    this.addManeuversForPrinting = function() {
        var maneuvers = routeQuery.routeManeuvers;
        var result = '';

        maneuvers.features[0].properties.description = $('.routeBox.startPoint').val();
        maneuvers.features[maneuvers.features.length - 1].properties.description = $('.routeBox.endPoint').val();

        lang = $("div.perfil_language_code").html().split("-")[0];
        for (var i = 0; i < maneuvers.features.length; i++) {
            maneuver = maneuvers.features[i];
            if (this.maneuversStrings[lang][maneuver.properties.type]) {
                switch (maneuver.properties.type) {
                    case 'From':
                        result += '' +
                            '<div class="routeIcon">' +
                            '  <img alt="RS" src="' + realHost + '/sites/all/themes/visitportugaltheme/img/pin_origem.png">' +
                            '</div>' +
                            '<div class="routeHeaderText">' + this.maneuversStrings[lang][maneuver.properties.type] + ' ' + maneuver.properties.description + '</div>' +
                            '<div class="hDivider"></div>';
                        break;
                    default:
                        result += '' +
                            '<div class="routeHeaderText">' + i + '. ' + this.maneuversStrings[lang][maneuver.properties.type] + ' ' + maneuver.properties.description + '</div>' +
                            '<div class="hDivider"></div>';
                        break;
                }
            }
        }
        lastManeuver = maneuvers.features[maneuvers.features.length - 1].properties.description;
        result += '' +
            '<div class="routeIcon">' +
            '  <img alt="RE" src="' + realHost + '/sites/all/themes/visitportugaltheme/img/pin_destino.png">' +
            '</div>' +
            '<div class="routeHeaderText">' + this.maneuversStrings[lang]['Arrival'] + ' ' + lastManeuver + '</div>';

        return result;
    };

    this.JSONPCallback = function(JSON) {
        for (i in JSON.streets.coordinates) {
            coords = JSON.streets.coordinates[i];


            // if(isNaN(coords[0]) || isNaN(coords[1]) ){
            //   //console.log("É NAN 1225");
            // }




            latLng = ToGeographic(coords[0], coords[1]);
            coords[0] = latLng[0];
            coords[1] = latLng[1];
        }

        visitMaps.clearRouteLayer();
        visitMaps.routeLineLayer.addData(JSON.streets);

        routeQuery.toggleRouteForm(true);

        var duration = secondsToTime(parseInt(JSON.totalDuration));
        routeQuery.durationStr = duration.h + ' h ' + duration.m + ' min';

        var dist = parseInt(JSON.totalDistance);
        if (dist >= 1000) {
            dist = Math.round(dist / 1000);
            routeQuery.distanceStr = dist + " km";
        } else {
            routeQuery.distanceStr = dist + " m";
        }

        routeQuery.routeManeuvers = JSON.maneuvers;
        routeQuery.addManeuvers();
    };

    this.requestJSONP = function(src) {
        mSelf = routeQuery;
        elementId = 'IPRReq'

        var script = document.getElementById(elementId);
        if (script) script.parentNode.removeChild(script);
        script = document.createElement("script");
        script.src = src;
        script.id = elementId;
        script.type = "text/javascript";
        script.charset = "utf-8";
        var head = document.getElementsByTagName("head")[0];
        head.appendChild(script);
    };

    this.maneuversStrings = new function() {
        this.en = {
            "UnkownStreet": gettext("Unknown street"),
            "From": gettext("Starting at"),
            "Arrival": gettext("Arrival at"),
            "EnterHighway": gettext("Enter highway at"),
            "GoForward": gettext("Go forward at"),
            "LeaveHighway": gettext("Leave highway at"),
            "LeftBifurcation": gettext("Keep left at"),
            "RightBifurcation": gettext("Keep right at"),
            "RoundaboutRight": gettext("Roundabout"),
            "RoundaboutRight1": gettext("Take the 1st exit at"),
            "RoundaboutRight2": gettext("Take the 2nd exit at"),
            "RoundaboutRight3": gettext("Take the 3rd exit at"),
            "RoundaboutRight4": gettext("Take the 4th exit at"),
            "RoundaboutRight5": gettext("Take the 5th exit at"),
            "RoundaboutRight6": gettext("Take the 6th exit at"),
            "RoundaboutRight7": gettext("Take the 7th exit at"),
            "RoundaboutRight8": gettext("Take the 8th exit at"),
            "RoundaboutRight9": gettext("Take the 9th exit at"),
            "RoundaboutRight10": gettext("Take the 10th exit at"),
            "SharpLeft": gettext("Take sharp left at"),
            "SharpRight": gettext("Take sharp right at"),
            "TurnLeft": gettext("Turn left at"),
            "TurnRight": gettext("Turn right at"),
            "U-Turn": gettext("Make U turn at"),
            "UTurnLeft": gettext("Make U turn at"),
            "UTurnRight": gettext("Make U turn at")
        };

        this.pt = {
            "UnkownStreet": gettext("Endereço desconhecido"),
            "From": gettext("Início em"),
            "Arrival": gettext("Chegada a"),
            "EnterHighway": gettext("Entrar na autoestrada em "),
            "GoForward": gettext("Seguir em frente em"),
            "LeaveHighway": gettext("Deixar a auto estrada em"),
            "LeftBifurcation": gettext("Mantenha-se à direita em "),
            "RightBifurcation": gettext("Mantenha-se à esquerda em"),
            "RoundaboutRight": gettext("Rotunda"),
            "RoundaboutRight1": gettext("Tome a 1ª saída para"),
            "RoundaboutRight2": gettext("Tome a 2ª saída para"),
            "RoundaboutRight3": gettext("Tome a 3ª saída para"),
            "RoundaboutRight4": gettext("Tome a 4ª saída para"),
            "RoundaboutRight5": gettext("Tome a 5ª saída para"),
            "RoundaboutRight6": gettext("Tome a 6ª saída para"),
            "RoundaboutRight7": gettext("Tome a 7ª saída para"),
            "RoundaboutRight8": gettext("Tome a 8ª saída para"),
            "RoundaboutRight9": gettext("Tome a 9ª saída para"),
            "RoundaboutRight10": gettext("Tome a 10 ª saída para"),
            "SharpLeft": gettext("Vire completamente à esquerda em"),
            "SharpRight": gettext("Vire completamente à direita em"),
            "TurnLeft": gettext("Vire à esquerda em"),
            "TurnRight": gettext("Vire à direita em"),
            "U-Turn": gettext("Faça inversão de marcha em"),
            "UTurnLeft": gettext("Faça inversão de marcha em"),
            "UTurnRight": gettext("Faça inversão de marcha em")
        };

        this.es = {
            "UnkownStreet": gettext("Dirección desconocida"),
            "From": gettext("Salida desde"),
            "Arrival": gettext("Llegada a"),
            "EnterHighway": gettext("Entrar en la autopista en "),
            "GoForward": gettext("Siga recto en"),
            "LeaveHighway": gettext("Salir de la autopista en"),
            "LeftBifurcation": gettext("Manténgase a la derecha en "),
            "RightBifurcation": gettext("Manténgase a la izquierda en"),
            "RoundaboutRight": gettext("Rotonda"),
            "RoundaboutRight1": gettext("Tome la 1ª salida hacia"),
            "RoundaboutRight2": gettext("Tome la 2ª salida hacia"),
            "RoundaboutRight3": gettext("Tome la 3ª salida hacia"),
            "RoundaboutRight4": gettext("Tome la 4ª salida hacia"),
            "RoundaboutRight5": gettext("Tome la 5ª salida hacia"),
            "RoundaboutRight6": gettext("Tome la 6ª salida hacia"),
            "RoundaboutRight7": gettext("Tome la 7ª salida hacia"),
            "RoundaboutRight8": gettext("Tome la 8ª salida hacia"),
            "RoundaboutRight9": gettext("Tome la 9ª salida hacia"),
            "RoundaboutRight10": gettext("Tome la 10ª salida hacia"),
            "SharpLeft": gettext("Gire completamente a la izquierda en"),
            "SharpRight": gettext("Gire completamente a la derecha en"),
            "TurnLeft": gettext("Gire a la izquierda en"),
            "TurnRight": gettext("Gire a la derecha en"),
            "U-Turn": gettext("Cambie de sentido en"),
            "UTurnLeft": gettext("Cambie de sentido en"),
            "UTurnRight": gettext("Cambie de sentido en")
        };

        this.de = {
            "UnkownStreet": gettext("Adresse unbekannt"),
            "From": gettext("Start am"),
            "Arrival": gettext("Ankunft am"),
            "EnterHighway": gettext("Auffahrt auf die Autobahn in "),
            "GoForward": gettext("Weiter geradeaus fahren in"),
            "LeaveHighway": gettext("Abfahrt von der Autobahn in"),
            "LeftBifurcation": gettext("Halten Sie sich rechts in "),
            "RightBifurcation": gettext("Halten Sie sich links in"),
            "RoundaboutRight": gettext("Kreisverkehr"),
            "RoundaboutRight1": gettext("Nehmen Sie die 1. Ausfahrt nach"),
            "RoundaboutRight2": gettext("Nehmen Sie die 2. Ausfahrt nach"),
            "RoundaboutRight3": gettext("Nehmen Sie die 3. Ausfahrt nach"),
            "RoundaboutRight4": gettext("Nehmen Sie die 4. Ausfahrt nach"),
            "RoundaboutRight5": gettext("Nehmen Sie die 5. Ausfahrt nach"),
            "RoundaboutRight6": gettext("Nehmen Sie die 6. Ausfahrt nach"),
            "RoundaboutRight7": gettext("Nehmen Sie die 7. Ausfahrt nach"),
            "RoundaboutRight8": gettext("Nehmen Sie die 8. Ausfahrt nach"),
            "RoundaboutRight9": gettext("Nehmen Sie die 9. Ausfahrt nach"),
            "RoundaboutRight10": gettext("Nehmen Sie die 10. Ausfahrt nach"),
            "SharpLeft": gettext("Biegen Sie ganz nach links ab in"),
            "SharpRight": gettext("Biegen Sie ganz nach rechts ab in"),
            "TurnLeft": gettext("Biegen Sie nach links ab in"),
            "TurnRight": gettext("Biegen Sie nach rechts ab in"),
            "U-Turn": gettext("Fahren Sie in entgegengesetzter Richtung in"),
            "UTurnLeft": gettext("Fahren Sie in entgegengesetzter Richtung in"),
            "UTurnRight": gettext("Fahren Sie in entgegengesetzter Richtung in")
        };

        this.fr = {
            "UnkownStreet": gettext("Adresse inconnue"),
            "From": gettext("Départ"),
            "Arrival": gettext("Arrivée"),
            "EnterHighway": gettext("Prendre l’autoroute à partir de "),
            "GoForward": gettext("Continuer tout droit"),
            "LeaveHighway": gettext("Quitter l’autoroute à"),
            "LeftBifurcation": gettext("Restez à droite à "),
            "RightBifurcation": gettext("Restez à gauche à"),
            "RoundaboutRight": gettext("Rond-point"),
            "RoundaboutRight1": gettext("Prenez la 1ère sortie à"),
            "RoundaboutRight2": gettext("Prenez la 2ère sortie à"),
            "RoundaboutRight3": gettext("Prenez la 3ère sortie à"),
            "RoundaboutRight4": gettext("Prenez la 4ère sortie à"),
            "RoundaboutRight5": gettext("Prenez la 5ère sortie à"),
            "RoundaboutRight6": gettext("Prenez la 6ère sortie à"),
            "RoundaboutRight7": gettext("Prenez la 7ère sortie à"),
            "RoundaboutRight8": gettext("Prenez la 8ère sortie à"),
            "RoundaboutRight9": gettext("Prenez la 9ère sortie à"),
            "RoundaboutRight10": gettext("Prenez la 10ère sortie à"),
            "SharpLeft": gettext("Tournez complètement à gauche à"),
            "SharpRight": gettext("Tournez complètement à droite à"),
            "TurnLeft": gettext("Tournez à gauche à"),
            "TurnRight": gettext("Tournez à droite à"),
            "U-Turn": gettext("Faites demi-tour à"),
            "UTurnLeft": gettext("Faites demi-tour à"),
            "UTurnRight": gettext("Faites demi-tour à")
        };

        this.it = {
            "UnkownStreet": gettext("Indirizzo sconosciuto"),
            "From": gettext("Partenza da"),
            "Arrival": gettext("Arrivo a "),
            "EnterHighway": gettext("Entrare in autostrada a"),
            "GoForward": gettext("Proseguire diritto per"),
            "LeaveHighway": gettext("Uscire dall’autostrada a"),
            "LeftBifurcation": gettext("Mantenersi a destra"),
            "RightBifurcation": gettext("Mantenersi a sinistra"),
            "RoundaboutRight": gettext("Rotonda"),
            "RoundaboutRight1": gettext("Prendi la 1ª uscita per"),
            "RoundaboutRight2": gettext("Prendi la 2ª uscita per"),
            "RoundaboutRight3": gettext("Prendi la 3ª uscita per"),
            "RoundaboutRight4": gettext("Prendi la 4ª uscita per"),
            "RoundaboutRight5": gettext("Prendi la 5ª uscita per"),
            "RoundaboutRight6": gettext("Prendi la 6ª uscita per"),
            "RoundaboutRight7": gettext("Prendi la 7ª uscita per"),
            "RoundaboutRight8": gettext("Prendi la 8ª uscita per"),
            "RoundaboutRight9": gettext("Prendi la 9ª uscita per"),
            "RoundaboutRight10": gettext("Prendi la 10ª uscita per"),
            "SharpLeft": gettext("Svolta a sinistra per"),
            "SharpRight": gettext("Svolta a destra per"),
            "TurnLeft": gettext("Svolta a sinistra per"),
            "TurnRight": gettext("Svolta a destra per"),
            "U-Turn": gettext("Fai inversione di marcia per"),
            "UTurnLeft": gettext("Fai inversione di marcia per"),
            "UTurnRight": gettext("Fai inversione di marcia per")
        };

        this.nl = {
            "UnkownStreet": gettext("Onbekend adres"),
            "From": gettext("Vertrek op"),
            "Arrival": gettext("Aankomst op"),
            "EnterHighway": gettext("De snelweg opgaan op "),
            "GoForward": gettext("Rechtdoor gaan op"),
            "LeaveHighway": gettext("De snelweg verlaten op"),
            "LeftBifurcation": gettext("Rechts aanhouden op "),
            "RightBifurcation": gettext("Links aanhouden op"),
            "RoundaboutRight": gettext("Rotonde"),
            "RoundaboutRight1": gettext("Neem de 1e afslag naar"),
            "RoundaboutRight2": gettext("Neem de 2e afslag naar"),
            "RoundaboutRight3": gettext("Neem de 3e afslag naar"),
            "RoundaboutRight4": gettext("Neem de 4e afslag naar"),
            "RoundaboutRight5": gettext("Neem de 5e afslag naar"),
            "RoundaboutRight6": gettext("Neem de 6e afslag naar"),
            "RoundaboutRight7": gettext("Neem de 7e afslag naar"),
            "RoundaboutRight8": gettext("Neem de 8e afslag naar"),
            "RoundaboutRight9": gettext("Neem de 9e afslag naar"),
            "RoundaboutRight10": gettext("Neem de 10e afslag naar"),
            "SharpLeft": gettext("Sla scherp linksaf op"),
            "SharpRight": gettext("Sla scherp rechtsaf op"),
            "TurnLeft": gettext("Sla linksaf op"),
            "TurnRight": gettext("Sla rechtsaf op"),
            "U-Turn": gettext("Keer om op"),
            "UTurnLeft": gettext("Keer om op"),
            "UTurnRight": gettext("Keer om op")
        };

        this.ru = {
            "UnkownStreet": gettext("Адрес неизвестен"),
            "From": gettext("Начало в"),
            "Arrival": gettext("Прибытие в"),
            "EnterHighway": gettext("Въезд на автомагистраль в"),
            "GoForward": gettext("Следовать вперёд в"),
            "LeaveHighway": gettext("Выезд с автомагистрали в"),
            "LeftBifurcation": gettext("Придерживайтесь правой стороны в"),
            "RightBifurcation": gettext("Придерживайтесь левой стороны в"),
            "RoundaboutRight": gettext("перекреcток с круговым движением"),
            "RoundaboutRight1": gettext("Выберите 1-й съезд на"),
            "RoundaboutRight2": gettext("Выберите 2-й съезд на"),
            "RoundaboutRight3": gettext("Выберите 3-й съезд на"),
            "RoundaboutRight4": gettext("Выберите 4-й съезд на"),
            "RoundaboutRight5": gettext("Выберите 5-й съезд на"),
            "RoundaboutRight6": gettext("Выберите 6-й съезд на"),
            "RoundaboutRight7": gettext("Выберите 7-й съезд на "),
            "RoundaboutRight8": gettext("Выберите 8-й съезд на"),
            "RoundaboutRight9": gettext("Выберите 9-й съезд на"),
            "RoundaboutRight10": gettext("Выберите 10 съезд на"),
            "SharpLeft": gettext("Поверните полностью налево в"),
            "SharpRight": gettext("Поверните полностью направо в"),
            "TurnLeft": gettext("Поверните налево в"),
            "TurnRight": gettext("Поверните направо в "),
            "U-Turn": gettext("Развернитесь в"),
            "UTurnLeft": gettext("Развернитесь в"),
            "UTurnRight": gettext("Развернитесь в")
        };

        this.ja = {
            "UnkownStreet": gettext("不明なアドレス"),
            "From": gettext("出発点"),
            "Arrival": gettext("到着点"),
            "EnterHighway": gettext("高速に乗る地点"),
            "GoForward": gettext("前進する"),
            "LeaveHighway": gettext("高速を降りる地点"),
            "LeftBifurcation": gettext("右ルートを走行"),
            "RightBifurcation": gettext("左ルートを走行"),
            "RoundaboutRight": gettext("ロータリー"),
            "RoundaboutRight1": gettext("最初の出口から"),
            "RoundaboutRight2": gettext("2番目の出口から"),
            "RoundaboutRight3": gettext("3番目の出口から"),
            "RoundaboutRight4": gettext("4番目の出口から"),
            "RoundaboutRight5": gettext("5番目の出口から"),
            "RoundaboutRight6": gettext("6番目の出口から"),
            "RoundaboutRight7": gettext("7番目の出口から"),
            "RoundaboutRight8": gettext("8番目の出口から"),
            "RoundaboutRight9": gettext("9番目の出口から"),
            "RoundaboutRight10": gettext("10番目の出口から"),
            "SharpLeft": gettext("完全に左折"),
            "SharpRight": gettext("完全に右折"),
            "TurnLeft": gettext("左折"),
            "TurnRight": gettext("右折"),
            "U-Turn": gettext("Uターン"),
            "UTurnLeft": gettext("Uターン"),
            "UTurnRight": gettext("Uターン")
        };

        this.zh = {
            "UnkownStreet": gettext("未知地点"),
            "From": gettext("出发"),
            "Arrival": gettext("到达"),
            "EnterHighway": gettext("在此进入高速路"),
            "GoForward": gettext("在…直行"),
            "LeaveHighway": gettext("在此离开高速路"),
            "LeftBifurcation": gettext("靠右行驶"),
            "RightBifurcation": gettext("靠左行驶"),
            "RoundaboutRight": gettext("环岛"),
            "RoundaboutRight1": gettext("第1个出口驶离"),
            "RoundaboutRight2": gettext("第2个出口驶离"),
            "RoundaboutRight3": gettext("第3个出口驶离"),
            "RoundaboutRight4": gettext("第4个出口驶离"),
            "RoundaboutRight5": gettext("第5个出口驶离"),
            "RoundaboutRight6": gettext("第6个出口驶离"),
            "RoundaboutRight7": gettext("第7个出口驶离"),
            "RoundaboutRight8": gettext("第8个出口驶离"),
            "RoundaboutRight9": gettext("第9个出口驶离"),
            "RoundaboutRight10": gettext("第10个出口驶离"),
            "SharpLeft": gettext("在…连续左转"),
            "SharpRight": gettext("在…连续右转"),
            "TurnLeft": gettext("在...左转"),
            "TurnRight": gettext("在...右转"),
            "U-Turn": gettext("在…掉头"),
            "UTurnLeft": gettext("在…掉头"),
            "UTurnRight": gettext("在…掉头")
        };
    };

    //AutocompleteHandlers
    this.shouldSelectFirst = true;
    this.parseQuery = function(value, target) {
        if (typeof target === "undefined" || target == null)
            target = "default";
        url = "";

        if (target == "default") {
            url += "&locality=" + value;
        } else if (target == "fallback") {
            value = value.split(",", 2);
            fields = value[0].split(" ");
            if (fields.length > 2) {
                field = fields[fields.length - 1];
                if (!isNaN(field)) {
                    url += "&number=" + field;
                    fields.splice(fields.length - 1, 1);
                    value[0] = fields.join(" ");
                }
            }

            url += "&address=" + value[0];
            if (value[1]) {
                url += "&locality=" + value[1];
            }
        }

        return url;
    };

    this.parseResults = function(JSON, autocomplete) {
        if (JSON.features.length == 0) {
            return false;
        }
        for (i = 0; i < JSON.features.length; i++) {
            workingObject = JSON.features[i];
            autocomplete.addResult(workingObject.properties.name, workingObject.properties.administrative_area, i);
        }

        return JSON.features;
    };

    this.selectedResult = function(selected) {
        IPAutocomplete.textfield.val(IPAutocomplete.selectedResult.properties.name);

        //InfoPT Geocoding search
        if (IPAutocomplete.textfield.hasClass('startPoint')) {
            routeQuery.routePoints[0] = IPAutocomplete.selectedResult;
            if (typeof routeQuery.markerList[0] !== "undefined" && routeQuery.markerList[0]) {
                visitMaps.markersLayer.removeLayer(routeQuery.markerList[0]);
                routeQuery.submitRouteQuery();
            }
            routeQuery.markerList[0] = visitMaps.addMarker(routeQuery.routePoints[0], realHost + '/sites/all/themes/visitportugaltheme/img/pin_mapa_origem.png');
        } else if (IPAutocomplete.textfield.hasClass('endPoint')) {
            len = routeQuery.markerList.length - 1;
            routeQuery.routePoints[len] = IPAutocomplete.selectedResult;
            if (typeof routeQuery.markerList[len] !== "undefined" && routeQuery.markerList[len]) {
                visitMaps.markersLayer.removeLayer(routeQuery.markerList[len]);
                routeQuery.submitRouteQuery();
            }
            routeQuery.markerList[len] = visitMaps.addMarker(routeQuery.routePoints[len], realHost + '/sites/all/themes/visitportugaltheme/img/pin_mapa_destino.png');
        } else {
            index = IPAutocomplete.textfield.attr('data-index');
            routeQuery.routePoints[index] = IPAutocomplete.selectedResult;
            if (typeof routeQuery.markerList[index] !== "undefined" && routeQuery.markerList[index]) {
                visitMaps.markersLayer.removeLayer(routeQuery.markerList[index]);
                if (!isParsed) {
                    routeQuery.submitRouteQuery();
                }
            }
            markerHTML = '<div class="mapIcon routeMidMapIcon">' + $('.routeIcon', IPAutocomplete.textfield.parent().parent()).clone().html() + '</div>';
            routeQuery.markerList[index] = visitMaps.addMarker(routeQuery.routePoints[index], null, markerHTML);
        }
    };

    this.resultSelected = function(result) {
        latlon = new L.latLng(result.geometry.coordinates[1], result.geometry.coordinates[0]);
        visitMaps.map.panTo(latlon);
    };
};

var tabHost = new function() {
    this.host = null;
    this.children = null;
    this.init = function(host, children) {
        this.host = host;
        this.children = children;
        this.activateSelected();
    };
    this.switchToTab = function(theTabClickable, value) {
        if ($(theTabClickable) == $('.tab.selected')) {
            return false;
        }

        //Clear everything, everything back to defaults
        visitMaps.clearMarkersLayer();
        visitMaps.clearRouteLayer();

        visitPoisQuery.clearSearchForm();
        visitPoisQuery.clearResults();
        visitPoisQuery.toggleSearchForm(false, false);

        routeQuery.clearRouteForm();
        routeQuery.toggleRouteForm(false, false);

        $('.routeBox.endPoint').prop('disabled', false);

        //Search..
        $('#selectedTab').val(value);
        this.host.children('.tab').removeClass('selected');
        $(theTabClickable).addClass('selected');
        this.activateSelected($(theTabClickable).attr('id'));

        return false;
    };

    this.activateSelected = function(selectedTab) {
        if (!selectedTab) {
            validTabs = this.host.children('.tab.selected');
            if (validTabs.length > 0) {
                selectedTab = validTabs.first().attr('id');
            } else {
                selectedTab = this.host.children('.tab').first().attr('id');
            }
        }
        this.children.children('.tabContent').hide();
        this.children.children('.tabContent').filter('[data-tab="' + selectedTab + '"]').show();
    }
}

var miscUtils = new function() {
    this.showMore = function(element) {
        $('#poiContent').css('overflow-y', 'scroll');
        $(element).hide();
        return false;
    };
}

var IPCollapsable = new function() {
    this.applyToElement = function(element) {
        $('.collapsableHeader', $(element)).attr('onselectstart', 'return false;');
        $(element).attr('data-state', 0);

        $('.collapsableHeader', $(element)).click(function(event) {
            element = $(this).parent();
            openState = $(element).attr('data-state')
            if (typeof openState === "undefined" || openState == null) {
                openState = 0;
            } else {
                openState = parseInt(openState);
            }

            if (openState) {
                IPCollapsable.open(element);
            } else {
                IPCollapsable.close(element);
            }
        });

        return false;
    };

    this.open = function(element) {
        realHeight = $('.collapsableResults', $(element)).css('height', 'auto').height();
        $('.collapsableResults', $(element)).css('height', '0');

        $('.collapsableResults', $(element)).animate({
            height: realHeight
        }, 200, function() {});
        $('.colToggle', $('.collapsableHeader', $(element))).css('background-image', "url('/sites/all/themes/visitportugaltheme/img/seta_resultados_down.png')");
        $(element).attr('data-state', 0);

        return false;
    };

    this.close = function(element) {
        $('.collapsableResults', $(element)).animate({
            height: "0"
        }, 200, function() {});
        $('.colToggle', $('.collapsableHeader', $(element))).css('background-image', "url('/sites/all/themes/visitportugaltheme/img/seta_resultados_up.png')");
        $(element).attr('data-state', 1);

        return false;
    };
};


var z_t_x = function(callback) {
    grp = L.featureGroup();
                $.each(visitMaps.poisList, function(x, poi){ // cada poi
            grp.addLayer(poi);
        });

    visitMaps.map.fitBounds(grp.getBounds());  

    if(callback) {
        return callback();
    }
};

function printMap() {
    $('#mapLoading').show();
    $('#mapLoadingBackground').show();
    $('#mapLoadingBackground').animate({
        opacity: 0.2
    }, 300);
    $('#mapLoadingBackground').css("-ms-filter", "'progid:DXImageTransform.Microsoft.Alpha(Opacity=20)'");

    var topRight = null;
    var bottomLeft = null;
    var base = null;

    try {
        topRight = visitMaps.routeLineLayer.getBounds()._northEast;
        bottomLeft = visitMaps.routeLineLayer.getBounds()._southWest;
        base = 'visit';
    } catch (e) {
        throw e
        return false;
    }

    markerList = [];

    for (i = 0; i < visitMaps.poisList.length; i++) {
        marker = visitMaps.poisList[i]
        markerJSON = marker.toGeoJSON();

        if (typeof marker.options.icon.options.iconUrl !== "undefined") {
            markerJSON.properties.src = marker.options.icon.options.iconUrl;
            markerJSON.properties.offsetLeft = -21;
            markerJSON.properties.offsetTop = -30;

            // markerJSON.properties.offsetLeft = marker._icon.offsetLeft;
            // markerJSON.properties.offsetTop = marker._icon.offsetTop;
        } else {
            markerJSON.properties.src = "http://placehold.it/32x32";
            markerJSON.properties.meta = {
                innerText: marker._icon.innerText
            };
            markerJSON.properties.offsetLeft = -16;
            markerJSON.properties.offsetTop = -28;
        }
        markerList.push(markerJSON);
    }

    $.ajax({
        url: "https://printmaps.infoportugal.info/print",
        data: JSON.stringify({
            crossdomain: true,
            topRight: [parseFloat(topRight.lng), parseFloat(topRight.lat)],
            bottomLeft: [parseFloat(bottomLeft.lng), parseFloat(bottomLeft.lat)],
            polyLine: visitMaps.routeLineLayer.toGeoJSON(),
            markers: markerList,
            dimensions: [602, 480],
            baseLayer: base,
        }),
        type: "POST",
        dataType: "json",
        traditional: true,
        processData: false,
        success: function(data) {
            hideLoading();
            if (data.status) {
                var rDur = routeQuery.distanceStr + '; ' + routeQuery.durationStr;
                //openVisitMapsPrintPage(data.url, routeQuery.addManeuversForPrinting(), routeQuery.fromToStr, rDur);
                openVisitMapsPrintPage(data.url, routeQuery.addManeuversForPrinting(), $('.routeBox.startPoint').val() + ' - ' + $('.routeBox.endPoint').val() , rDur);
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            hideLoading();
        }
    });         
};

openVisitMapsPrintPage = function(imgUrl, maneuvers, routingDescription, routingDuration) {
    $('#mapLoading').show();
    $('#mapLoadingBackground').show();
    $('#mapLoadingBackground').animate({
        opacity: 0.2
    }, 300);
    $('#mapLoadingBackground').css("-ms-filter", "'progid:DXImageTransform.Microsoft.Alpha(Opacity=20)'");

    $.ajax({
        url: realHost + "/sites/all/libraries/visitPortugalMapsPrint.php?langcode=" + $(".perfil_language_code").html().trim(),
        data: {
            printUrl: imgUrl,
            mans: maneuvers,
            rDescr: routingDescription,
            rDurat: routingDuration,
        },
        type: "POST",
        success: function(data) {
            hideLoading();
            //window.location.href = data;
            window.open(data);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            hideLoading();
        }
    });
};

$(document).ready(function() {
    $('#radiusSelect').next().css('width', '57px');
    $('#page').css({
        'min-width': '100%'
    });
    $('#main-content').css({
        'padding-left': '0px',
        'padding-right': '0px',
        'padding-bottom': '0px',
        'padding-top': '0px'
    });
    $('.breadcrumb-inner').css({
        'display': 'none'
    });
    $('#bigMap').parent().css('position', 'relative');

    $('#mapLoading').show();
    $('#mapLoadingBackground').show();
    $('#mapLoadingBackground').animate({
        opacity: 0.2
    }, 300);
    $('#mapLoadingBackground').css("-ms-filter", "'progid:DXImageTransform.Microsoft.Alpha(Opacity=20)'");

    fillCategoriesOptions();
    fillRegionsOptions();
    fillLocalitiesOptions();

    visitMaps.init();

    tabHost.init($('.tabHost'), $('.tabChildren'));
    tabHost.switchToTab($('#searchTab'), 0);

    $('#searchBox').focus(function() {
        IPAutocomplete.init(this, visitPoisQuery, {
            customCallbackArgument: 'json.wrf',
            limit: 6,
            target: scriptSolr,
        });
    });

    $('.routeBox').each(function() {
        $(this).focus(function() {
            IPAutocomplete.init(this, routeQuery, {
                target: 'https://api3.infoportugal.info/geocoding.json',
                fallbacktarget: 'https://api3.infoportugal.info/geocoding.json',
                limit: 6,
                args: {
                    api_key: '8e650a0aff802a10cc25d079c7fdeffaa14447aa'
                }
            });
        });
    });

    $('#radiusSelect').next().css('width', '57px');
    $('#map').parent().css('position', 'relative');

    visitMaps.parseURLParameters(false);

    //Debug
    visitMaps.toggleSidePanel();
});

// Create Base64 Object
var Base64 = {
    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    encode: function(e) {
        var t = "";
        var n, r, i, s, o, u, a;
        var f = 0;
        e = Base64._utf8_encode(e);
        while (f < e.length) {
            n = e.charCodeAt(f++);
            r = e.charCodeAt(f++);
            i = e.charCodeAt(f++);
            s = n >> 2;
            o = (n & 3) << 4 | r >> 4;
            u = (r & 15) << 2 | i >> 6;
            a = i & 63;
            if (isNaN(r)) {
                u = a = 64
            } else if (isNaN(i)) {
                a = 64
            }
            t = t + this._keyStr.charAt(s) + this._keyStr.charAt(o) + this._keyStr.charAt(u) + this._keyStr.charAt(a)
        }
        return t
    },
    decode: function(e) {
        var t = "";
        var n, r, i;
        var s, o, u, a;
        var f = 0;
        e = e.replace(/[^A-Za-z0-9\+\/\=]/g, "");
        while (f < e.length) {
            s = this._keyStr.indexOf(e.charAt(f++));
            o = this._keyStr.indexOf(e.charAt(f++));
            u = this._keyStr.indexOf(e.charAt(f++));
            a = this._keyStr.indexOf(e.charAt(f++));
            n = s << 2 | o >> 4;
            r = (o & 15) << 4 | u >> 2;
            i = (u & 3) << 6 | a;
            t = t + String.fromCharCode(n);
            if (u != 64) {
                t = t + String.fromCharCode(r)
            }
            if (a != 64) {
                t = t + String.fromCharCode(i)
            }
        }
        t = Base64._utf8_decode(t);
        return t
    },
    _utf8_encode: function(e) {
        e = e.replace(/\r\n/g, "\n");
        var t = "";
        for (var n = 0; n < e.length; n++) {
            var r = e.charCodeAt(n);
            if (r < 128) {
                t += String.fromCharCode(r)
            } else if (r > 127 && r < 2048) {
                t += String.fromCharCode(r >> 6 | 192);
                t += String.fromCharCode(r & 63 | 128)
            } else {
                t += String.fromCharCode(r >> 12 | 224);
                t += String.fromCharCode(r >> 6 & 63 | 128);
                t += String.fromCharCode(r & 63 | 128)
            }
        }
        return t
    },
    _utf8_decode: function(e) {
        var t = "";
        var n = 0;
        var r = c1 = c2 = 0;
        while (n < e.length) {
            r = e.charCodeAt(n);
            if (r < 128) {
                t += String.fromCharCode(r);
                n++
            } else if (r > 191 && r < 224) {
                c2 = e.charCodeAt(n + 1);
                t += String.fromCharCode((r & 31) << 6 | c2 & 63);
                n += 2
            } else {
                c2 = e.charCodeAt(n + 1);
                c3 = e.charCodeAt(n + 2);
                t += String.fromCharCode((r & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
                n += 3
            }
        }
        return t
    }
}

function getParameterByName(name, urlString) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(urlString);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function getParameterByName2(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}


var cords_arr = [];
var points_list = [];

function LoadURLParams() {
    var url_encoded = window.location.href.split('/mapas/')[1];
    if (url_encoded) {
        var tab = getParameterByName('t', '?' + Base64.decode(url_encoded));
        var selected_region = getParameterByName('r', '?' + Base64.decode(url_encoded));
        var selected_locality = getParameterByName('l', '?' + Base64.decode(url_encoded));
        var keywords = getParameterByName('k', '?' + Base64.decode(url_encoded));
        var selected_filters = getParameterByName('f', '?' + Base64.decode(url_encoded));
        points_list = getParameterByName('pl', '?' + Base64.decode(url_encoded));
        if (points_list.length != 0) {
            points_list = JSON.parse(points_list);
        };
        var selected_route_method = getParameterByName('m', '?' + Base64.decode(url_encoded));
        var selected_toll = getParameterByName('toll', '?' + Base64.decode(url_encoded));

        if (tab == 'searchTab') {
            // Marcar os pontos de interesse
            var selected_filters_arr = selected_filters.split(',');
            $.each(selected_filters_arr, function(key, value) {
                $('.poiCategorySelectable input:checkbox[value=' + value + ']').prop('checked', true);
            });

            // Preencher textbox de pesquisa
            $('.poiSearchBox').val(keywords);

            // Preencher DDL Regiões
            $('#regionsSelect').val(selected_region);
            $('#regionsSelect').trigger('change');
            Foundation.libs.forms.refresh_custom_select($('#regionsSelect'), true);

            // Preencher DDL Localidades
            fillLocalitiesOptions(selected_locality);
        } else {
            $("#routeTab").click();
            hideLoading();
            points_list = getParameterByName('pl', '?' + Base64.decode(url_encoded));
            if (points_list.length != 0) {
                points_list = JSON.parse(points_list);
            };

            if (!isNaN(selected_route_method)) {
                $('.routeOption input[value="' + selected_route_method + '"]').parent().find('span').click()
            };

            if (!isNaN(selected_toll)) {
                $('.tollOption input[value="' + selected_toll + '"]').parent().find('span').click();
            };

            // Adicionar os pontos intermédios
            for (var i = 0; i < points_list.length - 2; i++) {
                $('#addMidPoints a').click();
            }

            // Obter geoData através das coordenadas
            $.each(points_list, function(key, value) {
                var coordenadas = value.split(',');
                geocodingUrl = 'https://geocoding.infoportugal.info/?api_key=Xiebe7jRY21ne6GhXdIhNbPgj8orB5bad5jYMvzJe7GGJsPoJ5&lat=' + coordenadas[1] + '&lon=' + coordenadas[0] + '&callback=visitMaps.geocodingJSONPCallback';
                visitMaps.requestGeoJSONP(geocodingUrl);
            })
        };

    } else {
        // Verificar os parametros GET loc e reg
        var _reg = getParameterByName2('reg');
        var _loc = getParameterByName2('loc');

        if ( _reg == parseInt(_reg) )   {
          $('#regionsSelect').val(_reg);
          $('#regionsSelect').trigger('change');
          Foundation.libs.forms.refresh_custom_select($('#regionsSelect'), true);
        };

        if ( _loc == parseInt(_loc) ) {
          //fillLocalitiesOptions(_loc, false);
          $('#localitySelect').val(_loc);
          Foundation.libs.forms.refresh_custom_select($('#localitySelect'), true);
        };

        visitMaps.parseURLParameters();
        hideLoading();
    }

    var zoom = getParameterByName2('zoom');
    if (zoom > 0) {
        visitMaps.map.setZoom(zoom);
    };
}


function generateUrl() {
    // Obter tab seleccionada
    var selected_tab = $('.tab.selected').attr('id');

    // Obter todos os filtros seleccionados
    var selected_filters = [];
    $('.poiCategorySelectable input:checkbox').each(function() {
        (this.checked ? selected_filters.push($(this).val()) : false);
    });

    // Obter região seleccionada
    var selected_region = $('#regionsSelect option:selected').val();

    // Obter localidade seleccionada
    var selected_locality = $('#localitySelect option:selected').val();

    // Obter palavras de pesquisa
    var keywords = $('.mapcontent #searchBox').val();

    // Obter lista de pontos
    var points_list = [];
    $.each(routeQuery.routePoints, function(key, value) {
        if (value != undefined && value != 'NULL') {
            points_list.push(value.geometry.coordinates[0] + "," + value.geometry.coordinates[1])
        }
    });

    // Obter tipo de veículo
    var selected_route_method = $('.routeOption .radio.checked').parent().find('input').val();

    // Obter tipo de portagens
    var selected_toll = $('.tollOption .radio.checked').parent().find('input').val();



    // Construir o URL
    var final_url_params = "";
    var url_params = Object();

    (selected_region != -1 ? url_params.r = selected_region : false);
    (selected_locality != -1 ? url_params.l = selected_locality : false);
    (keywords.length != 0 ? url_params.k = keywords : false);
    (selected_filters.length != 0 ? url_params.f = selected_filters.join() : false);
    (selected_tab != '' ? url_params.t = selected_tab : false);
    (points_list.length != 0 ? url_params.pl = JSON.stringify(points_list) : false);
    (!isNaN(selected_route_method) ? url_params.m = selected_route_method : false);
    (!isNaN(selected_toll) ? url_params.toll = selected_toll : false);

    final_url_params = $.param(url_params, true);

    // Encode the Params String
    var encodedParams = Base64.encode(final_url_params);

    if (window.history.pushState) {
        //window.history.pushState(null, null, window.location.href.split('/mapas')[0] + '/mapas/' + encodedParams);
    };

    // Decode the String
    // var decodedString = Base64.decode(encodedString);
    // console.log(decodedString); 

    console.log(window.location.href.split('?')[0] + '/' + encodedParams)
    // $('.detail-button-icon-only.addthis_button').attr('addthis:url', window.location.href.split('?')[0] + '/' + encodedParams);
    // addthis.button(".addthis_button");

}


$('#close_context').click(function(){
  $('#mouse-menu').fadeOut(200);
});

$('#mouse-menu').click(function(){
  $('#mouse-menu').fadeOut(200);
});


$('#bigMap').click(function(){
  $('#mouse-menu').fadeOut(200);
});


$(document).on('click','#btn_from_here', function(){
  if ($('.tab.selected').attr('id') != 'routeTab') {
    $('#routeTab').click();
  };
  //$('.startPoint')

  // Criar GeoJSON
  var geojson = {
      'geometry': {
          'coordinates': [parseFloat(context_menu_lng), parseFloat(context_menu_lat)],
          'type': 'Point'
      }
  };

  if (routeQuery.routePoints[0] != undefined) {
    visitMaps.markersLayer.removeLayer(routeQuery.markerList[0]);
  };

  routeQuery.routePoints[0] = geojson;
  routeQuery.markerList[0] = visitMaps.addMarker(routeQuery.routePoints[0], realHost + '/sites/all/themes/visitportugaltheme/img/pin_mapa_origem.png');
  fillTextboxValues();
});


$(document).on('click','#btn_to_here', function(){
  if ($('.tab.selected').attr('id') != 'routeTab') {
    $('#routeTab').click();
  };
  //$('.endPoint')
  
  // Criar GeoJSON
  var geojson = {
      'geometry': {
          'coordinates': [parseFloat(context_menu_lng), parseFloat(context_menu_lat)],
          'type': 'Point'
      }
  };
  if (routeQuery.routePoints[routeQuery.routePoints.length-1] != undefined) {
    visitMaps.markersLayer.removeLayer(routeQuery.markerList[routeQuery.routePoints.length-1]);
  };

  routeQuery.routePoints[routeQuery.routePoints.length-1] = geojson;
  routeQuery.markerList[routeQuery.routePoints.length-1] = visitMaps.addMarker(routeQuery.routePoints[routeQuery.routePoints.length-1], realHost + '/sites/all/themes/visitportugaltheme/img/pin_mapa_destino.png');
  fillTextboxValues();
});

$(document).on('click','#btn_pass_here', function(){
  if ($('.tab.selected').attr('id') != 'routeTab') {
    $('#routeTab').click();
  };
  removeEmptyMidPoints();
  // Criar GeoJSON
  var geojson = {
      'geometry': {
          'coordinates': [parseFloat(context_menu_lng), parseFloat(context_menu_lat)],
          'type': 'Point'
      }
  };

  routeQuery.addMidPoint();
  routeQuery.routePoints[routeQuery.routePoints.length-2] = geojson;
  markerHTML = '<div class="mapIcon routeMidMapIcon">' + $('.routeMidIcon:last').clone().html() + '</div>';
  routeQuery.markerList[routeQuery.routePoints.length-2] = visitMaps.addMarker(routeQuery.routePoints[routeQuery.routePoints.length-2], null, markerHTML, false);
  // routeQuery.markerList[routeQuery.routePoints.length-2] = visitMaps.addMarker(routeQuery.routePoints[routeQuery.routePoints.length-2],null);
  fillTextboxValues();
});


function fillTextboxValues(){
  points_list = [];
  $.each(routeQuery.routePoints, function(key,value){
    if (value != undefined) {
      points_list[key] = (value.geometry.coordinates[0] + ',' + value.geometry.coordinates[1]);
      //points_list.push(value.geometry.coordinates[0] + ',' + value.geometry.coordinates[1]);
    }else{
        points_list[key] = null;
    };
  });

  // Obter geoData através das coordenadas
  $.each(points_list, function(key, value) {
      if (value) {
        var coordenadas = value.split(',');
        geocodingUrl = 'https://geocoding.infoportugal.info/?api_key=Xiebe7jRY21ne6GhXdIhNbPgj8orB5bad5jYMvzJe7GGJsPoJ5&lat=' + coordenadas[1] + '&lon=' + coordenadas[0] + '&callback=visitMaps.geocodingJSONPCallbackTextboxValues';
        visitMaps.requestGeoJSONP(geocodingUrl);
      }; 
  });
}

$(document).on('click','.remove-midpoint-btn',function(){
    var data_index = $(this).parent().find('input.routeBox').attr('data-index');
    try{
        visitMaps.markersLayer.removeLayer(routeQuery.markerList[data_index]);
    }catch(e){}
    routeQuery.markerList.splice(data_index,1);
    routeQuery.routePoints.splice(data_index,1);
    var letra_mid_point = $(this).parent().find('.routeMidIcon .midPointLabel').html();
    removeMidPointLabels(data_index);
    $(this).parent().parent().remove();
});

function removeMidPointLabels(pointID){
    var alphabet = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    $('.routeMidPoint').each(function(){
        var cur_data_index = parseInt($(this).find('.routeBox').attr('data-index'));
        if ( cur_data_index > pointID) {
            $(this).find('.midPointLabel').html(alphabet[cur_data_index-1]);
            $(this).find('.routeBox').attr('data-index', cur_data_index-1);
            // Marker HTML
            $('.midPointLabel').each(function(){
                if ($(this).html() == alphabet[cur_data_index]) {
                    $(this).html(alphabet[cur_data_index-1]);
                };
            });
        };
    });
    // Altrar o POPUP de cada midpoint
    $('.routeMidPoint').each(function(){
        var cur_data_index = parseInt($(this).find('.routeBox').attr('data-index'));
        try{
            routeQuery.markerList[cur_data_index]._popup._content = '<div class="mapIcon routeMidMapIcon">' + $(this).find('.routeIcon').html() + '</div>';
        }catch(e){}
    });
}


 $(document).on('click','.icon-fa-arrows-v', function(){
    var ClickedMidPoint = parseInt($(this).parent().find('.routeBox').attr('data-index'));
    var LastMidPoint = false;
    var position = -1;
    if (isNaN(ClickedMidPoint)) {
        LastMidPoint = true;
        position = routeQuery.routePoints.length -1;
    }else{
        position = ClickedMidPoint;
    };
    SwitchMidPoints(position);
});

function SwitchMidPoints(position){
        var PointA = position -1;
        var PointB = position;
        var PointAux;
        var alphabet = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    if ((routeQuery.markerList[PointA] && routeQuery.markerList[PointB]) || (routeQuery.routePoints.length == 2) ){
        // Change RouteBox textbox values
        var routeBoxesArray = $('.routeBox');
        routeBoxesArray.splice(0,1);
        PointAux = $(routeBoxesArray[PointA]).val();
        $(routeBoxesArray[PointA]).val($(routeBoxesArray[PointB]).val());
        $(routeBoxesArray[PointB]).val(PointAux);

        // Change Markers on Map
        try{
            var iconPointAux = routeQuery.markerList[PointA].options.icon;
            routeQuery.markerList[PointA].setIcon(routeQuery.markerList[PointB].options.icon);
            routeQuery.markerList[PointB].setIcon(iconPointAux);
        }catch(e){
           
                if (routeQuery.markerList[PointA]) {
                    if (PointA == 0) {
                        routeQuery.markerList[PointA].setIcon(
                            new visitMaps.markerIcon({
                                iconUrl: realHost + '/sites/all/themes/visitportugaltheme/img/pin_mapa_destino.png'
                            })
                        );
                    }else if(PointA == (routeQuery.routePoints.length -1)){
                        routeQuery.markerList[PointA].setIcon(
                            new visitMaps.markerIcon({
                                iconUrl: realHost + '/sites/all/themes/visitportugaltheme/img/pin_mapa_origem.png'
                            })
                        );
                    }else{
                        //routeQuery.markerList[PointA].setIcon(routeQuery.markerList[PointB].options.icon);
                    };
                };
                if (routeQuery.markerList[PointB]) {
                    if (PointB == 0) {
                        routeQuery.markerList[PointB].setIcon(
                            new visitMaps.markerIcon({
                                iconUrl: realHost + '/sites/all/themes/visitportugaltheme/img/pin_mapa_destino.png'
                            })
                        );
                    }else if(PointB == (routeQuery.routePoints.length -1)){
                        routeQuery.markerList[PointB].setIcon(
                            new visitMaps.markerIcon({
                                iconUrl: realHost + '/sites/all/themes/visitportugaltheme/img/pin_mapa_origem.png'
                            })
                        );
                    }else{
                        //routeQuery.markerList[PointA].setIcon(routeQuery.markerList[PointB].options.icon);
                    };
                };
        }
        
        // Change Maker on MarkersList
        var markerListAux = routeQuery.markerList[PointA];
        routeQuery.markerList[PointA] = routeQuery.markerList[PointB];
        routeQuery.markerList[PointB] = markerListAux;

        // Change RoutePoints
        var routePointsAux = routeQuery.routePoints[PointA];
        routeQuery.routePoints[PointA] = routeQuery.routePoints[PointB];
        routeQuery.routePoints[PointB] = routePointsAux;

    };
}


function removeEmptyMidPoints(){
    $('.routeMidPoint .routeBox').each(function(){
        if ($(this).val().trim().length <= 1) {
            $(this).parent().find('.remove-midpoint-btn').click();
        };
    });
}


$('.routeOption').click(function(){
    if ($('input[name="vOption"][checked]').siblings('.custom.radio.checked').size() != 0) {
        $('#tollOption').hide();
    }else{
        $('input[name="tOption"][value=1]').siblings('.custom.radio').click();
        $('#tollOption').show();
    };
});


















