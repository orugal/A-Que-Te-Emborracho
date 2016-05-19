/*Controlador editaInfo*/
var html5 = {};
var dbsize = 1024 * 1024; //1MB
html5.db = null;
html5.db = openDatabase("aqte", "1.0", "A que te emborracho", dbsize);

aqte.controller('intro', function($scope,$http,$q,$cordovaCamera)
{
	$scope.initIntro = function()
	{
		swal({
			title:"Bienvenido",
			"text":"Bienvenido al juego en donde una simple reunión de amigos puede ser una excusa para beber.",
			"type":"info",
			"html":true
		},function(){
			//location.reload();
		});
	}
	$scope.ingresarJuego = function()
	{

		swal({
				title: "Advertencia",   
				text: "Este juego es apto sólo para mayores de edad.<br> Recuerde si va a jugar no maneje, entregue las llaves.",   
				type: "warning",   
				showCancelButton: true,   
				confirmButtonColor: "#DD6B55",   
				confirmButtonText: "Tengo más de 18!",  
				 cancelButtonText: "Mejor no juego",  
				closeOnConfirm: false ,
				html:true
			}, 
			function()
			{   
				document.location = "home.html"
			});
	}
});	

/*Controlador editaInfo*/
aqte.controller('home', function($scope,$http,$q,$cordovaCamera,$cordovaSQLite,$cordovaSpinnerDialog)
{
	$scope.players = [];

	$scope.initHome = function()
	{

		document.addEventListener("backbutton", function(){

		}, false);

		setTimeout(function(){
			$cordovaSpinnerDialog.show("Cargando datos del juego...","Un momento por favor...", true);
		},100);
		//$scope.createDb();//creo la base de datos
		$scope.createTablesGame();//creo las tablas de juego
		$scope.getPlayers();//traigo los jugadores actuales
		setTimeout(function(){
			$cordovaSpinnerDialog.hide();
			if($scope.players.length == 0)
			{
				swal({
					title:"Antes de jugar",
					"text":"Debes agregar algunos jugadores.",
					"type":"info",
					"html":true
				},function(){
					//location.reload();
				});
			}
		},1000);
		
	}
	$scope.addFriend = function()
	{
		swal({   
			title: "Registrar jugador",   
			text: '<!--<center><a ng-click="getPictureProfile()"><img id="fotoCapturada" src="img/profile.png" class="img-circle"></img></a></center>-->',   
			type: "input",
			html:true,   
			showCancelButton: true,   
			closeOnConfirm: false,   
			animation: "slide-from-top",   
			inputPlaceholder: "Nombre del jugador" 
		}, 
		function(inputValue)
		{   
			if (inputValue === false)
			{ 
				return false;      
			}
			else if (inputValue === "") 
			{     
				swal.showInputError("Debes escribir el nombre!");     
				return false   
			}    
			else
			{
				$scope.insertPlayer(inputValue);
				$scope.players = [];
				$scope.$digest();
				$scope.getPlayers();
				setTimeout(function(){
	                $('.eventosHomePro').bootstrapToggle();
	            },1000);
				swal("Genial!", "has agregado a: " + inputValue, "success"); 
			}  
		});
		//alert("sdfkjsdhfkdjshf");
	}
	$scope.createTablesGame = function()
	{
		$scope.createTablePlayers();//jugadores
		$scope.createTablePartida();//partida
	}
	$scope.dropTablePartida = function()
	{
		html5.db.transaction(function(tx){
         	tx.executeSql("DROP TABLE partida", []);
     	});
	}
	$scope.createTablePartida = function()
	{
		$scope.dropTablePartida();

		html5.db.transaction(function(tx){
         	tx.executeSql("CREATE TABLE IF NOT EXISTS partida(idPartida INTEGER PRIMARY KEY, player INTEGER, pos INTEGER)", []);
     	});
	}
	$scope.createTablePlayers = function()
	{
		html5.db.transaction(function(tx){
         	tx.executeSql("CREATE TABLE IF NOT EXISTS players(id INTEGER PRIMARY KEY, nombre TEXT, picture TEXT)", []);
     	});
	}
	$scope.getPlayers = function()
	{
		//$cordovaSpinnerDialog.show("Cargando datos del juego","Un momento por favor...", true);
		html5.db.transaction(function(tx){
           tx.executeSql("SELECT * FROM players ORDER BY id DESC",[],$scope.listPlayers, html5.onError);
        });
	}
	$scope.listPlayers = function(tx, rs)
	{
		for(var i = 0; i < rs.rows.length; i++)
		{
	        //alert(rs.rows.item(i).nombre);
	        $scope.players.push(rs.rows.item(i));//paso los resultados al Scope que me pintará los jugadores
			$scope.$digest();
			//$cordovaSpinnerDialog.hide();
			console.log($scope.players);
	    }
	}
	$scope.insertPlayer = function(name)
	{
		html5.db.transaction(function(tx){
           tx.executeSql("INSERT INTO players(nombre) VALUES(?)",[name],html5.onSuccess,html5.onError);
        });
	}
	$scope.updatePlayer = function(picture,id)
	{
		html5.db.transaction(function(tx){
           tx.executeSql("UPDATE players set picture = ? WHERE id=?",[picture,id],html5.onSuccess,html5.onError);
        });
	}
	$scope.getPictureProfile = function(id)
	{
		var options = {
		      quality: 20,
		      destinationType: Camera.DestinationType.DATA_URL,
		      sourceType: Camera.PictureSourceType.CAMERA,
		      allowEdit: true,
		      encodingType: Camera.EncodingType.PNG,
		      targetWidth: 100,
		      targetHeight: 100,
		      popoverOptions: CameraPopoverOptions,
		      saveToPhotoAlbum: false,
		      correctOrientation:true
		    };

		    $cordovaCamera.getPicture(options).then(function(imageData) 
		    {
		    	//actualizo la foto en la base de datos
		    	$scope.updatePlayer(imageData,id);
		    	$("#imagen"+id).attr("src","data:image/jpeg;base64," + imageData);
		    }, function(err) 
		    {
		      alert(err)
		    });
	}
	$scope.startGame = function()
	{
		var jugadores = $(".eventosHomePro:checked");

		if(jugadores.length > 1 && jugadores.length <= 5)
		{
			//antes de empezar una partida borro las que hayan
			html5.db.transaction(function(tx){
	           tx.executeSql("DELETE FROM  partida",[],html5.onSuccess,html5.onError);
	        });

			var cont = 1;
			$.each(jugadores,function(){
				var id 		  = $(this).attr("rel")
				//alert(id);
				//inserto los jugadores que van a jugar
				html5.db.transaction(function(tx){
		           tx.executeSql("INSERT INTO partida(player,pos) VALUES(?,?)",[id,1],function(){
		           	//alert("insertado!! - "+cont+" - "+jugadores.length);
		           	if(cont == jugadores.length)
					{
						$cordovaSpinnerDialog.hide();
						document.location = "partida.html";
					}
					cont++;
		           },html5.onError);
		        });
		        
			});

			$cordovaSpinnerDialog.show("Iniciando Partida","Un momento por favor...", true);
		}
		else if(jugadores.length > 5)
		{
			swal({
					title:"Atención",
					"text":"El máximo de jugadores por partida es de 5.",
					"type":"info",
					"html":true
				},function(){
					//location.reload();
				});
		}
		else
		{
			swal({
					title:"Atención",
					"text":"Debe seleccionar por lo  menos dos jugadores para empezar la partida.",
					"type":"info",
					"html":true
				},function(){
					//location.reload();
				});
		}
	}
});	


