var resources = {
		"parent": {
			actions: {
				self: {
					method: "get",
					url: "/parent/:id"
				},
				list: {
					method: "get",
					url: "/parent"
				},
				children: {
					method: "get",
					url: "/parent/:id/child",
					render: { resource: "child", action: "self" },
					condition: function( data ) {
						return data.children && data.children.length > 0;
					},
					links: {
						"next-child-page": function( data, context ) {
							if( context && context.page ) {
								return "/parent/:id/child?page=" + 
									( context.page + 1 ) +
									"&size=" +
									( context.size );
							}
						}
					},
					parameters: {
						"page": function( data, context ) {
							var limit = 1;
							if( data && data.children && context ) {
								limit = data.children.length / context.size;
								return { range: [ 1, limit ] };
							}
						},
						"size": { range: [ 1, 100 ] }
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
		"child": {
			parent: "parent",
			actions: {
				self: {
					method: "get",
					url: "/child/:child.id",
					embed: {
						"grandChildren": {
							resource: "grandChild",
							render: "self",
							actions: [ "self", "create" ]
						}
					}
				}
			}	
		},
		"grandChild": {
			parent: "child",
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