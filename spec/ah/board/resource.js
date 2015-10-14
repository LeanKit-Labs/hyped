var model = require( "../../model.js" );

module.exports = function( host ) {
	return {
		name: "board",
		actions: {
			self: {
				include: [ "id", "title" ],
				method: "get",
				url: "/:id",
				embed: {
					lanes: {
						resource: "lane",
						render: "self",
						actions: [ "self", "cards" ]
					}
				},
				handle: function( envelope ) {
					envelope.hyped( model.board1 ).status( 200 ).render();
				}
			},
			cards: {
				method: "get",
				url: "/:id/card",
				render: { resource: "card", action: "self" },
				handle: function( envelope ) {
					return _.reduce( model.board1.lanes, function( acc, lane ) {
						return acc.concat( lane.cards );
					}, [] );
				}
			},
			hidden: {
				method: "get",
				url: "/:id/hidden",
				authorize: function() {
					return false;
				},
				handle: function( envelope ) {
					return { data: "this should never be visible" };
				}
			}
		},
		versions: {
			2: {
				self: {
					include: [ "id", "title", "description" ]
				}
			}
		}
	};
};
