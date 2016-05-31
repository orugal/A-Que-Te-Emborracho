/*Controlador editaInfo*/
var html5   = {};
var dbsize  = 1024 * 1024; //1MB
var sentido = true;
var posJug 	 = "";
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
		//inicializo variables
		sentido = true;
		posJug 	 = "";
		
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
	//3: Para el Shot
	//4: Para la punteria
	//5: Penitencias
	//6: Retroceder casillas
	//7: Dedito bailarin
	//8: De reversa
	//9: la copa de la amistad
	//10: El Dado dice
	//11: Fin del Juego
	$scope.activePlayers 	= [];
	$scope.activePlayersBig = [];
	var posJugador	 	= 0;
	var posJugador2	 	= 0;

	$scope.penitenciasList = [
		{texto:'Lamerse algo que otra persona se echa en su ombligo, por ejemplo un copa de licor, salsa, miel, etc.'},
		{texto:'Apretar un cubo de hielo en una mano hasta que se derrita.'},
		{texto:'Ponerse encima de su ropa por lo menos 10 prendas de vestir extra que le debe pedir al resto de los jugadores.'},
		{texto:'Colocarse en diferentes partes del cuerpo 20 pinzas de ropa: en las orejas, la nariz, la piel, los dedos, etc.'},
		{texto:'Decir el alfabeto al revés, si se equivoca vuelve a empezar'},
		{texto:'Baile sensual: Mostrar a los demás sus mejores movimientos de danza árabe o de streptease, por 1 minuto'},
		{texto:'Cantar una canción infantil mientras se come tres galletas secas, sin agua.'},
		{texto:'Diga 4 partes del cuerpo que tengan  sólo 3 letras.'},
		{texto:'Escriba una trova  o poema, donde mencione y les agradezca a  los organizadores de la fiesta, por haberlo invitado.'},
	];


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
			tipo:3,
			imagen:'img/pista/imagen3.svg',
			fondo:'img/pista/fondo3.svg',
			color:'#F5AD00',
			cantidad:'1'
		},
		{
			id:4,
			nombre:'Prueba tu punteria',
			tipo:4,
			imagen:'img/pista/imagen4.svg',//punteria
			fondo:'img/pista/fondo4.svg',
			color:'#009ACE',
			cantidad:'0'
		},
		{
			id:5,
			nombre:'La copa de la amistad',
			tipo:9,
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
			tipo:10,
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
			tipo:3,
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
			tipo:9,
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
			tipo:9,
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
			tipo:10,
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
			tipo:4,
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
			tipo:11,
			imagen:'img/pista/imagen15.svg',//Final
			fondo:'img/pista/fondo15.svg',
			color:'#DA1743',
			cantidad:''
		}
		
	]

	/*
	* Inicia la partida, aquí es donde ingresa a la ventana partida y pone las fichas listas para jugar.
	*/
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
	$scope.nextTurn = function(dir)
	{

		//para cambiar el sentido
		if(dir != undefined)
		{
			switch(sentido)
			{
				case true:
					sentido = false;
				break;	
				case false:
					sentido = true;
				break;
			}
		}

		var cantPlayers    = ($(".turnMark").length - 1);
		var actualturn     = $(".turnMark.actualTurno");
		var actualturnId   = $(".turnMark.actualTurno").attr("id");
		var actualturnRel  = $(".turnMark.actualTurno").attr("rel");


		//esta lógica es para controlar el sentido del juego, sólo la altera la ficha "En Reversa"
		if(sentido == true)//
		{
			if(actualturnId >= cantPlayers)
			{
				$(".turnMark").removeClass("actualTurno");
				$("#0").addClass("actualTurno");
				posJug = 0;
			}
			else
			{
				var nextTurn = (parseInt(actualturnId) + parseInt(1));
				posJug = nextTurn;
				//alert(nextTurn)
				$(".turnMark").removeClass("actualTurno");
				$("#"+nextTurn).addClass("actualTurno");
			}

		}
		else
		{
			if(actualturnId <= 0)
			{
				$(".turnMark").removeClass("actualTurno");
				$("#"+cantPlayers).addClass("actualTurno");
				posJug = cantPlayers;
			}
			else
			{
				var nextTurn = (parseInt(actualturnId) - parseInt(1));
				//alert(nextTurn)
				$(".turnMark").removeClass("actualTurno");
				$("#"+nextTurn).addClass("actualTurno");
				posJug = nextTurn;
			}
		}

		setTimeout(function(){
			var altoCaja = $("#boxTrack"+posJug).height();
	        $('html, body').stop().animate({
	            scrollTop: (parseInt(jQuery($("#boxTrack"+posJug)).offset().top) - parseInt(altoCaja))
	        }, 1000,function(){});
		},500);
		
		
	}
	/*
	* Lógica del juego
	* Aquí es donde empizan a jugar as personas que se hayan escogido, se lanzan los dados y se va avanzando en el tablero
	* @author Farez Prieto
	*/
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
			var resultDado	=	$scope.dices(1,6);//lanzamiendo de dados
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
					//antes de cambiar el turno debo de detectar cuantas casillas hay en total
					var cantCasillas = $(".boxTrack").length;

					//calculo la siguiente posición
					var nextPos = (parseInt(posJugador) + parseInt(resultDado));
					//si la nueva posición supera la cantidad total de casillas quiere decir que el jugador ha ganado la partida.
					if(nextPos >= cantCasillas)
					{
						nextPos = cantCasillas;
					}
					//pongo la ficha en el lugar de la nueva posicion, esta posición siempre será el lugar donde está + la de la nueva posicion
					fichaJugadorTurno.appendTo("#boxTrack"+nextPos+" .placePlayer");
					//muevo el mapa hacia la nueva posición
					$scope.ancla("#boxTrack"+nextPos);
					//ahora debo actualizar el turno del usuario en la mini ficha para más adelante poder saber de donde viene
					$scope.updatePlayerPos(nextPos,idPlayer);

					//debo saber que tipo de casilla es donde ha caido el personaje, de esta forma puedo poner al jugador a que haga algo
					//para esto capturo la metadata
					var datosBloque   =  $("#boxTrack"+nextPos).data("caja");
					//toma de decisión, esta función hace la lógica
					$scope.tomaDecision(datosBloque);

				},1000);


			});
		},2000);
	}
	$scope.retrocedeCasillas = function(cant)
	{
		//esta es la función que va a analizar tooooooodo el juego
		//debo saber cual es el jugador que esta activo en el turno
		var actualturn     		= $(".turnMark.actualTurno");
		var idElPlayer	  		= actualturn.attr("id");	
		var idPlayer	   		= actualturn.attr("rel");
		var fichaJugadorTurno	=	$("#gamer"+idPlayer);

		setTimeout(function(){
			var resultDado	=	cant;//lanzamiendo de dados
			
			//debo hacer que el jugador en turno avance, pero primero debo saber en que posición se encuentra
			$scope.getDataPlayerTurno(idPlayer);
			setTimeout(function()
			{
				//antes de cambiar el turno debo de detectar cuantas casillas hay en total
				var cantCasillas = $(".boxTrack").length;

				//calculo la siguiente posición
				var nextPos = (parseInt(posJugador) - parseInt(resultDado));
				//si la nueva posición supera la cantidad total de casillas quiere decir que el jugador ha ganado la partida.
				if(nextPos >= cantCasillas)
				{
					nextPos = cantCasillas;
				}
				//pongo la ficha en el lugar de la nueva posicion, esta posición siempre será el lugar donde está + la de la nueva posicion
				fichaJugadorTurno.appendTo("#boxTrack"+nextPos+" .placePlayer");
				//muevo el mapa hacia la nueva posición
				$scope.ancla("#boxTrack"+nextPos);
				//ahora debo actualizar el turno del usuario en la mini ficha para más adelante poder saber de donde viene
				$scope.updatePlayerPos(nextPos,idPlayer);

				//debo saber que tipo de casilla es donde ha caido el personaje, de esta forma puedo poner al jugador a que haga algo
				//para esto capturo la metadata
				var datosBloque   =  $("#boxTrack"+nextPos).data("caja");
				//toma de decisión, esta función hace la lógica
				$scope.tomaDecision(datosBloque);

			},1000);


		},500);
	}

	/*********************Funciones que realizan la lógica del juego*************************/
	$scope.tomaDecision 	=	function(obj)
	{
		//ahora debo validar el tipo de caja en la cual ha caido, par ello debo validar el campo tipo basandome en esta documentación
		//1: Es para iniciar
		//2: Es para tomar
		//3: Para el Shot
		//4: Para la punteria
		//5: Penitencias
		//6: Retroceder casillas
		//7: Dedito bailarin
		//8: De reversa
		//9: la copa de la amistad
		//10: El Dado dice
		//11: Fin del Juego
		switch(obj.tipo)
		{
			case 1://inicio

			break;
			case 2://Tomar
				//para poner al jugador a tomar analizo la cantidad de tragos que deba tomarse
				var lblTrago = (obj.cantidad > 1)?"tragos":"trago";
				swal({
					title:obj.nombre,
					text:"Debes tomar "+obj.cantidad+" "+lblTrago,
					html:true,   
					confirmButtonText: "Terminar mi turno",   
					confirmButtonColor: "#DD6B55",
				},function(){
					$scope.nextTurn();
				});
			break;
			case 3://Shot
				swal({
					title:obj.nombre,
					text:"Debes darle un trago a tu compañero de al lado",
					html:true,   
					confirmButtonText: "Terminar mi turno",   
					confirmButtonColor: "#DD6B55",
				},function(){
					$scope.nextTurn();
				});
			break;
			case 4://Puntería
				swal({
					title:obj.nombre,
					text:"Vamos a probar tu puntería",
					html:true,   
					confirmButtonText: "Terminar mi turno",   
					confirmButtonColor: "#DD6B55",
				},function(){
					$scope.nextTurn();
				});
			break;
			case 5://Penitencias
				//aquí debo sacar una penitencia del listado
				var penSel 	= $scope.dices(0,$scope.penitenciasList.length);
				var penText = $scope.penitenciasList[penSel].texto;
				swal({
					title:obj.nombre,
					text:penText,
					html:true,   
					confirmButtonText: "Terminar mi turno",   
					confirmButtonColor: "#DD6B55",
				},function(){
					$scope.nextTurn();
				});
			break;
			case 6://Retroceder casillas
				//para poner al jugador a tomar analizo la cantidad de tragos que deba tomarse
				var lblCasilla = (obj.cantidad > 1)?"casillas":"casilla";
				swal({
					title:obj.nombre,
					text:"Retrocederas "+obj.cantidad+" "+lblCasilla,
					type:"info",
					html:true,   
					confirmButtonText: "Terminar mi turno",   
					confirmButtonColor: "#DD6B55",
				},function(){
					$scope.retrocedeCasillas(obj.cantidad);
				});
			break;
			case 7://Dedito Bailarin
				swal({
					title:obj.nombre,
					text:"Tus compañeros te dirán el nombre de una canción, pon tu dedo en el suelo y comienza a cantar, tararear o silvar el coro completo de la canción y sin despegar el dedo del suelo, comienza a dar vueltas sobre tu propio eje.",
					type:"info",
					html:true,   
					confirmButtonText: "Terminar mi turno",   
					confirmButtonColor: "#DD6B55",
				},function(){
					$scope.nextTurn();
				});
			break;
			case 8://De reversa
				swal({
					title:obj.nombre,
					text:"Acabas de perder tu turno, toma un shot y ahora el juego cambia de sentido.",
					html:true,   
					confirmButtonText: "Terminar mi turno",   
					confirmButtonColor: "#DD6B55",
				},function(){
					$scope.nextTurn(1);
				});
			break;
			case 9://Copa de la amistad
				swal({
					title:obj.nombre,
					text:"pon un shot dentro de la copa y vuelvela a poner en su lugar.",
					html:true,   
					confirmButtonText: "Terminar mi turno",   
					confirmButtonColor: "#DD6B55",
				},function(){
					$scope.nextTurn();
				});
			break;
			case 10://El dado dice
				swal({
					title:obj.nombre,
					text:"Muy fácil, toma tantos tragos como indique el dado, si sale el número 6 pon un shot en LA COPA DE LA AMISTAD y luego date otros 6 a ti.",
					html:true,   
					confirmButtonText: "Terminar mi turno",   
					confirmButtonColor: "#DD6B55",
				},function(){
					$scope.nextTurn();
				});
			break;
			case 11://Fin del juego
				swal({
					title:obj.nombre,
					text:"Finalizaste el juego.",
					html:true,   
					confirmButtonText: "Terminar mi turno",   
					confirmButtonColor: "#DD6B55",
				},function(){
					$scope.nextTurn();
				});
			break;

		}
	}
	/*****************Fin de las funciones que realizan la lógica del juego******************/

	$scope.ancla = function(anchor)
	{
		var altoCaja = $(anchor).height();
        $('html, body').stop().animate({
            scrollTop: (parseInt(jQuery(anchor).offset().top) - parseInt(altoCaja))
        }, 1000,function(){
        	$(anchor).addClass("blink");
        	setTimeout(function(){
        		$(anchor).removeClass("blink");
        	},1000);
        });
        return false;
	}
	$scope.anclaturno = function()
	{
		alert(posJug);
		var altoCaja = $("#boxTrack"+posJug).height();
        $('html, body').stop().animate({
            scrollTop: (parseInt(jQuery($("#boxTrack"+posJug)).offset().top) - parseInt(altoCaja))
        }, 1000,function(){});
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


