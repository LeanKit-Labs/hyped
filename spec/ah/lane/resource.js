var model = require( "../../model.js" );

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
					return lane;
				}
			},
			cards: {
				method: "get",
				url: "/lane/:lane.id/card",
				include: [ "id", "title", "wip" ],
				handle: function( envelope ) {
					return {
						data: _.where( model.board1.lanes, { id: parseInt( envelope.data.id ) } )[ 0 ].cards,
						resource: "card",
						action: "self"
					};
				}
			}
		}
	};
};
