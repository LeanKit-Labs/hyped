var should = require( "should" ); // jshint ignore: line
var _ = require( "lodash" );
var when = require( "when" );
var model = require( "./model.js" );
var HyperModel = require( "../src/hyperModel.js" );

var board1 = model.board1;
var board2 = model.board2;
var deepCompare = model.deepCompare;

describe( "when rendering simple list", function() {
	var boardResource = {
		name: "board",
		actions: {
			self: {
				method: "get",
				url: "/board/:id",
				include: [ "id", "title" ]
			},
			full: {
				method: "get",
				url: "/board/:id?embed=lanes,cards,classOfService",
				include: [ "id", "title", "description" ]
			},
			tags: {
				method: "get",
				url: "/board/:id/tag",
				include: [ "tags" ]
			},
			addTag: {
				method: "POST",
				url: "/board/:id/tag/:tag",
				include: [ "tags" ]
			},
			removeTag: {
				method: "DELETE",
				url: "/board/:id/tag/:tag",
				include: [ "tags" ]
			}
		}
	};

	var self, tagList, postAdd, postRemove;
	
	var expectedSelf = {
		id: 100,
		title: "Test Board",
		_origin: { href: "/board/100", method: "GET" },
		_links: {
			self: { href: "/board/100", method: "GET" },
			full: { href: "/board/100?embed=lanes,cards,classOfService", method: "GET" },
			tags: { href: "/board/100/tag", method: "GET" },
			addTag: { href: "/board/100/tag/:tag", method: "POST", templated: true },
			removeTag: { href: "/board/100/tag/:tag", method: "DELETE", templated: true }
		}
	};

	var expectedTagList = {
		tags: [ "one", "two", "three" ],
		_origin: { href: "/board/100/tag", method: "GET" },
		_links: {
			self: { href: "/board/100", method: "GET" },
			full: { href: "/board/100?embed=lanes,cards,classOfService", method: "GET" },
			tags: { href: "/board/100/tag", method: "GET" },
			addTag: { href: "/board/100/tag/:tag", method: "POST", templated: true },
			removeTag: { href: "/board/100/tag/:tag", method: "DELETE", templated: true }
		}
	};

	var expectedPostAdd = {
		tags: [ "one", "two", "three", "four" ],
		_origin: { href: "/board/100/tag/:tag", method: "POST", templated: true },
		_links: {
			self: { href: "/board/100", method: "GET" },
			full: { href: "/board/100?embed=lanes,cards,classOfService", method: "GET" },
			tags: { href: "/board/100/tag", method: "GET" },
			addTag: { href: "/board/100/tag/:tag", method: "POST", templated: true },
			removeTag: { href: "/board/100/tag/:tag", method: "DELETE", templated: true }
		}
	};

	var expectedPostRemove = {
		tags: [ "one", "two", "four" ],
		_origin: { href: "/board/100/tag/:tag", method: "DELETE", templated: true },
		_links: {
			self: { href: "/board/100", method: "GET" },
			full: { href: "/board/100?embed=lanes,cards,classOfService", method: "GET" },
			tags: { href: "/board/100/tag", method: "GET" },
			addTag: { href: "/board/100/tag/:tag", method: "POST", templated: true },
			removeTag: { href: "/board/100/tag/:tag", method: "DELETE", templated: true }
		}
	};

	before( function() {
		var board1a = _.cloneDeep( board1 );
		var board1b = _.cloneDeep( board1 );
		var board1c = _.cloneDeep( board1 );
		var hypermodel = HyperModel( { board: boardResource } );
		self = hypermodel( board1a, "board", "self" ).render();
		tagList = hypermodel( board1a, "board", "tags" ).render();
		board1b.tags.push( "four" );
		postAdd = hypermodel(board1b, "board", "addTag" ).render();
		board1c.tags.splice( 2, 1 );
		postRemove = hypermodel( board1c, "board", "removeTag" ).render();
	} );

	it( 'should generate self hypermedia object model', function() {
		deepCompare( self, expectedSelf );
	} );

	it( 'should generate tag list', function() {
		deepCompare( tagList, expectedTagList );
	} );

	it( 'should generate tag list post add', function() {
		deepCompare( postAdd, expectedPostAdd );
	} );

	it( 'should generate tag list post remove', function() {
		deepCompare( postRemove, expectedPostRemove );
	} );

	after( function() {
		board1.tags = [ "one", "two", "three" ];
	} );
} );