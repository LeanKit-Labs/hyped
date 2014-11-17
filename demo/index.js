var cluster = require( "cluster" );

if( cluster.isMaster ) {
	var cpuCount = require('os').cpus().length;
	for (var i = 0; i < cpuCount; i += 1) {
		cluster.fork();
	}
} else {
	var hyped = require( "../src/index.js" )();
	var autohost = require( "autohost" );

	autohost.init( { 
			resources: "./spec/ah", 
			noOptions: true,
			urlStrategy: hyped.urlStrategy 
		} ) // just roll with the defaults...
		.then( hyped.addResources );
	hyped.setupMiddleware( autohost );	
}