/*Controla la ventana de la partida*/
aqte.controller('partida', function($scope,$http,$q,$cordovaCamera,$cordovaSQLite,$cordovaSpinnerDialog)
{
	var elementoInicial = null;
	//1: Es para iniciar
	//2: Es para tomar
	//4: Para el Shot, para la punteria y la copa de la amistad
	//5: Penitencias
	//6: Retroceder casillas
	//7: Dedito bailarin
	//8: De reversa
	//9: Fin del juego
	$scope.activePlayers 	= [];
	$scope.activePlayersBig = [];
	var posJugador	 	= 0;
	var posJugador2	 	= 0;
	$scope.pista = [
		{
			id:1,
			nombre:'Empecemos!',
			tipo:1,
			imagen:'img/pista/imagen1.svg',
			fondo:'img/pista/fondo1.svg',
			color:'#B1283E',
			cantidad:'0'
		},
		{
			id:2,
			nombre:'Toma 2',
			tipo:2,
			imagen:'img/pista/imagen2.svg',
			fondo:'img/pista/fondo2.svg',
			color:'#009ACE',
			cantidad:'2'
		},
		{
			id:3,
			nombre:'Un shot para tu amigo de la Izquierda',
			tipo:2,
			imagen:'img/pista/imagen3.svg',
			fondo:'img/pista/fondo3.svg',
			color:'#F5AD00',
			cantidad:'1'
		},
		{
			id:4,
			nombre:'Prueba tu punteria',
			tipo:2,
			imagen:'img/pista/imagen4.svg',//punteria
			fondo:'img/pista/fondo4.svg',
			color:'#009ACE',
			cantidad:'0'
		},
		{
			id:5,
			nombre:'La copa de la amistad',
			tipo:4,
			imagen:'img/pista/imagen5.svg',
			fondo:'img/pista/fondo5.svg',
			color:'#E44537',
			cantidad:'0'
		},
		{
			id:6,
			nombre:'Penitencia',
			tipo:5,
			imagen:'img/pista/imagen6.svg',//penitencia
			fondo:'img/pista/fondo6.svg',
			color:'#009CA1',
			cantidad:'0'
		},
		{
			id:7,
			nombre:'El dado dice...',
			tipo:5,
			imagen:'img/pista/imagen7.svg',
			fondo:'img/pista/fondo7.svg',
			color:'#10509E',
			cantidad:'0'
		},
		{
			id:8,
			nombre:'Penitencia',
			tipo:5,
			imagen:'img/pista/imagen6.svg',//penitencia
			fondo:'img/pista/fondo6.svg',
			color:'#009CA1',
			cantidad:'0'
		},
		{
			id:9,
			nombre:'2 casillas atrás',
			tipo:6,
			imagen:'img/pista/imagen8.svg',//retroceder
			fondo:'',
			color:'#E96E10',
			cantidad:'2'
		},
		{
			id:10,
			nombre:'Penitencia',
			tipo:5,
			imagen:'img/pista/imagen6.svg',//penitencia
			fondo:'img/pista/fondo6.svg',
			color:'#009CA1',
			cantidad:'0'
		},
		{
			id:11,
			nombre:'Un shot para tu amigo de la Derecha',
			tipo:2,
			imagen:'img/pista/imagen9.svg',
			fondo:'img/pista/fondo3.svg',
			color:'#F5AD00',
			cantidad:'1'
		},
		{
			id:12,
			nombre:'El dedito bailarin',
			tipo:7,
			imagen:'img/pista/imagen10.svg',//dedito
			fondo:'img/pista/fondo10.svg',
			color:'#DA1743',
			cantidad:'0'
		},
		{
			id:13,
			nombre:'De reversa',
			tipo:8,
			imagen:'img/pista/imagen11.svg',
			fondo:'img/pista/fondo11.svg',
			color:'#692A8A',
			cantidad:'0'
		},
		{
			id:14,
			nombre:'La copa de la amistad',
			tipo:4,
			imagen:'img/pista/imagen5.svg',//copa de la amistad
			fondo:'img/pista/fondo5.svg',
			color:'#E44537',
			cantidad:'0'
		},
		{
			id:15,
			nombre:'Penitencia',
			tipo:5,
			imagen:'img/pista/imagen6.svg',//penitencia
			fondo:'img/pista/fondo6.svg',
			color:'#009CA1',
			cantidad:'0'
		},
		{
			id:16,
			nombre:'La copa de la amistad',
			tipo:4,
			imagen:'img/pista/imagen5.svg',//copa de la amistad
			fondo:'img/pista/fondo5.svg',
			color:'#E44537',
			cantidad:'0'
		},
		{
			id:17,
			nombre:'Toma 3',
			tipo:2,
			imagen:'img/pista/imagen12.svg',
			fondo:'img/pista/fondo2.svg',
			color:'#009ACE',
			cantidad:'3'
		},
		{
			id:18,
			nombre:'1 casilla atrás',
			tipo:6,
			imagen:'img/pista/imagen13.svg',//retroceder
			fondo:'',
			color:'#E96E10',
			cantidad:'1'
		},
		{
			id:19,
			nombre:'Penitencia',
			tipo:5,
			imagen:'img/pista/imagen6.svg',//penitencia
			fondo:'img/pista/fondo6.svg',
			color:'#009CA1',
			cantidad:'0'
		},
		{
			id:20,
			nombre:'El dado dice...',
			tipo:5,
			imagen:'img/pista/imagen7.svg',//dado dice
			fondo:'img/pista/fondo7.svg',
			color:'#10509E',
			cantidad:'0'
		},
		{
			id:21,
			nombre:'El dedito bailarin',
			tipo:7,
			imagen:'img/pista/imagen10.svg',//dedito
			fondo:'img/pista/fondo10.svg',
			color:'#DA1743',
			cantidad:'0'
		},
		{
			id:22,
			nombre:'Prueba tu punteria',
			tipo:2,
			imagen:'img/pista/imagen4.svg',//punteria
			fondo:'img/pista/fondo4.svg',
			color:'#009ACE',
			cantidad:'0'
		},
		{
			id:23,
			nombre:'Penitencia',
			tipo:5,
			imagen:'img/pista/imagen6.svg',//penitencia
			fondo:'img/pista/fondo6.svg',
			color:'#009CA1',
			cantidad:'0'
		},
		{
			id:24,
			nombre:'4 casillas atrás',
			tipo:6,
			imagen:'img/pista/imagen14.svg',//retroceder
			fondo:'',
			color:'#E44537',
			cantidad:'4'
		},
		{
			id:25,
			nombre:'Toma 3',
			tipo:2,
			imagen:'img/pista/imagen12.svg',//toma 3
			fondo:'img/pista/fondo2.svg',
			color:'#009ACE',
			cantidad:'3'
		},
		{
			id:26,
			nombre:'Penitencia',
			tipo:5,
			imagen:'img/pista/imagen6.svg',//penitencia
			fondo:'img/pista/fondo6.svg',
			color:'#009CA1',
			cantidad:'0'
		},
		{
			id:27,
			nombre:'2 casillas atrás',
			tipo:6,
			imagen:'img/pista/imagen8.svg',//retroceder
			fondo:'',
			color:'#E96E10',
			cantidad:'2'
		},
		{
			id:28,
			nombre:'Felicitaciones, eres un gran bebedor',
			tipo:9,
			imagen:'img/pista/imagen15.svg',//Final
			fondo:'img/pista/fondo15.svg',
			color:'#DA1743',
			cantidad:''
		}
		
	]


	$scope.initPartida = function()
	{

		document.addEventListener("backbutton", function(){

			swal({
				title: "Advertencia",   
				text: "Está a punto de terminar la partida, esto borrara todos los datos del juego, desea continuar?.",   
				type: "warning",   
				showCancelButton: true,   
				confirmButtonColor: "#DD6B55",   
				confirmButtonText: "Salir de la partida",  
				cancelButtonText: "Quedarme en la partida",  
				closeOnConfirm: false 
			}, 
			function()
			{   
				document.location = "home.html"
			});

		}, false);

		//muevo el contenedor de la pista abajo del menu principal

		setTimeout(function(){
			$scope.getPartida();
		},1000);

		//inicializo cosas necesarias
		setTimeout(function()
		{
			$scope.resizeTrack();	
			$scope.restartVarGame();
			//debo poner a los jugadores en el punto de partida
			var gamersBig 	=	"";
			$.each($scope.activePlayersBig,function(key,value)
			{
				if(value.picture == null)
				{
					gamersBig += '<img id="gamer'+value.id+'" style="box-shadow: 0px 0px 5px #000;margin:2% 3% 0 0" src="img/profile.png" class="img-circle" width="15%">'
				}
				else
				{
					gamersBig += '<img id="gamer'+value.id+'" style="box-shadow: 0px 0px 5px #000;margin:2% 3% 0 0" src="data:image/jpeg;base64,'+value.picture+'" class="img-circle" width="15%">'	
				}
			})
			$("#boxTrack1 .placePlayer").html(gamersBig);




		},1100);
	}
	$scope.resizeTrack = function()
	{
		var altoMenu = $("#menuPista").height();
		//alert(altoMenu)
		$("#contPista").css("margin-top",altoMenu+"px");
	}
	$scope.restartVarGame = function()
	{
		$scope.initialTurn();
	}
	//asigna turno inicial
	$scope.initialTurn = function()
	{
		$(".turnMark").removeClass("actualTurno");
		$(".turnMark").first().addClass("actualTurno");
		elementoInicial = $(".turnMark").attr("id");
	}
	$scope.nextTurn = function()
	{
		var cantPlayers    = ($(".turnMark").length - 1);
		var actualturn     = $(".turnMark.actualTurno");
		var actualturnId   = $(".turnMark.actualTurno").attr("id");
		var actualturnRel  = $(".turnMark.actualTurno").attr("rel");

		//alert(actualturnRel)
		$scope.getDataPlayerTurno2(actualturnRel);
		//alert(posJugador2)
		setTimeout(function(){
			$scope.ancla("#boxTrack"+posJugador2);
		},1000)


		//debo mover la pantalla hasta donde la persona que debe tomar el turno.
		//alert(actualturnId+" - "+actualturnRel);
		if(actualturnId >= cantPlayers)
		{
			$(".turnMark").removeClass("actualTurno");
			$("#0").addClass("actualTurno");
		}
		else
		{
			var nextTurn = (parseInt(actualturnId) + parseInt(1));
			//alert(nextTurn)
			$(".turnMark").removeClass("actualTurno");
			$("#"+nextTurn).addClass("actualTurno");
		}
	}
	$scope.playGame = function()
	{
		//esta es la función que va a analizar tooooooodo el juego
		//debo saber cual es el jugador que esta activo en el turno
		var actualturn     		= $(".turnMark.actualTurno");
		var idElPlayer	  		= actualturn.attr("id");	
		var idPlayer	   		= actualturn.attr("rel");
		var fichaJugadorTurno	=	$("#gamer"+idPlayer);

		$cordovaSpinnerDialog.show("Lanzando dados","Un momento por favor...", true);
		setTimeout(function(){
			$cordovaSpinnerDialog.hide();
			var resultDado	=	$scope.dices(1,6);
			//notifico lo que digan los dados
			swal({
				title:resultDado+"!!",
				"text":"<img src='img/dados/"+resultDado+".svg'/>",
				"html":true,
				confirmButtonText: "Avanzar",
			},function()
			{

				//debo hacer que el jugador en turno avance, pero primero debo saber en que posición se encuentra
				$scope.getDataPlayerTurno(idPlayer);
				setTimeout(function()
				{
					//alert("la posicion Actual es: "+posJugador);
					//calculo la siguiente posición
					var nextPos = (parseInt(posJugador) + parseInt(resultDado));
					//pongo la ficha en el lugar de la nueva posicion, esta posición siempre será el lugar donde está + la de la nueva posicion
					fichaJugadorTurno.appendTo("#boxTrack"+nextPos+" .placePlayer");
					//muevo el mapa hacia la nueva posición
					$scope.ancla("#boxTrack"+nextPos);
					//ahora debo actualizar el turno del usuario en la mini ficha para más adelante poder saber de donde viene
					$scope.updatePlayerPos(nextPos,idPlayer);
					//paso al siguiente turno
					setTimeout(function(){
						$scope.nextTurn();	
					},1000)
					

				},1000);


			});
		},2000);
	}
	$scope.ancla = function(anchor)
	{
		var altoCaja = $(anchor).height();
        $('html, body').stop().animate({
            scrollTop: (parseInt(jQuery(anchor).offset().top) - parseInt(altoCaja))
        }, 1000,function(){
        	$(anchor).addClass("blink");
        	setTimeout(function(){
        		$(anchor).removeClass("blink");
        	},2000);
        });
        return false;
	}
	$scope.dices = function(inferior,superior)
	{
		var numPosibilidades = superior - inferior 
	   	var aleat = Math.random() * numPosibilidades 
	   	aleat = Math.round(aleat) 
	   	return parseInt(inferior) + aleat
	}
	$scope.getDataPlayerTurno = function(p)
	{
		html5.db.transaction(function(tx){
           tx.executeSql("SELECT * FROM partida WHERE player=?",[p],function(ts,rs){
           		posJugador	 =  rs.rows.item(0).pos;
           }, html5.onError);
        });
	}
	$scope.getDataPlayerTurno2 = function(p)
	{
		html5.db.transaction(function(tx){
           tx.executeSql("SELECT * FROM partida WHERE player=?",[p],function(ts,rs){
           		posJugador2	 =  rs.rows.item(0).pos;
           }, html5.onError);
        });
	}
	$scope.updatePlayerPos = function(pos,id)
	{
		html5.db.transaction(function(tx){
           tx.executeSql("UPDATE partida SET pos = ? WHERE player=?",[pos,id],html5.onSuccess,html5.onError);
        });
	}
	$scope.updatePlayer = function(picture,id)
	{
		html5.db.transaction(function(tx){
           tx.executeSql("UPDATE players set picture = ? WHERE id=?",[picture,id],html5.onSuccess,html5.onError);
        });
	}
	//consulto
	$scope.getPartida = function()
	{
		html5.db.transaction(function(tx){
           tx.executeSql("SELECT pp.nombre,pp.picture,p.pos,pp.id FROM partida p,players pp WHERE p.player=pp.id ORDER BY p.idPartida DESC",[],function(v,rs){
           		//alert(rs.length);
           		for(var i = 0; i < rs.rows.length; i++)
				{
					$scope.activePlayers.push(rs.rows.item(i));//paso los resultados al Scope que me pintará los jugadores
					$scope.activePlayersBig.push(rs.rows.item(i));//paso los resultados al Scope que me pintará los jugadores
					$scope.$digest();
			        //alert(rs.rows.item(i).nombre);
			    }
           }, html5.onError);
        });
	}
});	


