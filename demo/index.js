var cluster = require( "cluster" );

if ( cluster.isMaster ) {
	var cpuCount = require( "os" ).cpus().length;
	for ( var i = 0; i < cpuCount; i += 1 ) {
		cluster.fork();
	}
} else {
	var hyped = require( "../src/index.js" )();
	var autohost = require( "autohost" );
	var host = hyped.createHost( autohost, {} ); // just roll with the defaults...
	host.start();
}
