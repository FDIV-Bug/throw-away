// JavaScript code for the TI SensorTag Demo app.

/**
 * Object that holds application data and functions.
 */
var app = {};

/**
 * for input buttons/write characteristics
 */
app.device = null;

/**
 * Data that is plotted on the canvas.
 */
app.dataPoints = [];

/**
 * smoothie.js data
 *
 */

var lineAM = new TimeSeries();

app.AM = -1.00;

var smoothieAcc;

var maiorMod = 0.0;
var atualMod = 0.0;

app.coin = 'monk';


/**
 * Timeout (ms) after which a message is shown if the SensorTag wasn't found.
 */
app.CONNECT_TIMEOUT = 3000;

/**
 * Object that holds SensorTag UUIDs.
 */
app.curie = {};

/** 
 * UUIDs for movement services and characteristics. These must match the
 * UUIDs specified in the arduino sketch.
 */
app.curie.IMU_SERVICE = '917649a0-d98e-11e5-9eec-0002a5d5c51b';

app.curie.IMU_ACC = '917649a1-d98e-11e5-9eec-0002a5d5c51b';
app.curie.IMU_AXDESCRIPTOR = '00002902-0000-1000-8000-00805f9b34fb';

app.curie.APP_INPUTCHARACTERISTIC = '917649a7-d98e-11e5-9eec-0002a5d5c51b';



/**
 * Initialise the application.
 */
app.initialize = function()
{
	document.addEventListener(
		'deviceready',
		function() { evothings.scriptsLoaded(app.onDeviceReady) },
		false);

	// Called when HTML page has been loaded.
	$(document).ready( function()
	{
		// Adjust canvas size when browser resizes
		$(window).resize(app.respondCanvas);

		// Adjust the canvas size when the document has loaded.
		app.respondCanvas();
                      
        // set up smoothie canvas
        app.setUpSmoothie();                      
	});
};

/**
 * Adjust the canvas dimensions based on its container's dimensions.
 */
app.respondCanvas = function()
{
	var canvas = $('#canvas')
	var container = $(canvas).parent()
	canvas.attr('width', $(container).width() ) // Max width
	// Not used: canvas.attr('height', $(container).height() ) // Max height
};

/**
 * This function allows us to customize our smoothie charts. If you use the
 * builder at http://smoothiecharts.org/builder/ to customize your chart,
 * you can paste the JavaScript from the bottom of that page into the code
 * below.
 */


app.setUpSmoothie = function()
{
    smoothieAcc = new SmoothieChart(
    {
		interpolation:'linear',
		/**
        maxValue:16.1,minValue:-16.1,
		grid: { strokeStyle:'rgb(125, 0, 0)', fillStyle:'rgb(60, 0, 0)',
        lineWidth: 1, millisPerLine: 300, verticalSections: 6 , },
        labels: { fillStyle:'rgb(60, 0, 0)' }
		*/
    });    
     
    smoothieAcc.streamTo(document.getElementById("canvasAcc"),1000);    
    
    setInterval( function()
    {
                
      lineAM.append( new Date().getTime(), app.getAm() );                  
                
    }, 1000);
    
    smoothieAcc.addTimeSeries(lineAM,  { strokeStyle:'rgb(0, 255, 0)', lineWidth:3 });    
};

app.onDeviceReady = function()
{
	app.showInfo('Ligue o Arduino 101 e prescione INICIAR.');
	app.showMod(0.0);
};

app.showInfo = function(info)
{
	document.getElementById('info').innerHTML = info;
};

app.showMod = function(info)
{
	document.getElementById('mod').innerHTML = info.toPrecision(4);	
};

app.resetMod = function()
{
	maiorMod = 0.0;
	atualMod = 0.0;
	app.showMod(0.0);	
}

app.onStartButton = function()
{	
	app.onStopButton();
	app.startScan();
	app.showInfo('Status: Escaneando...');
	app.startConnectTimer();
};

app.onStopButton = function()
{
	// Stop any ongoing scan and close devices.	
	app.stopConnectTimer();
	evothings.easyble.stopScan();
	evothings.easyble.closeConnectedDevices();
	app.showInfo('Status: Desconectado.');
	app.resetMod()
};

