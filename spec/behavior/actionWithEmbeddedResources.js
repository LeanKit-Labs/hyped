module.exports = {
	id: 2,
	parentId: 1,
	title: "child",
	_origin: { href: "/test/api/parent/1/child/2", method: "GET" },
	_resource: "child",
	_action: "self",
	_links: {
		self: { href: "/test/api/parent/1/child/2", method: "GET" },
		change: { href: "/test/api/parent/1/child/2", method: "PUT" }
	},
	_embedded: {
		grandChildren: [
			{ id: 1,
				_origin: { href: "/test/api/parent/1/child/2/grand/1", method: "GET" },
				_resource: "grandChild",
				_action: "self",
				_links: {
					self: { href: "/test/api/parent/1/child/2/grand/1", method: "GET" },
					create: { href: "/test/api/parent/1/child/2/grand", method: "POST" },
					delete: { href: "/test/api/parent/1/child/2/grand/1", method: "DELETE" }
				}
			},
			{ id: 2,
				_origin: { href: "/test/api/parent/1/child/2/grand/2", method: "GET" },
				_resource: "grandChild",
				_action: "self",
				_links: {
					self: { href: "/test/api/parent/1/child/2/grand/2", method: "GET" },
					create: { href: "/test/api/parent/1/child/2/grand", method: "POST" },
					delete: { href: "/test/api/parent/1/child/2/grand/2", method: "DELETE" }
				}
			},
			{ id: 3,
				_origin: { href: "/test/api/parent/1/child/2/grand/3", method: "GET" },
				_resource: "grandChild",
				_action: "self",
				_links: {
					self: { href: "/test/api/parent/1/child/2/grand/3", method: "GET" },
					create: { href: "/test/api/parent/1/child/2/grand", method: "POST" },
					delete: { href: "/test/api/parent/1/child/2/grand/3", method: "DELETE" }
				}
			},
			{ id: 4,
				_origin: { href: "/test/api/parent/1/child/2/grand/4", method: "GET" },
				_resource: "grandChild",
				_action: "self",
				_links: {
					self: { href: "/test/api/parent/1/child/2/grand/4", method: "GET" },
					create: { href: "/test/api/parent/1/child/2/grand", method: "POST" },
					delete: { href: "/test/api/parent/1/child/2/grand/4", method: "DELETE" }
				}
			},
			{ id: 5,
				_origin: { href: "/test/api/parent/1/child/2/grand/5", method: "GET" },
				_resource: "grandChild",
				_action: "self",
				_links: {
					self: { href: "/test/api/parent/1/child/2/grand/5", method: "GET" },
					create: { href: "/test/api/parent/1/child/2/grand", method: "POST" },
					delete: { href: "/test/api/parent/1/child/2/grand/5", method: "DELETE" }
				}
			}
		]
	}
};
