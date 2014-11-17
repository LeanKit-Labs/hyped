var model = require( "../../model.js" );
var _ = require( "lodash" );

module.exports = function( host ) {
	return {
		name: "lane",
		parent: "board",
		actions: {
			self: {
				method: "get",
				url: "/lane/:lane.id",
				include: [ "id", "title", "wip" ],
				embed: {
					cards: {
						resource: "card",
						render: "self",
						actions: [ "self", "move", "block" ]
					}
				},
				handle: function( envelope ) {
					var lane = _.cloneDeep( _.where( model.board1.lanes, { id: parseInt( envelope.data.id ) } )[ 0 ] );
					envelope
						.hyped( lane )
						.render();
				}
			},
			cards: {
				method: "get",
				url: "/lane/:lane.id/card",
				include: [ "id", "title", "wip" ],
				handle: function( envelope ) {
					envelope
						.hyped( _.where( model.board1.lanes, { id: parseInt( envelope.data.id ) } )[ 0 ].cards )
						.resource( "card" )
						.action( "self" )
						.render();
				}
			}
		}
	};
};