app.startConnectTimer = function()
{
	// If connection is not made within the timeout
	// period, an error message is shown.
	app.connectTimer = setTimeout(
		function()
		{
			app.showInfo('Status: Tempo esgotado. Pressione PARAR, reinicie o Arduino 101 e tente novamente.');
		},
		app.CONNECT_TIMEOUT)
}

app.stopConnectTimer = function()
{
	clearTimeout(app.connectTimer);
}

app.startScan = function()
{
	evothings.easyble.startScan(
		function(device)
		{
			// Connect if we have found a sensor tag.
			if (app.deviceIsArduino101(device))
			{
				app.showInfo('Status: Dispositivo encontrado: ' + device.name + '.');
                // set up the app.device variable to access device for writing input button results to Arduino/Genuino101
                app.device = device;
				evothings.easyble.stopScan();
				app.connectToDevice(device);
				app.stopConnectTimer();
			}
		},
		function(errorCode)
		{
			app.showInfo('Error: startScan: ' + errorCode + '.');
		});
};

app.deviceIsArduino101 = function(device)
{
	console.log('device name: ' + device.name);
	return (device != null) &&
		(device.name != null) &&
		(device.name.indexOf('imu') > -1 ||
			device.name.indexOf('imu') > -1);
};

/**
 * Read services for a device.
 */
app.connectToDevice = function(device)
{
	app.showInfo('Conectando...');
	device.connect(
		function(device)
		{
			app.showInfo('Status: Conectado - Lendo serviços...');
			app.readServices(device);
		},
		function(errorCode)
		{
			app.showInfo('Error: Connection failed: ' + errorCode + '.');
			evothings.ble.reset();
			// This can cause an infinite loop...
			//app.connectToDevice(device);
		});
};

// Some getters and setters to properly work with imu data

app.setAm = function( value )
{
  app.Am = value;
};

app.getAm = function()
{
   return app.Am;
};

app.readServices = function(device)
{
	device.readServices(
		[
		app.curie.IMU_SERVICE // Movement service UUID.
		],
		// Function that monitors accelerometer data.
		app.startIMUNotification,
		function(errorCode)
		{
			console.log('Error: Failed to read services: ' + errorCode + '.');
		});
};



/**
 * Read accelerometer data.
 */
app.startIMUNotification = function(device)
{
	app.showInfo('Status: Starting IMU notification...');

	

	// Set accelerometer notifications to ON.
	device.writeDescriptor(
		app.curie.IMU_ACC,
		app.curie.IMU_AXDESCRIPTOR, // Notification descriptor.
		new Uint8Array([1,0]),
		function()
		{
			console.log('Status: writeDescriptor ok.');
		},
		function(errorCode)
		{
			// This error will happen on iOS, since this descriptor is not
			// listed when requesting descriptors. On iOS you are not allowed
			// to use the configuration descriptor explicitly. It should be
			// safe to ignore this error.
			console.log('Error: writeDescriptor: ' + errorCode + '.');
		});  
    
    
	// Start accelerometer notifications.
	device.enableNotification(
		app.curie.IMU_ACC,
		function(data)
		{
			app.showInfo('Status: Recebendo dados...');
			
            /**
             * The stream of bytes sent over BLE comes in here as the variable data
             * We create a DataView object and use the getFloat32() method to get
             * the floating point representation of our data here.
             */
            var ax = new DataView(data).getFloat32(0, true);
            var ay = new DataView(data).getFloat32(4, true);
            var az = new DataView(data).getFloat32(8, true);
			var am = Math.sqrt(Math.pow(ax,2) + Math.pow(ay,2) + Math.pow(az,2));
	
			atualMod = am
			if (atualMod > maiorMod)
			{
				maiorMod = atualMod
			}
			console.log(maiorMod);
			app.showMod(maiorMod);                              
            app.setAm(am);
			
						

			
		},
		function(errorCode)
		{
			console.log('Error: enableNotification: ' + errorCode + '.');
		});    
};

// Initialize the app.
app.initialize();
