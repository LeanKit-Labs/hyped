require( "../setup" );
var resources = require( "./resources" );
var versions = require( "../../src/versions" );

describe( "Versioning", function() {
	describe( "When getting versions", function() {
		var parentVersion1, parentVersion2, parentVersion3, childVersion;

		before( function() {
			versions.processHandles( resources.parent );
			parentVersion1 = versions.getVersion( resources.parent, 1 );
			parentVersion2 = versions.getVersion( resources.parent, 2 );
			parentVersion3 = versions.getVersion( resources.parent, 10 );
			childVersion = versions.getVersion( resources.child, 3 );
		} );

		it( "should merge distinct versions correctly", function() {
			should.not.exist( parentVersion1.actions.self.include );
			parentVersion2.actions.self.url.should.eql( "/parent/2/:id" );
			parentVersion2.actions.self.include.should.eql( [ "id", "title" ] );
			parentVersion3.actions.self.include.should.eql( [ "id" ] );
		} );

		it( "should return a version hash with one entry for resources without a version hash", function() {
			expect( childVersion.actions.self ).to.exist; // jshint ignore:line
		} );

		it( "should convert handle to a differentiated handle", function() {
			parentVersion2.actions.self.handle.length.should.equal( 3 );
		} );
	} );
} );
