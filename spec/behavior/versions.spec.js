require( "../setup" );
var resources = require( "./resources" );
var versions = require( "../../src/versions" );

describe( "Versioning", function() {
	describe( "When getting versions", function() {
		var parentVersions, childVersions;

		before( function() {
			parentVersions = versions.getVersions( resources.parent );
			childVersions = versions.getVersions( resources.child );
		} );

		it( "should produce new version correctly", function() {
			parentVersions[ 2 ].actions.self.include.should.eql( [ "id", "title" ] );
		} );

		it( "should keep version changes separate from original", function() {
			expect( parentVersions[ 1 ].actions.self.include ).not.to.exist; // jshint ignore:line
		} );

		it( "should return a version hash with one entry for resources without a version hash", function() {
			expect( childVersions[ 1 ].actions.self ).to.exist; // jshint ignore:line
		} );
	} );
} );
