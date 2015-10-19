var resources = {
	parent: {
		actions: {
			self: {
				method: "get",
				url: "/parent/:id",
				actions: [ "self", "children", "next-child-page" ]
			},
			list: {
				method: "get",
				url: "/parent",
				actions: [ "list" ]
			},
			// this will only display when fullOptions are requested (authorize is skipped)
			bogus: {
				method: "get",
				url: "/bogus",
				authorize: function( envelope ) {
					return false;
				}
			},
			exclude: {
				method: "get",
				url: "/exclude",
				hidden: true,
				authorize: function( envelope ) {
					envelope.hiddenWasAuthorized = true;
					return true;
				}
			},
			privileged: {
				method: "get",
				url: "/privileged",
				authorize: function( envelope ) {
					return envelope.user.name === "admin";
				}
			},
			children: {
				method: "get",
				url: "/parent/:id/child",
				render: { resource: "child", action: "self" },
				actions: [ "self", "children" ],
				condition: function( envelope, data ) {
					if ( _.isArray( data ) ) {
						return data.length;
					} else {
						return data.children && data.children.length > 0;
					}
				},
				links: {
					"next-child-page": function( envelope, data ) {
						if ( envelope.data ) {
							var page = envelope.data.page || 1;
							var size = envelope.data.size || 5;
							if ( page && size ) {
								return "/parent/:id/child?page=" + ( page + 1 ) + "&size=" + ( size );
							}
						}
					}
				},
				parameters: {
					page: function( envelope, data ) {
						var limit = 1;
						var size = envelope.data ? envelope.data.size : 0;
						if ( data && data.children && size ) {
							var count = data.children.length;
							return { range: [ 1, count / size ] };
						}
					},
					size: { range: [ 1, 100 ] }
				}
			}
		},
		versions: {
			2: {
				self: {
					include: [ "id", "title" ]
				}
			}
		}
	},
	child: {
		parent: "parent",
		actions: {
			self: {
				method: "get",
				url: "/child/:child.id",
				embed: {
					grandChildren: {
						resource: "grandChild",
						render: "self",
						actions: [ "self", "create" ]
					}
				}
			},
			change: {
				method: "put",
				url: "/child/:child.id",
				authorize: function( envelope, data ) {
					var userName = envelope.user ? envelope.user.name : "nobody";
					if ( userName === "Evenly" ) {
						return data.id % 2 === 0;
					} else if ( userName === "Oddly" ) {
						return data.id % 2 === 1;
					} else {
						return false;
					}
				}
			}
		}
	},
	grandChild: {
		parent: "child",
		resourcePrefix: false,
		actions: {
			self: {
				method: "get",
				url: "/grand/:grandChild.id"
			},
			create: {
				method: "post",
				url: "/grand"
			},
			delete: {
				method: "delete",
				url: "/grand/:grandChild.id"
			}
		}
	}
};
module.exports = resources;
