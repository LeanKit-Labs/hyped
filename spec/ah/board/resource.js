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
					return {
						status: 200,
						data: model.board1
					};
				}
			},
			cards: {
				method: "get",
				url: "/:id/card",
				render: { resource: "card", action: "self" },
				handle: function( envelope ) {
					var list = _.reduce( model.board1.lanes, function( acc, lane ) {
						return acc.concat( lane.cards );
					}, [] );
					list.id = envelope.data.id;
					return list;
				},
				links: {
					next: function( envelope, data ) {
						var currentPage = 1;
						if ( envelope.data ) {
							currentPage = envelope.data.page || 1;
						}

						if ( data.length > 5 ) {
							return "/board/:id/card?page=" + ( currentPage + 1 );
						}
					}
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
					handle: function( envelope ) {
						var data = _.cloneDeep( model.board1 );
						data.version = 2;
						return {
							status: 200,
							data: data
						};
					},
					include: [ "id", "title", "description", "version" ]
				}
			},
			10: {
				self: {
					url: "/train/:id",
					handle: function( envelope ) {
						return {
							status: 200,
							data: { wat: "crazy train" }
						};
					},
					include: [ "wat" ]
				}
			}
		}
	};
};
